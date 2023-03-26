//jshint esversion:6
const express = require("express");
const bodyparser = require("body-parser"); const { urlencoded } = require("body-parser");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const mongoose = require('mongoose');
mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
}
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);


const item1 = new Item({
  name: "This is the first task"
});

const item2 = new Item({
  name: "Hit + to save the task"
});

const item3 = new Item({
  name: "<--- Press this to delete a completed task"
});

const defaultItems = [item1, item2, item3];

async function insertManyDocuments() {
  try {
    const results = await Item.insertMany(defaultItems);
    console.log("Entered data successfully");
  } catch (err) {
    console.error(err);
  }
}
//insertManyDocuments() used once to enter the default items


async function getItems() {

  const Items = await Item.find({});
  return Items;

}

async function del(id) {
  try {
    await Item.findByIdAndDelete(id);
    console.log("Item successfully deleted")
  }
  catch {
    console.log("Error");
  }
};
async function del_from_list(id, ListName) {
  try {
    await List.findOneAndUpdate({ name: ListName }, { $pull: { items: { _id: id } } });
    console.log("Removed from ", ListName);
  }
  catch (err) {
    console.log(err);
  }
}

async function find_and_create_routes(listName) {
  try {
    let result = await List.findOne({ name: listName });
    if (!result) {
      console.log("List doesnot exist and was assigned default values")
      const list = new List({
        name: listName,
        items: defaultItems
      });
      list.save();
      return find_and_create_routes(listName);
    }
    else {

      console.log("List exist");
      return result;
    }
  }
  catch (err) {
    console.err(err);
  }
}


async function find_and_create() {
  try {
    const result = await Item.countDocuments({});
    if (result == 0) {
      insertManyDocuments();
    }
    else {
      console.log("Some tasks exist");
    }
  }
  catch (err) {
    console.log(err);
  }
}
app.get("/", function (req, res) {
  let options = { weekday: "long", month: "long", day: "numeric" };
  let today = new Date();
  let day = today.toLocaleDateString("en-US", options);
  find_and_create();
  getItems().then(function (found_list) {
    res.render("list", {
      ListName: day,
      Newtasks: found_list,
    });

  });
});

app.get("/:customListName", function (req, res) {
  const listName = req.params.customListName;
  if (listName != 'favicon.ico')
    find_and_create_routes(listName).then(function (found_entry) {
      res.render("list", {
        ListName: found_entry.name,
        Newtasks: found_entry.items,
      });

    });
});

app.post("/", function (req, res) {
  let task = req.body.NewItem;
  let list = req.body.button;
  if (task != "") {
    let options = { weekday: "long", month: "long", day: "numeric" };
    let today = new Date();
    let day = today.toLocaleDateString("en-US", options);
    const temp_task = new Item({
      name: task
    });
    if (list == day) {
      temp_task.save();
      res.redirect("/");
    }
    else {

      find_and_create_routes(list).then(function (found_entry) {
        found_entry.items.push(temp_task);
        found_entry.save();
        res.redirect("/" + list);
      });


    }
  }
  else res.redirect("/");
});

app.post("/delete", function (req, res) {
  const checkbyID = (req.body.checkbox);
  const kimi_no_nawa = req.body.ListName;
  let options = { weekday: "long", month: "long", day: "numeric" };
  let today = new Date();
  let day = today.toLocaleDateString("en-US", options);
  if (kimi_no_nawa == day) {
    del(checkbyID);
    res.redirect("/");
  }
  else {
    del_from_list(checkbyID, kimi_no_nawa);
    res.redirect("/" + kimi_no_nawa);
  }

});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

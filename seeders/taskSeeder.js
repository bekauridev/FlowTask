const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
const Task = require("../models/taskModel");
dotenv.config({ path: "../config/config.env" });
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("DB connection successful");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

//   Read Json vile

const tasks = JSON.parse(fs.readFileSync(`${__dirname}/../data/tasksData.json`, "utf-8"));

// Import data into DB

const importData = async () => {
  try {
    await Task.create(tasks);
    console.log("Data imported...".green.inverse);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All Data from Collection

const deleteData = async () => {
  try {
    await Task.deleteMany();
    console.log("Data Destroyed...".red.inverse);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

[, , ...args] = process.argv;
const [action] = args;
if (action === "-i") {
  importData();
} else if (action === "-d") {
  deleteData();
}

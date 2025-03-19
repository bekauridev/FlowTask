const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
const Organization = require("../models/organizationModel");
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

const organizations = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/organizationsData.json`, "utf-8")
);

// Import data into DB

const importData = async () => {
  try {
    await Organization.create(organizations);
    console.log("Data imported...".green.inverse);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All Data from Collection

const deleteData = async () => {
  try {
    await Organization.deleteMany();
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

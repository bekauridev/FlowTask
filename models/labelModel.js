const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "Label1",
    unique: true,
  },
  color: {
    type: String,
    required: true,
    default: "#90EE90",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
// handle connection between label and task
module.exports = mongoose.model("Label", labelSchema);

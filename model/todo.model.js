const mongoose = require("mongoose");

const todoSchema = mongoose.Schema({
  title: String,
  description: String,
  encrypted: Boolean,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

module.exports = mongoose.model("todo", todoSchema);

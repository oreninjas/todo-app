const mongoose = require("mongoose");

const todoSchema = mongoose.Schema({
  title: String,
  description: String,
  encrypted: Boolean,
  encryPass: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

module.exports = mongoose.model("todo", todoSchema);

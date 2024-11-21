const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  todo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'todo'
    },
  ],
});

module.exports = mongoose.model("user", userSchema);

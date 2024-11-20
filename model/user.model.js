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
      title: String,
      description: String,
    },
  ],
});

module.exports = mongoose.model("user", userSchema);

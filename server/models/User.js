const mongoose = require("mongoose");

// Category Schema
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  encryptedAppPassword: { type: String, required: true },
  iv: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);

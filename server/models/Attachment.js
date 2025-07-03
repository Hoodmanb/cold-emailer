const mongoose = require("mongoose");

// Attachment Schema
const AttachmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String },
  isPublic: { type: Boolean, default: true },
});

// Create and export the Attachment model
module.exports = mongoose.model("Attachment", AttachmentSchema);

const mongoose = require("mongoose");

// Attachment Schema
const AttachmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true }, 

  publicId: { type: String, required: true }, 
  url: { type: String, required: true }, 

  resourceType: { type: String }, 
  format: { type: String }, 
  fileSize: { type: Number },

  isPublic: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

// Create and export the Attachment model
module.exports = mongoose.model("Attachment", AttachmentSchema);

const mongoose = require("mongoose");

// Template Schema
const TemplateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  name: { type: String, required: true },
  private: { type: Boolean, default: true },
});

// Create and export the Template model
module.exports = mongoose.model("Template", TemplateSchema);

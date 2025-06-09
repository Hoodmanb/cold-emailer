const mongoose = require('mongoose');

// Template Schema
const TemplateSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
});

// Create and export the Template model
module.exports = mongoose.model('Template', TemplateSchema);
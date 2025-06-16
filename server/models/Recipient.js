const mongoose = require('mongoose');

// Recipient Schema
const RecipientSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
});

module.exports = mongoose.model('Recipient', RecipientSchema);
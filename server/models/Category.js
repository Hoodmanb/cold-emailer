const mongoose = require('mongoose');

// Category Schema
const CategorySchema = new mongoose.Schema({
  category: { type: String, required: true }
});

module.exports = mongoose.model('Category', CategorySchema);
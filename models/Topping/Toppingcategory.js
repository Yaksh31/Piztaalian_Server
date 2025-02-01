const mongoose = require('mongoose');

const ToppingCategorySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  tagline: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ToppingCategory', ToppingCategorySchema);

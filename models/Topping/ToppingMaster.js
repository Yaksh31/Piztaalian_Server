const mongoose = require('mongoose');

const ToppingMasterSchema = new mongoose.Schema(
  {
    toppingName: {
      type: String,
    },
    toppingCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ToppingCategory',
    },
    price: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ToppingMaster', ToppingMasterSchema);

const mongoose = require("mongoose");
const CategoryMaster = require("../Category/CategoryMaster");
const BranchMaster = require("../BranchMaster/BranchMaster");



const variantSchema = new mongoose.Schema({
  variantName: {
    type: String,
    
  },
  price: {
    type: Number,
    required: true
  }
  // You can add more fields here (like description, crust type, etc.)
});


const menuItemSchema = new mongoose.Schema({
  categoryName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryMaster",
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  spiceLevel: {
    type: Number,
  },
  isJain: {
    type: Boolean,
    default: false,
  },
  checkedPrice: {
    type: Number,
   // required: true,
  },
  description: {
    type: String,
    required: true,
  },
  foodImage: {
    type: String, // Field to store the image in binary format
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true, 
  },
  variants: [variantSchema],
  toppings: [
    {
      toppingCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ToppingCategory",
        
      },
      toppings: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ToppingMaster",
          required: true
        }
      ]
    }
  ]
});

const menuMasterSchema = new mongoose.Schema(
  {
    branchName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
      required: true,
    },
    menuItem: [menuItemSchema],
    isActive: {
      type: Boolean,
      default: true, 
    },
  },
  {
    timestamps: true,
  }
);

const MenuMaster = mongoose.model("MenuMaster", menuMasterSchema);
module.exports = MenuMaster;

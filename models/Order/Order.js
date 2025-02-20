const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// Reuse the CartItem schema structure for order items
const CartItemSchema = new Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuMaster",
      required: true,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
      // required: true,
      default: null,
    },
    toppings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ToppingMaster",
        required: true,
        default: null,
      },
    ],
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      default: null,
    },
    totalPrice: {
      type: Number,
      // required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    cart: {
      type: [CartItemSchema],
      default: [],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "accepted",
        "ready to pickup",
        "completed",
        "cancelled by customer",
        "cancelled by outlet",
      ],
      default: "pending",
      required: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    subTotal:{
      type:Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserMaster",
      required: true,
    },
    sgst:{
      type:Number,
    },
    cgst:{
      type:Number,
    },
    totalTax:{
      type:Number,
    },
    effectiveSubtotal:{
      type:Number,
    },
    completionDateTime: {
      type: Date,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = model("Order", OrderSchema);

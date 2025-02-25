const mongoose = require("mongoose");


const CouponAssignSchema = new mongoose.Schema(
  {
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluencerMaster", // Reference to the Influencer model
      
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponMster", // Reference to the Coupon model
      required: true,
    },
    numberOfCoupons: {
      type: Number,
      required: true,
      
    },
    branch: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches", // Reference to the Branch model
      default:null
      
    }],
    uniqueCouponCode: {
      type: String,
      unique: true,
    },
    
    qrCodeUrl: { // New Field
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
  },
  nonInfluencer:{
    type:Boolean,
  },
  
  redeemedHistory: [
    {
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branches",
        required: true,
      },
      redeemedAt: {
        type: Date,
        default: Date.now,
      },
      redeemerName: { type: String },
      redeemerPhone: { type: String },
    },
  ],
  
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponAssign", CouponAssignSchema);

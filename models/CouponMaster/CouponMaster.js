const mongoose = require("mongoose");

const CouponMsterSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            required: true,
        },
       
        discountPercentage: {
            type: Number,
        },
        maxDiscount: {
            type: Number,
        },
       
        expiryDate: {
            type: Date,
            required: true,
        },
        couponDescription: {
            type: String,
        },
        
        byBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BranchMaster",
            default: null,
        },
       
        isActive: {
            type: Boolean,
            default: false,
        },
       
    },
    { timestamps: true }
);

module.exports = mongoose.model("CouponMster", CouponMsterSchema);

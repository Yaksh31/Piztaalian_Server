const mongoose = require("mongoose");

const CouponMsterSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            required: true,
        },
        influencerName: {
            type: String,
        },
        influencerInstagram: {
            type: String,
        },
        influencerYT: {
            type: String,
        },
        discountPercentage: {
            type: Number,
        },
        maxDiscount: {
            type: Number,
        },
        numberofCouponsAlloted: {
            type: Number,
        },
        numberofCouponsUsed: {
            type: Number,
            default: 0
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        couponDescription: {
            type: String,
        },
        applicableBranch: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "BranchMaster",
                default: null,
            }],
        byBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BranchMaster",
            default: null,
        },
        isSoldOut: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CouponMster", CouponMsterSchema);

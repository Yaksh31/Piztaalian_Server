const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const {
  createCouponAssign,
  listCouponAssign,
  listCouponAssignByParams,
  getCouponAssign,
  updateCouponAssign,
  removeCouponAssign,
  redeemCoupon,
  downloadCouponPDF,
  downloadAllCouponsPDF,
  sendCouponPDF,
  influencerDashboard,
  exportCouponRedeemDetails,
  getCouponAssignByCode
} = require("../controllers/CouponMaster/CouponAssign");

// Define routes

// Create a new coupon assignment
router.post("/auth/CouponAssign/create", catchAsync(createCouponAssign));

// List all coupon assignments
router.get("/auth/CouponAssign/list", catchAsync(listCouponAssign));

// List coupon assignments with filters and pagination
router.post("/auth/CouponAssign/listByParams", catchAsync(listCouponAssignByParams));

// Get a coupon assignment by ID
router.get("/auth/couponAssign/get/:_id", catchAsync(getCouponAssign));

// Update a coupon assignment
router.put("/auth/CouponAssign/update/:_id", catchAsync(updateCouponAssign));

// Remove a coupon assignment
router.delete("/auth/CouponAssign/remove/:_id", catchAsync(removeCouponAssign));

router.post("/auth/CouponAssign/redeem/:_id", catchAsync(redeemCoupon));

router.get("/auth/CouponAssign/downloadPDF/:_id", catchAsync(downloadCouponPDF));

router.get("/auth/CouponAssign/downloadallPDF", catchAsync(downloadAllCouponsPDF));

router.post("/auth/CouponAssign/sendCouponEmail", catchAsync(sendCouponPDF));

router.get("/auth/influencer/dashboard/:_id", catchAsync(influencerDashboard));

router.get("/auth/exportCouponRedeemDetails/:_id", catchAsync(exportCouponRedeemDetails));

router.get("/auth/CouponAssign/getByCode/:code", catchAsync(getCouponAssignByCode));



module.exports = router;

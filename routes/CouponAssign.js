const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

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
  getCouponAssignByCode,
  applyCouponPending,
  redeemDirectCoupon,
  redeemDirectCouponByCode,
} = require("../controllers/CouponMaster/CouponAssign");

// Define routes

// Create a new coupon assignment
router.post("/auth/CouponAssign/create",authMiddleware(["ADMIN"]), catchAsync(createCouponAssign));

// List all coupon assignments
router.get("/auth/CouponAssign/list",authMiddleware(["ADMIN"]), catchAsync(listCouponAssign));

// List coupon assignments with filters and pagination
router.post("/auth/CouponAssign/listByParams",authMiddleware(["ADMIN"]), catchAsync(listCouponAssignByParams));

// Get a coupon assignment by ID
router.get("/auth/couponAssign/get/:_id",authMiddleware(["ADMIN"]), catchAsync(getCouponAssign));

// Update a coupon assignment
router.put("/auth/CouponAssign/update/:_id",authMiddleware(["ADMIN"]), catchAsync(updateCouponAssign));

// Remove a coupon assignment
router.delete("/auth/CouponAssign/remove/:_id",authMiddleware(["ADMIN"]), catchAsync(removeCouponAssign));

router.post("/auth/CouponAssign/redeem/:_id", authMiddleware(["USER", "ADMIN", "BRANCH"]), catchAsync(redeemCoupon));

router.post("/auth/coupon/redeemDirect", catchAsync(redeemDirectCoupon));

router.get("/auth/CouponAssign/downloadPDF/:_id", catchAsync(downloadCouponPDF));

router.get("/auth/CouponAssign/downloadallPDF",authMiddleware(["ADMIN"]), catchAsync(downloadAllCouponsPDF));

router.post("/auth/CouponAssign/sendCouponEmail",authMiddleware(["ADMIN"]), catchAsync(sendCouponPDF));

router.get("/auth/influencer/dashboard/:_id",authMiddleware(["INFLUENCER"]), catchAsync(influencerDashboard));

router.get("/auth/exportCouponRedeemDetails/:_id",authMiddleware(["INFLUENCER","ADMIN"]), catchAsync(exportCouponRedeemDetails));

router.get("/auth/CouponAssign/getByCode/:code", catchAsync(getCouponAssignByCode));

router.post(
  "/auth/CouponAssign/apply/:uniqueCouponCode",
  catchAsync(applyCouponPending)
);



module.exports = router;

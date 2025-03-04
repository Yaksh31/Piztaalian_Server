const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");
const {
  createUserMaster,
  listUserMaster,
  listUserMasterByParams,
  getUserMaster,
  updateUserMaster,
  removeUserMaster,
  userLoginMaster,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getAddresses,
  getAddress,
  addAddress,
  updateAddress,
  removeAddress,
  getGrandTotal,
  sendEmailOTP,
  verifyEmailOTP,
  getUserProfile
} = require("../controllers/UserMaster/UserMaster");

router.post("/auth/create/user", catchAsync(createUserMaster));
router.get("/auth/list/user",authMiddleware(["ADMIN"]), catchAsync(listUserMaster));
router.post("/auth/listByParams/user",authMiddleware(["ADMIN"]), catchAsync(listUserMasterByParams));
router.get("/auth/get/user/:_id",authMiddleware(["USER"]), catchAsync(getUserMaster));
router.get("/auth/profile/:_id",authMiddleware(["ADMIN"]), getUserProfile);
router.put("/auth/update/user/:_id",authMiddleware(["USER"]), catchAsync(updateUserMaster));
router.delete("/auth/remove/user/:_id",authMiddleware(["ADMIN"]), catchAsync(removeUserMaster));
router.post("/auth/login", catchAsync(userLoginMaster));

router.get("/auth/cart/:userId", catchAsync(getCart));
router.post("/auth/cart/:userId/add", catchAsync(addCartItem));
router.put("/auth/cart/:userId/update/:index", catchAsync(updateCartItem));
router.delete("/auth/cart/:userId/remove/:index", catchAsync(removeCartItem));
router.delete("/auth/cart/:userId/clear", catchAsync(clearCart));

router.get("/auth/addresses/:userId",authMiddleware(["USER"]), catchAsync(getAddresses));
router.get("/auth/addresses/:userId/:addressId",authMiddleware(["USER"]), catchAsync(getAddress));
router.post("/auth/addresses/:userId/add",authMiddleware(["USER"]), catchAsync(addAddress));
router.put("/auth/addresses/:userId/update/:addressId",authMiddleware(["USER"]), catchAsync(updateAddress));
router.delete("/auth/addresses/:userId/remove/:addressId",authMiddleware(["USER"]), catchAsync(removeAddress));


router.post("/auth/sendEmailOTP", catchAsync(sendEmailOTP)); // Send OTP to email
router.post("/auth/verifyEmailOTP", catchAsync(verifyEmailOTP)); // Verify OTP for login

router.get("/auth/cart/grandtotal/:userId",authMiddleware(["USER"]), catchAsync(getGrandTotal));

module.exports = router;

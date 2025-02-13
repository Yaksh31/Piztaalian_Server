const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
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
  removeAddress
} = require("../controllers/UserMaster/UserMaster");

router.post("/auth/create/user", catchAsync(createUserMaster));
router.get("/auth/list/user", catchAsync(listUserMaster));
router.post("/auth/listByParams/user", catchAsync(listUserMasterByParams));
router.get("/auth/get/user/:_id", catchAsync(getUserMaster));
router.put("/auth/update/user/:_id", catchAsync(updateUserMaster));
router.delete("/auth/remove/user/:_id", catchAsync(removeUserMaster));
router.post("/auth/login", catchAsync(userLoginMaster));

router.get("/auth/cart/:userId", catchAsync(getCart));
router.post("/auth/cart/:userId/add", catchAsync(addCartItem));
router.put("/auth/cart/:userId/update/:index", catchAsync(updateCartItem));
router.delete("/auth/cart/:userId/remove/:index", catchAsync(removeCartItem));
router.delete("/auth/cart/:userId/clear", catchAsync(clearCart));

router.get("/auth/addresses/:userId", catchAsync(getAddresses));
router.get("/auth/addresses/:userId/:addressId", catchAsync(getAddress));
router.post("/auth/addresses/:userId/add", catchAsync(addAddress));
router.put("/auth/addresses/:userId/update/:addressId", catchAsync(updateAddress));
router.delete("/auth/addresses/:userId/remove/:addressId", catchAsync(removeAddress));

module.exports = router;

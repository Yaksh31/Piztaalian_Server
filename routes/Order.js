const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

const {
  getOrder,
  createOrder,
  listOrders,
  listOrderByParams,
  updateOrder,
  removeOrder,
  listOrdersByBranch,
  updateOrderStatus,
  listUserOrders
} = require("../controllers/Order/Order");

router.post("/auth/order/create",authMiddleware(["USER"]), catchAsync(createOrder));
router.get("/auth/order/get/:id", catchAsync(getOrder));
router.get("/auth/order/list" ,authMiddleware(["ADMIN","BRANCH"]), catchAsync(listOrders));
router.post("/auth/order/listByParams",authMiddleware(["ADMIN","BRANCH"]), catchAsync(listOrderByParams));
router.put("/auth/order/update/:id",authMiddleware(["ADMIN","BRANCH"]), catchAsync(updateOrder));
router.delete("/auth/order/remove/:id",authMiddleware(["ADMIN","BRANCH"]), catchAsync(removeOrder));
router.post("/auth/order/listByBranch",authMiddleware(["ADMIN","BRANCH"]), catchAsync(listOrdersByBranch));
router.patch("/auth/order/:id",authMiddleware(["ADMIN","BRANCH"]), catchAsync(updateOrderStatus));

router.get("/auth/order/user/:userId",authMiddleware(["ADMIN","BRANCH","USER"]), catchAsync(listUserOrders));

module.exports = router;

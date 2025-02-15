const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const {
  getOrder,
  createOrder,
  listOrders,
  listOrderByParams,
  updateOrder,
  removeOrder,
  listOrdersByBranch,
  updateOrderStatus
} = require("../controllers/Order/Order");

router.post("/auth/order/create", catchAsync(createOrder));
router.get("/auth/order/get/:id", catchAsync(getOrder));
router.get("/auth/order/list", catchAsync(listOrders));
router.post("/auth/order/listByParams", catchAsync(listOrderByParams));
router.put("/auth/order/update/:id", catchAsync(updateOrder));
router.delete("/auth/order/remove/:id", catchAsync(removeOrder));
router.post("/auth/order/listByBranch", catchAsync(listOrdersByBranch));
router.patch("/auth/order/:id", catchAsync(updateOrderStatus));

module.exports = router;

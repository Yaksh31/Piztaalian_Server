const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const {
  createOrder,
  getOrder,
  listOrder,
  updateOrder,
  removeOrder,
  listOrderByParams
} = require("../controllers/Order/Order");


router.post("/auth/create/order", catchAsync(createOrder));

router.get("/auth/list/order", catchAsync(listOrder));


router.get("/auth/get/order/:_id", catchAsync(getOrder));


router.put("/auth/update/order/:_id", catchAsync(updateOrder));


router.delete("/auth/remove/order/:_id", catchAsync(removeOrder));

router.post("/auth/list-by-params/order", catchAsync(listOrderByParams));

module.exports = router;

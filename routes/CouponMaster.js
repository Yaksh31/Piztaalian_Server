const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const CouponMaster = require("../models/CouponMaster/CouponMaster");

const {
    createCouponMaster,
    listCouponMaster,
    listCouponMasterByParams,
    getCouponMaster,
    updateCouponMaster,
    removeCouponMaster,
    generateCouponQRCode
} = require("../controllers/CouponMaster/CouponMaster");





router.post("/auth/create/CouponMaster",  catchAsync(createCouponMaster));

router.get("/auth/list/CouponMaster", catchAsync(listCouponMaster));

router.post("/auth/list-by-params/CouponMaster", catchAsync(listCouponMasterByParams));

router.get("/auth/get/CouponMaster/:_id", catchAsync(getCouponMaster));

router.put("/auth/update/CouponMaster/:_id",  catchAsync(updateCouponMaster)
);

router.delete("/auth/remove/CouponMaster/:_id", catchAsync(removeCouponMaster)
);



module.exports = router;

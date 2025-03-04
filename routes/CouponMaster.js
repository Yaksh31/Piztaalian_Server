const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const CouponMaster = require("../models/CouponMaster/CouponMaster");
const { authMiddleware } = require("../middlewares/auth");




const {
    createCouponMaster,
    listCouponMaster,
    listCouponMasterByParams,
    getCouponMaster,
    updateCouponMaster,
    removeCouponMaster,
    generateCouponQRCode,
    getCouponTerms,
    
} = require("../controllers/CouponMaster/CouponMaster");





router.post("/auth/create/CouponMaster", authMiddleware(["ADMIN"]), catchAsync(createCouponMaster));

router.get("/auth/list/CouponMaster", authMiddleware(["ADMIN"]), catchAsync(listCouponMaster));

router.post("/auth/list-by-params/CouponMaster", authMiddleware(["ADMIN"]), catchAsync(listCouponMasterByParams));

router.get("/auth/get/CouponMaster/:_id", catchAsync(getCouponMaster));

router.put("/auth/update/CouponMaster/:_id", authMiddleware(["ADMIN"]),  catchAsync(updateCouponMaster)
);

router.delete("/auth/remove/CouponMaster/:_id", authMiddleware(["ADMIN"]), catchAsync(removeCouponMaster)
);

router.get("/auth/:_id/terms", authMiddleware(["ADMIN"]), getCouponTerms);




module.exports = router;

const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const CouponMaster = require("../models/CouponMaster/CouponMaster");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists or change the path as needed
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

const {
    createCouponMaster,
    listCouponMaster,
    listCouponMasterByParams,
    getCouponMaster,
    updateCouponMaster,
    removeCouponMaster,
    generateCouponQRCode,
    uploadExcel
} = require("../controllers/CouponMaster/CouponMaster");





router.post("/auth/create/CouponMaster",  catchAsync(createCouponMaster));

router.get("/auth/list/CouponMaster", catchAsync(listCouponMaster));

router.post("/auth/list-by-params/CouponMaster", catchAsync(listCouponMasterByParams));

router.get("/auth/get/CouponMaster/:_id", catchAsync(getCouponMaster));

router.put("/auth/update/CouponMaster/:_id",  catchAsync(updateCouponMaster)
);

router.delete("/auth/remove/CouponMaster/:_id", catchAsync(removeCouponMaster)
);
router.post(
    "/auth/CouponMaster/uploadExcel",
    upload.single("excelFile"),
    catchAsync(uploadExcel)
  );



module.exports = router;

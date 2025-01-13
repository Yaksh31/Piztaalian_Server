const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
    createCouponMaster,
    listCouponMaster,
    listCouponMasterByParams,
    getCouponMaster,
    updateCouponMaster,
    removeCouponMaster,
} = require("../controllers/CouponMaster/CouponMaster");
const multer = require("multer");

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/Products");
    },
    filename: (req, file, cb) => {
        // const ext = file.mimetype.split("/")[1];
        // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({ storage: multerStorage });

router.post("/auth/create/CouponMaster", upload.single("myFile"), catchAsync(createCouponMaster));

router.get("/auth/list/CouponMaster", catchAsync(listCouponMaster));

router.post("/auth/list-by-params/CouponMaster", catchAsync(listCouponMasterByParams));

router.get("/auth/get/CouponMaster/:_id", catchAsync(getCouponMaster));

router.put("/auth/update/CouponMaster/:_id", upload.single("myFile"), catchAsync(updateCouponMaster)
);

router.delete("/auth/remove/CouponMaster/:_id", catchAsync(removeCouponMaster)
);

///

module.exports = router;

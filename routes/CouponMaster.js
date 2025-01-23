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
const multer = require("multer");

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/Products");
//     },
//     filename: (req, file, cb) => {
//         // const ext = file.mimetype.split("/")[1];
//         // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
//         cb(null, Date.now() + "_" + file.originalname);
//     },
// });

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/CouponQR"); // Adjusted folder name for Coupon-related uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname); // File naming format
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
router.get(
    "/auth/generate-qr/CouponMaster/:_id",
    catchAsync(generateCouponQRCode) 
  );

  router.get("/:id", async (req, res) => {
    try {
        const coupon = await CouponMaster.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.status(200).json(coupon);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;

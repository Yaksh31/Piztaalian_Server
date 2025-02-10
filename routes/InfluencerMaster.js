const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

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
  createInfluencer,
  listInfluencer,
  listInfluencerByParams,
  getInfluencer,
  updateInfluencer,
  removeInfluencer,
  userInfluencer,
  uploadExcel,
  influencerLogin,
  
} = require("../controllers/CouponMaster/uploads/InfluencerMaster");

router.post("/auth/create/Influencer", catchAsync(createInfluencer));

router.get("/auth/list/Influencer", catchAsync(listInfluencer));

router.post("/auth/listByparams/Influencer", catchAsync(listInfluencerByParams));

router.get("/auth/get/Influencer/:_id", catchAsync(getInfluencer));

router.put("/auth/update/Influencer/:id", catchAsync(updateInfluencer));

router.delete("/auth/remove/Influencer/:_id", catchAsync(removeInfluencer));

router.post(
    "/auth/CouponMaster/uploadExcel",
    upload.single("excelFile"),
    catchAsync(uploadExcel)
  );
router.post("/influencer/login", catchAsync(influencerLogin))



// router.post("/adminLogin", catchAsync(userLoginAdmin));

module.exports = router;

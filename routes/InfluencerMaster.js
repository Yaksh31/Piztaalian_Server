const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

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

router.post("/auth/create/Influencer", authMiddleware(["ADMIN"]) ,catchAsync(createInfluencer));

router.get("/auth/list/Influencer", authMiddleware(["ADMIN"]), catchAsync(listInfluencer));

router.post("/auth/listByparams/Influencer", authMiddleware(["ADMIN"]), catchAsync(listInfluencerByParams));

router.get("/auth/get/Influencer/:_id", authMiddleware(["ADMIN","INFLUENCER"]), catchAsync(getInfluencer));

router.put("/auth/update/Influencer/:id", authMiddleware(["ADMIN","INFLUENCER"]), catchAsync(updateInfluencer));

router.delete("/auth/remove/Influencer/:_id", authMiddleware(["ADMIN"]), catchAsync(removeInfluencer));

router.post(
    "/auth/CouponMaster/uploadExcel",
    upload.single("excelFile"), authMiddleware(["ADMIN"]),
    catchAsync(uploadExcel)
  );
router.post("/influencer/login", catchAsync(influencerLogin))



// router.post("/adminLogin", catchAsync(userLoginAdmin));

module.exports = router;

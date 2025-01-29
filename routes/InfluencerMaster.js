const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createInfluencer,
  listInfluencer,
  listInfluencerByParams,
  getInfluencer,
  updateInfluencer,
  removeInfluencer,
  userInfluencer,
} = require("../controllers/CouponMaster/uploads/InfluencerMaster");
// const multer = require("multer");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/userImages");
//   },
//   filename: (req, file, cb) => {
//     // const ext = file.mimetype.split("/")[1];
//     // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// const upload = multer({ storage: multerStorage });
router.post("/auth/create/Influencer", catchAsync(createInfluencer));

router.get("/auth/list/Influencer", catchAsync(listInfluencer));

router.post("/auth/listByparams/Influencer", catchAsync(listInfluencerByParams));

router.get("/auth/get/Influencer/:_id", catchAsync(getInfluencer));

router.put("/auth/update/Influencer/:id", catchAsync(updateInfluencer));

router.delete("/auth/remove/Influencer/:_id", catchAsync(removeInfluencer));

// router.post("/adminLogin", catchAsync(userLoginAdmin));

module.exports = router;

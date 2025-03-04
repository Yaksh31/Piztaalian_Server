const express = require("express");

const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");

const catchAsync = require("../utils/catchAsync");
const {
  createOffer,
  listOffer,
  listOfferByParams,
  getOffer,
  updateOffer,
  removeOffer,
  //userLoginAdmin,
} = require("../controllers/Offers/OfferMaster");
const multer = require("multer");
const { list } = require("pdfkit");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/offerImages");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });
router.post(
  "/auth/create/offer",authMiddleware(["ADMIN"]),
  upload.single("myFile"),
  catchAsync(createOffer)
);

router.get("/auth/list/offer", catchAsync(listOffer));

router.post("/auth/listByparams/offer", catchAsync(listOfferByParams));

router.get("/auth/get/offer/:_id", catchAsync(getOffer));

router.put(
  "/auth/update/offer/:_id",authMiddleware(["ADMIN"]),
  upload.single("myFile"),
  catchAsync(updateOffer)
);

router.delete("/auth/remove/offer/:_id",authMiddleware(["ADMIN"]), catchAsync(removeOffer));

//router.post("/adminLogin", catchAsync(userLoginAdmin));

module.exports = router;

const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

const {
  createGallery,
  listGallery,
  listGalleryByParams,
  getGallery,
  updateGallery,
  removeGallery,
} = require("../controllers/GalleryMaster/GalleryMaster");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/GalleryImg");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

router.post(
  "/auth/create/gallery",
  upload.single("myFile"),authMiddleware(["ADMIN"]),
  catchAsync(createGallery)
);

router.get("/auth/list/gallery", catchAsync(listGallery));

router.post("/auth/list-by-params/gallery", catchAsync(listGalleryByParams));

router.get("/auth/get/gallery/:_id", catchAsync(getGallery));

router.put(
  "/auth/update/gallery/:_id",
  upload.single("myFile"),authMiddleware(["ADMIN"]),
  catchAsync(updateGallery)
);

router.delete("/auth/remove/gallery/:_id",authMiddleware(["ADMIN"]), catchAsync(removeGallery));

const multerStorageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ProductCKImages");  // Folder for product images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);  // Unique file naming
  },
});

const uploadProductCK = multer({ storage: multerStorageProduct });

router.post(
  "/auth/gallery-master/image-upload", authMiddleware(["ADMIN"]),
  uploadProductCK.single("uploadImg"),
  async (req, res) => {
    console.log(req.file.filename);
    res.json({ url: req.file.filename });  // Returning the file URL
  }
);

module.exports = router;

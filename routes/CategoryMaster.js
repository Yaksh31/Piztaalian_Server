const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createCategoryMaster,
  listCategoryMaster,
  listCategoryMasterByParams,
  getCategoryMaster,
  updateCategoryMaster,
  removeCategoryMaster,
  listActiveCategories,
} = require("../controllers/Category/CategoryMaster");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/menuCategoryImages");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

router.post(
  "/auth/create/categoryMaster",
  upload.single("myFile"),
  catchAsync(createCategoryMaster)
);

router.get("/auth/list/categoryMaster", catchAsync(listCategoryMaster));

router.get(
  "/auth/list-active/categoryMaster",
  catchAsync(listActiveCategories)
);

router.post(
  "/auth/list-by-params/categoryMaster",
  catchAsync(listCategoryMasterByParams)
);

router.get("/auth/get/categoryMaster/:_id", catchAsync(getCategoryMaster));

router.put(
  "/auth/update/categoryMaster/:_id",
  upload.single("myFile"),
  catchAsync(updateCategoryMaster)
);

router.delete(
  "/auth/remove/categoryMaster/:_id",
  catchAsync(removeCategoryMaster)
);

module.exports = router;

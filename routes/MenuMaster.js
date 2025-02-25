const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getBranchesWithZeroMenuItems,
  getMenuItemsByBranchId,
  updateMenuMaster,
  listMenuByParams,
  getMenuById,
  updateMenuMasterByAdmin,
  getMenuItemByCategory,
} = require("../controllers/MenuMaster/MenuMaster");

// Route for creating or updating MenuMaster

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/FoodImages");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: multerStorage });

// Routes
router.post("/auth/menuMaster", upload.any(), updateMenuMaster);
router.get("/auth/branches/menuItems/:branchId", getMenuItemsByBranchId);
// List Menu with filters and pagination
router.post("/auth/menu/listByParams", listMenuByParams);

// Define route to fetch all menu items
router.get("/auth/get/branchForMenu", getBranchesWithZeroMenuItems);
router.get("/auth/get/menuItems/:id", getMenuById);
router.put("/auth/update/menu/:id", upload.any(), updateMenuMasterByAdmin);

router.get("/auth/get/menuItemsByCategory/:categoryId", getMenuItemByCategory);

module.exports = router;

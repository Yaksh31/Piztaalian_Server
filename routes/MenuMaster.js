const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { getMenuItemsByBranchId, updateMenuMaster } = require('../controllers/MenuMaster/MenuMaster');



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

module.exports = router;

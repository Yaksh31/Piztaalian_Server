const express = require("express");
const router = express.Router();
const multer = require("multer");
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

const {
  createBranch,
  listBranch,
  listBranchByParams,
  getBranch,
  updateBranch,
  removeBranch,
  branchLogin, 
} = require("../controllers/BranchMaster/BranchMaster");

// Multer configuration for handling file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/branchImages");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

// Define routes

// Create a new branch
router.post("/auth/branches/create", authMiddleware(["ADMIN"]), upload.single("branchImage"), catchAsync(createBranch));

// List all branches
router.get("/auth/branches/list",catchAsync(listBranch));

// List branches with filters and pagination
router.post("/auth/branches/listByParams", catchAsync(listBranchByParams));

// Get a branch by ID
router.get("/auth/branches/:_id", authMiddleware(["ADMIN","BRANCH"]), catchAsync(getBranch));

// Update a branch
router.put("/auth/branches/update/:_id",  authMiddleware(["BRANCH","ADMIN"]),upload.single("branchImage"), catchAsync(updateBranch));

// Remove a branch
router.delete("/auth/branches/remove/:_id", authMiddleware(["ADMIN"]), catchAsync(removeBranch));

router.post("/branches/login", catchAsync(branchLogin));
 

module.exports = router;

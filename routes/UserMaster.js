const express = require("express");
const router = express.Router();

const catchAsync = require("../utils/catchAsync"); // For handling async errors
const {
  createUserMaster,
  listUserMaster,
  listUserMasterByParams,
  getUserMaster,
  updateUserMaster,
  removeUserMaster,
  userLoginMaster,
} = require("../controllers/UserMaster/UserMaster"); // Adjust the path if needed

// 1. CREATE a new user (optional file upload via 'myFile')
router.post(
  "/auth/create/user",

  catchAsync(createUserMaster)
);

// 2. LIST all users
router.get("/auth/list/user", catchAsync(listUserMaster));

// 3. LIST users by parameters (pagination, search, filters)
router.post("/auth/listByParams/user", catchAsync(listUserMasterByParams));

// 4. GET a single user by ID
router.get("/auth/get/user/:_id", catchAsync(getUserMaster));

// 5. UPDATE a user (optional file upload via 'myFile')
router.put(
  "/auth/update/user/:_id",

  catchAsync(updateUserMaster)
);

// 6. REMOVE (delete) a user
router.delete("/auth/remove/user/:_id", catchAsync(removeUserMaster));

// 7. USER LOGIN
router.post("/auth/login", catchAsync(userLoginMaster));

module.exports = router;

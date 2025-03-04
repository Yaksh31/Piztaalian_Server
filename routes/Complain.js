const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");

const {
  createComplains,
  listComplains,
  listComplainsByParams,
  getComplains,
  updateComplains,
  removeComplains,
} = require("../controllers/ComplainMaster/Complain");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ComplainImg");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

router.post(
  "/auth/create/complain",
  upload.single("myFile"),
  catchAsync(createComplains)
);

router.get("/auth/list/complain",authMiddleware(["ADMIN", "BRANCH"]), catchAsync(listComplains));

router.post("/auth/list-by-params/complain",authMiddleware(["ADMIN", "BRANCH"]), catchAsync(listComplainsByParams));

router.get("/auth/get/complain/:_id", authMiddleware(["USER", "ADMIN", "BRANCH"]), catchAsync(getComplains));

router.put(
  "/auth/update/complain/:_id",authMiddleware(["ADMIN"]),
  upload.single("myFile"),
  catchAsync(updateComplains)
);

router.delete("/auth/remove/complain/:_id",authMiddleware(["ADMIN"]), catchAsync(removeComplains));

module.exports = router;

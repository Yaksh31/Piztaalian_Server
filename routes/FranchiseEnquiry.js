const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");
const { createEnquiry, getEnquiry, listEnquiry, removeEnquiry , listEnquiryByParams} = require("../controllers/FranchiseEnquiry/FranchiseEnquiry");

// Route for submitting contact inquiry
router.post("/auth/create/enquiry", catchAsync(createEnquiry));

// Route for listing all contact inquiries
router.get("/auth/list/enquiry", authMiddleware(["ADMIN"]), catchAsync(listEnquiry));

// Route for fetching single inquiry details
router.get("/auth/get/enquiry/:_id", authMiddleware(["ADMIN"]), catchAsync(getEnquiry));

// Route for deleting an inquiry
router.delete("/auth/remove/enquiry/:_id", authMiddleware(["ADMIN"]), catchAsync(removeEnquiry))

router.post("/auth/list-by-params/enquiry", authMiddleware(["ADMIN"]), catchAsync(listEnquiryByParams));


module.exports = router;

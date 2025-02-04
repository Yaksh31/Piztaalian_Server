const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { createEnquiry, getEnquiry, listEnquiry, removeEnquiry , listEnquiryByParams} = require("../controllers/FranchiseEnquiry/FranchiseEnquiry");

// Route for submitting contact inquiry
router.post("/auth/create/enquiry", catchAsync(createEnquiry));

// Route for listing all contact inquiries
router.get("/auth/list/enquiry", catchAsync(listEnquiry));

// Route for fetching single inquiry details
router.get("/auth/get/enquiry/:_id", catchAsync(getEnquiry));

// Route for deleting an inquiry
router.delete("/auth/remove/enquiry/:_id", catchAsync(removeEnquiry))

router.post("/auth/list-by-params/enquiry", catchAsync(listEnquiryByParams));


module.exports = router;

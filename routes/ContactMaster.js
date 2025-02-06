const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { createContact, getContact, listContact, removeContact , listContactByParams} = require("../controllers/ContactMaster/ContactMaster");

// Route for submitting contact inquiry
router.post("/auth/create/contact", catchAsync(createContact));

// Route for listing all contact inquiries
router.get("/auth/list/contact", catchAsync(listContact));

// Route for fetching single inquiry details
router.get("/auth/get/contact/:_id", catchAsync(getContact));

// Route for deleting an inquiry
router.delete("/auth/remove/contact/:_id", catchAsync(removeContact));

router.post("/auth/list-by-params/contact", catchAsync(listContactByParams));


module.exports = router;

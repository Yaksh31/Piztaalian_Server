const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { authMiddleware } = require("../middlewares/auth");
const { createContact, getContact, listContact, removeContact , listContactByParams} = require("../controllers/ContactMaster/ContactMaster");

// Route for submitting contact inquiry
router.post("/auth/create/contact", catchAsync(createContact));

// Route for listing all contact inquiries
router.get("/auth/list/contact", authMiddleware(["ADMIN"]),catchAsync(listContact));

// Route for fetching single inquiry details
router.get("/auth/get/contact/:_id", authMiddleware(["ADMIN"]), catchAsync(getContact));

// Route for deleting an inquiry
router.delete("/auth/remove/contact/:_id",authMiddleware(["ADMIN"]), catchAsync(removeContact));

router.post("/auth/list-by-params/contact",authMiddleware(["ADMIN"]), catchAsync(listContactByParams));


module.exports = router;

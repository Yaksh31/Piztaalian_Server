const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const { createContact, getContact, listActiveCategories, removeContactMaster, updateContactMaster, listContact, listActiveContact, listContactByParams  } = require("../controllers/Contact/Contact");

// router.post("/auth/contact", catchAsync(createContact));
// router.get("/auth/list/contact", catchAsync(listContact));

// router.get(
//   "/auth/list-active/contact",
//   catchAsync(listActiveContact)
// );

// router.post(
//   "/auth/list-by-params/contact",
//   catchAsync(listContactByParams)
// );

// router.get("/auth/get/contact/:_id", catchAsync(getContact));

// router.put(
//   "/auth/update/contact/:_id",
//   catchAsync(updateContactMaster)
// );

// router.delete(
//   "/auth/remove/contact/:_id",
//   catchAsync(removeContactMaster)
// );


module.exports = router;
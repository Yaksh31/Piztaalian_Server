const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AddressSchema = new Schema({
  addressTitle: {
    type: String,
    // required: [true, "Address title is required"], // Uncomment if you want this field to be mandatory
    default: "Home",
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  area: {
    type: String,
    required: [true, "Area is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  state: {
    type: String,
    required: [true, "State is required"],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
  },
});

const UserMasterSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      // Remember to hash the password before saving to the database
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Enforces unique emails
      // Add email format validation if desired
    },
    addresses: {
      type: [AddressSchema],
      default: [], // By default, users will have an empty array of addresses
    },
    isActive: {
      type: Boolean,
      default: true, // Defaults to active
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = model("UserMaster", UserMasterSchema);

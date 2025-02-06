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
    type: mongoose.Schema.Types.ObjectId, // Reference to City collection
    ref: "City",
    required: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId, // Reference to State collection
    ref: "State",
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Country collection
    ref: "Country",
    required: true,
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
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Enforces unique emails
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
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

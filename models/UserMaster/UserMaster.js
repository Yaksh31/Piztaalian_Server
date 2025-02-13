const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AddressSchema = new Schema({
  addressType: {
    type: String,
    enum: ["home", "office", "other"],
    required: [true, "Address type is required"],
  },
  buildingNumber: {
    type: String,
    required: [true, "House/Flat/Block number is required"],
  },
  landmark: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
  },
  emailAddress: {
    type: String,
    required: [true, "Email address is required"],
    match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
  },
  area: {
    type: String,
    required: [true, "Area is required"],
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: [true, "City is required"],
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: [true, "Country is required"],
  },
}, { timestamps: true });

const CartItemSchema = new Schema(
 {
     menuItem: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "MenuMaster",
       required: true,
       default: null
     },
     quantity: {
       type: Number,
       required: true,
       default: 1
     },
     branch: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Branches",
       required: true,
       default: null
     },
     toppings: [
       {
         type: mongoose.Schema.Types.ObjectId,
         ref: "ToppingMaster",
         required: true,
         default: null
       }
     ],
     variant: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Variant",
       default: null
     },
     totalPrice: {
       type: Number,
       required: true
     }
   },
   { _id: false }
);

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
      
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    cart: {
      type: [CartItemSchema],
      default: []
    },
    addresses: {
      type: [AddressSchema],
      default: [], 
    },
    isActive: {
      type: Boolean,
      default: true, 
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = model("UserMaster", UserMasterSchema);

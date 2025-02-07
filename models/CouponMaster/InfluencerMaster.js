const mongoose = require("mongoose");

const InfluencerMasterSchema = new mongoose.Schema(
{
name: {
type: String,
required:true

},
phone: {
type: String,
required:true,
unique: true,
match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],

},
email: {
type: String,
required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        "Please enter a valid email address",
      ],
},
password: {
type: String,


},
instagram: {
type: String,


},
youtube: {
type: String,

},
IsActive:{
    type:Boolean,
}
},
{ timestamps: true }
);

module.exports = mongoose.model("InfluencerMaster", InfluencerMasterSchema);
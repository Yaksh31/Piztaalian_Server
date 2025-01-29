const mongoose = require("mongoose");

const InfluencerMasterSchema = new mongoose.Schema(
{
name: {
type: String,

},
phone: {
type: String,

},
email: {
type: String,
required: true,

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
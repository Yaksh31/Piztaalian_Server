const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const BlogsSchema = new mongoose.Schema(
  {
    blogTitle: {
      type: String,
      required: true,
    },
    blogDesc: {
      type: String,
      required: true,
    },
    // blogThumnailDesc: {
    //   type: String,

    //   required: true,
    // },
    blogImage: {
      type: String,
    },
    // views: {
    //   type: Number,
    //   default: 0,
    // },
    // likes: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Users",
    //     default: [],
    //   },
    // ],
    // comments: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "BlogComment",
    //     default: [],
    //   },
    // ],
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Users",
    //   required: true,
    // },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blogs", BlogsSchema);

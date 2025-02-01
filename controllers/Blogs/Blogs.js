const { log } = require("console");
const Blogs = require("../../models/Blogs/Blogs");
const fs = require("fs");

exports.getBlogs = async (req, res) => {
  try {
    const find = await Blogs.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.AddLikes = async (req, res) => {
  try {
    const { blogId, userId } = req.params;
    const blogsData = await Blogs.findOneAndUpdate(
      { _id: blogId },
      { $addToSet: { likes: userId } },
      { new: true }
    );
    res.json(blogsData);
  } catch (error) {
    return res.status(500).json("error in add likes ", error);
  }
};

exports.RemoveLikes = async (req, res) => {
  try {
    const { blogId, userId } = req.params;
    const blogsData = await Blogs.findOneAndUpdate(
      { _id: blogId },
      { $pull: { likes: userId } },
      { new: true }
    );
    res.json(blogsData);
  } catch (error) {
    return res.status(500).json("error in remove likes ", error);
  }
};

// exports.SerachBlog = async (req, res) => {
//   try {
//     const searchTerm = req.query.search; // Assuming you're passing the search term in the query string

//     const blogs = await Blogs.find({
//       blogTitle: { $regex: new RegExp(searchTerm, "i") },
//       IsActive: true, // Adding IsActive condition
//     }).sort({ createdAt: -1 });
//     // log("blogs", blogs);
//     res.json(blogs);
//   } catch (error) {
//     console.error("Error searching blogs:", error);
//     res.status(500).json("An error occurred while searching blogs");
//   }
// };

exports.SearchBlog = async (req, res) => {
  try {
    console.log("params", req.query);
    const searchTerm = req.query.search;
    const page = parseInt(req.query.page) || 1; // Extract page number from query parameters, default to 1 if not provided
    const limit = 5; // Number of documents per page

    const skip = (page - 1) * limit;

    const query = {
      blogTitle: { $regex: new RegExp(searchTerm, "i") },
      IsActive: true,
    };

    const totalBlogs = await Blogs.countDocuments(query); // Count total documents matching the query

    const totalPages = Math.ceil(totalBlogs / limit); // Calculate total pages

    const blogs = await Blogs.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ blogs, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json("An error occurred while searching blogs");
  }
};

exports.SerachBlogDetails = async (req, res) => {
  try {
    const searchTermBD = req.query.search; // Assuming you're passing the search term in the query string

    const blogs = await Blogs.find({
      blogTitle: { $regex: new RegExp(searchTermBD, "i") },
      blogDesc: { $regex: new RegExp(searchTermBD, "i") },
      IsActive: true, // Adding IsActive condition
    }).sort({ createdAt: -1 });
    // log("blogs", blogs);
    res.json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json("An error occurred while searching blog details");
  }
};

exports.topPopularPosts = async (req, res) => {
  try {
    const top5Blogs = await Blogs.aggregate([
      {
        $project: {
          _id: 1,
          blogTitle: 1,
          blogDesc: 1,
          // blogThumnailDesc: 1,
          blogImage: 1,
          // views: 1,
          // likesCount: { $size: "$likes" }, // Calculate the number of likes
        },
      },
      // {
      //   $sort: { likesCount: -1 }, // Sort in descending order based on likesCount
      // },
      {
        $limit: 5, // Limit to 5 documents
      },
    ]);
    const top5BlogIds = top5Blogs.map((blog) => blog._id);

    // return top5Blogs;
    res.json(top5BlogIds);
  } catch (error) {
    console.error("Error fetching top 5 popular blogs:", error);
    throw error;
  }
};

exports.createBlogs = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/blogImages`)) {
      fs.mkdirSync(`${__basedir}/uploads/blogImages`);
    }

    let blogImage = req.file ? `uploads/blogImages/${req.file.filename}` : null;

    let {
      blogTitle,
      blogDesc,
      // likes,
      // blogThumnailDesc,
      // views,
      // comments,
      // userId,
      IsActive,
    } = req.body;

    // let like;
    // let comment;
    // if (likes == undefined || likes == null || likes == "") {
    //   like = [];
    // }
    // if (comments == undefined || comments == null || comments == "") {
    //   comment = [];
    // }

    const add = await new Blogs({
      blogTitle: blogTitle,
      blogImage: blogImage,
      blogDesc: blogDesc,
      // blogThumnailDesc: blogThumnailDesc,
      // views: views,
      // likes: like,
      // comments: comment,
      // userId: userId,
      IsActive: IsActive,
    }).save();
    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.listBlogs = async (req, res) => {
  try {
    const list = await Blogs.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.updateViews = async (req, res) => {
  try {
    console.log("req.params", req.params);
    const id = req.params.bid;
    const viewsCounter = parseInt(req.params.views);

    log("viewsCounter", viewsCounter);
    const update = await Blogs.findOneAndUpdate(
      { _id: id },
      { views: viewsCounter + 1 },
      { new: true }
    );
    console.log("update", update);
    res.json(update.views);
  } catch (error) {
    return res.status(400).send("errror in update views", error);
  }
};
exports.listActiveBlogs = async (req, res) => {
  try {
    const listActive = await Blogs.find({ IsActive: true })
      .sort({ createdAt: -1 })
      .exec();
    res.json(listActive);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listBlogsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
      {
        $lookup: {
          from: "adminusers",
          localField: "userId",
          foreignField: "_id",
          as: "adminuser",
        },
      },
      {
        $unwind: {
          path: "$adminuser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          adminuser: "$adminuser.firstName",
        },
      },

      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];
    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                blogTitle: { $regex: match, $options: "i" },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }

    const list = await Blogs.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateBlogs = async (req, res) => {
  try {
    // console.log("req.body", req.body);
    let blogImage = req.file ? `uploads/blogImages/${req.file.filename}` : null;
    let fieldvalues = { ...req.body };
    if (blogImage != null) {
      fieldvalues.blogImage = blogImage;
    }

    if (
      fieldvalues.likes == undefined ||
      fieldvalues.likes == null ||
      fieldvalues.likes == ""
    ) {
      fieldvalues.likes = [];
    } else {
      const likesArray = JSON.parse(fieldvalues.likes);
      fieldvalues.likes = likesArray;
    }
    if (
      fieldvalues.comments == undefined ||
      fieldvalues.comments == null ||
      fieldvalues.comments == ""
    ) {
      fieldvalues.comments = [];
    } else {
      const commentList = JSON.parse(fieldvalues.comments);
      fieldvalues.comments = commentList;
    }

    const update = await Blogs.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    console.log(err);
    return res.status(500).send("error", err);
  }
};

exports.removeBlogs = async (req, res) => {
  try {
    const del = await Blogs.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

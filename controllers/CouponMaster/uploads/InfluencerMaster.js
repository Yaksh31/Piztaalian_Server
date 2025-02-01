const Influencer = require("../../../models/CouponMaster/InfluencerMaster");
const fs = require("fs");

exports.getInfluencer = async (req, res) => {
  try {
    const find = await Influencer.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createInfluencer = async (req, res) => {
  try {
    // Log request body for debugging
    console.log("Request Body: ", req.body);

    // Extract data from the request body
    const { name, youtube, instagram, email, password, IsActive, phone } = req.body;

    // Create a new influencer object
    const newInfluencer = new Influencer({
      name,
      youtube,
      instagram,
      email,
      password,
      IsActive,
      phone,
    });

    // Save the influencer to the database
    const savedInfluencer = await newInfluencer.save();
    res.status(200).json({
      isOk: true,
      data: savedInfluencer,
      message: "Influencer created successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      isOk: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

exports.listInfluencer = async (req, res) => {
  try {
    const list = await Influencer.find({IsActive:true}).sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listInfluencerByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
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
                name: { $regex: match, $options: "i" },
              },
              {
                youtube: { $regex: match, $options: "i" },
              },
              {
                email: { $regex: match, $options: "i" },
              },
              {
                password: { $regex: match, $options: "i" },
              },
              {
                instagram: { $regex: match, $options: "i" },
              },
              {
                phone: { $regex: match, $options: "i" },
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

    const list = await Influencer.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateInfluencer = async (req, res) => {
    try {
      console.log("Update Request Body:", req.body); // Debug incoming data
    console.log("ID to update:", req.params.id); // Debug ID

      const influencerId = req.params.id;
      const { name, phone, email, password, instagram, youtube ,IsActive} = req.body;
      const updatedInfluencer = await Influencer.findOneAndUpdate(
        { _id: influencerId },
        { name, phone, email, password, instagram, youtube,IsActive },
        { new: true }
      );
      res.json(updatedInfluencer);
    } catch (err) {
      res.status(400).send(err);
    }
  };

exports.removeInfluencer = async (req, res) => {
  try {
    const del = await Influencer.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

// exports.userLoginAdmin = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const usermp = await User.findOne({ email: email }).exec();
//     if (usermp) {
//       if (usermp.password !== password) {
//         return res.status(200).json({
//           isOk: false,
//           filed: 1,
//           message: "Authentication Failed",
//         });
//       } else {
//         res.status(200).json({
//           isOk: true,
//           message: "Authentication Successfull",
//           data: usermp,
//         });
//       }
//     } else {
//       res.status(200).json({
//         isOk: false,
//         message: "Admin User not Found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(200).json({
//       isOk: false,
//       message: "An error occurred while logging in adminpanel",
//     });
//   }
// };

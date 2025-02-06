const Offer = require("../../models/Offers/OfferMaster");
const fs = require("fs");

exports.getOffer = async (req, res) => {
  try {
    const find = await Offer.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createOffer = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/offerImages`)) {
      fs.mkdirSync(`${__basedir}/uploads/offerImages`);
    }

    let bannerImage = req.file
      ? `uploads/offerImages/${req.file.filename}`
      : null;

    let { IsActive, title, description } = req.body;
    // const emailExists = await User.findOne({
    //   email: req.body.email,
    // }).exec();

    // if (emailExists) {
    //   return res.status(200).json({
    //     isOk: false,
    //     message: "Email already exists",
    //   });
    // } 
      const add = await new Offer({
        title,
        description,

        bannerImage,
        IsActive,
      }).save();
      res.status(200).json({ isOk: true, data: add, message: "" });
    
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.listOffer = async (req, res) => {
  try {
    const list = await Offer.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listOfferByParams = async (req, res) => {
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
                title: { $regex: match, $options: "i" },
              },
              {
                description: { $regex: match, $options: "i" },
              },
              // {
              //   email: { $regex: match, $options: "i" },
              // },
              // {
              //   password: { $regex: match, $options: "i" },
              // },
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

    const list = await Offer.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    let bannerImage = req.file
      ? `uploads/offerImages/${req.file.filename}`
      : null;
    let fieldvalues = { ...req.body };
    if (bannerImage != null) {
      fieldvalues.bannerImage = bannerImage;
    }
    const update = await Offer.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeOffer = async (req, res) => {
  try {
    const del = await Offer.findOneAndRemove({
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

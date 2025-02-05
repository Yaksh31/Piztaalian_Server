const CouponMaster = require("../../models/CouponMaster/CouponMaster");
const fs = require("fs");
const QRCode = require("qrcode");
const path = require("path")
exports.getCouponMaster = async (req, res) => {
  try {
    const find = await CouponMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createCouponMaster = async (req, res) => {
  try {
    const {
      couponCode,
      discountPercentage,
      maxDiscount,
      expiryDate,
      couponDescription,
      isActive,
      byBranch,
      startTime,
      endTime,
      termsAndConditions
    } = req.body;

    const data = await CouponMaster.findOne({ couponCode }).exec();
    if (data) {
      return res.status(400).json({ isOk: false, message: "Coupon Code with this name already Exist" });
    }

    // Check for required fields
    if (!couponCode || !expiryDate) {
      return res.status(400).json({
        error: "couponCode and expiryDate are required.",
      });
    }

    const sanitizedByBranch = byBranch && mongoose.Types.ObjectId.isValid(byBranch)
      ? byBranch
      : null;

    // Create and save the new coupon
    const newCoupon = new CouponMaster({
      couponCode,
      discountPercentage,
      maxDiscount,
      expiryDate,
      couponDescription,
      startTime,
      endTime,
      termsAndConditions,
      isActive,
      byBranch: byBranch || null,
    });

    const savedCoupon = await newCoupon.save();

    res.status(200).json({
      isOk: true,
      data: savedCoupon,
      message: "Coupon created successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      isOk: false,
      message: "An error occurred while creating the coupon.",
      error: err.message,
    });
  }
};


exports.listCouponMaster = async (req, res) => {
  try {
    const list = await CouponMaster.find({isActive:true}).sort({ productName: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};




exports.listCouponMasterByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { isActive: IsActive },
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
                couponCode: { $regex: match, $options: "i" },
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

    const list = await CouponMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateCouponMaster = async (req, res) => {
  try {

    let fieldvalues = { ...req.body };


    const update = await CouponMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeCouponMaster = async (req, res) => {
  try {
    const del = await CouponMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};


// exports.generateCouponQRCode = async (req, res) => {
//   try {
//     const { _id } = req.params;

//     // Find the coupon by ID
//     const coupon = await CouponMaster.findOne({ _id }).exec();
//     if (!coupon) {
//       return res.status(404).json({ isOk: false, message: "Coupon not found." });
//     }

//     // Prepare the data to be encoded in the QR code
//     const qrData = {
//       couponCode: coupon.couponCode,
//       influencerName: coupon.influencerName || "",
//       discountPercentage: coupon.discountPercentage || 0,
//       maxDiscount: coupon.maxDiscount || 0,
//       expiryDate: coupon.expiryDate,
//       couponDescription: coupon.couponDescription || "",
//     };

//     // Define the folder and file path for storing the QR code

//     // Generate the QR code and save it as a file
//     QRCode.toFile(qrFilePath, qrUrl);
//     res.status(200).json({
//       isOk: true,
//       qrCodeUrl: qrUrl,
//       message: "QR Code generated and saved successfully.",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       isOk: false,
//       message: "An error occurred while generating the QR code.",
//       error: err.message,
//     });
//   }
// };
  
const Branch = require("../../models/BranchMaster/BranchMaster");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const InfluencerMaster = require("../../models/CouponMaster/InfluencerMaster")
const CouponMaster = require("../../models/CouponMaster/CouponMaster")
const QRCode = require("qrcode");
const CouponAssign = require ("../../models/CouponMaster/CouponAssign")


// exports.getCouponAssign = async (req, res) => {
//     try {
//       const couponAssign = await CouponAssign.findOne({ _id: req.params._id })
//         .populate("influencer", "name")
//         .populate("coupon", "couponCode")
//         .populate("branch", "branchName")
//         .exec();
  
//       if (!couponAssign) {
//         return res.status(404).json({ message: "Coupon Assign not found" });
//       }
  
//       res.json(couponAssign);
//     } catch (error) {
//       return res.status(500).send({ error: error.message });
//     }
//   };

exports.getCouponAssign = async (req, res) => {
  try {
    // const find = await User.findOne({ _id: req.params._id }).populate("branchName").exec();

    // if (!find) {
    //   return res.status(400).json({ message: "Coupon code is required." });
    // }

    // Fetch the coupon assignment
    const couponAssign = await CouponAssign.findById(req.params._id)
      .populate('influencer')
      .populate('coupon')
      .populate('qrCodeUrl')
      .exec();

    if (!couponAssign) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    res.status(200).json({
      isOk: true,
      data: couponAssign,
    });
  } catch (err) {
    console.error("Error in getCouponAssign:", err);
    return res.status(500).send({ error: "Internal Server Error." });
  }
};





  exports.createCouponAssign = async (req, res) => {
  try {
    const { influencer, coupon, numberOfCoupons, branch } = req.body;

    // Validate fields
    if (!influencer ||  !Array.isArray(influencer) ||!coupon || !numberOfCoupons || !branch) {
      return res.status(400).json({
        message: "All fields (influencer, coupon, numberOfCoupons, branch) are required.",
      });
    }

   
    const influencerData = await InfluencerMaster.find({ _id: { $in: influencer } }).exec();
    const couponData = await CouponMaster.findById(coupon).exec();

    if (!influencerData || !couponData) {
      return res.status(400).json({
        message: "Invalid Influencer or Coupon selected.",
      });
    }

     
    // const uniqueCouponCode = `${influencerData.name.slice(0, 3).toUpperCase()}_${couponData.couponCode.slice(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const generateUniqueCouponCode = (influencerName, couponCode) => {
      
      return `${influencerName.slice(0, 3).toUpperCase()}_${couponCode.slice(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
    };


    
   
    const uploadsFolder = path.join(__dirname, "../../uploads/CouponQR");
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }
    const createdAssignments = [];
    let savedCouponAssign2=[]
    for (const inf of influencerData) {
    const uniqueCouponCode = generateUniqueCouponCode(inf.name, couponData.couponCode);
      
      
      // 4) Create the new CouponAssign doc
      const newCouponAssign = new CouponAssign({
        influencer: inf._id,
        coupon: coupon,
        numberOfCoupons,
        branch, // assuming 'branch' is an array of branch IDs
        uniqueCouponCode,
        // qrCodeUrl: `uploads/CouponQR/${qrFileName}`, // relative path for the QR
      });


    // 7) Save doc
    const savedCouponAssign = await newCouponAssign.save();
    createdAssignments.push(savedCouponAssign);


     
      const qrFileName = `${savedCouponAssign._id}.png`;
      const qrFilePath = path.join(uploadsFolder, qrFileName);
      const qrData = `${process.env.REACT_APP_API_URL}/redeemcoupon/${savedCouponAssign._id}`; 

      // 3) Generate QR code
      await QRCode.toFile(qrFilePath, qrData);
      newCouponAssign.qrCodeUrl = `uploads/CouponQR/${qrFileName}`
      savedCouponAssign2= await newCouponAssign.save();
    }

    // 8) Return success
    res.status(200).json({
      isOk: true,
      data: savedCouponAssign2,
      message: "Coupon assigned successfully with QR code generated.",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: err.message });
  }
};


exports.listBranch = async (req, res) => {
    try {
        const list = await Branch.find({isActive:true}).sort({ createdAt: -1 }).exec();
        res.json(list);
    } catch (error) {
        return res.status(400).send(error);
    }
};


exports.listCouponAssignByParams = async (req, res) => {
    try {
      let { skip, per_page, sorton, sortdir, match, isActive } = req.body;
  
      let query = [
        // {
        //   $match: { isActive: isActive }, // Match active/inactive status
        // },
        {
          $lookup: {
            from: "influencermasters", // Replace with your actual collection name
            localField: "influencer",
            foreignField: "_id",
            as: "influencerData",
          },
        },
        {
          $lookup: {
            from: "couponmsters", // Replace with your actual collection name
            localField: "coupon",
            foreignField: "_id",
            as: "couponData",
          },
        },
        {
          $lookup: {
            from: "branchmasters", // Replace with your actual collection name
            localField: "branch",
            foreignField: "_id",
            as: "branchData",
          },
        },
        // Unwind the arrays created by lookups
        {
          $unwind: {
            path: "$influencerData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$couponData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$branchData",
            preserveNullAndEmptyArrays: true,
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
                  "influencerData.name": { $regex: match, $options: "i" },
                },
                {
                  "couponData.couponCode": { $regex: match, $options: "i" },
                },
                {
                  "branchData.branchName": { $regex: match, $options: "i" },
                },
                {
                  uniqueCouponCode: { $regex: match, $options: "i" },
                },
              ],
            },
          },
        ].concat(query);
      }
  
      if (sorton && sortdir) {
        let sort = {};
        sort[sorton] = sortdir === "desc" ? -1 : 1;
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
  
      const list = await CouponAssign.aggregate(query);
  
      res.json(list);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  };

  
  exports.updateCouponAssign = async (req, res) => {
    try {
      const { influencer, coupon, numberOfCoupons, branch } = req.body;
  
      if (!influencer || !coupon || !numberOfCoupons || !branch) {
        return res.status(400).json({
          message: "All fields (influencer, coupon, numberOfCoupons, branch) are required.",
        });
      }
  
      const influencerData = await InfluencerMaster.findById(influencer).exec();
      const couponData = await CouponMaster.findById(coupon).exec();
  
      if (!influencerData || !couponData) {
        return res.status(400).json({
          message: "Invalid Influencer or Coupon selected.",
        });
      }
  
      const generateUniqueCouponCode = (influencerName, couponCode) => {
        return `${influencerName.slice(0, 3).toUpperCase()}_${couponCode.slice(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
      };
  
      const uniqueCouponCode = generateUniqueCouponCode(influencerData.name, couponData.couponCode);
  
      const uploadsFolder = path.join(__dirname, "../../uploads/CouponQR");
      if (!fs.existsSync(uploadsFolder)) {
        fs.mkdirSync(uploadsFolder, { recursive: true });
      }
  
      const updatedCouponAssign = await CouponAssign.findOneAndUpdate(
        { _id: req.params._id },
        { influencer, coupon, numberOfCoupons, branch, uniqueCouponCode },
        { new: true }
      ).populate('influencer').populate('coupon').populate('branch').exec();
  
      if (!updatedCouponAssign) {
        return res.status(404).json({ message: "Coupon Assign not found" });
      }
  
      const qrFileName = `${uniqueCouponCode}.png`;
      const qrFilePath = path.join(uploadsFolder, qrFileName);
      const qrData = `${process.env.REACT_APP_API_URL}/redeemcoupon/${uniqueCouponCode}`;
  
      await QRCode.toFile(qrFilePath, qrData);
  
      updatedCouponAssign.qrCodeUrl = `uploads/CouponQR/${qrFileName}`;
      await updatedCouponAssign.save();
  
      res.json({
        isOk: true,
        data: updatedCouponAssign,
        message: "Coupon Assign updated successfully with QR code regenerated.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: err.message });
    }
  };


exports.removeCouponAssign = async (req, res) => {
    try {
      const deletedCouponAssign = await CouponAssign.findOneAndRemove({
        _id: req.params._id,
      });
  
      if (!deletedCouponAssign) {
        return res.status(404).json({ message: "Coupon Assign not found" });
      }
  
      res.json(deletedCouponAssign);
    } catch (err) {
      res.status(400).send(err);
    }
  };


  exports.redeemCoupon = async (req, res) => {
    try {
      const uniqueCouponCode  = req.params._id;
  
      if (!uniqueCouponCode) {
        return res.status(400).json({ message: "Unique coupon code is required." });
      }
  
      // Fetch the coupon assignment by uniqueCouponCode
      const couponAssign = await CouponAssign.findOne({ uniqueCouponCode:uniqueCouponCode })
        .populate('influencer')
        .populate('coupon')
        .populate('branch')
        .exec();
  
      if (!couponAssign) {
        return res.status(404).json({ message: "Coupon not found." });
      }
  
      // Check if numberOfCoupons > 0
      if (couponAssign.numberOfCoupons <= 0) {
        return res.status(400).json({ message: "Coupon already redeemed or no more uses left." });
      }
  
      // Decrement the number of available coupons
      couponAssign.numberOfCoupons -= 1;
      await couponAssign.save();
  
      res.status(200).json({
        message: "Coupon redeemed successfully",
        data: couponAssign,
      });
    } catch (err) {
      console.error("Error in redeemCoupon:", err);
      res.status(500).send({ error: "Internal Server Error." });
    }
  };
  



// exports.branchLogin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find branch by email
//     const branch = await Branch.findOne({ email }).exec();

//     if (!branch) {
//       return res.status(404).json({
//         isOk: false,
//         message: "Branch not found",
//       });
//     }

//     // Verify password
//     if (branch.password !== password) {
//       return res.status(401).json({
//         isOk: false,
//         message: "Invalid email or password",
//       });
//     }

//     // Generate JWT token
//     // const token = jwt.sign(
//     //   { id: branch._id, role: "branch", branchName: branch.branchName },
//     //   process.env.JWT_SECRET_TOKEN,
//     //   { expiresIn: "1d" } // Token valid for 1 day
//     // );

//     res.status(200).json({
//       isOk: true,
//       message: "Login successful",
      
//       data: {
//         id: branch._id,
//         email: branch.email,
//         branchName: branch.branchName,
//         role: "branch",
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       isOk: false,
//       message: "Internal server error",
//     });
//   }
// };

 
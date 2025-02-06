const Branch = require("../../models/BranchMaster/BranchMaster");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const State = require("../../models/Location/State");
const City = require("../../models/Location/City");
const Country = require("../../models/Location/Country");

exports.getBranch = async (req, res) => {
  try {
    // Find a branch by ID passed as a parameter
    const branch = await Branch.findOne({ _id: req.params._id }).exec();
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.json(branch);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    // Ensure the directory for uploads exists
    if (!fs.existsSync(`${__basedir}/uploads/branchImages`)) {
      fs.mkdirSync(`${__basedir}/uploads/branchImages`, { recursive: true });
    }

    // Handle the uploaded file (if any)
    let branchImage = req.file
      ? `uploads/branchImages/${req.file.filename}`
      : null;

    // Extract details from request body
    const {
      branchName,
      address,
      area,
      city,
      state,
      country,
      phone,
      email,
      password,
      isActive,
    } = req.body;

    // Check if branchName or email already exists
    const branchExists = await Branch.findOne({
      $or: [{ branchName }, { email }],
    }).exec();

    if (branchExists) {
      return res.status(200).json({
        isOk: false,
        message: "Branch name or email already exists",
      });
    } else {
      // Create and save the new branch
      const newBranch = new Branch({
        branchName,
        address,
        area,
        city,
        state,
        country,
        phone,
        email,
        password, // Note: Ensure you hash the password in a real application
        isActive,
        branchImage,
      });

      const savedBranch = await newBranch.save();

      res.status(200).json({
        isOk: true,
        data: savedBranch,
        message: "Branch created successfully",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: err.message });
  }
};

exports.listBranch = async (req, res) => {
  try {
    const list = await Branch.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listBranchByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;
    const branches = await Branch.find();
    console.log(branches);
    let query = [
      {
        $match: { isActive: isActive },
      },
      {
        $lookup: {
          from: "countries", // Replace with your actual collection name
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },
      {
        $lookup: {
          from: "states", // Replace with your actual collection name
          localField: "state",
          foreignField: "_id",
          as: "stateData",
        },
      },
      {
        $lookup: {
          from: "cities", // Replace with your actual collection name
          localField: "city",
          foreignField: "_id",
          as: "cityData",
        },
      },
      // Unwind the arrays created by lookups
      {
        $unwind: {
          path: "$countryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$cityData",
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
                branchName: { $regex: match, $options: "i" },
              },
              {
                address: { $regex: match, $options: "i" },
              },
              {
                area: { $regex: match, $options: "i" },
              },
              {
                state: { $regex: match, $options: "i" },
              },
              {
                country: { $regex: match, $options: "i" },
              },
              {
                phone: { $regex: match, $options: "i" },
              },
              {
                email: { $regex: match, $options: "i" },
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

    const list = await Branch.aggregate(query);
    console.log("list branch", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.updateBranch = async (req, res) => {
  try {
    let bannerImage = req.file
      ? `uploads/userImages/${req.file.filename}`
      : null;
    let fieldvalues = { ...req.body };
    if (bannerImage != null) {
      fieldvalues.bannerImage = bannerImage;
    }
    const update = await Branch.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeBranch = async (req, res) => {
  try {
    const del = await Branch.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.branchLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find branch by email
    const branch = await Branch.findOne({ email }).exec();

    if (!branch) {
      return res.status(404).json({
        isOk: false,
        message: "Branch not found",
      });
    }

    // Verify password
    if (branch.password !== password) {
      return res.status(401).json({
        isOk: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    // const token = jwt.sign(
    //   { id: branch._id, role: "branch", branchName: branch.branchName },
    //   process.env.JWT_SECRET_TOKEN,
    //   { expiresIn: "1d" } // Token valid for 1 day
    // );

    res.status(200).json({
      isOk: true,
      message: "Login successful",

      data:branch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isOk: false,
      message: "Internal server error",
    });
  }
};

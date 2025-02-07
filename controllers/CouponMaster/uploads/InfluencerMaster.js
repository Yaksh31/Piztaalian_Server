const Influencer = require("../../../models/CouponMaster/InfluencerMaster");

const fs = require("fs");
const xlsx = require("xlsx");

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

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        isOk: false,
        message: "Name, email, password, and phone are required fields.",
      });
    }

    const existingUser = await Influencer.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      // Build an errors object based on which field is duplicated.
      let duplicateErrors = {};
      if (existingUser.email === email) {
        duplicateErrors.email = "Email already exists.";
      }
      if (existingUser.phone === phone) {
        duplicateErrors.phone = "Phone number already exists.";
      }
      return res.status(400).json({
        isOk: false,
        message: "Duplicate Entry Error",
        errors: duplicateErrors,
      });
    }

    // Validate phone number format (must be exactly 10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        isOk: false,
        message: "Validation Error",
        errors: { phone: "Phone number must be exactly 10 digits." },
      });
    }

    // Validate email format
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
      return res.status(400).json({
        isOk: false,
        message: "Validation Error",
        errors: { email: "Invalid email format." },
      });
    }

   
   

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





exports.uploadExcel = async (req, res) => {
  try {
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        isOk: false, 
        message: "No file uploaded" 
      });
    }

    // Read the uploaded file from disk
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // use the first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Map Excel rows to influencer objects (set defaults if not provided)
    const influencers = jsonData.map((row) => ({
      name: row.name ? row.name.toString().trim() : "",
      phone: row.phone ? row.phone.toString().trim() : "",
      email: row.email ? row.email.toString().trim() : "",
      password: row.password ? row.password.toString() : "",
      instagram: row.instagram ? row.instagram.toString().trim() : "",
      youtube: row.youtube ? row.youtube.toString().trim() : "",
      IsActive: typeof row.IsActive === "string"
        ? row.IsActive.toLowerCase() === "true"
        : Boolean(row.IsActive),
    }));

    // Prepare an array to capture validation errors for each row
    let validationErrors = [];

    // Validate each influencer from the Excel file
    influencers.forEach((inf, index) => {
      let errors = {};

      // Check required fields
      if (!inf.name) {
        errors.name = "Name is required.";
      }
      if (!inf.email) {
        errors.email = "Email is required.";
      }
      if (!inf.password) {
        errors.password = "Password is required.";
      }
      if (!inf.phone) {
        errors.phone = "Phone number is required.";
      }

      
      if (inf.phone && !/^\d{10}$/.test(inf.phone)) {
        errors.phone = "Phone number must be exactly 10 digits.";
      }

      
      if (inf.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(inf.email)) {
        errors.email = "Invalid email format.";
      }

      
      if (Object.keys(errors).length > 0) {
        validationErrors.push({
          row: index + 1,
          errors: errors,
        });
      }
    });

  
    if (validationErrors.length > 0) {
      
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.status(400).json({
        isOk: false,
        message: "Validation errors in Excel file.",
        errors: validationErrors,
      });
    }

   
    const emails = influencers.map((inf) => inf.email);
    const phones = influencers.map((inf) => inf.phone);

    
    const existingInfluencers = await Influencer.find({
      $or: [
        { email: { $in: emails } },
        { phone: { $in: phones } }
      ]
    });

    
    let duplicateErrors = [];

    if (existingInfluencers.length > 0) {
      
      influencers.forEach((inf, index) => {
        let errors = {};
        existingInfluencers.forEach((existing) => {
          if (existing.email === inf.email) {
            errors.email = "Email already exists.";
          }
          if (existing.phone === inf.phone) {
            errors.phone = "Phone number already exists.";
          }
        });
        if (Object.keys(errors).length > 0) {
          duplicateErrors.push({
            row: index + 1,
            errors: errors,
          });
        }
      });
    }

    
    if (duplicateErrors.length > 0) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.status(400).json({
        isOk: false,
        message: "Duplicate Entry Error",
        errors: duplicateErrors,
      });
    }

  
    const insertedRecords = await Influencer.insertMany(influencers);

   
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    return res.status(200).json({
      isOk: true,
      data: insertedRecords,
      message: "Excel file processed successfully",
    });
  } catch (err) {
    console.error("Error processing Excel file:", err);
    return res.status(500).json({
      isOk: false,
      message: "Error processing Excel file",
      error: err.message,
    });
  }
};






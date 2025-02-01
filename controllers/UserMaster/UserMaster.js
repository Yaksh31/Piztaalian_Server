// 1. Import required modules
const User = require("../../models/UserMaster/UserMaster");
const bcrypt = require("bcrypt");

// 2. GET a single user
exports.getUserMaster = async (req, res) => {
  try {
    const user = await User.findById(req.params._id).select("-password").exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({ isOk: true, data: user });
  } catch (error) {
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

// 3. CREATE a new user
exports.createUserMaster = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isActive, addresses } =
      req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ isOk: false, message: "All fields are required" });
    }

    const emailExists = await User.findOne({ email }).exec();
    if (emailExists) {
      return res
        .status(400)
        .json({ isOk: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isActive,
      addresses: addresses || [],
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      isOk: true,
      data: savedUser,
      message: "User created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isOk: false, message: err.message });
  }
};

// 4. LIST all users
exports.listUserMaster = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .exec();
    res.json({ isOk: true, data: users });
  } catch (error) {
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

// 5. LIST users by parameters (search/sort/pagination)
exports.listUserMasterByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
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
                firstName: { $regex: match, $options: "i" },
              },
              {
                lastName: { $regex: match, $options: "i" },
              },
              {
                email: { $regex: match, $options: "i" },
              },
              //  {
              //    password: { $regex: match, $options: "i" },
              //  },
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

    const list = await User.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

// 6. UPDATE a user
exports.updateUserMaster = async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }

    res.json({
      isOk: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (err) {
    res.status(400).json({ isOk: false, message: err.message });
  }
};

// 7. REMOVE (delete) a user
exports.removeUserMaster = async (req, res) => {
  try {
    const removedUser = await User.findByIdAndDelete(req.params._id);
    if (!removedUser) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({ isOk: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ isOk: false, message: err.message });
  }
};

// 8. LOGIN for UserMaster
exports.userLoginMaster = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(401).json({ isOk: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ isOk: false, message: "Authentication failed" });
    }

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({
      isOk: true,
      message: "Authentication successful",
      data: userData,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ isOk: false, message: "An error occurred while logging in" });
  }
};

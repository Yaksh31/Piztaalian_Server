const User = require("../../models/UserMaster/UserMaster");
const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

exports.getUserMaster = async (req, res) => {
  try {
    const user = await User.findById(req.params._id).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({ isOk: true, data: user });
  } catch (error) {
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.createUserMaster = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      isActive,
      addresses,
      cart,
    } = req.body;
    console.log(">>>>>", req.body);

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ isOk: false, message: "All fields are required!!" });
    }

    // Address validation
    // if (!addresses || addresses.length === 0) {
    //   return res
    //     .status(400)
    //     .json({ isOk: false, message: "At least one address is required" });
    // }

    // const address = addresses[0];
    // console.log(address);
    // if (
    //   !address.addressTitle ||
    //   !address.address ||
    //   !address.area ||
    //   !address.city ||
    //   !address.state ||
    //   !address.country
    // ) {
    //   return res
    //     .status(400)
    //     .json({ isOk: false, message: "All address fields are required" });
    // }

    const emailExists = await User.findOne({ email }).exec();
    if (emailExists) {
      return res
        .status(400)
        .json({ isOk: false, message: "Email already exists" });
    }

    // Ensure that at least one address is marked as default.
    // If none is marked as default, mark the first one as default.
    // const defaultFound = addresses.some(
    //   (addr) => addr.isDefault === true || addr.isDefault === "true"
    // );
    // if (!defaultFound) {
    //   addresses[0].isDefault = true;
    // }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      isActive,
      addresses: addresses || [],
      cart: cart || [],
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

exports.listUserMaster = async (req, res) => {
  try {
    const users = await User.find()

      .sort({ createdAt: -1 })
      .exec();
    res.json({ isOk: true, data: users });
  } catch (error) {
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.listUserMasterByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },

      {
        $lookup: {
          from: "countries", // Replace with your actual collection name
          localField: "addresses.country",
          foreignField: "_id",
          as: "countryData",
        },
      },
      {
        $lookup: {
          from: "states", // Replace with your actual collection name
          localField: "addresses.state",
          foreignField: "_id",
          as: "stateData",
        },
      },
      {
        $lookup: {
          from: "cities", // Replace with your actual collection name
          localField: "addresses.city",
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
        $group: {
          _id: "$_id",
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          email: { $first: "$email" },
          phone: { $first: "$phone" },
          isActive: { $first: "$isActive" },
          addresses: { $first: "$addresses" },
          countryData: { $first: "$countryData" },
          stateData: { $first: "$stateData" },
          cityData: { $first: "$cityData" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $group: {
          _id: "$_id",
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          email: { $first: "$email" },
          phone: { $first: "$phone" },
          isActive: { $first: "$isActive" },
          addresses: { $first: "$addresses" },
          countryData: { $first: "$countryData" },
          stateData: { $first: "$stateData" },
          cityData: { $first: "$cityData" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
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
      // Define the search match stage with lookup fields for city, state, and country
      const searchMatchStage = {
        $match: {
          $or: [
            { firstName: { $regex: match, $options: "i" } },
            { lastName: { $regex: match, $options: "i" } },
            { email: { $regex: match, $options: "i" } },
            {
              phone: { $regex: match, $options: "i" },
            },
            //  { password: { $regex: match, $options: "i" } }, // commented out as before
            // { "addresses.addressTitle": { $regex: match, $options: "i" } },
            // { "addresses.address": { $regex: match, $options: "i" } },
            // // UPDATED: Search using lookup fields instead of raw ObjectIds
            // { "cityData.CityName": { $regex: match, $options: "i" } }, // <-- UPDATED
            // { "stateData.StateName": { $regex: match, $options: "i" } }, // <-- UPDATED
            // { "countryData.CountryName": { $regex: match, $options: "i" } }, // <-- UPDATED
            // { "addresses.area": { $regex: match, $options: "i" } },
          ],
        },
      };

      // Insert the search stage after the lookups/unwinds (after index 6)
      query.splice(7, 0, searchMatchStage);
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

exports.updateUserMaster = async (req, res) => {
  try {
    // const updatedData = req.body;

    // // If addresses are being updated, ensure at least one is default.
    // if (updatedData.addresses && updatedData.addresses.length > 0) {
    //   const defaultFound = updatedData.addresses.some(
    //     (addr) => addr.isDefault === true || addr.isDefault === "true"
    //   );
    //   if (!defaultFound) {
    //     updatedData.addresses[0].isDefault = true;
    //   }
    // }

    const updatedUser = await User.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
      runValidators: true,
    });

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

exports.userLoginMaster = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(401).json({ isOk: false, message: "User not found" });
    }

    //const isMatch = await bcrypt.compare(password, user.password);
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

exports.getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("cart").exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({ isOk: true, data: user.cart });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.addCartItem = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cartItem = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { cart: cartItem } },
      { new: true }
    ).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.status(201).json({
      isOk: true,
      data: user.cart,
      message: "Cart item added successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.params.userId;
    const index = parseInt(req.params.index, 10);
    const updateData = req.body;
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    if (!user.cart || index < 0 || index >= user.cart.length) {
      return res
        .status(400)
        .json({ isOk: false, message: "Invalid cart item index" });
    }
    // Merge new fields into the existing cart item
    user.cart[index] = { ...user.cart[index].toObject(), ...updateData };
    await user.save();
    res.json({
      isOk: true,
      data: user.cart,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.params.userId;
    const index = parseInt(req.params.index, 10);
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    if (!user.cart || index < 0 || index >= user.cart.length) {
      return res
        .status(400)
        .json({ isOk: false, message: "Invalid cart item index" });
    }
    user.cart.splice(index, 1);
    await user.save();
    res.json({
      isOk: true,
      data: user.cart,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { cart: [] } },
      { new: true }
    ).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({
      isOk: true,
      data: user.cart,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("addresses").exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    res.json({ isOk: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const user = await User.findById(userId).select("addresses").exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    const address = user.addresses.id(addressId);
    if (!address) {
      return res
        .status(404)
        .json({ isOk: false, message: "Address not found" });
    }
    res.json({ isOk: true, data: address });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const newAddress = req.body; // Expect a valid address object per AddressSchema
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json({
      isOk: true,
      data: user.addresses,
      message: "Address added successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updateData = req.body;
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    const address = user.addresses.id(addressId);
    if (!address) {
      return res
        .status(404)
        .json({ isOk: false, message: "Address not found" });
    }
    // Merge updateData into the existing address subdocument
    Object.keys(updateData).forEach((key) => {
      address[key] = updateData[key];
    });
    await user.save();
    res.json({
      isOk: true,
      data: address,
      message: "Address updated successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.removeAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }
    // const address = user.addresses.id(addressId);
    // if (!address) {
    //   return res
    //     .status(404)
    //     .json({ isOk: false, message: "Address not found" });
    // }
    // address.remove(); // Remove the subdocument from the array

    // Updated filter-based approach in the same structure:
    const address = user.addresses.id(addressId);
    if (!address) {
      return res
        .status(404)
        .json({ isOk: false, message: "Address not found" });
    }

    // Instead of `address.remove()`, we manually filter the array:
    user.addresses = user.addresses.filter(
      (addr) => String(addr._id) !== addressId
    );

    await user.save();
    res.json({
      isOk: true,
      data: user.addresses,
      message: "Address removed successfully",
    });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(201)
        .json({ isOk: false, message: "Email is required" });
    }

    // 1) Check if user exists
    let user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }

    // 2) Generate a 6-digit OTP (customize as you like)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3) Set expiration time for, say, 5 minutes from now
    const expires = new Date(Date.now() + 2 * 60 * 1000);

    // 4) Save OTP and expiration to user record
    user.otp = otp;
    user.otpExpiresAt = expires;
    await user.save();

    // 5) Send email with nodemailer
    const mailOptions = {
      from: "process.env.EMAIL_USER", // match transporter user
      to: user.email,
      subject: "Your OTP Code",
      text: `Your login OTP is ${otp}. It will expire in 2 minutes.`,
    };
    await transporter.sendMail(mailOptions);

    // 6) Return success
    return res.json({
      isOk: true,
      message: `OTP has been sent to ${user.email}.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(201)
        .json({ isOk: false, message: "Email and OTP are required" });
    }

    // 1) Check if user exists
    let user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(404).json({ isOk: false, message: "User not found" });
    }

    // 2) Verify OTP matches and is not expired
    if (user.otp !== otp) {
      return res.status(401).json({ isOk: false, message: "Invalid OTP" });
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < Date.now()) {
      return res.status(401).json({
        isOk: false,
        message: "OTP has expired, please request a new one",
      });
    }

    // 3) Clear the OTP from DB (so it can’t be reused)
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // 4) Here you can choose to create a session token, JWT, etc.
    // For now, just return success plus user data (without password & OTP fields).
    const { password, otp: unused, otpExpiresAt, ...rest } = user.toObject();
    return res.json({
      isOk: true,
      message: "OTP verified successfully",
      data: rest, // user fields except password/otp
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ isOk: false, message: error.message });
  }
};

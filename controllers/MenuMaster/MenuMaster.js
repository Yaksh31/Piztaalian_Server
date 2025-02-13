const MenuMaster = require("../../models/MenuMaster/MenuMaster");
const Branches = require("../../models/BranchMaster/BranchMaster");
const fs = require("fs");
const BranchMaster = require("../../models/BranchMaster/BranchMaster");

const mongoose = require("mongoose");

exports.getBranchesWithZeroMenuItems = async (req, res) => {
  try {
   
    const allBranches = await BranchMaster.find({}, { _id: 1, branchName: 1 });

   
    const branchesWithMenus = await MenuMaster.find({}, { branchName: 1 });

    
    const menuBranchSet = new Set(
      branchesWithMenus.map((menu) => String(menu.branchName))
    );

    
    const branchesWithoutMenus = allBranches.filter(
      (branch) => !menuBranchSet.has(String(branch._id))
    );

    res.status(200).json(branchesWithoutMenus)
  } catch (error) {
    console.error("Error fetching branches without menu items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateMenuMaster = async (req, res) => {
  try {
    const { branchName, menuItem, isActive } = req.body; 

    
    let parsedMenuItem = [];
    if (typeof menuItem === "string") {
      try {
        parsedMenuItem = JSON.parse(menuItem);
      } catch (e) {
        return res.status(400).json({ message: "Invalid menuItem format." });
      }
    } else if (Array.isArray(menuItem)) {
      parsedMenuItem = menuItem;
    } else {
     
      return res.status(400).json({ message: "menuItem must be an array." });
    }

    const additionalLinkFiles = {};

    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname.startsWith("menuItem")) {
          const indexMatch = file.fieldname.match(/\d+/);
          const index = indexMatch ? parseInt(indexMatch[0], 10) : null; 
          if (index !== null && !isNaN(index)) {
            additionalLinkFiles[index] = `uploads/FoodImages/${file.filename}`; 
          }
        }
      });
    }

   
    const updatedMenuItems = parsedMenuItem.map((item, index) => ({
      ...item,
      foodImage: additionalLinkFiles[index] || item.foodImage, 
    }));

    let menuMaster = await MenuMaster.findOne({ branchName }).exec();
    if (!menuMaster) {
    
      menuMaster = new MenuMaster({
        branchName,
        menuItem: updatedMenuItems,
        isActive,
      });

      await menuMaster.save();

      return res.status(201).json({
        isOk: true,
        message: "MenuMaster created successfully",
        data: menuMaster,
      });
    } else {
      
      menuMaster.menuItem = updatedMenuItems;
      menuMaster.isActive = isActive;
      await menuMaster.save();

      return res.status(200).json({
        isOk: true,
        message: "MenuMaster updated successfully",
        data: menuMaster,
      });
    }
  } catch (error) {
    console.error("Error in upsert operation for MenuMaster:", error);
    res.status(500).json({
      message: "An error occurred during the upsert operation",
      error: error.message,
    });
  }
};

exports.updateMenuMasterByAdmin = async (req, res) => {
  try {
    const { branchName } = req.body;
    let menuItem = JSON.parse(req.body.menuItem);

    const additionalLinkFiles = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname.startsWith("menuItem")) {
          const indexMatch = file.fieldname.match(/\d+/);
          if (indexMatch) {
            const index = parseInt(indexMatch[0], 10);
            additionalLinkFiles[index] = `uploads/FoodImages/${file.filename}`;
          }
        }
      });
    }

    menuItem = menuItem.map((rawItem, index) => {
      const spiceNum = rawItem.spiceLevel === "" ? null : Number(rawItem.spiceLevel) || null;

      const cleanedToppings = (rawItem.toppings || []).map((group) => ({
        toppingCategory: typeof group.toppingCategory === "object"
          ? group.toppingCategory._id  // if it's { _id: "...", name: "..."}
          : group.toppingCategory,     // otherwise, assume it's already a string
        toppings: (group.toppings || []).map((tId) =>
          typeof tId === "object" ? tId._id : tId
        )
      }));

      const cleanedVariants = (rawItem.variants || []).map((v) => ({
        variantName: String(v.variantName || ""),
        price: Number(v.price || 0),
      }));

      const updatedItem = {
        categoryName: String(rawItem.categoryName),    // must be an _id string
        itemName: String(rawItem.itemName),
        price: Number(rawItem.price || 0),
        spiceLevel: spiceNum,
        isJain: Boolean(rawItem.isJain),
        checkedPrice: Number(rawItem.checkedPrice || 0),
        description: String(rawItem.description),
        foodImage: rawItem.foodImage || "",
        isActive: rawItem.isActive !== false, // default true
        variants: cleanedVariants,
        toppings: cleanedToppings,
      };

      // If there's a newly uploaded file, override the path
      if (additionalLinkFiles[index]) {
        updatedItem.foodImage = additionalLinkFiles[index];
      }

      return updatedItem;
    });

    const menuMaster = await MenuMaster.findOneAndUpdate(
      { branchName },
      { branchName, menuItem },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      isOk: true,
      message: menuMaster.isNew ? "MenuMaster created successfully" : "MenuMaster updated successfully",
      data: menuMaster,
    });
  } catch (error) {
    console.error("Error in upsert operation for MenuMaster:", error);
    return res.status(500).json({
      message: "An error occurred during the upsert operation",
      error: error.message
    });
  }
};


 


// exports.updateMenuMaster = async (req, res) => {
//     try {
//         const { branchName } = req.body;
//         let menuItem = JSON.parse(req.body.menuItem);
//         const additionalLinkFiles = {};

//         // Process uploaded files
//         if (req.files && req.files.length > 0) {
//             req.files.forEach((file) => {
//                 const itemIndex = parseInt(file.fieldname.replace('file', '')); // Extract index from filename
//                 additionalLinkFiles[itemIndex] = file.buffer; // Use buffer directly instead of reading file
//             });
//         }

//         // Update menu items with images
//         menuItem = menuItem.map((item, index) => {
//             const updatedItem = {
//                 ...item,
//                 categoryName: String(item.categoryName),
//                 itemName: String(item.itemName),
//                 description: String(item.description),
//                 spiceLevel: String(item.spiceLevel),
//                 isJain: Boolean(item.isJain),
//                 checkedPrice: Number(item.checkedPrice),
//                 price: Number(item.price)
//             };

//             // Only update foodImage if a new file was uploaded
//             if (additionalLinkFiles[index]) {
//                 updatedItem.foodImage = additionalLinkFiles[index];
//             }

//             return updatedItem;
//         });

//         // Upsert the MenuMaster document
//         const menuMaster = await MenuMaster.findOneAndUpdate(
//             { branchName },
//             {
//                 branchName,
//                 menuItem
//             },
//             {
//                 new: true,
//                 upsert: true
//             }
//         );

//         return res.status(200).json({
//             message: menuMaster.isNew ? "MenuMaster created successfully" : "MenuMaster updated successfully",
//             data: menuMaster
//         });

//     } catch (error) {
//         console.error("Error in upsert operation for MenuMaster:", error);
//         res.status(500).json({
//             message: "An error occurred during the upsert operation",
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     updateMenuMaster,
// };

exports.getMenuItemsByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params; 

   
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        message: "Invalid branch ID provided.",
      });
    }



    // Find the MenuMaster document for the given branchId
    const menuMaster = await MenuMaster.findOne({
      branchName: branchId,})
      // .populate("menuItem.categoryName") 
      .populate({
        path: "menuItem.toppings.toppingCategory", // Populates topping category details
        model: "ToppingCategory",
      })
      .populate({
        path: "menuItem.toppings.toppings", // Populates individual topping details
        model: "ToppingMaster",
      })
      .exec();

    if (!menuMaster) {
      return res.status(404).json({
        message: "Menu items not found for the given branch ID",
      });
    }

    // Convert binary images to Base64
    const menuItemsWithImages = menuMaster.menuItem.map((item) => ({
      ...item.toObject(),
    }));

    return res.status(200).json({
      data: { ...menuMaster.toObject(), menuItem: menuItemsWithImages },
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({
      message: "An error occurred while fetching menu items",
      error: error.message,
    });
  }
};

exports.listMenuByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },
      // {
      //   $unwind: {
      //     path: "$menuItem",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // // Unwind the toppings array inside each menu item so that each topping becomes a separate document in the pipeline
      // {
      //   $unwind: {
      //     path: "$menuItem.toppings",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },

      
      // {
      //   $lookup: {
      //     from: "toppingcategories",
      //     localField: "menuItem.toppings.toppingCategory",
      //     foreignField: "_id",
      //     as: "toppingCategoryDetails",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$menuItem.toppings.toppingCategoryDetails",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // // Lookup topping master details
      // {
      //   $lookup: {
      //     from: "toppingmasters", // collection name for topping masters
      //     localField: "menuItem.toppings.toppings",
      //     foreignField: "_id",
      //     as: "menuItem.toppings.toppingMastersData",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$menuItem.toppings.toppingMastersData",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "branches", // Ensure the collection name is correct
          localField: "branchName",
          foreignField: "_id",
          as: "BranchData",
        },
      },
      {
        $unwind: {
          path: "$BranchData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "BranchData.branchName": { $ne: null }, // Ensure valid branches only
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "BranchData.country",
          foreignField: "_id",
          as: "BranchData.countryData",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "BranchData.state",
          foreignField: "_id",
          as: "BranchData.stateData",
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "BranchData.city",
          foreignField: "_id",
          as: "BranchData.cityData",
        },
      },
      {
        $unwind: {
          path: "$BranchData.countryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$BranchData.stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$BranchData.cityData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Apply Search Filter
    if (match) {
      query.push({
        $match: {
          $or: [
            { "BranchData.branchName": { $regex: match, $options: "i" } },
            {
              "BranchData.countryData.CountryName": {
                $regex: match,
                $options: "i",
              },
            },
            {
              "BranchData.stateData.StateName": {
                $regex: match,
                $options: "i",
              },
            },
            {
              "BranchData.cityData.CityName": { $regex: match, $options: "i" },
            },
          ],
        },
      });
    }

    // Sorting Logic
    let sort = {};
    if (sorton && sortdir) {
      sort[sorton] = sortdir === "desc" ? -1 : 1;
    } else {
      sort["createdAt"] = -1;
    }
    query.push({ $sort: sort });

    // Pagination
    query.push(
      {
        $facet: {
          stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
          stage2: [{ $skip: skip }, { $limit: per_page }],
        },
      },
      { $unwind: { path: "$stage1" } },
      { $project: { count: "$stage1.count", data: "$stage2" } }
    );

    const list = await MenuMaster.aggregate(query);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};


exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params; 

   
     

    // Find the MenuMaster document for the given branchId
    const menuMaster = await MenuMaster.findById(id)
      .populate("branchName") 
      .populate({
        path: "menuItem.toppings.toppingCategory", // Populates topping category details
        model: "ToppingCategory",
      })
      .populate({
        path: "menuItem.toppings.toppings", // Populates individual topping details
        model: "ToppingMaster",
      })
      .exec();

    if (!menuMaster) {
      return res.status(404).json({
        message: "Menu items not found for the given branch ID",
      });
    }

    // Convert binary images to Base64
    const menuItemsWithImages = menuMaster.menuItem.map((item) => ({
      ...item.toObject(),
    }));

    return res.status(200).json({
      data: { ...menuMaster.toObject(), menuItem: menuItemsWithImages },
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({
      message: "An error occurred while fetching menu items",
      error: error.message,
    });
  }
};
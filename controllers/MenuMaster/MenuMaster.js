const MenuMaster = require("../../models/MenuMaster/MenuMaster");
const Branch = require("../../models/BranchMaster/BranchMaster")
const fs = require("fs");

exports.updateMenuMaster = async (req, res) => {
    try {
        const { branchName ,menuItem} = req.body; // Extract branchName
        // const menuItem = JSON.parse(req.body.menuItem || "[]"); // Parse menuItem or default to empty array
        const additionalLinkFiles = {};

        // Process uploaded files (binary data)
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                if (file.fieldname.startsWith("menuItem")) {
                    const index = parseInt(file.fieldname.match(/\d+/)[0]); // Extract index from fieldname
                    additionalLinkFiles[index] = `uploads/FoodImages/${file.filename}`; // Store the file path
                }
            });
        }

        // Update menu items without overwriting existing foodImage values
        const updatedMenuItems = menuItem.map((item, index) => ({
            ...item,
            foodImage: additionalLinkFiles[index] || item.foodImage, // Use binary file path if provided; otherwise, retain the existing value
        }));

        // Check if MenuMaster exists for the branch
        let menuMaster = await MenuMaster.findOne({ branchName }).exec();
        if (!menuMaster) {
            // Create new MenuMaster if not found
            menuMaster = new MenuMaster({
                branchName,
                menuItem: updatedMenuItems,
            });

            await menuMaster.save();

            return res.status(201).json({
                message: "MenuMaster created successfully",
                data: menuMaster,
            });
        } else {
            // Update existing MenuMaster
            menuMaster.menuItem = updatedMenuItems;
            await menuMaster.save();

            return res.status(200).json({
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
        const { branchId } = req.params; // Extract branchId from request params

        // Find the MenuMaster document for the given branchId
        const menuMaster = await MenuMaster.findOne({ branchName: branchId }).exec();

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







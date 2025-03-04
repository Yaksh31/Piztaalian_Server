const Order = require("../../models/Order/Order");
const mongoose = require("mongoose");
const eventEmitter = require("../../eventEmitter");
const ToppingMaster = require("../../models/Topping/ToppingMaster");
const CouponAssign = require("../../models/CouponMaster/CouponAssign");
const MenuMaster = require("../../models/MenuMaster/MenuMaster");
const UserMaster = require("../../models/UserMaster/UserMaster");

// exports.getOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id).exec();
//     if (!order) {
//       return res.status(404).json({ isOk: false, message: "Order not found" });
//     }
//     res.json({ isOk: true, data: order });
//   } catch (error) {
//     res.status(500).json({ isOk: false, message: error.message });
//   }
// };

exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id; // CHANGE: Using order id from params instead of user id
    if (!orderId) {
      return res
        .status(400)
        .json({ isOk: false, message: "Order ID is required" });
    }

    const pipeline = [
      // MATCH stage: Filter by the provided order ID
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },

      // LOOKUP: Get user details from "usermasters"
      {
        $lookup: {
          from: "usermasters",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "branches", // Ensure this matches your branch collection name
          localField: "branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },

      // UNWIND the cart array to process each cart item
      { $unwind: { path: "$cart", preserveNullAndEmptyArrays: true } },

      // ADD FIELDS: Convert cart.menuItem (string) to ObjectId
      {
        $addFields: {
          "cart.menuItem": { $toObjectId: "$cart.menuItem" },
        },
      },

      // ADD FIELDS: Convert each cart.topping to ObjectId
      {
        $addFields: {
          "cart.toppings": {
            $map: {
              input: "$cart.toppings",
              as: "t",
              in: { $toObjectId: "$$t" },
            },
          },
        },
      },

      // LOOKUP: Fetch menu item details from "menumasters"
      {
        $lookup: {
          from: "menumasters",
          let: { menuId: "$cart.menuItem" },
          pipeline: [
            { $unwind: "$menuItem" },
            { $match: { $expr: { $eq: ["$menuItem._id", "$$menuId"] } } },
            {
              $project: {
                _id: 0,
                itemName: "$menuItem.itemName",
                description: "$menuItem.description",
              },
            },
          ],
          as: "cart.menuItemDetails",
        },
      },
      {
        $unwind: {
          path: "$cart.menuItemDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // LOOKUP: Fetch variant details from "menumasters"
      {
        $lookup: {
          from: "menumasters",
          let: { variantId: "$cart.variant" },
          pipeline: [
            { $unwind: "$menuItem" },
            { $unwind: "$menuItem.variants" },
            {
              $match: {
                $expr: { $eq: ["$menuItem.variants._id", "$$variantId"] },
              },
            },
            {
              $project: {
                _id: 0,
                variantName: "$menuItem.variants.variantName",
                variantPrice: "$menuItem.variants.price",
              },
            },
          ],
          as: "cart.variantDetails",
        },
      },
      {
        $unwind: {
          path: "$cart.variantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // LOOKUP: Fetch topping details from "toppingmasters"
      {
        $lookup: {
          from: "toppingmasters",
          localField: "cart.toppings",
          foreignField: "_id",
          as: "cart.toppingDetails",
        },
      },

      // GROUP: Reassemble the cart array for the order
      {
        $group: {
          _id: "$_id",
          orderStatus: { $first: "$orderStatus" },
          couponCode: { $first: "$couponCode" },
          discountPrice: { $first: "$discountPrice" },
          subTotal: { $first: "$subTotal" },
          effectiveSubtotal: { $first: "$effectiveSubtotal" },
          cgst: { $first: "$cgst" },
          sgst: { $first: "$sgst" },
          totalTax: { $first: "$totalTax" },
          grandTotal: { $first: "$grandTotal" },
          completionDateTime: { $first: "$completionDateTime" },
          remark: { $first: "$remark" },
          createdAt: { $first: "$createdAt" },
          userDetails: { $first: "$userDetails" },
          branchDetails: { $first: "$branchDetails" },
          cart: { $push: "$cart" },
        },
      },

      // PROJECT: Transform the cart items to include populated details
      {
        $project: {
          orderStatus: 1,
          couponCode: 1,
          discountPrice: 1,
          subTotal: 1,
          effectiveSubtotal: 1,
          cgst: 1,
          sgst: 1,
          totalTax: 1,
          grandTotal: 1,
          completionDateTime: 1,
          remark: 1,
          createdAt: 1,
          userDetails: 1,
          branch: {
            //  Project branch name and address from branchDetails
            name: "$branchDetails.branchName",
            address: "$branchDetails.address",
          },
          cart: {
            $map: {
              input: "$cart",
              as: "item",
              in: {
                quantity: "$$item.quantity",
                totalPrice: "$$item.totalPrice",
                // CHANGE: Using the populated menuItem name field
                menuItem: "$$item.menuItemDetails.itemName",
                description: "$$item.menuItemDetails.description",
                variant: {
                  name: "$$item.variantDetails.variantName",
                  price: "$$item.variantDetails.variantPrice",
                },
                toppings: {
                  $map: {
                    input: "$$item.toppingDetails",
                    as: "t",
                    in: {
                      toppingName: "$$t.toppingName",
                      toppingPrice: "$$t.price",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const orderResult = await Order.aggregate(pipeline);
    if (!orderResult || orderResult.length === 0) {
      return res.status(404).json({ isOk: false, message: "Order not found" });
    }
    res.json({ isOk: true, data: orderResult[0] });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      cart,
      orderStatus,
      couponCode,
      userId,
      remark,
      branch,
      // grandTotal and discountPrice will be recalculated, so we ignore provided values
    } = req.body;

    if (!userId || !cart || cart.length === 0 || !branch) {
      return res.status(400).json({
        isOk: false,
        message:
          "User ID, branch, and at least one cart item are required for order processing",
      });
    }

    const userDetail = await UserMaster.findById(userId);

    // --- Calculate subtotal and update each cart item (your existing logic) ---
    let subtotal = 0;
    const updatedCart = await Promise.all(
      cart.map(async (item) => {
        const cartBranch = item.branch || branch;
        const menuMasterDoc = await MenuMaster.findOne(
          { "menuItem._id": item.menuItem },
          { "menuItem.$": 1 }
        );

        let basePrice = 0;
        let menuItemName = "";
        let variantPrice = 0;
        let variantName = "";

        if (
          menuMasterDoc &&
          menuMasterDoc.menuItem &&
          menuMasterDoc.menuItem.length > 0
        ) {
          const menuItemDetail = menuMasterDoc.menuItem[0];
          menuItemName = menuItemDetail.itemName;
          basePrice = menuItemDetail.price || 0;
          if (
            item.variant &&
            menuItemDetail.variants &&
            menuItemDetail.variants.length > 0
          ) {
            const variantDetail = menuItemDetail.variants.find(
              (v) => v._id.toString() === item.variant
            );
            if (variantDetail) {
              variantName = variantDetail.variantName;
              variantPrice = variantDetail.price || 0;
            }
          }
        }

        let toppingsTotal = 0;
        let toppingsDetails = [];
        if (item.toppings && item.toppings.length > 0) {
          const toppingsDocs = await ToppingMaster.find({
            _id: { $in: item.toppings },
          });
          if (toppingsDocs && toppingsDocs.length > 0) {
            toppingsDocs.forEach((t) => {
              toppingsTotal += t.price || 0;
              toppingsDetails.push({
                toppingName: t.toppingName,
                toppingPrice: t.price || 0,
              });
            });
          }
        }

        const pricePerItem = item.variant ? variantPrice : basePrice;
        const itemPrice = (pricePerItem + toppingsTotal) * (item.quantity || 1);
        subtotal += itemPrice;

        return {
          ...item,
          branch: cartBranch,
          menuItemName,
          basePrice,
          variantName,
          variantPrice,
          toppingsDetails,
          totalPrice: itemPrice,
        };
      })
    );

    // --- Coupon Discount Calculation ---
    let discount = 0;
    if (couponCode && couponCode.trim() !== "") {
      const couponAssign = await CouponAssign.findOne({
        uniqueCouponCode: couponCode.trim(),
      }).populate("coupon");
      if (couponAssign && couponAssign.isActive && couponAssign.coupon) {
        const discountPercentage =
          Number(couponAssign.coupon.discountPercentage) || 0;
        const maxDiscount = Number(couponAssign.coupon.maxDiscount) || Infinity;
        discount = Math.min(subtotal * (discountPercentage / 100), maxDiscount);
      }
    }
    // ----------------------------------------------------------------

    const effectiveSubtotal = subtotal - discount;
    const cgst = effectiveSubtotal * 0.05;
    const sgst = effectiveSubtotal * 0.05;
    const totalTax = cgst + sgst;
    const computedGrandTotal = effectiveSubtotal + totalTax;

    // Create new Order document.
    const newOrder = new Order({
      cart: updatedCart,
      branch,
      orderStatus: orderStatus || "pending",
      couponCode: couponCode || "",
      discountPrice: discount,
      subTotal: subtotal,
      effectiveSubtotal,
      cgst,
      sgst,
      totalTax,
      grandTotal: computedGrandTotal,
      userId,
      remark,
    });

    const savedOrder = await newOrder.save();

    // --- Finalize Coupon Redemption ---
    if (couponCode && couponCode.trim() !== "") {
      const couponAssign = await CouponAssign.findOne({
        uniqueCouponCode: couponCode.trim(),
      });
      // Finalize only if pending redemption details exist.
      if (couponAssign) {
        couponAssign.redeemedHistory.push({
          redeemerName: userDetail.firstName,
          redeemerPhone: userDetail.phone,
          branch: branch,
        });
        couponAssign.numberOfCoupons -= 1;
        couponAssign.pendingRedemption = false;

        await couponAssign.save();
      }
    }
    // ------------------------------------------------

    eventEmitter.emit("newOrder", savedOrder);
    eventEmitter.emit("ordersUpdateTrigger");

    return res.status(201).json({
      isOk: true,
      data: savedOrder,
      message: "Order created successfully.",
      subtotal,
      discount,
      effectiveSubtotal,
      cgst,
      sgst,
      totalTax,
      grandTotal: computedGrandTotal,
    });
  } catch (err) {
    console.error("Error during order creation: ", err);
    return res.status(500).json({ isOk: false, message: err.message });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).exec();
    res.json({ isOk: true, data: orders });
  } catch (error) {
    res.status(500).json({ isOk: false, message: error.message });
  }
};
// exports.listOrderByParams = async (req, res) => {
//   try {
//     let { skip, per_page, sorton, sortdir, match, orderStatus ,branchId} = req.body;

//     let query = [

//       // {
//       //   $match: { orderStatus: orderStatus }
//       // },
//       {
//         $facet: {
//           stage1: [
//             {
//               $group: {
//                 _id: null,
//                 count: { $sum: 1 }
//               }
//             }
//           ],
//           stage2: [
//             { $skip: skip },
//             { $limit: per_page }
//           ]
//         }
//       },
//       {
//         $unwind: { path: "$stage1" }
//       },
//       {
//         $project: {
//           count: "$stage1.count",
//           data: "$stage2"
//         }
//       }
//     ];

//     if (match) {
//       const searchMatchStage = {
//         $match: {
//           $or: [
//             { couponCode: { $regex: match, $options: "i" } },
//             { orderStatus: { $regex: match, $options: "i" } }
//           ]
//         }
//       };

//       query.splice(1, 0, searchMatchStage);
//     }
//     if(branchId){
//       query=[{
//         $match: { branch: new mongoose.Types.ObjectId(branchId) }
//       }
//       ,

//     ].concat(query)
//     }

//     if (sorton && sortdir) {
//       let sort = {};
//       sort[sorton] = sortdir === "desc" ? -1 : 1;
//       query = [{ $sort: sort }].concat(query);
//     } else {
//       let sort = {};
//       sort["createdAt"] = -1;
//       query = [{ $sort: sort }].concat(query);
//     }

//     const list = await Order.aggregate(query);

//     res.json(list);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error);
//   }
// };

exports.listOrderByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, orderStatus, branchId } =
      req.body;
    let query = [];

    if (branchId) {
      query.push({
        $match: { branch: new mongoose.Types.ObjectId(branchId) },
      });
    }
    if (match) {
      query.push({
        $match: {
          $or: [
            { couponCode: { $regex: match, $options: "i" } },
            { orderStatus: { $regex: match, $options: "i" } },
          ],
        },
      });
    }
    if (orderStatus) {
      query.push({ $match: { orderStatus } });
    }
    query.push({
      $lookup: {
        from: "usermasters",
        let: { userId: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { password: 0 , otp: 0, otpExpiresAt: 0} }
        ],
        as: "userDetails",
      },
    });
    query.push({
      $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
    });
    query.push({
      $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
    });
    query.push({
      $addFields: {
        "cart.menuItem": { $toObjectId: "$cart.menuItem" },
      },
    });
    query.push({
      $addFields: {
        "cart.toppings": {
          $map: {
            input: "$cart.toppings",
            as: "t",
            in: { $toObjectId: "$$t" },
          },
        },
      },
    });
    query.push({
      $lookup: {
        from: "menumasters",
        let: { menuId: "$cart.menuItem" },
        pipeline: [
          { $unwind: "$menuItem" },
          { $match: { $expr: { $eq: ["$menuItem._id", "$$menuId"] } } },
          { $project: { _id: 0, itemName: "$menuItem.itemName" } },
        ],
        as: "cart.menuItemDetails",
      },
    });
    query.push({
      $unwind: {
        path: "$cart.menuItemDetails",
        preserveNullAndEmptyArrays: true,
      },
    });
    query.push({
      $lookup: {
        from: "menumasters",
        let: { variantId: "$cart.variant" },
        pipeline: [
          { $unwind: "$menuItem" },
          { $unwind: "$menuItem.variants" },
          {
            $match: {
              $expr: { $eq: ["$menuItem.variants._id", "$$variantId"] },
            },
          },
          {
            $project: {
              _id: 0,
              variantName: "$menuItem.variants.variantName",
              variantPrice: "$menuItem.variants.price",
            },
          },
        ],
        as: "cart.variantDetails",
      },
    });
    query.push({
      $unwind: {
        path: "$cart.variantDetails",
        preserveNullAndEmptyArrays: true,
      },
    });
    query.push({
      $lookup: {
        from: "toppingmasters",
        localField: "cart.toppings",
        foreignField: "_id",
        as: "cart.toppingDetails",
      },
    });
    // Group stage: Include the additional fields from the Order document.
    query.push({
      $group: {
        _id: "$_id",
        orderStatus: { $first: "$orderStatus" },
        couponCode: { $first: "$couponCode" },
        discountPrice: { $first: "$discountPrice" },
        subTotal: { $first: "$subTotal" }, // Existing subTotal field
        effectiveSubtotal: { $first: "$effectiveSubtotal" }, // Newly added field
        cgst: { $first: "$cgst" }, // Newly added field
        sgst: { $first: "$sgst" }, // Newly added field
        totalTax: { $first: "$totalTax" }, // Newly added field
        grandTotal: { $first: "$grandTotal" },
        completionDateTime: { $first: "$completionDateTime" },
        remark: { $first: "$remark" },
        createdAt: { $first: "$createdAt" },
        userDetails: { $first: "$userDetails" },
        cart: { $push: "$cart" },
      },
    });
    // Projection stage: Expose the new fields in the final output.
    query.push({
      $project: {
        orderStatus: 1,
        couponCode: 1,
        discountPrice: 1,
        subTotal: 1,
        effectiveSubtotal: 1,
        cgst: 1,
        sgst: 1,
        totalTax: 1,
        grandTotal: 1,
        completionDateTime: 1,
        remark: 1,
        createdAt: 1,
        userDetails: 1,
        cart: {
          $map: {
            input: "$cart",
            as: "item",
            in: {
              quantity: "$$item.quantity",
              totalPrice: "$$item.totalPrice",
              menuItem: "$$item.menuItemDetails.itemName",
              variant: {
                name: "$$item.variantDetails.variantName",
                price: "$$item.variantDetails.variantPrice",
              },
              toppings: {
                $map: {
                  input: "$$item.toppingDetails",
                  as: "t",
                  in: {
                    toppingName: "$$t.toppingName",
                    toppingPrice: "$$t.price",
                  },
                },
              },
            },
          },
        },
      },
    });
   
    

    query = query.concat([
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: per_page }],
        },
      },
      { $unwind: "$metadata" },
      { $project: { count: "$metadata.total", data: 1 } },
    ]);

    const list = await Order.aggregate(query);
    eventEmitter.emit("ordersListByParamsFetched", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).exec();
    if (!updatedOrder) {
      return res.status(404).json({ isOk: false, message: "Order not found" });
    }
    eventEmitter.emit("orderUpdated", updatedOrder);
    eventEmitter.emit("ordersUpdateTrigger");
    res.json({
      isOk: true,
      data: updatedOrder,
      message: "Order updated successfully",
    });
  } catch (err) {
    res.status(400).json({ isOk: false, message: err.message });
  }
};

exports.removeOrder = async (req, res) => {
  try {
    const removedOrder = await Order.findByIdAndDelete(req.params.id).exec();
    if (!removedOrder) {
      return res.status(404).json({ isOk: false, message: "Order not found" });
    }
    eventEmitter.emit("orderDeleted", removedOrder);
    eventEmitter.emit("ordersUpdateTrigger");
    res.json({ isOk: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ isOk: false, message: err.message });
  }
};

exports.listOrdersByBranch = async (req, res) => {
  try {
    let { branchId, skip, per_page, sorton, sortdir, match, orderStatus } =
      req.body;

    let pipeline = [];

    // Match by branch using the top-level field
    if (branchId) {
      pipeline.push({
        $match: { branch: new mongoose.Types.ObjectId(branchId) },
      });
    }

    // If orderStatus is provided, filter orders by that status
    if (orderStatus) {
      pipeline.push({ $match: { orderStatus: orderStatus } });
    }

    // If match text is provided, search couponCode or orderStatus fields
    if (match) {
      pipeline.push({
        $match: {
          $or: [
            { couponCode: { $regex: match, $options: "i" } },
            { orderStatus: { $regex: match, $options: "i" } },
          ],
        },
      });
    }

    // Sorting stage
    pipeline.push({
      $sort:
        sorton && sortdir
          ? { [sorton]: sortdir === "desc" ? -1 : 1 }
          : { createdAt: -1 },
    });

    // Facet for pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: parseInt(skip) }, { $limit: parseInt(per_page) }],
      },
    });

    pipeline.push({ $unwind: "$metadata" });
    pipeline.push({
      $project: {
        count: "$metadata.total",
        data: 1,
      },
    });

    const orders = await Order.aggregate(pipeline);
    eventEmitter.emit("ordersByBranchFetched", orders);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching branch orders:", error);
    res.status(500).json({ isOk: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const orderId = req.params.id;
    if (!orderStatus) {
      return res
        .status(400)
        .json({ isOk: false, message: "Order status is required" });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true, runValidators: true }
    ).exec();
    if (!updatedOrder) {
      return res.status(404).json({ isOk: false, message: "Order not found" });
    }
    eventEmitter.emit("orderStatusUpdated", updatedOrder);
    eventEmitter.emit("ordersUpdateTrigger");
    res.json({
      isOk: true,
      data: updatedOrder,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isOk: false, message: error.message });
  }
};
// exports.listUserOrders = async (req, res) => {
//   try {
//     // Assume the user ID is passed as a route parameter
//     const userId = req.params.userId;
//     if (!userId) {
//       return res
//         .status(400)
//         .json({ isOk: false, message: "User ID is required" });
//     }

//     // Find orders where the userId matches the provided ID, sorted by creation date descending
//     const userOrders = await Order.find({
//       userId: new mongoose.Types.ObjectId(userId),
//     })
//       .sort({ createdAt: -1 })
//       .exec();

//     res.json({ isOk: true, data: userOrders });
//   } catch (error) {
//     res.status(500).json({ isOk: false, message: error.message });
//   }
// };

exports.listUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ isOk: false, message: "User ID is required" });
    }

    const pipeline = [
      // Match orders by the given userId
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      // Lookup user details from "usermasters"
      {
        $lookup: {
          from: "usermasters",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },

      // Unwind the cart array to work on each cart item separately
      { $unwind: { path: "$cart", preserveNullAndEmptyArrays: true } },

      // Convert the cart.menuItem string to ObjectId
      {
        $addFields: {
          "cart.menuItem": { $toObjectId: "$cart.menuItem" },
        },
      },
      // Convert each topping ID in the cart.toppings array to ObjectId
      {
        $addFields: {
          "cart.toppings": {
            $map: {
              input: "$cart.toppings",
              as: "t",
              in: { $toObjectId: "$$t" },
            },
          },
        },
      },

      // Lookup the menu item details from "menumasters"
      {
        $lookup: {
          from: "menumasters",
          let: { menuId: "$cart.menuItem" },
          pipeline: [
            { $unwind: "$menuItem" },
            {
              $match: {
                $expr: { $eq: ["$menuItem._id", "$$menuId"] },
              },
            },
            { $project: { _id: 0, itemName: "$menuItem.itemName" } },
          ],
          as: "cart.menuItemDetails",
        },
      },
      {
        $unwind: {
          path: "$cart.menuItemDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup the variant details from "menumasters"
      {
        $lookup: {
          from: "menumasters",
          let: { variantId: "$cart.variant" },
          pipeline: [
            { $unwind: "$menuItem" },
            { $unwind: "$menuItem.variants" },
            {
              $match: {
                $expr: { $eq: ["$menuItem.variants._id", "$$variantId"] },
              },
            },
            {
              $project: {
                _id: 0,
                variantName: "$menuItem.variants.variantName",
                variantPrice: "$menuItem.variants.price",
              },
            },
          ],
          as: "cart.variantDetails",
        },
      },
      {
        $unwind: {
          path: "$cart.variantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup topping details from "toppingmasters"
      {
        $lookup: {
          from: "toppingmasters",
          localField: "cart.toppings",
          foreignField: "_id",
          as: "cart.toppingDetails",
        },
      },

      // Group back the cart items for each order
      {
        $group: {
          _id: "$_id",
          orderStatus: { $first: "$orderStatus" },
          couponCode: { $first: "$couponCode" },
          discountPrice: { $first: "$discountPrice" },
          subTotal: { $first: "$subTotal" },
          effectiveSubtotal: { $first: "$effectiveSubtotal" },
          cgst: { $first: "$cgst" },
          sgst: { $first: "$sgst" },
          totalTax: { $first: "$totalTax" },
          grandTotal: { $first: "$grandTotal" },
          completionDateTime: { $first: "$completionDateTime" },
          remark: { $first: "$remark" },
          createdAt: { $first: "$createdAt" },
          userDetails: { $first: "$userDetails" },
          branchDetails: { $first: "$branchDetails" },
          cart: { $push: "$cart" },
        },
      },

      // Project the desired fields and transform the cart array
      {
        $project: {
          orderStatus: 1,
          couponCode: 1,
          discountPrice: 1,
          subTotal: 1,
          effectiveSubtotal: 1,
          cgst: 1,
          sgst: 1,
          totalTax: 1,
          grandTotal: 1,
          completionDateTime: 1,
          remark: 1,
          createdAt: 1,
          userDetails: 1,
          branch: {
            name: "$branchDetails.branchName",
            address: "$branchDetails.address",
          },

          cart: {
            $map: {
              input: "$cart",
              as: "item",
              in: {
                quantity: "$$item.quantity",
                totalPrice: "$$item.totalPrice",
                // Extract the menu item name from the looked-up details
                menuItem: "$$item.menuItemDetails.itemName",
                variant: {
                  name: "$$item.variantDetails.variantName",
                  price: "$$item.variantDetails.variantPrice",
                },
                toppings: {
                  $map: {
                    input: "$$item.toppingDetails",
                    as: "t",
                    in: {
                      toppingName: "$$t.toppingName",
                      toppingPrice: "$$t.price",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Finally, sort the orders by creation date in descending order
      { $sort: { createdAt: -1 } },
    ];

    const orders = await Order.aggregate(pipeline);
    res.json({ isOk: true, data: orders });

    // eventEmitter.emit('orderStatusUpdated', updatedOrder);
    // eventEmitter.emit('ordersUpdateTrigger');
    // res.json({ isOk: true, data: updatedOrder, message: "Order status updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ isOk: false, message: error.message });
  }
};

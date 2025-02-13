const Order = require("../../models/Order/Order");

exports.getOrder = async (req, res) => {
    try {
      const order = await Order.findById(req.params._id).exec();
      if (!order) {
        return res.status(404).json({ isOk: false, message: "Order not found" });
      }
      res.json({ isOk: true, data: order });
    } catch (error) {
      return res.status(500).json({ isOk: false, message: error.message });
    }
  };    


  exports.createOrder = async (req, res) => {
    try {
      const { cart, orderStatus, discountPrice, couponCode, grandTotal, completionTime } = req.body;
      console.log(">>>>>", req.body);
    
      if (!cart || cart.length === 0) {
        return res
          .status(400)
          .json({ isOk: false, message: "Cart must contain at least one item" });
      }
    
      if (grandTotal == null) {
        return res
          .status(400)
          .json({ isOk: false, message: "Grand total is required" });
      }
    
      const newOrder = new Order({
        cart: cart || [],
        orderStatus: orderStatus || "pending",
        discountPrice: discountPrice || 0,
        couponCode,
        grandTotal,
        completionTime
      });
    
      const savedOrder = await newOrder.save();
      res.status(201).json({
        isOk: true,
        data: savedOrder,
        message: "Order created successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ isOk: false, message: err.message });
    }
  };

  exports.listOrder = async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).exec();
      res.json({ isOk: true, data: orders });
    } catch (error) {
      return res.status(500).json({ isOk: false, message: error.message });
    }
  };

  exports.listOrderByParams = async (req, res) => {
    try {
      let { skip, per_page, sorton, sortdir, match, orderStatus } = req.body;
    
      let query = [
        {
          $match: { orderStatus: orderStatus }
        },
        {
          $facet: {
            stage1: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 }
                }
              }
            ],
            stage2: [
              { $skip: skip },
              { $limit: per_page }
            ]
          }
        },
        {
          $unwind: { path: "$stage1" }
        },
        {
          $project: {
            count: "$stage1.count",
            data: "$stage2"
          }
        }
      ];
    
      if (match) {
        const searchMatchStage = {
          $match: {
            $or: [
              { couponCode: { $regex: match, $options: "i" } },
              { orderStatus: { $regex: match, $options: "i" } }
            ]
          }
        };
    
        query.splice(1, 0, searchMatchStage);
      }
    
      if (sorton && sortdir) {
        let sort = {};
        sort[sorton] = sortdir === "desc" ? -1 : 1;
        query = [{ $sort: sort }].concat(query);
      } else {
        let sort = {};
        sort["createdAt"] = -1;
        query = [{ $sort: sort }].concat(query);
      }
    
      const list = await Order.aggregate(query);
    
      res.json(list);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  exports.updateOrder = async (req, res) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(req.params._id, req.body, {
        new: true,
        runValidators: true,
      });
    
      if (!updatedOrder) {
        return res.status(404).json({ isOk: false, message: "Order not found" });
      }
    
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
      const removedOrder = await Order.findByIdAndDelete(req.params._id);
      if (!removedOrder) {
        return res.status(404).json({ isOk: false, message: "Order not found" });
      }
      res.json({ isOk: true, message: "Order deleted successfully" });
    } catch (err) {
      res.status(500).json({ isOk: false, message: err.message });
    }
  };
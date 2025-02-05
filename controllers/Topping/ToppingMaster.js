const ToppingMaster = require("../../models/Topping/ToppingMaster");

exports.getToppingMaster = async (req, res) => {
  try {
    const find = await ToppingMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createToppingMaster = async (req, res) => {
  try {
    const add = await new ToppingMaster(req.body).save();
    res.json(add);
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.listToppingMaster= async (req, res) => {
  try {
    const list = await ToppingMaster.find({ isActive: true }).sort({ name : 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listActiveToppingMaster = async (req, res) => {
  try {
    const list = await ToppingMaster.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    console.log("list avi", list);
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listToppingMasterByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },
      {
        $lookup: {
          from: "toppingcategories", // Adjust if your collection name is different
          localField: "toppingCategory", // Field in ToppingMaster storing the ObjectId reference
          foreignField: "_id",
          as: "toppingCategoryData"
        }
      },
      {
        $unwind: {
          path: "$toppingCategoryData",
          preserveNullAndEmptyArrays: true
        }
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
                toppingName: { $regex: match, $options: "i" },
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

    const list = await ToppingMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateToppingMaster = async (req, res) => {
  try {
    const update = await ToppingMaster.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeToppingMaster = async (req, res) => {
  try {
    const delTL = await ToppingMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(delTL);
  } catch (err) {
    res.status(400).send(err);
  }
};

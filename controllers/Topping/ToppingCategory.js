const getToppingCategory = require("../../models/Topping/Toppingcategory");

exports.getToppingCategory = async (req, res) => {
  try {
    const find = await getToppingCategory.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createToppingCategory = async (req, res) => {
  try {
    const add = await new getToppingCategory(req.body).save();
    res.json(add);
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.listToppingCategory = async (req, res) => {
  try {
    const list = await getToppingCategory.find({ isActive: true }).sort({ name : 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listActiveToppingCategory = async (req, res) => {
  try {
    const list = await getToppingCategory.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    console.log("list avi", list);
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listToppingCategoryByParams = async (req, res) => {
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
                name: { $regex: match, $options: "i" },
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

    const list = await getToppingCategory.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateToppingCategory = async (req, res) => {
  try {
    const update = await getToppingCategory.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeToppingCategory = async (req, res) => {
  try {
    const delTL = await getToppingCategory.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(delTL);
  } catch (err) {
    res.status(400).send(err);
  }
};

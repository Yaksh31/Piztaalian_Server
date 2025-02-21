const CategoryMaster = require("../../models/Category/CategoryMaster");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");





async function compressImage(file, uploadDir) {
  const filePath = path.join(uploadDir, file.filename);
  const compressedPath = path.join(uploadDir, `compressed-${file.filename}`);

  try {
    let quality = 80;
    let compressed = false;

    do {
      await sharp(file.path)
        .jpeg({ quality }) // Adjust the quality to reduce the size
        .toFile(compressedPath);

      const { size } = fs.statSync(compressedPath);
      if (size <= 100 * 1024 || quality <= 20) {
        // Check if size is under 100 KB or quality is too low
        compressed = true;
      } else {
        quality -= 10; // Reduce quality further if size is still too large
      }
    } while (!compressed);

    // Replace the original image with the compressed one
    fs.unlinkSync(filePath);
    fs.renameSync(compressedPath, filePath);

    return `uploads/menuCategoryImages/${file.filename}`;
  } catch (error) {
    console.log("Error compressing image:", error);
    return null;
  }
}

exports.getCategoryMaster = async (req, res) => {
  try {
    const find = await CategoryMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createCategoryMaster = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/menuCategoryImages`)) {
      fs.mkdirSync(`${__basedir}/uploads/menuCategoryImages`);
    }

    const uploadDir =`${__basedir}/uploads/menuCategoryImages`

    let bannerImage = req.file
    ? await compressImage(req.file, uploadDir)
    : null;

    let { categoryName, IsActive } = req.body;
    const add = await new CategoryMaster({
      categoryName,
      bannerImage,
      IsActive,
    }).save();
    //const add = await new CategoryMaster(req.body).save();
    res.json(add);
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.listCategoryMaster = async (req, res) => {
  try {
    const list = await CategoryMaster.find({ IsActive: true })
      .sort({ categoryName: 1 })
      .exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listActiveCategories = async (req, res) => {
  try {
    const list = await CategoryMaster.find({ IsActive: true })
      .sort({ createdAt: -1 })
      .exec();
    console.log("list avi", list);
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listCategoryMasterByParams = async (req, res) => {
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
                CategoryMaster: { $regex: match, $options: "i" },
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

    const list = await CategoryMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateCategoryMaster = async (req, res) => {
  try {
    const uploadDir =`${__basedir}/uploads/menuCategoryImages`
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
    
    let bannerImage = req.file
      ? await compressImage(req.file, uploadDir)
      : null;
    let fieldvalues = { ...req.body };
    if (bannerImage != null) {
      fieldvalues.bannerImage = bannerImage;
    }
    const update = await CategoryMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
     // req.body,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeCategoryMaster = async (req, res) => {
  try {
    const delTL = await CategoryMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(delTL);
  } catch (err) {
    res.status(400).send(err);
  }
};

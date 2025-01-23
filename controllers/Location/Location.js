const Country = require("../../models/Location/Country");
const State = require("../../models/Location/State");
const City = require("../../models/Location/City");

//////////////////////////////////////Country//////////////////////////////////////////

exports.listCountry = async (req, res) => {
  try {
    const list = await Country.find().sort({ createdAt: -1 }).exec();
    // console.log("list country", list);
    res.json(list);
  } catch (error) {
    console.log("error in list country", error);
    res.status(400).send("list country failed");
  }
};

exports.listActiveCountry = async (req, res) => {
  try {
    const list = await Country.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    // console.log("list country", list);
    res.json(list);
  } catch (error) {
    console.log("error in list Active country", error);
    res.status(500).json("list Active country failed");
  }
};

exports.listCountryByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive },
      },
    ];

    // Search on both CountryName and CountryCode fields
    if (match) {
      const regex = new RegExp(match, "i");
      const codeRegex = !isNaN(match) ? parseInt(match) : null;
      query.push({
        $match: {
          $or: [{ CountryName: regex }],
        },
      });
    }

    // Sort records based on sorton and sortdir
    let sort = {};
    if (sorton && sortdir) {
      sort[sorton] = sortdir === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }
    query.push({ $sort: sort });

    // Limit and skip records based on per_page and skip
    query.push({
      $facet: {
        stage1: [{ $count: "count" }],
        stage2: [{ $skip: skip }, { $limit: per_page }],
      },
    });
    query.push({ $unwind: "$stage1" });
    query.push({
      $project: {
        count: "$stage1.count",
        data: "$stage2",
      },
    });

    const list = await Country.aggregate(query);
    res.json(list);
  } catch (error) {
    console.log("error in list all country", error);
    res.status(400).send("list country failed");
  }
};
exports.createCountry = async (req, res) => {
  try {
    const country = await Country.findOne({
      CountryName: req.body.CountryName,
    });
    if (country) {
      return res.status(200).json({
        isOk: false,
        field: 1,
        message: "Country with this name already exists!",
      });
    } else {
      const { CountryName, CountryCode } = req.body;
      const addCountry = await new Country(req.body).save();
      console.log("create country", addCountry);
      res.status(200).json({ isOk: true, data: addCountry, message: "" });
    }
  } catch (err) {
    res.status(200).json({ isOk: false, message: "Error creating country" });
  }
};

exports.removeCountry = async (req, res) => {
  try {
    const delCountry = await Country.findOneAndRemove({
      _id: req.params._id,
    });
    console.log(delCountry);
    res.json(delCountry);
  } catch (err) {
    console.log(err);
    res.status(400).send("delete category failed");
  }
};

exports.removeAndUpdateCountry = async (req, res) => {
  try {
    const update = await Country.findOneAndUpdate(
      { _id: req.params._id },
      { isActive: false },
      { new: true }
    );
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("update category failed");
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const update = await Country.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    console.log("edit country", update);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("update country failed");
  }
};

exports.getCountry = async (req, res) => {
  try {
    const country = await Country.findOne({ _id: req.params._id }).exec();
    console.log("get country", country);
    res.json(country);
  } catch (error) {
    console.log(error);
    res.status(400).send("get country failed");
  }
};

/////////////////////////////STATE////////////////////////////
exports.listState = async (req, res) => {
  try {
    const list = await State.find().sort({ createdAt: -1 }).exec();
    console.log("list State", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send("get country failed");
  }
};

exports.listActiveState = async (req, res) => {
  try {
    const list = await State.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    console.log("list active State", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).json("get state active failed");
  }
};

exports.listStateByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },
      {
        $lookup: {
          from: "countries",
          localField: "CountryID",
          foreignField: "_id",
          as: "countryname",
        },
      },
      {
        $unwind: {
          path: "$countryname",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          countryname: "$countryname.CountryName",
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
      const regex = new RegExp(match, "i");
      const codeRegex = !isNaN(match) ? parseInt(match) : null;
      query = [
        {
          $match: {
            $or: [
              {
                StateName: regex,
              },
              // {
              //   StateCode: codeRegex,
              // },
              {
                CountryName: regex,
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

    const list = await State.aggregate(query);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send("get state list all failed");
  }
};

exports.createState = async (req, res) => {
  try {
    // const code = await State.findOne({ StateCode: req.body.StateCode });
    const state = await State.findOne({ StateName: req.body.StateName });
    console.log(state);
    if (state) {
      return res.status(200).json({
        isOk: false,
        field: 1,
        message: "State with this name already exists!",
      });
    } else {
      console.log(req.body);
      const addState = await new State(req.body).save();
      console.log("create country", addState);
      res.status(200).json({ isOk: true, data: addState, message: "" });
    }
  } catch (err) {
    console.log("log error from create state", err);
    return res
      .status(200)
      .json({ isOk: false, message: "Error creating state" });
  }
};

exports.removeState = async (req, res) => {
  try {
    const del = await State.findOneAndRemove({
      _id: req.params._id,
    });
    console.log(del);
    res.json(del);
  } catch (err) {
    console.log(err);
    res.status(400).send("delete state failed");
  }
};

exports.removeAndUpdateState = async (req, res) => {
  try {
    const update = await State.findOneAndUpdate(
      { _id: req.params._id },
      { isActive: false },
      { new: true }
    );
    console.log(update);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("remove state failed");
  }
};

exports.updateState = async (req, res) => {
  try {
    // const { CountryCode, CountryName } = req.body;
    const update = await State.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    console.log("edit state", update);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("update state failed");
  }
};

exports.getState = async (req, res) => {
  try {
    const state = await State.findOne({ _id: req.params._id }).exec();
    console.log("get state", state);
    res.json(state);
  } catch (error) {
    console.log(error);
    res.status(400).send("get state failed");
  }
};

////////////////////////////////////////City//////////////////////////////////////////
exports.listCity = async (req, res) => {
  try {
    const list = await City.find().sort({ CityName: 1 }).exec();
    console.log("list city", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send("list city failed");
  }
};

exports.listCityByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },
      {
        $lookup: {
          from: "countries",
          localField: "CountryID",
          foreignField: "_id",
          as: "countryname",
        },
      },
      {
        $unwind: {
          path: "$countryname",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          countryname: "$countryname.CountryName",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "StateID",
          foreignField: "_id",
          as: "statename",
        },
      },
      {
        $unwind: {
          path: "$statename",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          statename: "$statename.StateName",
        },
      },
      {
        $match: {
          $or: [
            {
              CityName: new RegExp(match, "i"),
            },
            {
              StateID: new RegExp(match, "i"),
            },
            {
              countryname: new RegExp(match, "i"),
            },
            {
              statename: new RegExp(match, "i"),
            },
          ],
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

    const list = await City.aggregate(query);
    console.log("list city by  params", list);
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send("list all city failed");
  }
};

exports.removeCity = async (req, res) => {
  try {
    const del = await City.findOneAndRemove({
      _id: req.params._id,
    });
    console.log(del);
    res.json(del);
  } catch (err) {
    console.log(err);
    res.status(400).send("delete city failed");
  }
};

exports.getCity = async (req, res) => {
  try {
    const state = await City.findOne({ _id: req.params._id }).exec();
    console.log("get city", state);
    res.json(state);
  } catch (error) {
    console.log(error);
    res.status(400).send("get city failed");
  }
};

exports.createCity = async (req, res) => {
  try {
    console.log(req.body);
    // const code = await City.findOne({ CityCode: req.body.CityCode });
    const cityName = await City.findOne({ CityName: req.body.CityName });
    if (cityName) {
      return res.status(200).json({
        isOk: false,
        field: 1,
        message: "City with this name already exists!",
      });
    }
    // else if (code) {
    //   return res
    //     .status(200)
    //     .json({
    //       isOk: false,
    //       field: 2,
    //       message: "City with this code already exists!",
    //     });
    // }
    else {
      const addCity = await new City(req.body).save();
      console.log("create city", addCity);
      res.status(200).json({ isOk: true, data: addCity });
    }
  } catch (err) {
    console.log("log error from create city", err);
    return res.status(400).send("create dynamic content failed");
  }
};

exports.updateCity = async (req, res) => {
  try {
    const update = await City.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    console.log("edit city", update);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("update city failed");
  }
};

exports.removeAndUpdateCity = async (req, res) => {
  try {
    const update = await City.findOneAndUpdate(
      { _id: req.params._id },
      { isActive: false },
      { new: true }
    );
    console.log(update);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("remove city failed");
  }
};






exports.getStatesByCountry = async (req, res) => {
  try {
      const { countryId } = req.params; // Pass countryId as a URL parameter
      const states = await State.find({ CountryID: countryId }).exec();

      if (!states || states.length === 0) {
          return res.status(404).json({ isOk: false, message: "No states found for the given country." });
      }

      res.status(200).json({ isOk: true, data: states });
  } catch (error) {
      console.error("Error fetching states by country:", error);
      res.status(500).json({ isOk: false, message: "Internal server error", error: error.message });
  }
}; 

exports.getCitiesByState = async (req, res) => {
  try {
      const { stateId } = req.params; // Pass stateId as a URL parameter
      const cities = await City.find({ StateID: stateId }).exec();

      if (!cities || cities.length === 0) {
          return res.status(404).json({ isOk: false, message: "No cities found for the given state." });
      }

      res.status(200).json({ isOk: true, data: cities });
  } catch (error) {
      console.error("Error fetching cities by state:", error);
      res.status(500).json({ isOk: false, message: "Internal server error", error: error.message });
  }
};
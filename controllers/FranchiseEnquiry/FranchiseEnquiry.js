const FranchiseEnquiry = require("../../models/FranchiseEnquiry/FranchiseEnquiry");
const nodemailer = require("nodemailer");

const COMPANY_EMAIL = process.env.EMAIL_USER; // Replace with your email

exports.createEnquiry = async (req, res) => {
  try {
    const { name, number, email, city, message } = req.body;
    console.log(req.body);

    // Save the inquiry in the database
    const newEnquiry = new FranchiseEnquiry({
      name,
      number,
      email,
      city,
      message,
    });
    await newEnquiry.save();

    // Nodemailer setup
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Thank-You Email to User
    let userMailOptions = {
      from: COMPANY_EMAIL,
      to: email,
      subject: "Thanks for Reaching Out!",
      text: `Hi ${name},\n\nThank you for contacting us. We have received your inquiry and will get back to you soon.\n\nBest Regards,\nPiztaalian`,
    };

    // Email to Company
    let companyMailOptions = {
      from: email,
      to: COMPANY_EMAIL,
      subject: "New  Inquiry",
      text: `A new inquiry has been received:\n\nName: ${name}\nNumber: ${number}\nEmail: ${email}\nCity: ${city}\nMessage: ${message}`,
    };

    // Send emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(companyMailOptions);

    res.status(200).json({
      isOk: true,
      data: newEnquiry,
      message: "Inquiry submitted successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isOk: false, message: "Error submitting inquiry" });
  }
};

// Fetch all contact inquiries
exports.listEnquiry = async (req, res) => {
  try {
    const enquiry = await FranchiseEnquiry.find()
      .sort({ createdAt: -1 })
      .exec();
    res.json(enquiry);
  } catch (error) {
    return res.status(500).send(error);
  }
};

// Fetch a single inquiry details
exports.getEnquiry = async (req, res) => {
  try {
    const enquiry = await FranchiseEnquiry.findById(req.params._id);
    if (!enquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.status(200).json({ isOk: true, data: enquiry }); //  Wrap data in a 'data' field
  } catch (error) {
    return res.status(500).send(error);
  }
};

// Delete an inquiry
exports.removeEnquiry = async (req, res) => {
  try {
    const deletedEnquiry = await FranchiseEnquiry.findByIdAndDelete(
      req.params._id
    );
    if (!deletedEnquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.json({ message: "Inquiry deleted successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.listEnquiryByParams = async (req, res) => {
  try {
    let {
      skip = 0,
      per_page = 10,
      sorton,
      sortdir,
      match,
      isActive,
    } = req.body;

    // Base query to match active/inactive contacts
    let query = [
      {
        $match: isActive !== undefined ? { isActive: isActive } : {}, // Handles both active and inactive filters
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 }, // Total count of documents
              },
            },
          ],
          stage2: [
            {
              $skip: parseInt(skip),
            },
            {
              $limit: parseInt(per_page),
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

    //  Dynamic Filtering Based on Search Query (Name, Email, number)
    if (match) {
      query.unshift({
        $match: {
          $or: [
            { name: { $regex: match, $options: "i" } },
            { email: { $regex: match, $options: "i" } },
            { city: { $regex: match, $options: "i" } },
            { number: { $regex: match, $options: "i" } },
            { message: { $regex: match, $options: "i" } },
          ],
        },
      });
    }

    //  Dynamic Sorting
    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      query.unshift({ $sort: sort });
    } else {
      query.unshift({ $sort: { createdAt: -1 } }); // Default sorting by created date
    }

    //  Final Aggregation Query
    const enquiry = await FranchiseEnquiry.aggregate(query);

    res.status(200).json(enquiry);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

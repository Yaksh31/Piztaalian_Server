const ContactMaster = require("../../models/ContactMaster/ContactMaster");
const nodemailer = require("nodemailer");

const COMPANY_EMAIL = process.env.EMAIL_USER; // Replace with your email

exports.createContact = async (req, res) => {
  try {
    const { name, phone, email, description } = req.body;
    console.log(req.body);

    // Save the inquiry in the database
    const newContact = new ContactMaster({ name, phone, email, description });
    await newContact.save();

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
      text: `Hi ${name},\n\nThank you for contacting us. We have received your inquiry and will get back to you soon.\n\nBest Regards,\nYour Company`,
    };

    // Email to Company
    let companyMailOptions = {
      from: email,
      to: COMPANY_EMAIL,
      subject: "New Contact Inquiry",
      text: `A new inquiry has been received:\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDescription: ${description}`,
    };

    // Send emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(companyMailOptions);

    res
      .status(200)
      .json({
        isOk: true,
        data: newContact,
        message: "Inquiry submitted successfully!",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isOk: false, message: "Error submitting inquiry" });
  }
};

// Fetch all contact inquiries
exports.listContact = async (req, res) => {
  try {
    const contacts = await ContactMaster.find().sort({ createdAt: -1 }).exec();
    res.json(contacts);
  } catch (error) {
    return res.status(500).send(error);
  }
};

// Fetch a single inquiry details
exports.getContact = async (req, res) => {
  try {
    const contact = await ContactMaster.findById(req.params._id);
    if (!contact) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.status(200).json({ isOk: true, data: contact }); //  Wrap data in a 'data' field
  } catch (error) {
    return res.status(500).send(error);
  }
};

// Delete an inquiry
exports.removeContact = async (req, res) => {
  try {
    const deletedContact = await ContactMaster.findByIdAndDelete(req.params._id);
    if (!deletedContact) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.json({ message: "Inquiry deleted successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
};



exports.listContactByParams = async (req, res) => {
  try {
    let { skip = 0, per_page = 10, sorton, sortdir, match, isActive } = req.body;

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

    //  Dynamic Filtering Based on Search Query (Name, Email, Phone)
    if (match) {
      query.unshift({
        $match: {
          $or: [
            { name: { $regex: match, $options: "i" } },
            { email: { $regex: match, $options: "i" } },
            { phone: { $regex: match, $options: "i" } },
            { description: { $regex: match, $options: "i" } },
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

    // 🚀 Final Aggregation Query
    const contacts = await ContactMaster.aggregate(query);

    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};


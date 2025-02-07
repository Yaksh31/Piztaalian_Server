const Branch = require("../../models/BranchMaster/BranchMaster");
const fs = require("fs");
const path = require('path');
const jwt = require("jsonwebtoken");
const InfluencerMaster = require("../../models/CouponMaster/InfluencerMaster")
const CouponMaster = require("../../models/CouponMaster/CouponMaster")
const QRCode = require("qrcode");
const CouponAssign = require("../../models/CouponMaster/CouponAssign")
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const nodemailer = require("nodemailer");
const axios = require("axios");

const puppeteer = require("puppeteer");
const __basedir = path.resolve();

const React = require('react')


exports.getCouponAssign = async (req, res) => {
  try {

    const couponAssign = await CouponAssign.findById(req.params._id)
      .populate('influencer')
      .populate('coupon')
      .populate('qrCodeUrl')
      .populate('branch')
      .exec();

    if (!couponAssign) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    res.status(200).json({
      isOk: true,
      data: couponAssign,
    });
  } catch (err) {
    console.error("Error in getCouponAssign:", err);
    return res.status(500).send({ error: "Internal Server Error." });
  }
};





// controllers/CouponAssignController.js



exports.createCouponAssign = async (req, res) => {
  try {
    const { influencer, coupon, numberOfCoupons, branch, isActive } = req.body;

    // Validate fields
    if (!influencer || !Array.isArray(influencer) || !coupon || !numberOfCoupons || !branch) {
      return res.status(400).json({
        message: "All fields (influencer, coupon, numberOfCoupons, branch) are required.",
      });
    }

    // Fetch Influencer and Coupon data
    const influencerData = await InfluencerMaster.find({ _id: { $in: influencer } }).exec();
    const couponData = await CouponMaster.findById(coupon).exec();

    if (!influencerData.length || !couponData) {
      return res.status(400).json({
        message: "Invalid Influencer or Coupon selected.",
      });
    }

    // Function to generate unique coupon code
    const generateUniqueCouponCode = (influencerName, couponCode) => {
      return `${influencerName.slice(0, 3).toUpperCase()}_${couponCode.slice(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
    };

    // Ensure the uploads directory exists
    const uploadsFolder = path.join(__dirname, "../../uploads/CouponQR");
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const createdAssignments = []; // To store all created assignments

    for (const inf of influencerData) {
      const uniqueCouponCode = generateUniqueCouponCode(inf.name, couponData.couponCode);

      // Create new CouponAssign document
      const newCouponAssign = new CouponAssign({
        influencer: inf._id,
        coupon: coupon,
        numberOfCoupons,
        branch, // Assuming 'branch' is an array of branch IDs
        uniqueCouponCode,
        isActive,
      });

      // Save the document to get the _id
      const savedCouponAssign = await newCouponAssign.save();
      createdAssignments.push(savedCouponAssign); // Add to the array

      // Generate QR code using the _id
      const qrFileName = `${savedCouponAssign._id}.png`;
      const qrFilePath = path.join(uploadsFolder, qrFileName);
      const qrData = `${process.env.REACT_APP_API_URL_BRANCH}/redeemcoupon/${savedCouponAssign._id}`; // Ensure this URL is correct and accessible

      await QRCode.toFile(qrFilePath, qrData);

      // Update the CouponAssign document with the QR code URL
      savedCouponAssign.qrCodeUrl = `uploads/CouponQR/${qrFileName}`;
      await savedCouponAssign.save();
    }

    // Return all created assignments
    res.status(200).json({
      isOk: true,
      data: createdAssignments,
      message: "Coupons assigned successfully with QR codes generated.",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: err.message });
  }
};


exports.listBranch = async (req, res) => {
  try {
    const list = await Branch.find({ isActive: true }).sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};


exports.listCouponAssignByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive }, // Match active/inactive status
      },
      {
        $lookup: {
          from: "influencermasters", // Replace with your actual collection name
          localField: "influencer",
          foreignField: "_id",
          as: "influencerData",
        },
      },
      {
        $lookup: {
          from: "couponmsters", // Replace with your actual collection name
          localField: "coupon",
          foreignField: "_id",
          as: "couponData",
        },
      },
      {
        $lookup: {
          from: "branchmasters", // Replace with your actual collection name
          localField: "branch",
          foreignField: "_id",
          as: "branchData",
        },
      },
      // Unwind the arrays created by lookups
      {
        $unwind: {
          path: "$influencerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$couponData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$branchData",
          preserveNullAndEmptyArrays: true,
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
      query = [
        {
          $match: {
            $or: [
              {
                influencer: { $regex: match, $options: "i" },
              },
              {
                coupon: { $regex: match, $options: "i" },
              },
              {
                uniqueCouponCode: { $regex: match, $options: "i" },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
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

    const list = await CouponAssign.aggregate(query);

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};


exports.updateCouponAssign = async (req, res) => {
  try {
    const { influencer, coupon, numberOfCoupons, branch, isActive } = req.body;

    if (!influencer || !coupon || !numberOfCoupons || !branch) {
      return res.status(400).json({
        message: "All fields (influencer, coupon, numberOfCoupons, branch) are required.",
      });
    }

    const influencerData = await InfluencerMaster.findById(influencer).exec();
    const couponData = await CouponMaster.findById(coupon).exec();

    if (!influencerData || !couponData) {
      return res.status(400).json({
        message: "Invalid Influencer or Coupon selected.",
      });
    }

    const generateUniqueCouponCode = (influencerName, couponCode) => {
      return `${influencerName.slice(0, 3).toUpperCase()}_${couponCode.slice(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
    };

    const uniqueCouponCode = generateUniqueCouponCode(influencerData.name, couponData.couponCode);

    const uploadsFolder = path.join(__dirname, "../../uploads/CouponQR");
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const updatedCouponAssign = await CouponAssign.findOneAndUpdate(
      { _id: req.params._id },
      { influencer, coupon, numberOfCoupons, branch, uniqueCouponCode, isActive },
      { new: true }
    ).populate('influencer').populate('coupon').populate('branch').exec();

    if (!updatedCouponAssign) {
      return res.status(404).json({ message: "Coupon Assign not found" });
    }

    const qrFileName = `${uniqueCouponCode}.png`;
    const qrFilePath = path.join(uploadsFolder, qrFileName);
    const qrData = `${process.env.REACT_APP_API_URL}/redeemcoupon/${uniqueCouponCode}`;

    await QRCode.toFile(qrFilePath, qrData);

    updatedCouponAssign.qrCodeUrl = `uploads/CouponQR/${qrFileName}`;
    await updatedCouponAssign.save();

    res.json({
      isOk: true,
      data: updatedCouponAssign,
      message: "Coupon Assign updated successfully with QR code regenerated.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
};


exports.removeCouponAssign = async (req, res) => {
  try {
    const deletedCouponAssign = await CouponAssign.findOneAndRemove({
      _id: req.params._id,
    });

    if (!deletedCouponAssign) {
      return res.status(404).json({ message: "Coupon Assign not found" });
    }

    res.json(deletedCouponAssign);
  } catch (err) {
    res.status(400).send(err);
  }
};


exports.redeemCoupon = async (req, res) => {
  try {
    const uniqueCouponCode = req.params._id;

    if (!uniqueCouponCode) {
      return res.status(201).json({ message: "Unique coupon code is required." });
    }

    // Fetch the coupon assignment by uniqueCouponCode
    const couponAssign = await CouponAssign.findOne({ uniqueCouponCode: uniqueCouponCode })
      .populate('influencer')
      .populate('coupon')
      .populate('branch')
      .exec();

    if (!couponAssign) {
      return res.status(201).json({ message: "Coupon not found." });
    }

    if (!couponAssign.isActive) {
      return res.status(201).json({ message: "Coupon is inactive and cannot be redeemed." });
    }

    const currentDate = new Date();
    if (currentDate > couponAssign.validUntil) {
      return res.status(201).json({ message: "Coupon has expired and cannot be redeemed." });
    }



    // Check if numberOfCoupons > 0
    if (couponAssign.numberOfCoupons <= 0) {
      return res.status(201).json({ message: "Coupon already redeemed or no more uses left." });
    }

    // Decrement the number of available coupons
    couponAssign.numberOfCoupons -= 1;
    await couponAssign.save();

    res.status(200).json({
      isOk: true,
      message: "Coupon redeemed successfully",
      data: couponAssign,
    });
  } catch (err) {
    console.error("Error in redeemCoupon:", err);
    res.status(500).send({ error: "Internal Server Error." });
  }
};


// controllers/CouponAssignController.js
//   const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');
// const CouponAssign = require('../../models/CouponMaster/CouponAssign');

// const couponAssign = await CouponAssign.findById(req.params._id)
//       .populate('influencer')
//       .populate('coupon')
//       .populate('qrCodeUrl')
//       .exec();sj



exports.downloadCouponPDF = async (req, res) => {
  try {
    const id = req.params._id;

    const couponAssign = await CouponAssign.findById(id)
      .populate("influencer")
      .populate("coupon")
      .populate("branch")
      .exec();

    if (!couponAssign) {
      return res.status(404).json({ message: "Coupon assignment not found." });
    }
    console.log(couponAssign)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Useful for certain hosting environments
    });
    const page = await browser.newPage();


    const qrCodePath = path.join(__basedir, couponAssign.qrCodeUrl);
    const qrCodeBase64 = fs.existsSync(qrCodePath)
      ? `data:image/png;base64,${fs.readFileSync(qrCodePath).toString("base64")}`
      : "";

    // **Generate HTML content from your style**
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coupon</title>
  <style>

  @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .coupon-container {
    font-family: "Montserrat", serif;
      background: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .coupon {
      width: 100%;
      max-width: 500px;
      height: 200px;
      border-radius: 10px;
      overflow: hidden;
      margin: auto;
      filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
      display: flex;
      align-items: stretch;
      position: relative;
      text-transform: uppercase;
    }
    .coupon::before,
    .coupon::after {
      content: "";
      position: absolute;
      top: 0;
      width: 50%;
      height: 100%;
      z-index: -1;
    }
    .coupon::before {
      left: 0;
      background-image: radial-gradient(circle at 0 50%, transparent 17px, #cf2027 18px);
    }
    .coupon::after {
      right: 0;
      background-image: radial-gradient(circle at 100% 50%, transparent 18px, #cf2027 19px);
    }
    .coupon > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .left {
      border-right: 2px dashed rgba(255, 255, 255, 0.71);
      width: 23%;
      padding: 0px;
    }
    .left div {
      transform: rotate(-90deg);
      white-space: nowrap;
      font-weight: 600;
      font-size: 10px;
    }
    .center {
      width: 54%;
      text-align: center;
      padding: 15px;
      background-color: #cf2027;
    }
    .p-2 {
      padding: 0;
    }
    .coupon-image {
      display: flex;
      flex-direction: row;
      gap: 10px;
      height: 90px;
      width: auto;
    }
    .right {
      background-image: radial-gradient(circle at 100% 50%, transparent 17px, #fff 18px);
      width: 23%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0px;
    }
    .right div {
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      transform: rotate(-90deg);
      letter-spacing: 2px;
    }
    .center h2 {
      border-radius: 5px;
      background: #000;
      color: #fff;
      margin: 0;
      font-size: 25px;
      white-space: nowrap;
      display: inline-block;
      padding: 5px;
    }
    .center p {
      font-size: 15px;
      margin: 0;
      color: #fff;
    }
    .left a {
      text-decoration: none;
      color: #fff;
    }
    .logo {
      background: #fff;
      border-radius: 10px;
      padding: 5px;
      margin-bottom: 15px;
    }
    .p-2 img {
      height: 80px;
      width: 80px;
    }
    .center small {
      font-size: 12px;
      font-weight: 600;
      margin: 0;
      padding-bottom: 10px;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="coupon-container">
    <div class="coupon">
      <div class="left">
        <div class="text-center">
          Enjoy Your Gift From <br />
          <a href="https://instagram.com/${couponAssign.influencer.instagram}" target="_blank" rel="noopener noreferrer">
            @${couponAssign.influencer.instagram}
          </a>
        </div>
      </div>
      <div class="center">
        <div class="p-2">
          <div class="coupon-image">
            <img src="${couponAssign.influencer.logoUrl || 'https://www.piztaalian.com/assets/img/logo.png'}" width="60" class="logo mb-2" alt="Company Logo" />
            <img src="${process.env.REACT_APP_SERVER}/${couponAssign.qrCodeUrl}" width="64.5" class="logo mb-2" alt="QR Code" />
          </div>
          <h2>${couponAssign.coupon.discountPercentage}% OFF</h2>
          <p>${couponAssign.coupon.couponDescription}</p>
          <small>Valid Till: ${new Date(couponAssign.coupon.expiryDate).toLocaleDateString()}</small>
        </div>
      </div>
      <div class="right">
        <div>${couponAssign.uniqueCouponCode}</div>
      </div>
    </div>
    <div class="coupon" style="height: auto; min-height:200px">
      <div class="left">
        <div class="text-center">
          Terms &amp; Conditions
        </div>
      </div>
      <div class="center" style="font-size:10px ; text-align:left ; color:white; text-transform:"uppercase">
       
           ${couponAssign.coupon.termsAndConditions}
        
        
      </div>
      <div class="right">
        <div>${couponAssign.uniqueCouponCode}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const uploaddir = `${__basedir}/uploads`;
    const filename = "piztaalian.pdf"
    const filePath = path.join(uploaddir, filename)
    if (!fs.existsSync(uploaddir)) {
      fs.mkdirSync(uploaddir, { recursive: true });
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      path: filePath,
      printBackground: true, // To ensure background colors render
    });

    await browser.close();

    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; poojan.pdf`
    // );

    // res.send(pdfBuffer);
    const fileUrl = `${process.env.REACT_APP_SERVER}/uploads/${filename}`;

    return res.status(200).json({ filename, isOk: true, fileUrl })
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to generate PDF." });
  }
};





exports.downloadAllCouponsPDF = async (req, res) => {
  try {
    // Fetch all active CouponAssign documents
    const couponAssigns = await CouponAssign.find({ isActive: true })
      .populate("influencer")
      .populate("coupon")
      .populate("branch")
      .exec();

    if (!couponAssigns.length) {
      return res.status(404).json({ message: "No active coupon assignments found." });
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Start building combined HTML
    let combinedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Coupons</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          .coupon-container {
            font-family: "Montserrat", serif;
            background: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            page-break-after: always;
          }
          .coupon {
            width: 100%;
            max-width: 500px;
            height: 200px;
            border-radius: 10px;
            overflow: hidden;
            margin: auto;
            filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
            display: flex;
            align-items: stretch;
            position: relative;
            text-transform: uppercase;
          }
          .coupon::before,
          .coupon::after {
            content: "";
            position: absolute;
            top: 0;
            width: 50%;
            height: 100%;
            z-index: -1;
          }
          .coupon::before {
            left: 0;
            background-image: radial-gradient(circle at 0 50%, transparent 17px, #cf2027 18px);
          }
          .coupon::after {
            right: 0;
            background-image: radial-gradient(circle at 100% 50%, transparent 18px, #cf2027 19px);
          }
          .coupon > div {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .left {
            border-right: 2px dashed rgba(255, 255, 255, 0.71);
            width: 23%;
            padding: 0px;
          }
          .left div {
            transform: rotate(-90deg);
            white-space: nowrap;
            font-weight: 600;
            font-size: 10px;
          }
          .center {
            width: 54%;
            text-align: center;
            padding: 15px;
            background-color: #cf2027;
          }
          .p-2 {
            padding: 0;
          }
          .coupon-image {
            display: flex;
            flex-direction: row;
            gap: 10px;
            height: 90px;
            width: auto;
          }
          .right {
            background-image: radial-gradient(circle at 100% 50%, transparent 17px, #fff 18px);
            width: 23%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0px;
          }
          .right div {
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: 600;
            transform: rotate(-90deg);
            letter-spacing: 2px;
          }
          .center h2 {
            border-radius: 5px;
            background: #000;
            color: #fff;
            margin: 0;
            font-size: 25px;
            white-space: nowrap;
            display: inline-block;
            padding: 5px;
          }
          .center p {
            font-size: 15px;
            margin: 0;
            color: #fff;
          }
          .left a {
            text-decoration: none;
            color: #fff;
          }
          .logo {
            background: #fff;
            border-radius: 10px;
            padding: 5px;
            margin-bottom: 15px;
          }
          .p-2 img {
            height: 80px;
            width: 80px;
          }
          .center small {
            font-size: 12px;
            font-weight: 600;
            margin: 0;
            padding-bottom: 10px;
            color: #fff;
          }
          .back {
            margin-top: 40px;
            height: auto !important;
            min-height: 200px;
          }
          .back .center {
            font-size: 10px;
            text-align: left;
            color: white;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
    `;

    // Iterate over each couponAssign
    for (const couponAssign of couponAssigns) {
      const qrCodeBase64 = `${process.env.REACT_APP_SERVER}/${couponAssign.qrCodeUrl}`;
      const couponHtml = `
        <div class="coupon-container">
          <div class="coupon">
            <div class="left">
              <div class="text-center">
                Enjoy Your Gift From <br />
                <a href="https://instagram.com/${couponAssign.influencer.instagram}" target="_blank" rel="noopener noreferrer">
                  @${couponAssign.influencer.instagram}
                </a>
              </div>
            </div>
            <div class="center">
              <div class="p-2">
                <div class="coupon-image">
                  <img src="${couponAssign.influencer.logoUrl || 'https://www.piztaalian.com/assets/img/logo.png'}" width="60" class="logo mb-2" alt="Company Logo" />
                  <img src="${qrCodeBase64}" width="64.5" class="logo mb-2" alt="QR Code" />
                </div>
                <h2>${couponAssign.coupon.discountPercentage}% OFF</h2>
                <p>${couponAssign.coupon.couponDescription}</p>
                <small>Valid Till: ${new Date(couponAssign.coupon.expiryDate).toLocaleDateString()}</small>
              </div>
            </div>
            <div class="right">
              <div>${couponAssign.uniqueCouponCode}</div>
            </div>
          </div>
          <div class="coupon back">
            <div class="left">
              <div class="text-center">
                Terms &amp; Conditions
              </div>
            </div>
            <div class="center">
              <div class="p-2">
                ${couponAssign.coupon.termsAndConditions}
              </div>
            </div>
            <div class="right">
              <div>${couponAssign.uniqueCouponCode}</div>
            </div>
          </div>
        </div>
      `;
      combinedHtml += couponHtml;
    }

    combinedHtml += `
      </body>
      </html>
    `;

    // Set the content and generate PDF
    await page.setContent(combinedHtml, { waitUntil: "networkidle0" });

    const uploaddir = path.join(__basedir, 'uploads');
    const filename = `all_coupons.pdf`;
    const filePath = path.join(uploaddir, filename);

    if (!fs.existsSync(uploaddir)) {
      fs.mkdirSync(uploaddir, { recursive: true });
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      path: filePath,
      printBackground: true,
    });

    await browser.close();

    const fileUrl = `${process.env.REACT_APP_API_URL_COFFEE}/uploads/${filename}`;
    return res.status(200).json({ filename, fileUrl, isOk: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to generate PDF." });
  }
};












// exports.branchLogin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find branch by email
//     const branch = await Branch.findOne({ email }).exec();

//     if (!branch) {
//       return res.status(404).json({
//         isOk: false,
//         message: "Branch not found",
//       });
//     }

//     // Verify password
//     if (branch.password !== password) {
//       return res.status(401).json({
//         isOk: false,
//         message: "Invalid email or password",
//       });
//     }

//     // Generate JWT token
//     // const token = jwt.sign(
//     //   { id: branch._id, role: "branch", branchName: branch.branchName },
//     //   process.env.JWT_SECRET_TOKEN,
//     //   { expiresIn: "1d" } // Token valid for 1 day
//     // );

//     res.status(200).json({
//       isOk: true,
//       message: "Login successful",

//       data: {
//         id: branch._id,
//         email: branch.email,
//         branchName: branch.branchName,
//         role: "branch",
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       isOk: false,
//       message: "Internal server error",
//     });
//   }
// };

// Function to send coupon PDF via email
// Function to send coupon PDF via email (always regenerates the PDF first)
exports.sendCouponPDF = async (req, res) => {
  try {
    const { email, uniqueCouponCode } = req.body;
    if (!email || !uniqueCouponCode) {
      return res
        .status(400)
        .json({ error: "Missing required fields (email & uniqueCouponCode)" });
    }

    const couponAssign = await CouponAssign.findOne({ uniqueCouponCode })
      .populate("influencer")
      .populate("coupon")
      .populate("branch")
      .exec();
    
    if (!couponAssign) {
      return res.status(404).json({ error: "Coupon not found." });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const qrCodeBase64 = `${process.env.REACT_APP_SERVER}/${couponAssign.qrCodeUrl}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coupon</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .coupon-container {
      font-family: "Montserrat", serif;
      background: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .coupon {
      width: 100%;
      max-width: 500px;
      height: 200px;
      border-radius: 10px;
      overflow: hidden;
      margin: auto;
      filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
      display: flex;
      align-items: stretch;
      position: relative;
      text-transform: uppercase;
    }
    .coupon::before,
    .coupon::after {
      content: "";
      position: absolute;
      top: 0;
      width: 50%;
      height: 100%;
      z-index: -1;
    }
    .coupon::before {
      left: 0;
      background-image: radial-gradient(circle at 0 50%, transparent 17px, #cf2027 18px);
    }
    .coupon::after {
      right: 0;
      background-image: radial-gradient(circle at 100% 50%, transparent 18px, #cf2027 19px);
    }
    .coupon > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .left {
      border-right: 2px dashed rgba(255, 255, 255, 0.71);
      width: 23%;
      padding: 0px;
    }
    .left div {
      transform: rotate(-90deg);
      white-space: nowrap;
      font-weight: 600;
      font-size: 10px;
    }
    .center {
      width: 54%;
      text-align: center;
      padding: 15px;
      background-color: #cf2027;
    }
    .p-2 {
      padding: 0;
    }
    .coupon-image {
      display: flex;
      flex-direction: row;
      gap: 10px;
      height: 90px;
      width: auto;
    }
    .right {
      background-image: radial-gradient(circle at 100% 50%, transparent 17px, #fff 18px);
      width: 23%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0px;
    }
    .right div {
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      transform: rotate(-90deg);
      letter-spacing: 2px;
    }
    .center h2 {
      border-radius: 5px;
      background: #000;
      color: #fff;
      margin: 0;
      font-size: 25px;
      white-space: nowrap;
      display: inline-block;
      padding: 5px;
    }
    .center p {
      font-size: 15px;
      margin: 0;
      color: #fff;
    }
    .left a {
      text-decoration: none;
      color: #fff;
    }
    .logo {
      background: #fff;
      border-radius: 10px;
      padding: 5px;
      margin-bottom: 15px;
    }
    .p-2 img {
      height: 80px;
      width: 80px;
    }
    .center small {
      font-size: 12px;
      font-weight: 600;
      margin: 0;
      padding-bottom: 10px;
      color: #fff;
    }
    .back {
      margin-top: 40px;
      height: auto !important;
      min-height: 200px;
    }
    .back .center {
      font-size: 10px;
      text-align: left;
      color: white;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="coupon-container">
    <div class="coupon">
      <div class="left">
        <div class="text-center">
          Enjoy Your Gift From <br />
          <a href="https://instagram.com/${couponAssign.influencer.instagram}" target="_blank" rel="noopener noreferrer">
            @${couponAssign.influencer.instagram}
          </a>
        </div>
      </div>
      <div class="center">
        <div class="p-2">
          <div class="coupon-image">
            <img src="${couponAssign.influencer.logoUrl || 'https://www.piztaalian.com/assets/img/logo.png'}" width="60" class="logo mb-2" alt="Company Logo" />
            <img src="${qrCodeBase64}" width="64.5" class="logo mb-2" alt="QR Code" />
          </div>
          <h2>${couponAssign.coupon.discountPercentage}% OFF</h2>
          <p>${couponAssign.coupon.couponDescription}</p>
          <small>Valid Till: ${new Date(couponAssign.coupon.expiryDate).toLocaleDateString()}</small>
        </div>
      </div>
      <div class="right">
        <div>${couponAssign.uniqueCouponCode}</div>
      </div>
    </div>
    <div class="coupon back">
      <div class="left">
        <div class="text-center">
          Terms &amp; Conditions
        </div>
      </div>
      <div class="center">
        <div class="p-2">
          ${couponAssign.coupon.termsAndConditions}
        </div>
      </div>
      <div class="right">
        <div>${couponAssign.uniqueCouponCode}</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const uploadsDir = path.join(__basedir, "uploads");
    const filename = "piztaalian.pdf";
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await page.pdf({
      format: "A4",
      path: filePath,
      printBackground: true,
    });

    await browser.close();

    if (!fs.existsSync(filePath)) {
      return res
        .status(500)
        .json({ error: "PDF generation failed; file not found after create." });
    }

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Coupon Code",
      text: `Hello,\n\nHere is your latest coupon code PDF attached.\n\nBest Regards,\nPiztaalian`,
      attachments: [
        {
          filename,
          path: filePath,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      isOk: true,
      message: "Latest PDF generated & emailed successfully.",
    });
  } catch (error) {
    console.error("Error in sendCouponPDF:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate/send email", details: error.message });
  }
};
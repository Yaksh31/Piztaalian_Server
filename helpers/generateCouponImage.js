const fs = require("fs");
const path = require("path");
const nodeHtmlToImage = require("node-html-to-image");

// This function reads the couponTemplate.html, replaces placeholders,
// then uses node-html-to-image to render a single PNG on your server.
async function generateCouponImage({
  instagramHandle,
  qrCodeUrl,
  discountPercentage,
  description,
  validity,
  couponCode,
}) {
  try {
    // 1. Read the template file
    const templatePath = path.join(__dirname, "../templates/couponTemplate.html");
    let templateHtml = fs.readFileSync(templatePath, "utf8");

    // 2. Replace placeholders
    templateHtml = templateHtml
      .replace("{{instagramHandle}}", instagramHandle)
      .replace("{{qrCodeUrl}}", qrCodeUrl)
      .replace("{{discountPercentage}}", discountPercentage)
      .replace("{{description}}", description)
      .replace("{{validity}}", validity)
      .replace("{{couponCode}}", couponCode);

    // 3. Output path for final PNG
    const outputFolder = path.join(__dirname, "../uploads/CouponImages");
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const outputFilePath = path.join(outputFolder, `${couponCode}.png`);

    // 4. Render the HTML into a PNG
    await nodeHtmlToImage({
      html: templateHtml,
      output: outputFilePath,
      puppeteerArgs: {
        args: ["--no-sandbox"], // depends on your hosting environment
      },
    });

    return outputFilePath;
  } catch (error) {
    console.error("Error generating coupon image:", error);
    throw error;
  }
}

module.exports = { generateCouponImage };

const sizeOf = require('image-size');
const fs = require('fs');
const mime = require('mime');
const { generateResponseMessage } = require('./response');

const maxSizeInBytes = 1024 * 1024; // 1 MB
const minAspectRatio = 1;
const maxAspectRatio = 16 / 9;

const checkImage = (req, res, next) => {
  if (!req.file) {
    // No image uploaded, return error response
    return res.status(400).json(generateResponseMessage("error", "No image uploaded"));
  }

  // Check the size of the uploaded image
  const dimensions = sizeOf(req.file.path);
  const imageSizeInBytes = dimensions.width * dimensions.height;

  if (imageSizeInBytes > maxSizeInBytes) {
    // Delete the uploaded file as it exceeds the size limit
    fs.unlinkSync(req.file.path);
    return res.status(400).json(generateResponseMessage("error", "Image size should be less than 1 MB", imageSizeInBytes));
  }

  // Calculate the aspect ratio
  const aspectRatio = dimensions.width / dimensions.height;

  if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
    // Delete the uploaded file as it does not fall within the aspect ratio range
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      message: `Aspect ratio should be between 1 and 1.7`,
      aspectRatio,
    });
  }

  // Check the image type using the mime library
  const imageType = mime.getType(req.file.path);
  if (!imageType.startsWith('image/')) {
    // Delete the uploaded file as it is not an image
    fs.unlinkSync(req.file.path);
    return res.status(400).json(generateResponseMessage("error", "File uploaded is not an image"));
  }

  // Image size, aspect ratio, and type are all within the limits, proceed to the next middleware/route handler
  next();
};

module.exports = checkImage;

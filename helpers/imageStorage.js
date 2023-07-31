const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config(); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.IMAGE_UPLOAD_FULL_PATH);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueFilename = uuidv4() + ext;
    cb(null, uniqueFilename);
  }
});
const upload = multer({ storage });

module.exports = upload;

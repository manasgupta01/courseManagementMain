const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();
/**
 * This is the router for the user management API.
 *
 * @module user
 */

const User = require('../../db/models/user/model')
const { USERROLE_CODES,USERSTATUS_CODES } = require("../../db/models/user/model");

const { generateResponseMessage } = require("../../helpers/response");

const updateUserValidator = require('./validators')

const { checkJwt } = require("../../helpers/jwt");

const logger = require("../../helpers/logger");


/**
 * This router uses the `checkJwt` middleware to ensure that all requests are authenticated.
 */
router.use(checkJwt);
const { checkJwtForUserImage } = require("../../helpers/jwtForUserImageUpload");
const checkImage = require("../../helpers/imageValidator")
const upload = require('../../helpers/imageStorage')
/**
 * This route gets the details of the user with the specified ID.
 *
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 */
router.get('/details', async (req, res) => {
  const userId = req.id;

  try {
    // Find the user by ID.
    const users = await User.findById(userId);

    if (!users) {
      // Return a 404 error if the user is not found.
      return res.status(404).json(generateResponseMessage("error", 'User not found' ));
    }

    // Return the user details.
    res.json(generateResponseMessage(
      "success",
      users
		));
  } catch (error) {
    // Log the error and return a 500 error.
		logger.error(error)
    console.error('Error:', error.message);
    res.status(500).json(generateResponseMessage( "error",  'Internal Server Error' ));
  }
});

/**
 * This route updates the details of the user with the specified ID.
 *
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 */
router.put("/details", async (req, res) => {
  const userId = req.id;

  const updateData = req.body; // Assuming you send the updated user data in the request body
  updateUserValidator.validate(req.body);

  try {
    // Find the user by ID and update the data.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // This option returns the updated user object
    );

    if (!updatedUser) {
      // Return a 404 error if the user is not found.
			return res.status(404).json(generateResponseMessage("error", 'User not found' ));
    }

    // Return the updated user details.
    res.json(generateResponseMessage(
      "success",
      "updatedUser"
		));
  } catch (error) {
    // Log the error and return a 500 error.
		logger.error(error)
    console.error("Error:", error.message);
		res.status(500).json(generateResponseMessage( "error",  'Internal Server Error' ));
  }
});



router.post("/userdetail/upload-image",checkJwtForUserImage,upload.single("image"),checkImage,async (req, res) => {
  try {
    const id = req.id;
    const imageUrl =   req.file.filename;
    // Update the User document with the new image URL
    const updatedUser = await User.findOneAndUpdate(
      { _id: id }, // Query condition to find the User by ID
      { pic: imageUrl }, // Update object with the new image URL
      { new: true } // Return the updated user object
    );
    if (!updatedUser) {
      return res.status(404).json(generateResponseMessage("error", "User not found"));
    }
    // Handle the successful update if needed
    // Additional logic can be added here to handle any further actions
    // required after successfully updating the user.
    // Send the success response with the image URL
    res.json({
      status: "success",
      message: "Image uploaded and user updated successfully.",
      imageUrl: imageUrl,
    });
  } catch (err) {
		logger.error(err)
    // Catch any errors that occurred during the upload
    // In case of an error, log the error and return a 500 Internal Server Error response.
    console.error("Error uploading image:", err.message);
    res.status(500).json(generateResponseMessage("error", "Internal Server Error"));
  }
});



module.exports = router;




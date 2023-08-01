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

const User = require("../../db/models/user/model");
const {
  USERROLE_CODES,
  USERSTATUS_CODES,
} = require("../../db/models/user/model");

const { generateResponseMessage } = require("../../helpers/response");

const updateUserValidator = require("./validators");

const { checkJwt } = require("../../helpers/jwt");

const logger = require("../../helpers/logger");

/**
 * This router uses the `checkJwt` middleware to ensure that all requests are authenticated.
 */
router.use(checkJwt);
const { checkJwtForUserImage } = require("../../helpers/jwtForUserImageUpload");
const checkImage = require("../../helpers/imageValidator");
const upload = require("../../helpers/imageStorage");
/**   gets the details of the user
 * This route gets the details of the user with the specified ID.
 *
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 */
router.get("/details", async (req, res) => {
  const userId = req.id;

  try {
    // Find the user by ID.
    const users = await User.findById(userId);

    if (!users) {
      // Return a 404 error if the user is not found.
      return res
        .status(404)
        .json(generateResponseMessage("error", "User not found"));
    }

    // Return the user details.
    res.json(generateResponseMessage("success", users));
  } catch (error) {
    // Log the error and return a 500 error.
    logger.error(error);
    console.error("Error:", error.message);
    res
      .status(500)
      .json(generateResponseMessage("error", "Internal Server Error"));
  }
});

/**   updates the details of the user
 * This route updates the details of the user with the specified ID.
 *
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 */
router.put("/details", async (req, res) => {
  const userId = req.id;
 updateUserValidator.validate(req.body);
  const updateData = req.body; // Assuming you send the updated user data in the request body
 

  try {
    // Find the user by ID and update the data.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // This option returns the updated user object
    );

    if (!updatedUser) {
      // Return a 404 error if the user is not found.
      return res
        .status(404)
        .json(generateResponseMessage("error", "User not found"));
    }

    // Return the updated user details.
    res.json(generateResponseMessage("success", "updatedUser"));
  } catch (error) {
    // Log the error and return a 500 error.
    logger.error(error);
    console.error("Error:", error.message);
    res
      .status(500)
      .json(generateResponseMessage("error", "Internal Server Error"));
  }
});

/**  post request to update image

This route uploads an image for the user and updates the user document with the new image URL.

@param {Request} req The request object.

@param {Response} res The response object.
*/
router.post(
  "/userdetail/upload-image",
  checkJwtForUserImage,
  upload.single("image"),
  checkImage,
  async (req, res) => {
    try {
      const id = req.id;
      const imageUrl = req.file.filename;

      // Update the User document with the new image URL
      const updatedUser = await User.findOneAndUpdate(
        { _id: id }, // Query condition to find the User by ID
        { pic: imageUrl }, // Update object with the new image URL
        { new: true } // Return the updated user object
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json(generateResponseMessage("error", "User not found"));
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
      logger.error(err);
      // Catch any errors that occurred during the upload
      // In case of an error, log the error and return a 500 Internal Server Error response.
      console.error("Error uploading image:", err.message);
      res
        .status(500)
        .json(generateResponseMessage("error", "Internal Server Error"));
    }
  }
);

/**This route updates the award with the specified ID for the user.
@param {Request} req The request object.
@param {Response} res The response object. 
*/ 
router.put(
  "/awards/:id",
  async (req, res) => {
    const awardId = req.params.id;
//		updateUserValidator.validate(req.body);
    const { name, date, institution, description } = req.body;
		
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.id,
        {
          $set: {
            "awards.$[award].name": name,
            "awards.[award].date": date,
            "awards.[award].institution": institution,
            "awards.$[award].description": description,
          },
        },
        {
          new: true,
          arrayFilters: [{ "award._id": awardId }],
        }
      );

      if (!updatedUser)
        return res
          .status(404)
          .json(generateResponseMessage("error", "User not found"));
      res.json(
        generateResponseMessage(
          "success",
          "Award updated successfully",
          updatedUser
        )
      );
    } catch (error) {
      console.error("Error:", error.message);
      res
        .status(500)
        .json(generateResponseMessage("error", "Internal Server Error"));
    }
  }
);



router.put("/education/:id", async (req, res) => {
  const educationId = req.params.id;
  const { institution, degree, duration, location, gpa, fieldOfStudy } = req.body;
//	const { error } = updateUserValidator.validate(userData);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.id,
      {
        $set: {
          "education.$[edu].institution": institution,
          "education.$[edu].degree": degree,
          "education.$[edu].duration": duration,
          "education.$[edu].location": location,
          "education.$[edu].gpa": gpa,
          "education.$[edu].fieldOfStudy": fieldOfStudy,
        },
      },
      {
        new: true,
        arrayFilters: [{ "edu._id": educationId }],
      }
    );

    if (!updatedUser) return res.status(404).json(generateResponseMessage("error", "User not found"));
    res.json(generateResponseMessage("success", "Education entry updated successfully", updatedUser));
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json(generateResponseMessage("error", "Internal Server Error"));
  }
});

// Route for updating experience
router.put('/update-experience/:id', async (req, res) => {
  const userId = req.params.id;
  const experienceData = req.body;

  try {
    // Validate the request body using the updateExperienceValidator
    const { error } = updateExperienceValidator.validate(experienceData);
    if (error) {
      // If validation fails, return the error message
      return res.status(400).json({ error: error.details[0].message });
    }

    // Update the user's experience
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: { experience: experienceData } }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Route for updating projects
router.put('/update-projects/:id', async (req, res) => {
  const userId = req.params.id;
  const projectsData = req.body;

  try {
    // Validate the request body using the updateProjectsValidator
    const { error } = updateProjectsValidator.validate(projectsData);
    if (error) {
      // If validation fails, return the error message
      return res.status(400).json({ error: error.details[0].message });
    }

    // Update the user's projects
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: { projects: projectsData } }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


module.exports = router;

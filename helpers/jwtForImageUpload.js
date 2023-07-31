
const jwt = require('jsonwebtoken');
const { generateResponseMessage } = require("./response");
const logger = require("./logger");
const { USERROLE_CODES } = require("../db/models/user/model");
const { Course, COURSESTATUS_CODES,MANAGERROLE_CODES
 } = require("../db/models/course/model"); // Import the Course model

const sizeOf = require('image-size');
const fs = require('fs');
const mime = require('mime');
//const { generateResponseMessage } = require('./response');


const maxSizeInBytes = 1024 * 1024; // 1 MB
const minAspectRatio = 1;
const maxAspectRatio = 16 / 9;


/**
 * Express middleware that checks for the validity of a JWT token and returns the user role.
 *
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 * @param {Function} next The next middleware function in the chain.
 *
 * @throws {Error} If the JWT token is missing or invalid
 */
const checkJwtForImage = async (req, res, next) => {
  // Get the JWT token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Unauthorized, invalid auth token.' });
  }
  const token = authHeader.slice(7);

  try {
    // Verify the JWT token
    const tokenDecoded = jwt.verify(token, process.env.SECRET_KEY);
    req.id = tokenDecoded.id;
    req.role = tokenDecoded.role;
		// Extracting the role from the request
    const id = req.id;
	//	const filePath = req.file.path;
	const cid = req.params.id;
    const existingCourse = await Course.findById(cid);
    if (!existingCourse) {
      return res.status(404).json(generateResponseMessage("error", "Course not found"));
    }
    if (existingCourse.status === COURSESTATUS_CODES.ARCHIVED) {
      return res.status(409).json(generateResponseMessage("error", "Course is archived and cannot be updated."));
    }
    const isCoordinator = existingCourse.managers.some(
      (manager) => manager.managerId.toString() === id && manager.role === MANAGERROLE_CODES.COORDINATOR
    );

    if (!isCoordinator && role !== USERROLE_CODES.SUPERADMIN) {
      // User is not a SUPERADMIN or a coordinator manager, they are not allowed to make changes
      return res.status(403).json(generateResponseMessage("error", "Not allowed for this role."));
    }

		
    // If everything is valid, proceed to the next middleware or route handler
    return next();
  } catch (err) {
    console.error(err);
    logger.error(err);
    return res.status(401).json(generateResponseMessage("error", err));
  }
};

module.exports = { checkJwtForImage };

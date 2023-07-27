// External Imports
const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const checkImage = require("../../helpers/imageValidator");

// Create an instance of Express Router
const router = express.Router();

// Middleware to check for valid JWT token in header (authorization)
// This middleware, checkJwt, is responsible for validating the JWT token
// included in the request header. It is used to authenticate and authorize
// the user making the request. If the token is valid and not expired, the
// request proceeds to the next middleware or route handler. If the token
// is invalid or expired, it returns a 401 Unauthorized response.
router.use(checkJwt);

// Modify the Multer storage configuration to use memoryStorage
// The multer middleware is used for handling file uploads. In this code,
// we configure the storage option to use the "diskStorage" mode, where
// uploaded files are saved to the 'public/uploads/' directory with a
// unique filename generated using the UUIDv4 library and the original file
// extension. The uploaded files will be temporarily stored on the disk
// before being processed further.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueFilename = uuidv4() + ext;
    cb(null, uniqueFilename);
  }
});

// Create an instance of multer using the configured storage
const upload = multer({ storage });

// Database Models
// Importing database models related to courses and users for database operations
const {
  Course,
  MANAGERROLE_CODES,
  COURSESTATUS_CODES,
  REGISTRATIONSTATUS_CODES,
} = require("../../db/models/course/model");

const { User } = require("../../db/models/user/model");
const { USERROLE_CODES } = require("../../db/models/user/model");

// Validators
// Importing validator functions to validate incoming data
const {
  createCourseValidator,
  createMaterialValidator,
} = require("./validators");

// Helpers
// Importing various helper functions for JWT verification and response generation
const { checkJwt } = require("../../helpers/jwt");
const { generateResponseMessage } = require("../../helpers/response");

// Logger
// Importing a helper function for logging errors and other messages
const logger = require("../../helpers/logger");

// Middleware to check image size, aspect ratio, and type
// Importing a custom middleware, checkImage, which is responsible for checking
// the size, aspect ratio, and type of the uploaded image. This middleware is used
// to ensure that the uploaded image meets the specified requirements. If the image
// fails any of the checks, an error response is returned, and the uploaded file
// is deleted.

/** Route to upload an image and store its url in course and image inn public folder
 * @swagger
 * /upload-image/{id}:
 *   post:
 *     summary: Upload an image for a course.
 *     description: Uploads an image for a course and associates it with the specified course ID. Only SUPERADMIN users can perform this action.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the course to associate with the uploaded image.
 *         schema:
 *           type: string
 *       - in: formData
 *         name: image
 *         required: true
 *         description: The image file to upload.
 *         type: file
 *     responses:
 *       200:
 *         description: Successful response with the URL of the uploaded image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: string
 *                   format: uri
 *                   example: /uploads/image-file.jpg
 *       400:
 *         description: Bad request due to missing image or image size/aspect ratio/type validation failure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No image uploaded or validation error message.
 *       403:
 *         description: Forbidden error when the user role is not SUPERADMIN.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Not allowed for this role.
 *       404:
 *         description: Course not found error when the specified course ID is invalid or not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course not found.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error.
 */
router.post("/upload-image/:id", upload.single("image"), checkImage ,async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.role; // You need to extract the role from the request

    // Check if role is valid (only SUPERADMIN can create a course)
    if (role !== USERROLE_CODES.SUPERADMIN) {
      return res
        .status(403)
        .json(generateResponseMessage("error", "Not allowed for this role."));
    }

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      res.json(generateResponseMessage("success", imageUrl ));

      // Update the course document with the new image URL
      const updatedCourse = await Course.findOneAndUpdate(
        { _id: id }, // Query condition to find the course by ID
        { pic: imageUrl }, // Update object with the new image URL
        { new: true } // Return the updated course object
      );

      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Handle the successful update if needed
    } else {
      // No image was uploaded
      res.status(400).json({ message: "No image uploaded" });
    }
  } catch (err) {
    logger.error(err);
    // Handle any errors that occurred during the upload
    console.error("Error uploading image:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/** Route to create a new course, allowed only by the SUPERADMINS.
 * @swagger
 * /course:
 *   post:
 *     summary: Allow a SUPERADMIN to create a course.
 *     tags:
 *       - course
 *     description: Protected route for SUPERADMIN user. Creates a new Course available for public viewing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 required: true
 *                 example: Aspire JavaScript Course - Beginner
 *               description:
 *                 type: string
 *                 required: true
 *                 example: A beginner level introduction to JavaScript from Aspire.
 *               subtitle:
 *                 type: string
 *                 required: true
 *                 example: Learn Practical JS, Quick and Easy!
 *               tags:
 *                 schema:
 *                   type: array
 *                   items:
 *                     type: string
 *                 required: true
 *                 example: ["JavaScript", "Beginner", "Slow Paced"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation. Returns the created course data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       500:
 *         description: Internal Server Error or Validation Error or Database Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Internal Server Error or Validation Error or Database Error.
 *       403:
 *         description: Forbidden. The user does not have the required role for creating a course.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Not allowed for this role.
 */
router.post("/", async (req, res) => {
  try {
    // Decode the JWT token to get the user information
    const role = req.role;
    const id = req.id;
    const { title, subtitle, description, tags } = req.body;

    // Check if role is valid (only SUPERADMIN can create a course)
    if (role !== USERROLE_CODES.SUPERADMIN) {
      return res
        .status(403)
        .json(generateResponseMessage("error", "Not allowed for this role."));
    }

    // Validate the request body
    createCourseValidator.validate(req.body);
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
      return res
        .status(400)
        .json(
          generateResponseMessage("error", "Tags must be an array of strings.")
        );
    }
    // Create a new Course with the data
    const newCourseObject = {
      title,
      subtitle,
      description,
      tags,
      createdBy: id,
      managers: [{ managerId: id, role: MANAGERROLE_CODES.COORDINATOR }],
    };

    const newCourse = new Course(newCourseObject);
    await newCourse.save();

    // Convert the Mongoose document to a plain JavaScript object
    const newCourseData = newCourse.toObject();

    res.status(200).json(generateResponseMessage("success", newCourseData));
  } catch (err) {
    logger.error(err);

    // Handle different types of errors and return appropriate response messages
    if (err instanceof jwt.JsonWebTokenError) {
      // JWT token error
      return res
        .status(401)
        .json(generateResponseMessage("error", "Invalid token"));
    } else if (err instanceof jwt.TokenExpiredError) {
      // JWT token expired error
      return res
        .status(401)
        .json(generateResponseMessage("error", "Token expired"));
    } else if (err.name === "ValidationError") {
      // Validation error in the request body
      return res
        .status(500)
        .json(generateResponseMessage("error", "Validation Error"));
    } else {
      // Other internal server errors
      logger.error(err);
      return res
        .status(500)
        .json(generateResponseMessage("error", "Internal Server Error"));
    }
  }
});

/** get all detail courses for admin and necessary details for user
 * @swagger
 * /course/all:
 *   get:
 *     summary: Get all courses.
 *     tags:
 *       - course
 *     description: Retrieve a list of all courses available in the system.
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     responses:
 *       200:
 *         description: Successful operation. Returns an array of course objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'   # Reference the "Course" schema here
 *       204:
 *         description: No courses found. The request was successful, but there are no courses available.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No courses found
 *       400:
 *         description: Bad Request. Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request parameters
 *       401:
 *         description: Unauthorized. Missing auth token or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Unauthorized, missing or invalid auth token
 *       403:
 *         description: Forbidden. Invalid user role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Forbidden, invalid user role
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error.
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *         registrations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               feedback:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.get("/all", async (req, res) => {
  try {
    // Decode the JWT token to get the user information

    const userId = req.id;
    const userRole = req.role; // Assuming the role is specified in the token

    if (!userId || userRole.length == 0) {
      return res
        .status(400)
        .json(
          generateResponseMessage("error", "User ID or Role not found in token")
        );
    }

    if (userRole === USERROLE_CODES.SUPERADMIN) {
      // If the user is an admin, fetch all courses with full details
      const courses = await Course.find().populate("createdByDetails"); // Populate createdByDetails
      return res.status(200).json(generateResponseMessage("success", courses));
    } else if (userRole === USERROLE_CODES.REGULAR) {
      // If the user is a student, fetch only necessary details for each course
      const courses = await Course.find({ status: 1 })
        .select(
          "-status -registrations.state -registrations.requestedAt -registrations._id -managers -material -rating -tags -creationDate -__v "
        )
        .populate(
          "createdBy",
          "-password -firstname -lastname -phone -college -interests -status -role -createdAt -__v"
        )
        .populate({
          path: "registrations",
          match: { state: 1 }, // Only include registrations with state === 1
        }); // Populate createdByDetails

      return res.status(200).json(generateResponseMessage("success", courses));
    } else {
      return res
        .status(403)
        .json(generateResponseMessage("error", "Forbidden, invalid user role"));
    }
  } catch (err) {
    logger.error(err);
    console.error("Error fetching courses:", err);
    return res
      .status(500)
      .json(generateResponseMessage("error", "Internal Server Error"));
  }
});

/** route for pending request
 * @swagger
 * /course/pending-requests:
 *   get:
 *     summary: Get all pending registration requests for superadmin.
 *     description: Retrieve a list of pending registration requests accessible to a superadmin.
 *     tags: [Pending Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of pending registration requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseWithRegistrations'
 *       204:
 *         description: No pending registration requests found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No pending registration requests
 *       401:
 *         description: Unauthorized, missing or invalid auth token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Unauthorized, missing or invalid auth token.
 *       403:
 *         description: Forbidden, invalid user role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Forbidden, invalid user role.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Internal Server Error.
 */
router.get("/admin/pending", async (req, res) => {
  try {
    const userRole = req.role;

    if (userRole !== USERROLE_CODES.SUPERADMIN) {
      return res.status(403).json({
        error: true,
        message: "Forbidden, invalid user role",
      });
    }

    const pendingRequests = await Course.find({
      "registrations.state": 0,
    }).populate("registrations.user", "firstname lastname");

    if (pendingRequests.length === 0) {
      return res
        .status(204)
        .json(generateResponseMessage("success", "No pending registration requests"));
    }

    return res.status(200).json(generateResponseMessage("success", pendingRequests));
  } catch (err) {
    logger.error(err);
    console.error("Error fetching pending registration requests:", err);
    return res.status(500).json(generateResponseMessage("error", "Internal Server Error"));
  }
});

/** get detail of a specific course
 * @swagger
 * /course/{id}:
 *   get:
 *     summary: Get course details by ID.
 *     tags:
 *       - course
 *     description: Retrieve the details of a specific course using its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the course to fetch.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     responses:
 *       200:
 *         description: Successful operation. Returns the course details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'   # Reference the "Course" schema here
 *       404:
 *         description: Not Found. The requested course does not exist in the system.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Course Not Found
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error.
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *         registrations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               feedback:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.get("/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Course Not Found"));
    }

    // Return the course details
    res.status(200).json(generateResponseMessage("success", course));
  } catch (err) {
    logger.error(err);
    console.error("Error fetching course details:", err);
    res
      .status(500)
      .json(generateResponseMessage("error", "Internal Server Error"));
  }
});

/** update a specific course
 * @swagger
 * /courses/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []   # Token-based authentication using JWT (Bearer token)
 *     summary: Update a course by ID
 *     description: Update a course's details by providing its ID.
 *     tags:
 *       - course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *               material:
 *                 type: string
 *               managers:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: number
 *                 enum: [0, 1, 2, 3]
 *             example:
 *               title: Updated Course Title
 *               subtitle: Updated Course Subtitle
 *               description: Updated course description.
 *               material: Updated course material link.
 *               managers: ['Manager1', 'Manager2']
 *               status: 1
 *     responses:
 *       200:
 *         description: Successful update. Returns the updated course data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Course'  # Define Course schema in components section
 *       400:
 *         description: Bad Request. Invalid course status transition or validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Invalid course status transition.
 *       403:
 *         description: Unauthorized access. Only admin users are allowed to update courses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Unauthorized access. Only admin users are allowed to update courses.
 *       404:
 *         description: Course not found. The specified course ID does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Course not found.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Error updating course.
 */
router.put("/:id", async (req, res) => {
  try {
    const userRole = req.role;
    const courseId = req.params.id;
    const { title, subtitle, description, material, managers, status } = req.body;

    // Check if the user is an admin using the authentication token
    if (userRole === USERROLE_CODES.SUPERADMIN) {
      // User is an admin, proceed with update
      // Validate the request body
      createCourseValidator.validate(req.body);

      // Fetch the existing course to get the current status
      const existingCourse = await Course.findById(courseId);
      if (!existingCourse) {
        return res.status(404).json(generateResponseMessage("error", "Course not found"));
      }

      // Check if the provided status is a valid transition from the current status
      const validTransitions = {
        [COURSESTATUS_CODES.DRAFT]: [COURSESTATUS_CODES.PUBLISHED],  // 0->1
        [COURSESTATUS_CODES.DRAFT]: [COURSESTATUS_CODES.FINISHED],   // 0->2
        [COURSESTATUS_CODES.DRAFT]: [COURSESTATUS_CODES.ARCHIVED],   // 0->3
        [COURSESTATUS_CODES.PUBLISHED]: [COURSESTATUS_CODES.FINISHED],  //1->2
        [COURSESTATUS_CODES.PUBLISHED]: [COURSESTATUS_CODES.ARCHIVED],  //1->3
			  [COURSESTATUS_CODES.FINISHED]: [COURSESTATUS_CODES.ARCHIVED],  //2->3
        [COURSESTATUS_CODES.ARCHIVED]: [COURSESTATUS_CODES.DRAFT],  //3->0
      };

      if (!validTransitions[existingCourse.status].includes(status)) {
        return res.status(400).json(generateResponseMessage("error", "Invalid course status transition"));
      }

      const updatedFields = {
        title,
        subtitle,
        description,
        material,
        status,
      };

      // Check if the request includes managers to add
      if (managers && Array.isArray(managers) && managers.length > 0) {
        // Add the new managers to the course
        if (!updatedFields.managers) {
          updatedFields.managers = [];
        }

        updatedFields.managers.push(...managers);
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: updatedFields },
        { new: true }
      );

      if (updatedCourse) {
        return res.status(200).json(generateResponseMessage("success", updatedCourse));
      } else {
        return res.status(404).json(generateResponseMessage("error", "Course not found"));
      }
    } else {
      // User is not an admin, handle accordingly (you can customize this part based on your application's logic)
      return res.status(403).json(generateResponseMessage("error", "Unauthorized access. Only admin users are allowed to update courses."));
    }
  } catch (error) {
		logger.error(error)
    console.error("Error updating course:", error);
    return res.status(500).json(generateResponseMessage("error", "Error updating course"));
  }
});
 
//  CRUD FOR MATERIAL

/** create materail for a course
 * @swagger
 * /course/{courseId}/material:
 *   post:
 *     summary: Add a new material to a course.
 *     tags:
 *       - material
 *     description: Add a new material to a course using the course ID.
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID of the course to which the material should be added.
 *         schema:
 *           type: string
 *       - in: body
 *         name: material
 *         required: true
 *         description: Material object to be added to the course.
 *         schema:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: URL of the material.
 *             description:
 *               type: string
 *               description: Description of the material.
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL of the material.
 *               description:
 *                 type: string
 *                 description: Description of the material.
 *     responses:
 *       201:
 *         description: Successful operation. Material added to the course successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Material added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Material'   # Reference the "Material" schema here
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error creating material.
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *         addedBy:
 *           type: string
 *         description:
 *           type: string
 */
router.post("/:courseId/material", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const addedBy = req.id;
    const { url, description } = req.body;

    createMaterialValidator.validate(req.body);
    // Create a new material object
    const newMaterial = { url, addedBy, description };

    // Find the course by ID
    const course = await Course.findById(courseId);

    // Add the new material to the course's material array
    course.material.push(newMaterial);

    // Save the updated course
    await course.save();

    return res
      .status(201)
      .json(
        generateResponseMessage(
          "success: Material added successfully",
          newMaterial
        )
      );
  } catch (error) {
    logger.error(error);
    console.error("Error creating material:", error);
    return res
      .status(500)
      .json(generateResponseMessage("error", "Error creating material"));
  }
});

/**  read all the materials in a course
 * @swagger
 * /course/{courseId}/material:
 *   get:
 *     summary: Get materials for a specific course.
 *     tags:
 *       - material
 *     description: Retrieve the materials available for a specific course using the course ID.
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID of the course for which materials should be fetched.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     responses:
 *       200:
 *         description: Successful operation. Returns an array of material objects for the course.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'   # Reference the "Material" schema here
 *       404:
 *         description: Not Found. The specified course was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course not found
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching materials.
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *         addedBy:
 *           type: string
 *         description:
 *           type: string
 */
router.get("/:courseId/material", async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Find the course by ID and project only the material field
    const course = await Course.findById(courseId).select("material");

    if (!course) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Course not found"));
    }

    return res
      .status(200)
      .json(generateResponseMessage("success", course.material));
  } catch (error) {
    logger.error(error);
    console.error("Error fetching materials:", error);
    return res
      .status(500)
      .json(generateResponseMessage("error", "Error fetching materials"));
  }
});

/** update materail for a course
 * @swagger
 * /course/{courseId}/material/{materialId}:
 *   put:
 *     summary: Update material details for a course.
 *     tags:
 *       - material
 *     description: Update the details of a material associated with a specific course using the course ID and material ID.
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID of the course to which the material belongs.
 *         schema:
 *           type: string
 *       - in: path
 *         name: materialId
 *         required: true
 *         description: ID of the material to be updated.
 *         schema:
 *           type: string
 *       - in: body
 *         name: material
 *         required: true
 *         description: Updated material object with new details.
 *         schema:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: Updated URL of the material.
 *             description:
 *               type: string
 *               description: Updated description of the material.
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Updated URL of the material.
 *               description:
 *                 type: string
 *                 description: Updated description of the material.
 *     responses:
 *       200:
 *         description: Successful operation. Material details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Material updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Material'   # Reference the "Material" schema here
 *       404:
 *         description: Not Found. The specified course or material was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Material not found
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating material.
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *         addedBy:
 *           type: string
 *         description:
 *           type: string
 */
router.put("/:courseId/material/:materialId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const materialId = req.params.materialId;
    const addedBy = req.id;
    const { url, description } = req.body;

    createMaterialValidator.validate(req.body);
    // Find the course by ID
    const course = await Course.findById(courseId);

    // Find the index of the material in the material array
    const materialIndex = course.material.findIndex((material) =>
      material._id.equals(materialId)
    );

    if (materialIndex === -1) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Material not found"));
    }

    // Update the material fields
    course.material[materialIndex].url = url;
    course.material[materialIndex].addedBy = addedBy;
    course.material[materialIndex].description = description;

    // Save the updated course
    await course.save();

    return res
      .status(200)
      .json(
        generateResponseMessage(
          "success: Material updated successfully",
          course.material[materialIndex]
        )
      );
  } catch (error) {
    logger.error(error);
    console.error("Error updating material:", error);
    return res
      .status(500)
      .json(generateResponseMessage("error", "Error updating material"));
  }
});

/** delete material for a course
 * @swagger
 * /course/{courseId}/material/{materialId}:
 *   delete:
 *     summary: Delete material from a course.
 *     tags:
 *       - material
 *     description: Delete a material associated with a specific course using the course ID and material ID.
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID of the course from which the material will be deleted.
 *         schema:
 *           type: string
 *       - in: path
 *         name: materialId
 *         required: true
 *         description: ID of the material to be deleted.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     responses:
 *       200:
 *         description: Successful operation. Material deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Material deleted successfully
 *       404:
 *         description: Not Found. The specified course or material was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Material not found
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error deleting material.
 */
router.delete("/:courseId/material/:materialId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const materialId = req.params.materialId;

    // Find the course by ID
    const course = await Course.findById(courseId);

    // Find the index of the material in the material array
    const materialIndex = course.material.findIndex((material) =>
      material._id.equals(materialId)
    );

    if (materialIndex === -1) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Material not found"));
    }

    // Remove the material from the material array
    course.material.splice(materialIndex, 1);

    // Save the updated course
    await course.save();

    return res
      .status(200)
      .json(
        generateResponseMessage("success", "Material deleted successfully")
      );
  } catch (error) {
    logger.error(error);
    console.error("Error deleting material:", error);
    return res
      .status(500)
      .json(generateResponseMessage("error", "Error deleting material"));
  }
});

// STUDENT OPERATOINS

/** enroll a student in a course
 * @swagger
 * /course/enroll/{id}:
 *   post:
 *     summary: Enroll a student in a course.
 *     tags:
 *       - course
 *     description: Enroll a student in a course using the course ID. Only students are allowed to enroll.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the course in which the student should be enrolled.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     responses:
 *       200:
 *         description: Successful operation. Returns the updated course data after enrollment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'   # Reference the "Course" schema here
 *       400:
 *         description: Bad Request. Invalid request parameters or student is already enrolled in the course.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User is already enrolled in the course.
 *       403:
 *         description: Forbidden. Only students are allowed to enroll in the course.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Only students are allowed to enroll in the course.
 *       404:
 *         description: Not Found. The requested course does not exist in the system.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Course not found
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student enrollment failed.
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *         registrations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               feedback:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post("/enroll/:id", async (req, res) => {
  try {
    const courseId = req.params.id;

    const role = req.role;
    const id = req.id;

    // Check if the user role is valid and is allowed to enroll in the course
    if (role !== USERROLE_CODES.REGULAR) {
      return res
        .status(403)
        .json(
          generateResponseMessage(
            "error",
            "Only students are allowed to enroll in the course."
          )
        );
    }

    // Find the course by its ID
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Course not found"));
    }

    // Check if the user is already enrolled in the course
    const isEnrolled = course.registrations.some(
      (registration) => registration.user.toString() === id.toString()
    );

    if (isEnrolled) {
      return res
        .status(400)
        .json(
          generateResponseMessage(
            "error",
            "User is already enrolled in the course."
          )
        );
    }

    // Create a new registration object for the student
    const newRegistration = {
      user: id,
      state: REGISTRATIONSTATUS_CODES.REQUESTED, // You can set the initial state to REQUESTED or ACCEPTED based on your use case
      requestedAt: new Date(),
    };

    // Add the registration to the course's registrations array
    course.registrations.push(newRegistration);

    // Save the updated course with the new registration
    await course.save();

    // Return the updated course data as a response
    res.status(200).json(generateResponseMessage("success", course));
  } catch (error) {
    logger.error(error);
    // Handle errors during the enrollment process
    console.error("Error enrolling student:", error);
    res
      .status(500)
      .json(generateResponseMessage("error", "Student enrollment failed"));
  }
});

/** unenroll a student from a course
 * @swagger
 * /course/unenroll/{id}:
 *   post:
 *     summary: Unenroll a student from a course.
 *     tags:
 *       - course
 *     description: Unenroll a student from a course using the student's user ID and the course ID.
 *     security:
 *       - bearerAuth: []    # Apply the "bearerAuth" security scheme to this endpoint
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to unenroll from.
 *     responses:
 *       200:
 *         description: Successful operation. Returns the updated course object after unenrollment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'   # Reference the "Course" schema here
 *       400:
 *         description: Bad Request. User is not enrolled in the course or invalid course ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User is not enrolled in the course.
 *       404:
 *         description: Not Found. Course with the specified ID not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course not found.
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student unenrollment failed.
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *         registrations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               state:
 *                 type: number
 *               requestedAt:
 *                 type: string
 */
router.post("/unenroll/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.id;

    // Find the course by its ID
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json(generateResponseMessage("error", "Course not found"));
    }

    // Check if the user is enrolled in the course
    const enrollmentIndex = course.registrations.findIndex(
      (registration) => registration.user.toString() === userId.toString()
    );

    if (enrollmentIndex === -1) {
      return res
        .status(400)
        .json(
          generateResponseMessage(
            "error",
            "User is not enrolled in the course."
          )
        );
    }

    // Remove the enrollment from the course's registrations array
    course.registrations.splice(enrollmentIndex, 1);

    // Save the updated course without the unenrolled student
    await course.save();

    // Return the updated course data as a response
    res.status(200).json(generateResponseMessage("success", course));
  } catch (error) {
    logger.error(error);
    // Handle errors during the unenrollment process
    console.error("Error unenrolling student:", error);
    res
      .status(500)
      .json(generateResponseMessage("error", "Student unenrollment failed"));
  }
});

/** for student to get list of enrolled courses
 * @swagger
 * /student/enrolled-courses:
 *   get:
 *     summary: Get the list of enrolled courses for the current user
 *     description: Retrieve the list of courses that the current user is enrolled in.
 *     tags: [Student]
 *     responses:
 *       '200':
 *         description: Successful response with the list of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       '400':
 *         description: User ID not found in token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *     security:
 *       - bearerAuth: []
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         rating:
 *           $ref: '#/components/schemas/Rating'
 *         registrations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Registration'
 *     Rating:
 *       type: object
 *       properties:
 *         upvotes:
 *           type: array
 *           items:
 *             type: string
 *         downvotes:
 *           type: array
 *           items:
 *             type: string
 *     Registration:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *         state:
 *           type: integer
 */
router.get("/student/enrolled-courses", async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) {
      return res.status(400).json(generateResponseMessage( "error","User ID not found in token" ));
    }
    
    // Get the list of registered courses for the user with the given userId
    const registeredCourses = await Course.find({ "registrations.user": userId }, {
      title: 1,
      subtitle: 1,
      description: 1,
      rating: 1,
      "registrations.user": 1,
      "registrations.state": 1
    });

    // Return the list of registered courses
    res.status(200).json(generateResponseMessage("success",registeredCourses));
  } catch (err) {
		logger.error(err)
    console.error("Error fetching registered courses:", err);
    res.status(500).json(generateResponseMessage( "error","Internal Server Error" ));
  }
});



// router.get("/trending", async (req, res) => {
//     //not required to be logged in
//     // const userId = req.userId // from the middleware checkJWT
//     try{
//         const trendingCourses = await Course.find().projection({
//             courseName:1,
//             instructorName:1,
//             duration:1,
//             price:1,
//             rating:1,
//             image:1,
//         }).sort({rating: -1}).limit(6)
//         res.status(200).json(trendingCourses)
//     }
//     catch(err){
//         res.status(500).json({msg: err.message})
//     }

// })

module.exports = router;

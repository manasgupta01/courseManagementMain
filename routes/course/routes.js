// External Import
const express = require("express");

const jwt = require("jsonwebtoken");
// Database
const {
  Course,
  FEEDBACKTYPE_CODES,
  REGISTRATIONSTATUS_CODES,
  MANAGERROLE_CODES,
} = require("../../db/models/course/model");

// Validators
const { createCourseValidator } = require("./validators");

// Helpers
// const checkUserRole = require('../../helpers/db').checkUserRole
const { checkJwt } = require("../../helpers/jwt");
const { generateResponseMessage } = require("../../helpers/response");

// Logger
const logger = require("../../helpers/logger");
const { USERROLE_CODES } = require("../../db/models/user/model");

// Instantiating the router object
const router = express.Router();

// Middleware to check for valid JWT token in header (authorization)
//router.use(checkJwt)

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
 *         description: List of followers queries and returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: success or error
 *                   example: success
 *                 data:
 *                   type: string
 *                   description: confirmation message in case of "status" success
 *                   example: { status: "success" }
 *                   required: false
 *       500:
 *         description: Server error in contacting database
 *       204:
 *         description: Same as 200 but no data returned
 */
router.post("/", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json(
        generateResponseMessage("error", "Unauthorized, missing auth token.")
      );
  }

  try {
    // Decode the JWT token to get the user information
    const decodedToken = jwt.verify(token, "aspireinfoz");
    console.log("Decoded Token:", decodedToken);
    const { role, id } = decodedToken;
    const { title, subtitle, description, tags } = req.body;

    // Check if role is valid (only SUPERADMIN can create a course)
    if (role !== USERROLE_CODES.SUPERADMIN) {
      return res
        .status(403)
        .json(generateResponseMessage("error", "Not allowed for this role."));
    }

    // Validate the request body
    createCourseValidator.validate(req.body);

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
    res.status(500).json(generateResponseMessage("error", err));
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the course.
 *         subtitle:
 *           type: string
 *           description: The subtitle of the course.
 *         description:
 *           type: string
 *           description: The description of the course.
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the course.
 *       required:
 *         - title
 *         - description
 *         - subtitle
 *         - tags
 */

/**
 * @swagger
 * /course/all:
 *   get:
 *     summary: Get all courses.
 *     description: Retrieve a list of all courses available in the system.
 *     responses:
 *       200:
 *         description: Successful operation. Returns an array of course objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
router.get("/all", async (req, res) => {
  try {
    // Fetch all courses from the database
    const courses = await Course.find();

    // Return the courses as a JSON response
    res.status(200).json(courses);
  } catch (err) {
    // If an error occurs, handle it gracefully
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /course/details/{id}:
 *   get:
 *     summary: Get course details by ID.
 *     tags:
 *       - course
 *     description: Retrieve the details of a course by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to retrieve.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation. Returns the details of the course.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized. The request lacks valid authentication credentials.
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
 *                   example: Unauthorized, missing auth token.
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
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
 *                   example: Internal Server Error.
 */
router.get("/details/:id", async (req, res) => {
  // console.log("Route reached");
  const authHeader = req.headers["authorization"];
  //console.log(authHeader);
  const token = authHeader && authHeader.split(" ")[1];
 // console.log(token);
  if (!token) {
    return res
      .status(401)
      .json(
        generateResponseMessage("error", "Unauthorized, missing auth token.")
      );
   }

  // const userId = req.userId // from the middleware checkJWT
  // const userExists = await isUserActive(userId)
  // // only permanent users can access the courses
  // if (userExists !== 1){
  //     const outputString =  "The user's account is " +
  //         (userExists == -1) ? "throwing a db error" :
  //         (userExists == -2) ? "not a valid id" :
  //         (userExists == 0) ? "not found with this id" :
  //         (userExists == 2) ? "is only temporarily registered" :
  //         (userExists == 3) ? "is banned" : `!! returning ${userExists}`
  //     res.status(403).json(generateResponseMessage("error", outputString))
  // }
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw Error("Course not found");
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ msg: err.message });
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

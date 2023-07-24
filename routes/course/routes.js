// External Import
const express = require("express");
const jwt = require("jsonwebtoken");
// Database
const {
  Course,
  MANAGERROLE_CODES,
	 REGISTRATIONSTATUS_CODES
} = require("../../db/models/course/model");

// Validators
const { createCourseValidator } = require("./validators");

// Helpers
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
    // Handle different types of errors and return appropriate response messages
    if (err instanceof jwt.JsonWebTokenError) {
      // JWT token error
      return res.status(401).json(generateResponseMessage("error", "Invalid token"));
    } else if (err instanceof jwt.TokenExpiredError) {
      // JWT token expired error
      return res.status(401).json(generateResponseMessage("error", "Token expired"));
    } else if (err.name === "ValidationError") {
      // Validation error in the request body
      return res.status(500).json(generateResponseMessage("error", "Validation Error"));
    } else {
      // Other internal server errors
      logger.error(err);
      return res.status(500).json(generateResponseMessage("error", "Internal Server Error"));
    }
  }
});
/**
 * @swagger
 * /course/all:
 *   get:
 *     summary: Get all courses.
 *     tags:
 *       - course
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
 *       204:
 *         description: No Content. There are no courses found in the system.
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
 */
router.get("/all", async (req, res) => {
  try {
    // Fetch all courses from the database
    const courses = await Course.find();

    // Check if any courses were found
    if (courses.length === 0) {
      return res.status(204).json({ message: "No courses found" });
    }

    // Return the courses as a JSON response
    res.status(200).json(courses);
  } catch (err) {
    // Handle different types of errors and return appropriate response messages
    if (err.name === "MongoError" && err.code === 18) {
      // Mongoose Validation Error
      return res.status(400).json({ message: "Invalid request parameters" });
    } else {
      // Other internal server errors
      console.error("Error fetching courses:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
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
 *       404:
 *         description: Not Found. The course with the specified ID was not found.
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
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Internal Server Error.
 */
router.get("/details/:id", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json(generateResponseMessage("error", "Unauthorized, missing auth token."));
  }

  try {
    // Decode the JWT token to get the user information
    const decodedToken = jwt.verify(token, "aspireinfoz");
    console.log("Decoded Token:", decodedToken);

    // Check if user exists and is active (example code commented out)
    // const userId = decodedToken.id;
    // const userExists = await isUserActive(userId);
    // // only permanent users can access the courses
    // if (userExists !== 1) {
    //     const outputString =  "The user's account is " +
    //         (userExists == -1) ? "throwing a db error" :
    //         (userExists == -2) ? "not a valid id" :
    //         (userExists == 0) ? "not found with this id" :
    //         (userExists == 2) ? "is only temporarily registered" :
    //         (userExists == 3) ? "is banned" : `!! returning ${userExists}`
    //     return res.status(403).json(generateResponseMessage("error", outputString));
    // }

    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Return the course details
    res.status(200).json(course);
  } catch (err) {
    console.error("Error fetching course details:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




/**
 * @swagger
 * /course/update/{id}:
 *   put:
 *     summary: Update course details by ID.
 *     description: Update the details of a course by its ID. This route is allowed only for SUPERADMIN users.
 *     tags:
 *      - course
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Aspire JavaScript Course - Intermediate
 *               subtitle:
 *                 type: string
 *                 example: Learn Advanced JS Concepts
 *               description:
 *                 type: string
 *                 example: An intermediate level course for mastering JavaScript.
 *               material:
 *                 type: string
 *                 example: Textbook, Online Resources, Exercises
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation. Returns the updated details of the course.
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
 *       403:
 *         description: Forbidden. The user does not have the required role for updating courses.
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
 *         description: Not Found. The course with the specified ID was not found.
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
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Error updating course.
 * 
 */
router.put("/update/:id", async (req, res) => {
  console.log("Route reached");
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

		const decodedToken = jwt.verify(token, "aspireinfoz");
    console.log("Decoded Token:", decodedToken);
    const { role } = decodedToken;

    // Check if role is valid (only SUPERADMIN can create a course)
    if (role !== USERROLE_CODES.SUPERADMIN) {
      return res
        .status(403)
        .json(generateResponseMessage("error", "Not allowed for this role."));
    }

    // Validate the request body
    createCourseValidator.validate(req.body);

    const courseId = req.params.id;
    const { title, subtitle, description, material } = req.body;
    console.log(courseId);

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId }, // Use "_id" to match the document by its ID
      { title },
      { subtitle },
      { description },
      { material },
      { new: true }
    );

    if (updatedCourse) {
      return res.status(200).json(updatedCourse);
    } else {
      return res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({ message: "Error updating course" });
  }
});


/**
 * @swagger
 * /course/enroll/{id}:
 *   post:
 *     summary: Enroll a student in a course.
 *     tags:
 *       - course
 *     description: Enroll a student in a specific course using the course ID. This route is protected and requires a valid JWT token with the role of a student.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to enroll the student in.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful enrollment. Returns the updated course data with the student's registration details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized. The request lacks valid authentication credentials (JWT token).
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
 *       403:
 *         description: Forbidden. The user does not have the required role for enrolling in a course.
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
 *                   example: Only students are allowed to enroll in the course.
 *       404:
 *         description: Not Found. The course with the specified ID was not found.
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
 *                   example: Course not found
 *       400:
 *         description: Bad Request. The user is already enrolled in the course.
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
 *                   example: User is already enrolled in the course.
 *       500:
 *         description: Internal Server Error. An error occurred while processing the enrollment request.
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
 *                   example: Student enrollment failed.
 *     components:
 *       schemas:
 *         Course:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             subtitle:
 *               type: string
 *             description:
 *               type: string
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *             pic:
 *               type: string
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *             createdBy:
 *               type: string
 *             creationDate:
 *               type: string
 *               format: date-time
 *             managers:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   managerId:
 *                     type: string
 *                   role:
 *                     type: integer
 *             material:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   addedBy:
 *                     type: string
 *                   addedOn:
 *                     type: string
 *                     format: date-time
 *                   description:
 *                     type: string
 *             registrations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   state:
 *                     type: integer
 *                   requestedAt:
 *                     type: string
 *                     format: date-time
 *                   acceptedAt:
 *                     type: string
 *                     format: date-time
 *                   rejectedAt:
 *                     type: string
 *                     format: date-time
 *                   discontinuedAt:
 *                     type: string
 *                     format: date-time
 *                   feedback:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: integer
 *                         details:
 *                           type: string
 *                         feedback:
 *                           type: string
 *                         createdBy:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         score:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 100
 *             rating:
 *               type: object
 *               properties:
 *                 upvotes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 downvotes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 score:
 *                   type: number
 *                   minimum: 0
 *             comments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   comment:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.post("/enroll/:id", checkJwt, async (req, res) => {
  try {
    const courseId = req.params.id;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json(generateResponseMessage("error", "Unauthorized, missing auth token."));
    }

    // Decode the JWT token to get the user information
    const decodedToken = jwt.verify(token, "aspireinfoz");
		console.log(decodedToken)
    const { role, id } = decodedToken;
		const k = USERROLE_CODES.REGULAR
    // Check if the user role is valid and is allowed to enroll in the course
    if (role !== k) {
      return res.status(403).json(generateResponseMessage("error", "Only students are allowed to enroll in the course."));
    }

    // Find the course by its ID
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json(generateResponseMessage("error", "Course not found"));
    }

    // Check if the user is already enrolled in the course
    const isEnrolled = course.registrations.some(registration => registration.user.toString() === id.toString());

    if (isEnrolled) {
      return res.status(400).json(generateResponseMessage("error", "User is already enrolled in the course."));
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
    // Handle errors during the enrollment process
    console.error("Error enrolling student:", error);
    res.status(500).json(generateResponseMessage("error", "Student enrollment failed"));
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

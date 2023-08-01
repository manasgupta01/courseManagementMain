const mongoose = require("mongoose")

const USERSTATUS_CODES = {
	TEMPORARY: 0,
	PERMANENT: 1,
	BANNED: -1
}

const USERROLE_CODES = {
	REGULAR: 0,
	SUPERADMIN: 1,
	MANAGER:2
}


// Define the education schema
const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  degree: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  duration: {
    type: String,
    required: true,
    match: /^[0-9]{4}-[0-9]{4}$/,
  },
  location: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  gpa: {
    type: Number,
    required: true,
    min: 0,
    max: 10.0,
  },
  fieldOfStudy: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
});

// Define the experience schema
const experienceSchema = new mongoose.Schema({
  working: { type: String, required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  duration: {
    type: String,
    required: true,
    match: /^[0-9]{4} - [0-9]{4}$/,
  },
});

// Define the project schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  entity: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  duration: {
    type: String,
    required: true,
		match: /^(0[1-9]|1[0-2])\/\d{4} - (0[1-9]|1[0-2])\/\d{4}$/,
  },
  about: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 1000,
  },
  role: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  technologiesUsed: {
    type: [String],
    required: true,
  },
  url: {
    type: String,
  },
});

// Define the awards schema
const awardsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  date: {
    type: String,
    required: true,
    match: /^(0[1-9]|1[0-2])\/\d{4}$/,
  },
  institution: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  description: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 1000,
  },
});


const userSchema = new mongoose.Schema({

	firstname: 	{ type: String, required: true },
	name: 	{ type: String, required: true },
	lastname: 	{ type: String, required: true },
	email: 			{ type: String, required: true, unique: true },
	password: 	{ type: String, required: true },
	phone: 			{ type: String, required: true },
	username: 	{ type: String, required: true, unique: true },
	college: 		{ type: String, required: true },
	profilepic:	{ type: String, unique: true, default: "" },

	interests: 	{ type: [String], required: true, default: [] },

	status: 		{ type: Number, required: true, default: USERSTATUS_CODES.TEMPORARY },
	role: 			{ type: Number, required: true, default: USERROLE_CODES.REGULAR },

	otp: 				{ type: String },
	resetOtp: 	{ type: String },

	createdAt: 	{ type: Date, required: true, default: Date.now },

// new updates for user info and profile

	address: { type: String },
	about: { type: String },
	education: [{ type: educationSchema }],
  //   institution: { type: String, required: true },
  //   degree: { type: String, required: true },
  //   duration: { type: String, required: true }, // e.g., '2015 - 2019'
  // }],
  experience: [{ type: experienceSchema }],
	// 	working: { type: String, required: true },
  //   company: { type: String, required: true },
  //   position: { type: String, required: true },
  //   duration: { type: String, required: true }, // e.g., '2020 - Present'
  // }],
  projects: [{ type: projectSchema }],
	// 	name: {type: String, required: true},
	// 	entity: {type: String, required: true},
	// 	duration: { type: String, required: true },
	// 	about: { type: String, required: true },
	// }],
  skills: [{ type: String }],
  awards: [{ type: awardsSchema }],
		// name: {type: String, required: true},
		// date: {type: String, required: true},
		// about: {type: String, required: true},
		// }],
  interests: [{ type: String }],


})

const User = mongoose.model("User", userSchema)

module.exports = User
module.exports.USERSTATUS_CODES = USERSTATUS_CODES
module.exports.USERROLE_CODES = USERROLE_CODES
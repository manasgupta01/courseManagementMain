const Joi = require('joi');

// Define the schema for first name
const firstnameSchema = Joi.string()
  .min(2)
  .max(30)
  .required()
  .regex(/^[a-zA-Z.'\s\d]+$/)
  .messages({
    'string.base': 'First name should be a string.',
    'string.empty': 'First name cannot be empty.',
    'string.min': 'First name should have a minimum length of 2 characters.',
    'string.max': 'First name should have a maximum length of 30 characters.',
    'string.pattern.base': 'First name should only contain alphabet characters, periods, apostrophes, and digits.',
  });

// Define the schema for last name
const lastnameSchema = Joi.string()
  .min(2)
  .max(30)
  .required()
  .regex(/^[a-zA-Z.'\s\d]+$/)
  .messages({
    'string.base': 'Last name should be a string.',
    'string.empty': 'Last name cannot be empty.',
    'string.min': 'Last name should have a minimum length of 2 characters.',
    'string.max': 'Last name should have a maximum length of 30 characters.',
    'string.pattern.base': 'Last name should only contain alphabet characters, periods, apostrophes, and digits.',
  });

// Define the schema for email
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.base': 'Email should be a string.',
    'any.required': 'Email is a mandatory field.',
    'string.email': 'Email must be a valid email address.',
  });

// Define the schema for phone number
const phoneSchema = Joi.string()
  .required()
  .regex(/^\d+$/)
  .min(10)
  .max(15)
  .messages({
    'string.base': 'Phone number should be a string.',
    'any.required': 'Phone number is a mandatory field.',
    'string.pattern.base': 'Phone number should contain only digits.',
    'string.min': 'Phone number should have a minimum length of 10 digits.',
    'string.max': 'Phone number should have a maximum length of 15 digits.',
  });

// Define the schema for college
const collegeSchema = Joi.string()
  .required()
  .min(2)
  .max(100)
  .regex(/^[a-zA-Z.'\s\d]+$/)
  .messages({
    'string.base': 'College should be a string.',
    'any.required': 'College is a mandatory field.',
    'string.min': 'College should have a minimum length of 2 characters.',
    'string.max': 'College should have a maximum length of 100 characters.',
    'string.pattern.base': 'College should only contain alphabet characters, periods, apostrophes, and digits.',
  });

// Define the schema for address
const addressSchema = Joi.string()
  .min(5)
  .max(200)
  .required()
  .messages({
    'string.base': 'Address should be a string.',
    'string.empty': 'Address cannot be empty.',
    'string.min': 'Address should have a minimum length of 5 characters.',
    'string.max': 'Address should have a maximum length of 200 characters.',
  });

// Define the schema for about
const aboutSchema = Joi.string()
  .min(10)
  .max(2000)
  .required()
  .messages({
    'string.base': 'About should be a string.',
    'string.empty': 'About cannot be empty.',
    'string.min': 'About should have a minimum length of 10 characters.',
    'string.max': 'About should have a maximum length of 2000 characters.',
  });

// Define the schema for education details
const educationDetailsSchema = Joi.object({
  institution: Joi.string().min(3).max(100).required(),
  degree: Joi.string().min(3).max(100).required(),
  duration: Joi.string().required().pattern(/^[0-9]{4} - [0-9]{4}$/),
  location: Joi.string().min(3).max(100).required(),
  gpa: Joi.number().min(0).max(10).required(),
  fieldOfStudy: Joi.string().min(3).max(100).required(),
});

// Define the schema for skills
const skillsSchema = Joi.array().items(Joi.string().required());

// Define the schema for awards
const awardsSchema = Joi.array().items(
  Joi.object({
    name: Joi.string().min(3).max(100).required(),
    date: Joi.string().required().pattern(/^(0[1-9]|1[0-2])\/\d{4}$/),
    description: Joi.string().min(3).max(1000).required(),
  })
);

// Define the schema for interests
const interestsSchema = Joi.array().items(Joi.string().required());

// Define the schema for the update user request
const updateUserValidator = Joi.object({
  firstname: firstnameSchema,
  lastname: lastnameSchema,
  email: emailSchema,
  phone: phoneSchema,
  college: collegeSchema,
  address: addressSchema,
  about: aboutSchema,
  education: Joi.array().items(educationDetailsSchema).required(),
  skills: skillsSchema,
  awards: awardsSchema,
  interests: interestsSchema,
});

module.exports = {
  updateUserValidator,
};

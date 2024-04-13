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
  degree: Joi.string().min(3).max(100),
	duration: Joi.string()
	.pattern(/^[0-9]{4}-[0-9]{4}$/)
	.custom((value, helpers) => {
		const [startYear, endYear] = value.split('-').map(Number);
		const currentYear = new Date().getFullYear();

		if (startYear < 1947 || startYear > currentYear + 5) {
			return helpers.error('any.invalid');
		}

		if (endYear < startYear || endYear > currentYear + 5) {
			return helpers.error('any.invalid');
		}

		return value;
	}, 'Custom validation for duration')
	.required(),
  location: Joi.string().min(3).max(100),
  grade: Joi.number().min(0).max(10),
  department: Joi.string().min(3).max(100),
});

// Define the schema for skills
const skillsSchema = Joi.array().items(Joi.string().required());

// Define the schema for awards
const awardsSchema = 
  Joi.object({
    name: Joi.string().min(3).max(100),
    date: Joi.string().pattern(/^(0[1-9]|1[0-2])\/\d{4}$/),
    description: Joi.string().min(3).max(1000),
  })

	const experienceValidationSchema = Joi.object({
		working: Joi.string(),
		company: Joi.string(),
		position: Joi.string().required(),
		duration: Joi.string().pattern(/^[0-9]{4} - [0-9]{4}$/),
	});


	const projectSchema = Joi.object({
		name: Joi.string().min(3).max(100).required(),
		entity: Joi.string().min(3).max(100).required(),
		duration: Joi.string().required().pattern(/^(0[1-9]|1[0-2])\/\d{4} - (0[1-9]|1[0-2])\/\d{4}$/),
		about: Joi.string().min(3).max(1000).required(),
		role: Joi.string().min(3).max(100).required(),
		technologiesUsed: Joi.array().items(Joi.string().required()).required(),
		url: Joi.string().allow('').optional(), // Optional field, allow empty string or absent
	});

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
  education: Joi.array().items(educationDetailsSchema),
  skills: skillsSchema,
  awards: Joi.array().items(awardsSchema),
  interests: interestsSchema,
	projets: Joi.array().items(projectSchema),
	experience: Joi.array().items(experienceValidationSchema),
});

ValidateAwareds = Joi.object({
	awards:awardsSchema,
})

module.exports = {
  updateUserValidator,
	awardsSchema,
	educationDetailsSchema,
	projectSchema,
	experienceValidationSchema
};

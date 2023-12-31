const Joi = require('joi')
const COURSESTATUS_CODES = require("../../db/models/course/model");
// Define the schema for name
const nameSchema = Joi.string()
	.min(2)
	.max(30)
	.required()
	.regex(/^[a-zA-Z.'\s\d]+$/)
	.messages({
		'string.base': 'Name should be a string.',
		'string.empty': 'Name cannot be empty.',
		'string.min': 'Name should have a minimum length of 2 characters.',
		'string.max': 'Name should have a maximum length of 30 characters.',
		'string.pattern.base': 'Name should only contain alphabet characters, periods and apostrophes and digits.'
	})

// Define the schema for subtitle
const subtitleSchema = Joi.string()
	.min(10)
	.max(200)
	.required()
	.regex(/^[a-zA-Z.'\s\d]+$/)
	.messages({
		'string.base': 'Subtitle should be a string.',
		'string.empty': 'Subtitle cannot be empty.',
		'string.min': 'Subtitle should have a minimum length of 10 characters.',
		'string.max': 'Subtitle should have a maximum length of 200 characters.',
		'string.pattern.base': 'Subtitle should only contain alphabet characters, periods, apostrophes and digits.'
	})

// Define the schema for subtitle
const descriptionSchema = Joi.string()
.min(10)
.max(2000)
.required()
.regex(/^[a-zA-Z.'\s\d]+$/)
.messages({
	'string.base': 'Description should be a string.',
	'string.empty': 'Description cannot be empty.',
	'string.min': 'Description should have a minimum length of 10 characters.',
	'string.max': 'Description should have a maximum length of 2000 characters.',
	'string.pattern.base': 'Description should only contain alphabet characters, periods, apostrophes and digits.'
})


const tagsSchema = Joi.array()
  .items(Joi.string().required().messages({
    'string.base': 'Each tag in the tags array must be a string',
    'any.required': 'Each tag in the tags array is required',
  }))
  .required()
  .messages({
    'object.required': 'Tags array is a mandatory field',
    'array.includesRequiredUnknowns': 'Each tag in the tags array must be a string',
  });

const createCourseValidator = Joi.object({
	name:					nameSchema,
	subtitle:			subtitleSchema,
	description:	descriptionSchema,
	tags:					tagsSchema,
	status: Joi.number()
})

// Export the schemas
// Define the schema for URL
const urlSchema = Joi.string()
	.uri()
	.required()
	.messages({
		'string.base': 'URL should be a string.',
		'any.required': 'URL is a mandatory field.',
		'string.uri': 'URL must be a valid URL.'
	});

// Define the schema for description
const createMaterialValidator = Joi.object({
	url: urlSchema,
	description: descriptionSchema
});

// Export the schemas
module.exports = {
	createCourseValidator,
	createMaterialValidator
};
const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  department: Joi.string().trim().allow("").max(100).required(),
});

const createEmployeeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("employee", "manager").required(),
  department: Joi.string().trim().allow("").max(100).optional(),
  managerId: Joi.string().hex().length(24).allow(null, "").optional(),
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  role: Joi.string().valid("employee", "manager").optional(),
  department: Joi.string().trim().allow("").max(100).optional(),
  managerId: Joi.string().hex().length(24).allow(null, "").optional(),
}).min(1);

module.exports = { updateProfileSchema, createEmployeeSchema, updateEmployeeSchema };

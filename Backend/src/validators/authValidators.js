const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("employee", "manager", "admin").optional(),
  department: Joi.string().allow("").max(100).optional(),
  managerId: Joi.string().hex().length(24).allow(null, "").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

module.exports = { signupSchema, loginSchema };

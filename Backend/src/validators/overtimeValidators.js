const Joi = require("joi");

const createOvertimeSchema = Joi.object({
  attendanceId: Joi.string().hex().length(24).required(),
  hours: Joi.number().positive().max(24).required(),
  reason: Joi.string().trim().min(3).max(300).required(),
});

const reviewOvertimeSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
});

module.exports = { createOvertimeSchema, reviewOvertimeSchema };

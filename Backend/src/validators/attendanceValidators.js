const Joi = require("joi");

const punchInSchema = Joi.object({
  selfieBase64: Joi.string().pattern(/^data:image\/(png|jpeg|jpg);base64,/).required(),
  latitude: Joi.number().min(-90).max(90).allow(null).required(),
  longitude: Joi.number().min(-180).max(180).allow(null).required(),
});

const attendanceQuerySchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: Joi.string().hex().length(24).optional(),
});

module.exports = { punchInSchema, attendanceQuerySchema };

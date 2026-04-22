const Joi = require("joi");

const reportQuerySchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: Joi.string().hex().length(24).optional(),
});

module.exports = { reportQuerySchema };

const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details.map((detail) => detail.message),
    });
  }

  req[source] = value;
  return next();
};

module.exports = { validate };

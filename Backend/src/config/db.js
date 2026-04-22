const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("MongoDB connected");
};

module.exports = connectDB;

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { morganStream } = require("./config/logger");
const { errorHandler, notFound } = require("./middlewares/error");

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const overtimeRoutes = require("./routes/overtimeRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: morganStream }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/overtime", overtimeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

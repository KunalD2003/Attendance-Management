const mongoose = require("mongoose");

const overtimeRequestSchema = new mongoose.Schema(
  {
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hours: { type: Number, required: true, min: 0.1 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OvertimeRequest", overtimeRequestSchema);

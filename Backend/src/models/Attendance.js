const mongoose = require("mongoose");

const punchSessionSchema = new mongoose.Schema(
  {
    punchInAt: { type: Date, required: true },
    punchOutAt: { type: Date, default: null },
    selfieUrl: { type: String, default: null },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    punchInAt: { type: Date, default: null },
    punchOutAt: { type: Date, default: null },
    selfieUrl: { type: String, default: null },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    hoursWorked: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    status: { type: String, enum: ["completed", "incomplete", "active"], default: "active" },
    overtimeStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    punchSessions: { type: [punchSessionSchema], default: [] },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

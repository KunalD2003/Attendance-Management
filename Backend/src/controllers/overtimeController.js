const Attendance = require("../models/Attendance");
const OvertimeRequest = require("../models/OvertimeRequest");
const User = require("../models/User");

const mapRequest = (request) => ({
  id: request._id,
  attendanceId: request.attendanceId?._id || request.attendanceId,
  userId: request.userId?._id || request.userId,
  userName: request.userId?.name || "Unknown",
  date: request.attendanceId?.date || "",
  hours: request.hours,
  reason: request.reason,
  status: request.status,
});

const requestOvertime = async (req, res) => {
  const { attendanceId, hours, reason } = req.body;
  if (!attendanceId || !hours || !reason) {
    return res.status(400).json({ message: "attendanceId, hours and reason are required" });
  }

  const attendance = await Attendance.findById(attendanceId);
  if (!attendance || attendance.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: "Attendance record not found" });
  }

  const existing = await OvertimeRequest.findOne({ attendanceId });
  if (existing) {
    return res.status(409).json({ message: "OT request already exists for this day" });
  }

  const request = await OvertimeRequest.create({
    attendanceId,
    userId: req.user._id,
    hours,
    reason,
  });

  attendance.overtimeStatus = "pending";
  await attendance.save();

  const populated = await request.populate([{ path: "attendanceId", select: "date" }, { path: "userId", select: "name" }]);
  return res.status(201).json({ request: mapRequest(populated) });
};

const listOvertimeRequests = async (req, res) => {
  const query = {};
  if (req.user.role === "employee") {
    query.userId = req.user._id;
  } else if (req.user.role === "manager") {
    const teamFilter = {
      _id: { $ne: req.user._id },
      $or: [{ managerId: req.user._id }],
    };
    if (req.user.department) {
      teamFilter.$or.push({ department: req.user.department, role: "employee" });
    }
    const team = await User.find(teamFilter).select("_id");
    query.userId = { $in: [req.user._id, ...team.map((u) => u._id)] };
  }

  const requests = await OvertimeRequest.find(query)
    .sort({ createdAt: -1 })
    .populate("attendanceId", "date")
    .populate("userId", "name");

  return res.json({ requests: requests.map(mapRequest) });
};

const reviewOvertimeRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }

  const request = await OvertimeRequest.findById(id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }
  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request already reviewed" });
  }

  request.status = status;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  await Attendance.findByIdAndUpdate(request.attendanceId, { overtimeStatus: status });
  const populated = await request.populate([{ path: "attendanceId", select: "date" }, { path: "userId", select: "name" }]);
  return res.json({ request: mapRequest(populated) });
};

module.exports = { requestOvertime, listOvertimeRequests, reviewOvertimeRequest };

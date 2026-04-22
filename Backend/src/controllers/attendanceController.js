const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { toDateKey, round2 } = require("../utils/time");
const { uploadSelfieFromBase64 } = require("../utils/upload");
const { distanceMeters, parseGeofenceConfig } = require("../utils/geo");

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

const deriveSummaryFromSessions = (attendance) => {
  const sessions = attendance.punchSessions || [];
  const firstSession = sessions[0] || null;
  const lastSession = sessions[sessions.length - 1] || null;

  attendance.punchInAt = firstSession?.punchInAt || null;
  attendance.punchOutAt = lastSession?.punchOutAt || null;
  attendance.selfieUrl = firstSession?.selfieUrl || null;
  attendance.location = firstSession?.location || { latitude: null, longitude: null };

  const totalHours = sessions.reduce((sum, session) => {
    if (!session.punchInAt || !session.punchOutAt) return sum;
    const sessionHours = (new Date(session.punchOutAt).getTime() - new Date(session.punchInAt).getTime()) / (1000 * 60 * 60);
    return sum + Math.max(0, sessionHours);
  }, 0);

  attendance.hoursWorked = round2(totalHours);
  attendance.overtimeHours = round2(Math.max(0, attendance.hoursWorked - 8));
  attendance.status =
    sessions.length > 0 && sessions.some((session) => !session.punchOutAt)
      ? "active"
      : attendance.hoursWorked >= 8
        ? "completed"
        : "incomplete";
};

const mapAttendance = (doc) => ({
  id: doc._id,
  userId: doc.userId?._id || doc.userId,
  userName: doc.userId?.name || "Unknown",
  date: doc.date,
  punchIn: formatTime(doc.punchInAt),
  punchOut: formatTime(doc.punchOutAt),
  selfieUrl: doc.selfieUrl,
  latitude: doc.location?.latitude ?? null,
  longitude: doc.location?.longitude ?? null,
  hoursWorked: doc.hoursWorked,
  status: doc.status,
  overtimeHours: doc.overtimeHours,
  overtimeStatus: doc.overtimeStatus,
  punchSessions: (doc.punchSessions || []).map((session) => ({
    id: session._id,
    punchIn: formatTime(session.punchInAt),
    punchOut: formatTime(session.punchOutAt),
    selfieUrl: session.selfieUrl || null,
    latitude: session.location?.latitude ?? null,
    longitude: session.location?.longitude ?? null,
  })),
});

const punchIn = async (req, res) => {
  const { selfieBase64, latitude, longitude } = req.body;
  if (!selfieBase64) {
    return res.status(400).json({ message: "Live selfie is required for punch in" });
  }
  const dateKey = toDateKey();

  const existing = await Attendance.findOne({ userId: req.user._id, date: dateKey });
  const activeSession = existing?.punchSessions?.find((session) => !session.punchOutAt);
  if (activeSession) {
    return res.status(400).json({ message: "Already punched in today" });
  }

  const geofence = parseGeofenceConfig();
  if (geofence.enabled) {
    if (!geofence.validConfig) {
      return res.status(500).json({ message: "Geofence is enabled but misconfigured on server" });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Location is required for geofenced punch in" });
    }
    const distance = distanceMeters(latitude, longitude, geofence.officeLatitude, geofence.officeLongitude);
    if (distance > geofence.radiusMeters) {
      return res.status(403).json({
        message: `Outside allowed geofence radius (${Math.round(distance)}m away, max ${geofence.radiusMeters}m)`,
      });
    }
  }

  const selfieUrl = await uploadSelfieFromBase64(selfieBase64);

  let attendance = existing;
  if (!attendance) {
    attendance = await Attendance.create({
      userId: req.user._id,
      date: dateKey,
      overtimeStatus: "none",
      punchSessions: [],
    });
  }

  attendance.punchSessions.push({
    punchInAt: new Date(),
    punchOutAt: null,
    selfieUrl,
    location: { latitude: latitude ?? null, longitude: longitude ?? null },
  });

  deriveSummaryFromSessions(attendance);
  await attendance.save();
  await attendance.populate("userId", "name");

  return res.status(201).json({ attendance: mapAttendance(attendance) });
};

const punchOut = async (req, res) => {
  const dateKey = toDateKey();
  const attendance = await Attendance.findOne({ userId: req.user._id, date: dateKey }).populate("userId", "name");
  if (!attendance || !attendance.punchSessions?.length) {
    return res.status(400).json({ message: "Punch in first" });
  }
  const activeSession = [...attendance.punchSessions].reverse().find((session) => !session.punchOutAt);
  if (!activeSession) {
    return res.status(400).json({ message: "No active punch-in session found" });
  }

  activeSession.punchOutAt = new Date();
  deriveSummaryFromSessions(attendance);
  await attendance.save();

  return res.json({ attendance: mapAttendance(attendance) });
};

const listAttendance = async (req, res) => {
  const { from, to, userId } = req.query;
  const query = {};

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

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
    const ids = [req.user._id.toString(), ...team.map((u) => u._id.toString())];

    if (userId) {
      if (ids.includes(String(userId))) {
        query.userId = userId;
      } else {
        query.userId = { $in: [] };
      }
    } else {
      query.userId = { $in: ids };
    }
  } else if (userId) {
    query.userId = userId;
  }

  const records = await Attendance.find(query).sort({ date: -1 }).populate("userId", "name");
  return res.json({ records: records.map(mapAttendance) });
};

const geofenceConfig = async (_req, res) => {
  const geofence = parseGeofenceConfig();
  return res.json({
    enabled: geofence.enabled,
    validConfig: geofence.validConfig,
    officeLatitude: geofence.officeLatitude,
    officeLongitude: geofence.officeLongitude,
    radiusMeters: geofence.radiusMeters,
  });
};

module.exports = { punchIn, punchOut, listAttendance, geofenceConfig };

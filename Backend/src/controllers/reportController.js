const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const buildQuery = async (req) => {
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
    const allowedIds = [req.user._id.toString(), ...team.map((u) => u._id.toString())];
    if (userId) {
      query.userId = allowedIds.includes(String(userId)) ? userId : { $in: [] };
    } else {
      query.userId = { $in: allowedIds };
    }
  } else if (userId) {
    query.userId = userId;
  }
  return query;
};

const mapRows = (records) =>
  records.map((record) => ({
    Name: record.userId?.name || "",
    Date: record.date,
    PunchIn: record.punchInAt ? new Date(record.punchInAt).toLocaleTimeString() : "",
    PunchOut: record.punchOutAt ? new Date(record.punchOutAt).toLocaleTimeString() : "",
    HoursWorked: record.hoursWorked,
    Status: record.status,
    SelfieUrl: record.selfieUrl || "",
    Location: record.location?.latitude ? `${record.location.latitude}, ${record.location.longitude}` : "",
  }));

const exportExcel = async (req, res) => {
  const query = await buildQuery(req);
  const records = await Attendance.find(query).sort({ date: -1 }).populate("userId", "name");
  const rows = mapRows(records);

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, sheet, "Attendance");
  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.xlsx");
  return res.send(excelBuffer);
};

const exportPdf = async (req, res) => {
  const query = await buildQuery(req);
  const records = await Attendance.find(query).sort({ date: -1 }).populate("userId", "name");
  const rows = mapRows(records);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.pdf");

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  doc.pipe(res);

  doc.fontSize(16).text("Attendance Report", { underline: true });
  doc.moveDown();

  rows.forEach((row, index) => {
    doc.fontSize(10).text(
      `${index + 1}. ${row.Name} | ${row.Date} | In: ${row.PunchIn || "-"} | Out: ${row.PunchOut || "-"} | Hours: ${row.HoursWorked} | ${row.Status}`
    );
    doc.fontSize(9).text(`   Selfie: ${row.SelfieUrl || "-"} | Location: ${row.Location || "-"}`);
    doc.moveDown(0.4);
  });

  doc.end();
};

module.exports = { exportExcel, exportPdf };

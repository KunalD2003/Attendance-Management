const express = require("express");
const { punchIn, punchOut, listAttendance, geofenceConfig } = require("../controllers/attendanceController");
const { protect } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { punchInSchema, attendanceQuerySchema } = require("../validators/attendanceValidators");

const router = express.Router();

router.use(protect);
router.get("/geofence", geofenceConfig);
router.get("/", validate(attendanceQuerySchema, "query"), listAttendance);
router.post("/punch-in", validate(punchInSchema), punchIn);
router.post("/punch-out", punchOut);

module.exports = router;

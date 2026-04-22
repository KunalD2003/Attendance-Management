const express = require("express");
const { exportExcel, exportPdf } = require("../controllers/reportController");
const { protect } = require("../middlewares/auth");
const { allowRoles } = require("../middlewares/role");
const { validate } = require("../middlewares/validate");
const { reportQuerySchema } = require("../validators/reportValidators");

const router = express.Router();

router.use(protect);
router.get("/excel", allowRoles("manager", "admin", "employee"), validate(reportQuerySchema, "query"), exportExcel);
router.get("/pdf", allowRoles("manager", "admin", "employee"), validate(reportQuerySchema, "query"), exportPdf);

module.exports = router;

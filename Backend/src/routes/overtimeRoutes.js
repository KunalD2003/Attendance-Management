const express = require("express");
const { requestOvertime, listOvertimeRequests, reviewOvertimeRequest } = require("../controllers/overtimeController");
const { protect } = require("../middlewares/auth");
const { allowRoles } = require("../middlewares/role");
const { validate } = require("../middlewares/validate");
const { createOvertimeSchema, reviewOvertimeSchema } = require("../validators/overtimeValidators");

const router = express.Router();

router.use(protect);
router.get("/", listOvertimeRequests);
router.post("/", allowRoles("employee"), validate(createOvertimeSchema), requestOvertime);
router.patch("/:id/review", allowRoles("manager", "admin"), validate(reviewOvertimeSchema), reviewOvertimeRequest);

module.exports = router;

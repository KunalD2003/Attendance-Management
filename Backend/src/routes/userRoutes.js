const express = require("express");
const { listUsers, updateMyProfile, createEmployee, updateEmployee, deleteEmployeeSafely } = require("../controllers/userController");
const { protect } = require("../middlewares/auth");
const { allowRoles } = require("../middlewares/role");
const { validate } = require("../middlewares/validate");
const { updateProfileSchema, createEmployeeSchema, updateEmployeeSchema } = require("../validators/userValidators");

const router = express.Router();

router.use(protect);
router.patch("/me", validate(updateProfileSchema), updateMyProfile);
router.get("/", allowRoles("admin"), listUsers);
router.post("/employees", allowRoles("admin"), validate(createEmployeeSchema), createEmployee);
router.patch("/employees/:id", allowRoles("admin"), validate(updateEmployeeSchema), updateEmployee);
router.delete("/employees/:id", allowRoles("admin"), deleteEmployeeSafely);

module.exports = router;

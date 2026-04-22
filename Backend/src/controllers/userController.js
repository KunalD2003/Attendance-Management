const User = require("../models/User");

const sanitizeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  managerId: u.managerId,
});

const listUsers = async (_req, res) => {
  const users = await User.find({ isActive: { $ne: false } }).select("-password").sort({ createdAt: -1 });
  const data = users.map(sanitizeUser);
  return res.json({ users: data });
};

const updateMyProfile = async (req, res) => {
  const { name, department } = req.body;
  const user = await User.findById(req.user._id);
  if (!user || user.isActive === false) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = name;
  user.department = department;
  await user.save();
  return res.json({ user: sanitizeUser(user) });
};

const createEmployee = async (req, res) => {
  const { name, email, password, role, department, managerId } = req.body;
  const existing = await User.findOne({ email });
  if (existing && existing.isActive !== false) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    department: department || "",
    role,
    managerId: role === "employee" ? managerId || null : null,
    isActive: true,
    deletedAt: null,
  });

  return res.status(201).json({ user: sanitizeUser(user) });
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user || user.isActive === false) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.role === "admin") {
    return res.status(400).json({ message: "Admin records cannot be edited here" });
  }

  const { name, role, department, managerId } = req.body;
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (managerId !== undefined || role !== undefined) {
    user.managerId = (role ?? user.role) === "employee" ? managerId || null : null;
  }

  await user.save();
  return res.json({ user: sanitizeUser(user) });
};

const deleteEmployeeSafely = async (req, res) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  const user = await User.findById(id);
  if (!user || user.isActive === false) {
    return res.status(404).json({ message: "Employee not found" });
  }
  if (user.role !== "employee") {
    return res.status(400).json({ message: "Only employee accounts can be deleted here" });
  }

  user.isActive = false;
  user.deletedAt = new Date();
  user.email = `${user.email}__deleted_${Date.now()}`;
  await user.save();

  return res.json({ message: "Employee deleted safely" });
};

module.exports = { listUsers, updateMyProfile, createEmployee, updateEmployee, deleteEmployeeSafely };

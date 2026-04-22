const User = require("../models/User");
const { signToken } = require("../utils/token");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  avatar: user.avatar,
});

const signup = async (req, res) => {
  const { name, email, password, role, department, managerId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "employee",
    department: department || "",
    managerId: managerId || null,
  });

  const token = signToken(user._id);
  return res.status(201).json({ token, user: sanitizeUser(user) });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id);
  return res.json({ token, user: sanitizeUser(user) });
};

const me = async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
};

module.exports = { signup, login, me };

require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const seed = async () => {
  await connectDB();

  const users = [
    { name: "Admin User", email: "admin@demo.com", password: "password", role: "admin", department: "Operations" },
    { name: "Manager User", email: "mgr@demo.com", password: "password", role: "manager", department: "Engineering" },
    { name: "Employee User", email: "emp@demo.com", password: "password", role: "employee", department: "Engineering" },
  ];

  for (const userData of users) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      // eslint-disable-next-line no-await-in-loop
      await User.create(userData);
      console.log(`Created ${userData.role}: ${userData.email}`);
    }
  }
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

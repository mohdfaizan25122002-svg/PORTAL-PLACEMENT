const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Student } = require("../models/Student");

const router = express.Router();

// Register User + Profile
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, name, batch } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role });

    if (role === "student") {
      await Student.create({
        userId: user._id,
        name: name || email.split("@")[0],
        batch: batch || "Batch 2025-A",
        targetRole: "Full Stack Engineer",
        description: "Enthusiastic candidate focused on software engineering and web development.",
        skills: [
          { name: "JavaScript", proficiency: 75 },
          { name: "HTML & CSS", proficiency: 80 },
          { name: "Problem Solving", proficiency: 78 }
        ],
      });
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" },
    );

    res.json({ token, role: user.role, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

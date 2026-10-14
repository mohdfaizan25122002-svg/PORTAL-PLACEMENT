const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const { Student } = require("./models/Student");
const { Assessment } = require("./models/Assessment");
const { Job } = require("./models/Job");
const { Application } = require("./models/Application");

const seedDB = async () => {
  try {
    // Check if data already seeded
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("Database already contains data. Skipping initial seed.");
      return;
    }

    console.log("Seeding demo database...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Create Student User 1 (Demo Student)
    const studentUser1 = await User.create({
      email: "student@demo.com",
      password: hashedPassword,
      role: "student",
    });

    const studentProfile1 = await Student.create({
      userId: studentUser1._id,
      name: "Alex Johnson",
      batch: "Batch 2025-A",
      skills: [
        { name: "React.js", proficiency: 88 },
        { name: "Node.js & Express", proficiency: 82 },
        { name: "Python", proficiency: 90 },
        { name: "PostgreSQL & SQL", proficiency: 75 },
        { name: "Data Structures & Algo", proficiency: 85 },
      ],
      isPlaced: false,
    });

    // 2. Create Student User 2 (Placed Student)
    const studentUser2 = await User.create({
      email: "sarah@demo.com",
      password: hashedPassword,
      role: "student",
    });

    const studentProfile2 = await Student.create({
      userId: studentUser2._id,
      name: "Sarah Miller",
      batch: "Batch 2025-A",
      skills: [
        { name: "Java & Spring Boot", proficiency: 92 },
        { name: "Microservices", proficiency: 85 },
        { name: "AWS & DevOps", proficiency: 80 },
      ],
      isPlaced: true,
    });

    // 3. Create Student User 3 (Batch B)
    const studentUser3 = await User.create({
      email: "david@demo.com",
      password: hashedPassword,
      role: "student",
    });

    const studentProfile3 = await Student.create({
      userId: studentUser3._id,
      name: "David Chen",
      batch: "Batch 2025-B",
      skills: [
        { name: "JavaScript", proficiency: 70 },
        { name: "HTML/CSS", proficiency: 85 },
      ],
      isPlaced: false,
    });

    // 4. Create Admin / Trainer User
    await User.create({
      email: "admin@demo.com",
      password: hashedPassword,
      role: "admin",
    });

    await User.create({
      email: "trainer@demo.com",
      password: hashedPassword,
      role: "trainer",
    });

    // 5. Create Jobs
    const job1 = await Job.create({
      company: "Google",
      role: "Frontend Software Engineer",
      requiredSkills: ["React.js", "TypeScript", "CSS Layouts", "System Design"],
      type: "Job",
    });

    const job2 = await Job.create({
      company: "Microsoft",
      role: "Cloud Backend Engineer",
      requiredSkills: ["Node.js", "Distributed Systems", "SQL"],
      type: "Job",
    });

    const job3 = await Job.create({
      company: "Amazon",
      role: "SDE Intern",
      requiredSkills: ["Java", "Data Structures", "Problem Solving"],
      type: "Internship",
    });

    const job4 = await Job.create({
      company: "Meta",
      role: "Full Stack Engineer",
      requiredSkills: ["React.js", "GraphQL", "Python", "Node.js"],
      type: "Job",
    });

    // 6. Create Assessments
    await Assessment.create({
      studentId: studentProfile1._id,
      testName: "Full Stack & Web Architecture Diagnostic",
      score: 85,
      topSkills: ["React.js", "Node.js"],
      skillGaps: ["System Design", "Docker", "GraphQL"],
    });

    await Assessment.create({
      studentId: studentProfile1._id,
      testName: "Data Structures & Algorithms Mock Test",
      score: 88,
      topSkills: ["Python", "Data Structures"],
      skillGaps: ["Dynamic Programming", "Graph Algorithms"],
    });

    await Assessment.create({
      studentId: studentProfile1._id,
      testName: "Database Systems & Performance",
      score: 78,
      topSkills: ["PostgreSQL & SQL"],
      skillGaps: ["Redis Caching", "Database Indexing", "System Design"],
    });

    await Assessment.create({
      studentId: studentProfile2._id,
      testName: "Backend Engineering Mock Assessment",
      score: 94,
      topSkills: ["Java & Spring Boot", "Microservices"],
      skillGaps: ["Kubernetes"],
    });

    await Assessment.create({
      studentId: studentProfile3._id,
      testName: "Frontend Fundamentals Assessment",
      score: 72,
      topSkills: ["HTML/CSS"],
      skillGaps: ["React State Management", "TypeScript", "System Design"],
    });

    // 7. Create Applications
    await Application.create({
      studentId: studentProfile1._id,
      jobId: job1._id,
      status: "Interviewing",
    });

    await Application.create({
      studentId: studentProfile1._id,
      jobId: job2._id,
      status: "Applied",
    });

    await Application.create({
      studentId: studentProfile1._id,
      jobId: job3._id,
      status: "Offered",
    });

    await Application.create({
      studentId: studentProfile2._id,
      jobId: job2._id,
      status: "Offered",
    });

    await Application.create({
      studentId: studentProfile3._id,
      jobId: job4._id,
      status: "Applied",
    });

    console.log("Demo Database successfully seeded!");
    console.log("Demo Credentials:");
    console.log(" - Student: student@demo.com / password123");
    console.log(" - Admin:   admin@demo.com   / password123");
    console.log(" - Trainer: trainer@demo.com / password123");
  } catch (err) {
    console.error("Error seeding database:", err.message);
  }
};

module.exports = seedDB;

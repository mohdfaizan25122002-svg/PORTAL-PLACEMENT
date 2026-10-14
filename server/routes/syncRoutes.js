const express = require("express");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { Student } = require("../models/Schemas");
const { getSheetsClient } = require("../config/googleSheets");

const router = express.Router();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build a single student's row for the "Student Input" sheet
// ─────────────────────────────────────────────────────────────────────────────
function buildStudentRow(student, readinessScore = 0) {
  const skillsStr = (student.skills || [])
    .map((s) => `${s.name}(${s.proficiency}%)`)
    .join(", ");

  return [
    student.name || "",
    student.batch || "",
    student.targetRole || "",
    student.description || "",
    skillsStr,
    String(readinessScore),
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Calculate readiness score (mirrors apiRoutes.js logic)
// ─────────────────────────────────────────────────────────────────────────────
function calcReadiness(assessments, skills) {
  const avgScore = assessments.length
    ? assessments.reduce((acc, c) => acc + c.score, 0) / assessments.length
    : 0;
  return Math.min(Math.round(avgScore * 0.6 + skills.length * 8), 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH: Send ONE student's data to the "Student Input" Google Sheet tab
// Called automatically by apiRoutes.js after profile/assessment/apply actions
// ─────────────────────────────────────────────────────────────────────────────
async function pushStudentToSheets(student, assessments = []) {
  if (!SHEET_ID) {
    console.warn("[Sheets] GOOGLE_SHEET_ID not set — skipping push.");
    return;
  }
  try {
    const sheets = await getSheetsClient();
    const readinessScore = calcReadiness(assessments, student.skills || []);
    const newRow = buildStudentRow(student, readinessScore);

    // Check if a row for this student already exists (search column A for name)
    const readResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Student Input!A:A",
    });
    const rows = readResp.data.values || [];
    const existingRowIndex = rows.findIndex((r) => r[0] === student.name);

    if (existingRowIndex === -1) {
      // Student not found → append a new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Student Input!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });
      console.log(`[Sheets] ✅ Appended new row for: ${student.name}`);
    } else {
      // Student found → update in-place (row index is 1-based, +1 for header)
      const rowNumber = existingRowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Student Input!A${rowNumber}:G${rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });
      console.log(`[Sheets] ✅ Updated row ${rowNumber} for: ${student.name}`);
    }
  } catch (err) {
    console.error("[Sheets] ❌ Push failed:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/sync/push-to-sheets  (Admin or logged-in student)
// Manually trigger a push for the current logged-in student
// ─────────────────────────────────────────────────────────────────────────────
router.post("/push-to-sheets", verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student)
      return res.status(404).json({ error: "Student record not found" });

    await pushStudentToSheets(student);
    res.json({ message: `✅ ${student.name}'s data pushed to Google Sheets!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/sync/push-all  (Admin only)
// Push ALL students to the Google Sheet at once
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/push-all",
  verifyToken,
  authorizeRoles("admin", "trainer"),
  async (req, res) => {
    try {
      const students = await Student.find();
      for (const student of students) {
        await pushStudentToSheets(student);
      }
      res.json({
        message: `✅ All ${students.length} students pushed to Google Sheets!`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/sync/pull-da-results  (Admin or student)
// Reads the "DA Output" sheet tab and saves results into MongoDB Student records
//
// Expected "DA Output" sheet columns (row 1 = header, row 2+ = data):
//   A: Student Name
//   B: Readiness Analysis (text)
//   C: Recommended Courses (comma-separated)
//   D: Predicted Placement Chance (number, e.g. 78)
//   E: Key Strengths (comma-separated)
//   F: Areas to Improve (comma-separated)
//   G: DA Comment (free text)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/pull-da-results", verifyToken, async (req, res) => {
  if (!SHEET_ID) {
    return res
      .status(500)
      .json({ error: "GOOGLE_SHEET_ID not configured in .env" });
  }
  try {
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "DA Output!A2:G1000", // skip header row
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json({
        message: "DA Output sheet is empty — no results to pull.",
        updated: 0,
      });
    }

    let updatedCount = 0;
    const skipped = [];

    for (const row of rows) {
      const [
        studentName = "",
        readinessAnalysis = "",
        coursesRaw = "",
        placementChanceRaw = "",
        strengthsRaw = "",
        improvementsRaw = "",
        daComment = "",
      ] = row;

      if (!studentName.trim()) continue;

      // Find student by name (case-insensitive)
      const student = await Student.findOne({
        name: { $regex: new RegExp(`^${studentName.trim()}$`, "i") },
      });

      if (!student) {
        skipped.push(studentName);
        continue;
      }

      student.daInsights = {
        readinessAnalysis: readinessAnalysis.trim(),
        recommendedCourses: coursesRaw
          ? coursesRaw.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        predictedPlacementChance: Number(placementChanceRaw) || 0,
        keyStrengths: strengthsRaw
          ? strengthsRaw.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        areasToImprove: improvementsRaw
          ? improvementsRaw.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        daComment: daComment.trim(),
        lastSyncedAt: new Date(),
      };

      await student.save();
      updatedCount++;
    }

    res.json({
      message: `✅ DA results synced! ${updatedCount} student(s) updated in MongoDB.`,
      updated: updatedCount,
      skipped,
    });
  } catch (err) {
    console.error("[Sheets] ❌ Pull failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Export both the router and the helper function so apiRoutes.js can call it
module.exports = { syncRouter: router, pushStudentToSheets };

const mongoose = require("mongoose");

// Mock-test / Assessment Records Schema
const assessmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  testName: { type: String, required: true },
  score: { type: Number, required: true }, // Out of 100
  topSkills: [String],
  skillGaps: [String]
}, { timestamps: true });

module.exports = {
  Assessment: mongoose.model("Assessment", assessmentSchema)
};
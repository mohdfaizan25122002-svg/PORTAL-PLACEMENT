const mongoose = require("mongoose");

// Student & Skill Profile Schema
const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    batch: { type: String, required: true },
    skills: [{ name: String, proficiency: Number }], // e.g. [{ name: "React", proficiency: 85 }]
    description: { type: String, default: "" },
    targetRole: { type: String, default: "Full Stack Engineer" },
    targetSkills: [{ type: String }],
    isPlaced: { type: Boolean, default: false },
    // DA Analysis results — populated by pulling from the "DA Output" Google Sheet
    daInsights: {
      readinessAnalysis: { type: String, default: "" },
      recommendedCourses: [{ type: String }],
      predictedPlacementChance: { type: Number, default: 0 },
      keyStrengths: [{ type: String }],
      areasToImprove: [{ type: String }],
      daComment: { type: String, default: "" },
      lastSyncedAt: { type: Date },
    },
  },
  { timestamps: true },
);
module.exports = {
  Student: mongoose.model('Student', studentSchema)
}
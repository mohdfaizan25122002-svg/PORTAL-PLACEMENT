const mongoose = require("mongoose");


// Job & Internship Listings Schema[cite: 1]
const jobSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  requiredSkills: [String],
  type: { type: String, enum: ['Job', 'Internship'], default: 'Job' }
}, { timestamps: true });


module.exports = {
  Job: mongoose.model("Job", jobSchema),
};
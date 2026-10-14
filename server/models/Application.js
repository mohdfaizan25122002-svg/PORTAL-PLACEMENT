const mongoose = require("mongoose");


// Application Tracking Schema[cite: 1]
const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['Applied', 'Interviewing', 'Offered', 'Rejected'], default: 'Applied' }
}, { timestamps: true });


module.exports = {
  Application: mongoose.model("Application", applicationSchema)
};
const mongoose = require("mongoose");
const seedDB = require("../seed");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/placement_db";
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedDB();
    return conn;
  } catch (err) {
    console.warn(`Primary MongoDB connection failed (${err.message}). Initializing In-Memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected at ${mongoUri}`);
      await seedDB();
      return conn;
    } catch (memErr) {
      console.error(`MongoDB Memory Server initialization failed: ${memErr.message}`);
      console.log("Starting server without active DB connection. DB operations will require MongoDB.");
    }
  }
};

module.exports = connectDB;

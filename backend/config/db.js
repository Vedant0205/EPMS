const mongoose = require('mongoose');

let mongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/epms';
  try {
    console.log(`[Database] Attempting connection to MongoDB: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    mongoConnected = true;
    console.log('✅ [Database] MongoDB Connected Successfully');
  } catch (err) {
    mongoConnected = false;
    console.warn('⚠️  [Database] MongoDB is not currently running or unreachable on port 27017.');
    console.log('💡 [Database] Activating High-Performance Persistent JSON Storage Engine (Data will persist safely in /backend/data)');
  }
};

const isConnected = () => mongoConnected;

module.exports = { connectDB, isConnected };

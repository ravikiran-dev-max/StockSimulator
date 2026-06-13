import mongoose from 'mongoose';
import dns from 'dns';

// Force DNS resolution to prefer IPv4 (fixes MongoDB Atlas connection issues on some networks)
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5-second timeout for server selection
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed: ${error.message}`);
    console.log('Falling back to local MongoDB at mongodb://127.0.0.1:27017/Stocksimulator ...');
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/Stocksimulator', {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`Connected to fallback local MongoDB: ${localConn.connection.host}`);
    } catch (localError) {
      console.error(`Fallback local MongoDB connection also failed: ${localError.message}`);
      console.log('💡 DIAGNOSTIC TIP: Please check if your current IP address is added to the "IP Access List" under "Network Access" in your MongoDB Atlas Panel, or ensure a local MongoDB service is running.');
      process.exit(1);
    }
  }
};

export default connectDB;

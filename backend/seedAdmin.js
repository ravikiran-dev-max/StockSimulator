import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

// Force DNS resolution to prefer IPv4 (fixes MongoDB Atlas connection issues on some networks)
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const seedAdmin = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB:', mongoUri);
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB (Atlas).');
    } catch (connErr) {
      console.warn('⚠️ Atlas connection failed:', connErr.message);
      console.log('Falling back to local MongoDB at mongodb://127.0.0.1:27017/Stocksimulator...');
      mongoUri = 'mongodb://127.0.0.1:27017/Stocksimulator';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to fallback MongoDB (Local).');
    }

    const adminEmail = 'admin@stocksimulator.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Updated existing user role to admin.');
      }
    } else {
      const adminUser = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'AdminSecurePass123!',
        role: 'admin',
        balance: 1000000 // Admin gets a larger starting balance
      });
      console.log('Admin user created successfully.');
      console.log('Email:', adminUser.email);
      console.log('Password: AdminSecurePass123!');
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

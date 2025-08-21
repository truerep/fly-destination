const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

/**
 * Setup script to initialize the database with default admin user
 */
async function setupDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    // const existingAdmin = await User.findOne({ userType: 'admin' });
    
    // if (existingAdmin) {
    //   console.log('ℹ️  Admin user already exists');
    //   return;
    // }

    // Create default admin user
    // password: 'AdminPass123!',
    const adminData = {
      userType: 'admin',
      email: 'venkyncccadet@gmail.com',
      password: 'Nani@143',
      phoneNumber: '9933245651',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isBlocked: false
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Default admin user created successfully');
    console.log('📧 Email: admin@flydestination.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 
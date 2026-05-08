const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config();

async function upgradeUser() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI not found in .env');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const email = 'riteshtharu333@gmail.com';
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    const user = await User.findOneAndUpdate(
      { email },
      { 
        plan: 'premium', 
        subscriptionExpires: expirationDate,
        role: 'admin'
      },
      { new: true }
    );

    if (user) {
      console.log(`✅ User ${email} upgraded to Premium and Admin.`);
      console.log(`Subscription Expires: ${user.subscriptionExpires}`);
    } else {
      console.log(`❌ User ${email} not found.`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

upgradeUser();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/Herald/Easy Project Management/Backend/.env' });

async function fixDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the problematic index
    try {
      await mongoose.connection.db.collection('users').dropIndex('PhoneNumber_1');
      console.log('Dropped index PhoneNumber_1');
    } catch (err) {
      console.log('Index PhoneNumber_1 not found or already dropped');
    }
    
    // Check for existing users with null phonenumber
    const usersWithNull = await mongoose.connection.db.collection('users').find({ phoneNumber: null }).toArray();
    console.log(`Found ${usersWithNull.length} users with null phoneNumber (lowercase)`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixDB();

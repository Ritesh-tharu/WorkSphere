// Backend/seed_admin.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/worksphere";
    console.log(`Connecting to database at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const email = "admin@worksphere.com";
    const password = "adminpassword123";
    const name = "Super Admin";

    // Check if user exists
    let admin = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (admin) {
      console.log(`User ${email} already exists. Updating role to superadmin and setting verified status...`);
      admin.role = "superadmin";
      admin.isVerified = true;
      admin.password = hashedPassword;
      await admin.save();
      console.log(`✅ Super Admin user updated successfully!`);
    } else {
      console.log(`Creating default Super Admin user (${email})...`);
      admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "superadmin",
        isVerified: true,
        plan: "premium",
      });
      console.log(`✅ Default Super Admin user created successfully!`);
    }

    await mongoose.disconnect();
    console.log("Database disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
    process.exit(1);
  }
};

seedAdmin();

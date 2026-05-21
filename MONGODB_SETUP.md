# 📊 MongoDB Database Setup Guide

## Database Name
- **Database**: `worksphere` (or as configured in `MONGO_URI`)

## Collections & Schema

### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required for non-Google users),
  phoneNumber: String (unique, optional),
  googleId: String (unique, optional),
  dateOfBirth: Date,
  location: String,
  jobTitle: String,
  bio: String,
  profilePhoto: String,
  role: String (enum: ["admin", "member", "superadmin"], default: "admin"),
  teamMembers: [ObjectId], // References to other Users
  invitedBy: ObjectId, // Reference to User
  notificationPreferences: {
    desktop: Boolean,
    sound: Boolean
  },
  isVerified: Boolean,
  plan: String (enum: ["free", "premium"]),
  otp: String,
  otpExpires: Date,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. **Projects Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  owner: ObjectId (Reference to User),
  members: [ObjectId],
  tasks: [ObjectId],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. **Tasks Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  project: ObjectId (Reference to Project),
  assignedTo: ObjectId (Reference to User),
  status: String (enum: ["todo", "in-progress", "done"]),
  priority: String (enum: ["low", "medium", "high"]),
  dueDate: Date,
  attachments: [String],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. **Notes Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  owner: ObjectId (Reference to User),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. **Calendar Events Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  color: String,
  owner: ObjectId (Reference to User),
  reminders: [{
    time: Number,
    sent: Boolean
  }],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 6. **Notifications Collection**
```javascript
{
  _id: ObjectId,
  recipient: ObjectId (Reference to User),
  type: String,
  message: String,
  link: String,
  read: Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 7. **Invitations Collection**
```javascript
{
  _id: ObjectId,
  email: String,
  invitedBy: ObjectId (Reference to User),
  project: ObjectId (Reference to Project),
  token: String,
  status: String (enum: ["pending", "accepted", "rejected"]),
  createdAt: Timestamp,
  expiresAt: Timestamp,
  updatedAt: Timestamp
}
```

### 8. **Payments Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (Reference to User),
  amount: Number,
  currency: String,
  plan: String (enum: ["free", "premium"]),
  transactionId: String,
  status: String (enum: ["pending", "completed", "failed"]),
  paymentGateway: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 Setup Instructions

### Step 1: Environment Configuration
Create a `.env` file in the Backend directory:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/worksphere?retryWrites=true&w=majority
# OR for local development:
MONGO_URI=mongodb://localhost:27017/worksphere

JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Step 2: Create Superadmin User
Run the seed script to create a superadmin:

```bash
cd Backend
node seed_admin.js
```

**Default Superadmin Credentials:**
- Email: `admin@worksphere.com`
- Password: `adminpassword123`
- Role: `superadmin`

### Step 3: Login to Admin Panel
1. Go to `http://localhost:5173/admin-login`
2. Enter superadmin credentials
3. You'll be redirected to `/admin-dashboard`

## 🛡️ Role-Based Access Control

### Roles Available:
1. **superadmin** - Full system access, can manage users, pricing, and all resources
2. **admin** - Limited admin access (can view users, manage own resources)
3. **member** - Regular user, can create projects and tasks

### Protected Routes:
- `/admin-login` - Admin login page (public, but only superadmin credentials work)
- `/admin-dashboard` - Admin dashboard (requires superadmin role)
- `/dashboard` - User dashboard (requires authentication)
- `/settings` - User settings (requires authentication)

## 📝 Create Additional Superadmins

To create more superadmin users, connect to MongoDB and run:

```javascript
db.users.insertOne({
  name: "Another Admin",
  email: "another@admin.com",
  password: "$2a$10$hashedPasswordHere",
  role: "superadmin",
  isVerified: true,
  plan: "premium",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use this Node.js script in Backend folder:

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createSuperadmin() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);
  
  const admin = await User.create({
    name: "Admin Name",
    email: "admin@example.com",
    password: hashedPassword,
    role: "superadmin",
    isVerified: true,
    plan: "premium"
  });
  
  console.log("Superadmin created:", admin);
  process.exit(0);
}

createSuperadmin().catch(console.error);
```

## 🔐 Admin Functions Available

### From Admin Dashboard:
✅ View system statistics
✅ Manage users (view, edit, delete)
✅ Update user roles
✅ Manage pricing plans
✅ View payment transactions
✅ Monitor user activity

### API Endpoints (Admin Only):
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/pricing` - Get pricing plans
- `PUT /api/admin/pricing` - Update pricing
- `GET /api/admin/payments` - Get payments list

## ✅ Verification Checklist

- [ ] MongoDB connection configured in `.env`
- [ ] Superadmin created via `seed_admin.js`
- [ ] Backend server running on `localhost:5000`
- [ ] Frontend running on `localhost:5173`
- [ ] Can access `/admin-login`
- [ ] Can login with superadmin credentials
- [ ] Redirects to `/admin-dashboard`
- [ ] Admin dashboard loads successfully

## 🆘 Troubleshooting

### Issue: MongoDB Connection Failed
**Solution:** 
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running locally or Atlas is accessible
- Verify network access rules (if using Atlas)

### Issue: Cannot Login as Admin
**Solution:**
- Run `node seed_admin.js` again
- Check if email exists: Query MongoDB to verify
- Reset password via direct database update

### Issue: Admin Dashboard Shows "Access Denied"
**Solution:**
- Ensure user role is `superadmin` (not just `admin`)
- Clear browser cache and localStorage
- Login again

### Issue: Forgot Superadmin Password
**Solution:**
Edit directly in MongoDB:
```javascript
// Update in MongoDB Studio/CLI
db.users.updateOne(
  { email: "admin@worksphere.com" },
  { $set: { password: "new_hashed_password" } }
)
```

Or re-run seed script which updates existing admin password.

---

**Last Updated:** May 22, 2026
**Status:** ✅ Production Ready

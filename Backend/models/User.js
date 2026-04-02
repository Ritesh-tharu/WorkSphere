// // Backend/models/User.js
// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     phoneNumber: {
//       type: String,
//       required: true,
//       unique: true,
//       match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
//     },

//     dateOfBirth: {
//       type: Date,
//     },

//     location: {
//       type: String,
//       trim: true,
//     },

//     jobTitle: {
//       type: String,
//       trim: true,
//     },

//     bio: {
//       type: String,
//       trim: true,
//       maxlength: 500,
//     },

//     profilePhoto: {
//       type: String,
//     },

//     role: {
//       type: String,
//       enum: ["admin", "member"],
//       default: "admin",
//     },

//     teamMembers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: function() { return !this.googleId; }, // Required only if not a Google user
      minlength: 6,
    },
    phoneNumber: {
      type: String,
      required: false, // Making it optional for now to support quick signups
      unique: true,
      sparse: true, // Allow multiple nulls
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    profilePhoto: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "admin",
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notificationPreferences: {
      desktop: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model("User", userSchema);
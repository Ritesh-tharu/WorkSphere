const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { sendInvitationEmail } = require("../config/emailService"); // Remove testEmailConfig import
const crypto = require("crypto");
const Notification = require("../models/Notification");

// Remove the testEmailConfig() call from here

// Send invitation
exports.sendInvite = async (req, res) => {
  try {
    const { email } = req.body;
    const inviterId = req.user.id;

    // Validate email
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Add to team if already registered
      await User.findByIdAndUpdate(inviterId, {
        $addToSet: { teamMembers: existingUser._id },
      });

      // Create notification for existing user
      const inviter = await User.findById(inviterId);
      await Notification.create({
        user: existingUser._id,
        title: "Added to Team",
        message: `${inviter.name} added you to their team`,
        type: "team",
      });

      return res.status(200).json({
        message: "User already registered, added to team",
        user: existingUser,
      });
    }

    // Check if invitation already sent and not expired
    const existingInvite = await Invitation.findOne({
      email,
      status: "pending",
    });

    if (existingInvite) {
      // Check if invitation is expired (7 days)
      const daysSinceCreation =
        (Date.now() - new Date(existingInvite.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 7) {
        existingInvite.status = "expired";
        await existingInvite.save();
      } else {
        return res.status(400).json({
          message:
            "Invitation already sent. Please wait for the user to respond.",
          invitation: existingInvite,
        });
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Get inviter details
    const inviter = await User.findById(inviterId);
    if (!inviter) {
      return res.status(404).json({ message: "Inviter not found" });
    }

    // Create invitation with expiration
    const invitation = await Invitation.create({
      email,
      invitedBy: inviterId,
      token,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send email
    try {
      await sendInvitationEmail(email, token, inviter.name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Still return success but notify about email issue
      return res.status(201).json({
        message:
          "Invitation created but email could not be sent. Please check email configuration.",
        invitation,
        emailError: true,
      });
    }

    // Create notification for inviter
    await Notification.create({
      user: inviterId,
      title: "Invitation Sent",
      message: `Invitation sent to ${email}`,
      type: "invitation",
      metadata: { invitationId: invitation._id },
    });

    res.status(201).json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error in sendInvite:", error);
    res
      .status(500)
      .json({ message: "Failed to send invitation. Please try again." });
  }
};

// Accept invitation
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: { $in: ["pending", "sent"] },
    }).populate("invitedBy", "name email");

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired invitation" });
    }

    // Check if expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(410).json({ message: "Invitation has expired" });
    }

    // Update invitation status
    invitation.status = "accepted";
    await invitation.save();

    // Notify inviter
    await Notification.create({
      user: invitation.invitedBy,
      title: "Invitation Accepted",
      message: `${invitation.email} accepted your invitation`,
      type: "invitation",
      metadata: { invitationId: invitation._id },
    });

    res.json({
      message: "Invitation accepted successfully",
      email: invitation.email,
      inviter: invitation.invitedBy,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all invitations
exports.getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await Invitation.find({ invitedBy: userId })
      .sort({ createdAt: -1 })
      .populate("invitedBy", "name email");

    // Check for expired invitations
    const now = new Date();
    for (let invite of invitations) {
      if (
        invite.status === "pending" &&
        invite.expiresAt &&
        now > new Date(invite.expiresAt)
      ) {
        invite.status = "expired";
        await invite.save();
      }
    }

    res.json(invitations);
  } catch (error) {
    console.error("Error getting invitations:", error);
    res.status(500).json({ message: error.message });
  }
};

// Resend invitation
exports.resendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await Invitation.findOne({
      _id: id,
      invitedBy: userId,
      status: { $in: ["pending", "expired"] },
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    invitation.token = token;
    invitation.status = "pending";
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    // Get inviter details
    const inviter = await User.findById(userId);

    // Send email
    await sendInvitationEmail(invitation.email, token, inviter.name);

    res.json({ message: "Invitation resent successfully" });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get team members
exports.getTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate(
      "teamMembers",
      "name email phoneNumber profilePhoto jobTitle role",
    );

    res.json(user.teamMembers || []);
  } catch (error) {
    console.error("Error getting team members:", error);
    res.status(500).json({ message: error.message });
  }
};

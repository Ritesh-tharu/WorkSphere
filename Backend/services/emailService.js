const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const sendInvitationEmail = async (email, token, inviterName) => {
  try {
    const inviteUrl = `http://localhost:5173/accept-invite/${token}`;

    const mailOptions = {
      from: `"Easy Project Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${inviterName} invited you to join their team!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Team Invitation</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been invited to join a team</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong style="color: #6366f1; font-size: 18px;">${inviterName}</strong> has invited you to join their team on 
                <strong style="color: #6366f1;">Easy Project Management</strong>.
              </p>
              
              <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 20px; margin: 30px 0; border-radius: 10px;">
                <p style="color: #475569; margin: 0 0 10px 0; font-size: 14px;">✨ What you can do:</p>
                <ul style="color: #475569; margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>Collaborate with team members</li>
                  <li>Manage tasks and projects</li>
                  <li>Track progress and deadlines</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 20px rgba(99,102,241,0.3);">
                  Accept Invitation
                </a>
              </div>
              
              <!-- Alternative link -->
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Or copy this link: <br>
                <span style="color: #6366f1; word-break: break-all;">${inviteUrl}</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">
                This invitation will expire in 7 days.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                © 2026 Easy Project Management. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = () => {
  const requiredEnvVars = ["EMAIL_USER", "EMAIL_PASS"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error(`Missing email configuration: ${missingVars.join(", ")}`);
    return false;
  }
  return true;
};

module.exports = { sendInvitationEmail, testEmailConfig };

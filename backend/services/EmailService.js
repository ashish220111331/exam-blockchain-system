const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'Exam Portal <onboarding@resend.dev>';
  }

  async sendEmail(to, subject, html) {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: to,
        subject: subject,
        html: html
      });

      console.log('Email sent:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationOTP(email, otp, name) {
    const subject = 'Verify Your Email - Exam Portal';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with Exam Portal. Please verify your email address to complete your registration.</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • Never share this code with anyone<br>
              • This code expires in 10 minutes<br>
              • If you didn't request this, please ignore this email
            </div>

            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Exam Portal</p>
            <p>© 2025 Exam Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetOTP(email, otp, name) {
    const subject = 'Password Reset Request - Exam Portal';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #ef4444; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #ef4444; letter-spacing: 8px; }
          .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password. Use the code below to proceed:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your password reset code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Alert:</strong><br>
              • If you didn't request this, your account may be compromised<br>
              • Change your password immediately<br>
              • Never share this code with anyone<br>
              • This code expires in 10 minutes
            </div>

            <p>If you didn't request a password reset, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Exam Portal</p>
            <p>© 2025 Exam Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, name, userType) {
    const subject = 'Welcome to Exam Portal!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .feature-item { display: flex; align-items: center; margin: 15px 0; }
          .feature-icon { font-size: 24px; margin-right: 15px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Exam Portal!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Your account has been successfully verified. Welcome to our secure blockchain-based exam distribution system!</p>
            
            <div class="features">
              <h3>What you can do:</h3>
              ${userType === 'examiner' ? `
                <div class="feature-item">
                  <span class="feature-icon">📤</span>
                  <span>Upload exam papers securely</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔐</span>
                  <span>Encrypt files with blockchain security</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⏰</span>
                  <span>Schedule automatic file release</span>
                </div>
              ` : `
                <div class="feature-item">
                  <span class="feature-icon">📥</span>
                  <span>Download exam papers on exam day</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔒</span>
                  <span>Access secured blockchain-protected files</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <span>View complete audit trail</span>
                </div>
              `}
              <div class="feature-item">
                <span class="feature-icon">🔗</span>
                <span>Track all activities on blockchain</span>
              </div>
            </div>

            <center>
              <a href="https://exam-blockchain-system.vercel.app" class="button">Go to Dashboard</a>
            </center>

            <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Exam Portal</p>
            <p>© 2025 Exam Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
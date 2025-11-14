require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Host:', process.env.EMAIL_HOST);
  console.log('Email Port:', process.env.EMAIL_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: 'Test Email - Exam Portal',
      html: '<h1>✅ Email Configuration Works!</h1><p>If you see this, your email is configured correctly.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox:', process.env.EMAIL_USER);
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
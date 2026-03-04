const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  const message = {
    from: `${process.env.TWO_FACTOR_APP_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || options.message
  };

  // If SMTP is not configured, log to console instead
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    console.log('\n========== EMAIL (Development Mode) ==========');
    console.log('To:', message.to);
    console.log('Subject:', message.subject);
    console.log('Content:', message.html.replace(/<[^>]*>/g, ''));
    console.log('==============================================\n');
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    // Fallback to console logging
    console.log('\n========== EMAIL (Fallback) ==========');
    console.log('To:', message.to);
    console.log('Subject:', message.subject);
    console.log('Content:', message.html.replace(/<[^>]*>/g, ''));
    console.log('======================================\n');
    return { success: false, error };
  }
};

exports.send2FACode = async (email, code) => {
  return await this.sendEmail({
    email,
    subject: '2FA Verification Code',
    html: `
      <h2>Two-Factor Authentication</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `
  });
};

exports.sendWelcomeEmail = async (email, name) => {
  return await this.sendEmail({
    email,
    subject: 'Welcome to Agency CRM',
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now log in to the system.</p>
    `
  });
};

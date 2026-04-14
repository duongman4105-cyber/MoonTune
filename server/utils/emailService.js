const nodemailer = require('nodemailer');

// Cấu hình Gmail - yêu cầu App Password nếu có 2FA
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

// Kiểm tra connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email config error:', error.message);
    console.error('📌 Cần Gmail App Password (không phải password thường)');
    console.error('📌 Hướng dẫn: https://support.google.com/accounts/answer/185833');
  } else {
    console.log('✅ Email service ready - Sẵn sàng gửi email');
  }
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email xác nhận
const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: `MOONTUNE <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎵 Mã xác nhận MOONTUNE - Có hiệu lực trong 5 phút',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
              .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; border-radius: 12px; border: 1px solid #334155; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 32px; margin-bottom: 10px; }
              .title { font-size: 24px; font-weight: bold; color: #22d3ee; margin-bottom: 10px; }
              .subtitle { color: #94a3b8; font-size: 14px; }
              .code-box { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
              .code { font-size: 48px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .info { background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22d3ee; }
              .info-text { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎵</div>
                <div class="title">MOONTUNE</div>
                <div class="subtitle">Xác nhận tài khoản của bạn</div>
              </div>
              
              <div class="info">
                <div class="info-text">Bạn vừa yêu cầu xác nhận tài khoản. Vui lòng nhập mã dưới đây để tiếp tục.</div>
              </div>

              <div class="code-box">
                <div class="code">${code}</div>
              </div>

              <div class="info">
                <div class="info-text">
                  <strong>⏱️ Mã này có hiệu lực trong 5 phút</strong><br><br>
                  ⚠️ Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.<br><br>
                  💡 Không chia sẻ mã này với bất kỳ ai.
                </div>
              </div>

              <div class="footer">
                <p>© 2026 MOONTUNE. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw new Error('Không thể gửi email xác nhận. ' + error.message);
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
};

import nodemailer from 'nodemailer';

// Creates a transporter — uses Ethereal (fake SMTP) in dev if no real creds provided.
// In production set EMAIL_USER and EMAIL_PASS in .env
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Real SMTP (Gmail, Outlook, etc.)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Dev fallback: Ethereal fake SMTP — emails are captured at https://ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('📧 Ethereal test email account:', testAccount.user);
  return transporter;
};

/**
 * Send appointment request notification to host
 */
export const sendAppointmentRequestEmail = async ({ hostEmail, hostName, visitorName, purpose, scheduledDate }) => {
  try {
    const transporter = await createTransporter();
    const dateStr = new Date(scheduledDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const info = await transporter.sendMail({
      from: `"PassGuard" <${process.env.EMAIL_USER || 'noreply@passguard.io'}>`,
      to: hostEmail,
      subject: `New Visit Request from ${visitorName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:2rem;text-align:center;">
            <h1 style="margin:0;font-size:1.5rem;color:white;">🛡️ PassGuard</h1>
            <p style="margin:0.5rem 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Visitor Pass Management</p>
          </div>
          <div style="padding:2rem;">
            <h2 style="color:#818cf8;margin-top:0;">New Visit Request</h2>
            <p>Hi <strong>${hostName}</strong>,</p>
            <p>You have a new visit request awaiting your approval:</p>
            <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;">
              <tr><td style="padding:0.75rem;border-bottom:1px solid #1e293b;color:#94a3b8;width:120px;">Visitor</td><td style="padding:0.75rem;border-bottom:1px solid #1e293b;font-weight:600;">${visitorName}</td></tr>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #1e293b;color:#94a3b8;">Purpose</td><td style="padding:0.75rem;border-bottom:1px solid #1e293b;">${purpose}</td></tr>
              <tr><td style="padding:0.75rem;color:#94a3b8;">Scheduled</td><td style="padding:0.75rem;">${dateStr}</td></tr>
            </table>
            <p style="color:#94a3b8;font-size:0.875rem;">Login to PassGuard to approve or reject this request.</p>
          </div>
        </div>
      `,
    });

    console.log('📧 Appointment request email sent. Preview:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (err) {
    // Email failure should never crash the app
    console.error('Email send failed:', err.message);
  }
};

/**
 * Send QR pass to visitor after approval
 */
export const sendPassEmail = async ({ visitorEmail, visitorName, hostName, purpose, scheduledDate, qrCodeData, passId }) => {
  try {
    const transporter = await createTransporter();
    const dateStr = new Date(scheduledDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // QR code as inline image via Google Charts API (no extra package needed)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCodeData}`;

    const info = await transporter.sendMail({
      from: `"PassGuard" <${process.env.EMAIL_USER || 'noreply@passguard.io'}>`,
      to: visitorEmail,
      subject: `Your Visit Pass is Ready — ${dateStr}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:2rem;text-align:center;">
            <h1 style="margin:0;font-size:1.5rem;color:white;">🛡️ PassGuard</h1>
            <p style="margin:0.5rem 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Your Visit Pass</p>
          </div>
          <div style="padding:2rem;text-align:center;">
            <h2 style="color:#34d399;margin-top:0;">✅ Visit Approved!</h2>
            <p>Hi <strong>${visitorName}</strong>, your visit has been approved.</p>
            <div style="background:#1e293b;border-radius:12px;padding:1.5rem;margin:1.5rem 0;display:inline-block;">
              <img src="${qrImageUrl}" alt="QR Pass" style="width:200px;height:200px;display:block;" />
              <p style="margin:0.75rem 0 0;color:#94a3b8;font-size:0.75rem;">Show this QR code at the entrance</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;text-align:left;">
              <tr><td style="padding:0.75rem;border-bottom:1px solid #1e293b;color:#94a3b8;width:120px;">Host</td><td style="padding:0.75rem;border-bottom:1px solid #1e293b;font-weight:600;">${hostName}</td></tr>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #1e293b;color:#94a3b8;">Purpose</td><td style="padding:0.75rem;border-bottom:1px solid #1e293b;">${purpose}</td></tr>
              <tr><td style="padding:0.75rem;color:#94a3b8;">Scheduled</td><td style="padding:0.75rem;">${dateStr}</td></tr>
            </table>
            <p style="color:#94a3b8;font-size:0.8rem;margin-top:1.5rem;">Pass valid for 24 hours from your scheduled time. Present this QR at security.</p>
          </div>
        </div>
      `,
    });

    console.log('📧 Pass email sent to visitor. Preview:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

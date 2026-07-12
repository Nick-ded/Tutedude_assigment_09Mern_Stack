// sendEmail.js - handles all email notifications
// uses gmail via nodemailer with app password

import nodemailer from 'nodemailer'

// log whether real email is configured on startup
console.log('Email config:', process.env.EMAIL_USER ? `Real Gmail (${process.env.EMAIL_USER})` : 'Ethereal test mode')

function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // real gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }
  // fallback - won't actually deliver but won't crash either
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: 'fake@ethereal.email', pass: 'fakepass' },
  })
}

const FROM = () => `"PassGuard" <${process.env.EMAIL_USER || 'noreply@passguard.io'}>`

// send email to host when a visitor submits pre-registration
export async function sendAppointmentRequestEmail({ hostEmail, hostName, visitorName, purpose, scheduledDate }) {
  try {
    const transporter = createTransporter()
    const dateStr = new Date(scheduledDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    const info = await transporter.sendMail({
      from: FROM(),
      to: hostEmail,
      subject: `New Visit Request from ${visitorName} — Action Required`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
          <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:1.75rem 2rem;">
            <h1 style="margin:0;font-size:1.4rem;color:white;font-weight:800;">🛡️ PassGuard</h1>
            <p style="margin:0.4rem 0 0;color:rgba(255,255,255,0.75);font-size:0.875rem;">Visitor Management System</p>
          </div>
          <div style="padding:2rem;">
            <h2 style="color:#818cf8;margin:0 0 1rem;font-size:1.2rem;">New Visit Request</h2>
            <p style="color:#94a3b8;margin-bottom:1.5rem;">Hi <strong style="color:#f1f5f9;">${hostName}</strong>, you have a new visit request awaiting approval:</p>
            <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;border-bottom:1px solid #0f172a;width:110px;">Visitor</td>
                <td style="padding:0.8rem 1rem;font-weight:600;border-bottom:1px solid #0f172a;">${visitorName}</td>
              </tr>
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;border-bottom:1px solid #0f172a;">Purpose</td>
                <td style="padding:0.8rem 1rem;border-bottom:1px solid #0f172a;color:#94a3b8;">${purpose}</td>
              </tr>
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;">Scheduled</td>
                <td style="padding:0.8rem 1rem;color:#94a3b8;">${dateStr}</td>
              </tr>
            </table>
            <p style="color:#475569;font-size:0.8rem;margin-top:1.5rem;">Login to PassGuard dashboard to approve or reject this request.</p>
          </div>
        </div>
      `,
    })
    console.log('✉️  Request email sent to host:', hostEmail)
    return true
  } catch (err) {
    console.error('❌ Failed to send request email:', err.message)
    return false
  }
}

// send QR pass to visitor after approval
export async function sendApprovalEmail({ visitorEmail, visitorName, hostName, purpose, scheduledDate, qrCodeData }) {
  try {
    const transporter = createTransporter()
    const dateStr = new Date(scheduledDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    // use qrserver.com to generate QR image inline - no extra package needed
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrCodeData}&bgcolor=0f172a&color=f1f5f9&qzone=2`

    const info = await transporter.sendMail({
      from: FROM(),
      to: visitorEmail,
      subject: `✅ Your Visit is Approved — QR Pass Inside`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
          <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:1.75rem 2rem;">
            <h1 style="margin:0;font-size:1.4rem;color:white;font-weight:800;">🛡️ PassGuard</h1>
            <p style="margin:0.4rem 0 0;color:rgba(255,255,255,0.75);font-size:0.875rem;">Your Visitor Pass</p>
          </div>
          <div style="padding:2rem;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.8rem;">✅</div>
            <h2 style="color:#34d399;margin:0 0 0.5rem;font-size:1.3rem;">Visit Approved!</h2>
            <p style="color:#94a3b8;margin-bottom:1.75rem;">Hi <strong style="color:#f1f5f9;">${visitorName}</strong>, your visit has been approved. Show the QR code below at the security desk.</p>
            
            <div style="background:#1e293b;border-radius:12px;padding:1.5rem;display:inline-block;margin-bottom:1.75rem;border:1px solid #334155;">
              <img src="${qrImageUrl}" alt="Your QR Pass" style="width:220px;height:220px;display:block;border-radius:8px;" />
              <p style="margin:0.75rem 0 0;color:#64748b;font-size:0.75rem;">Valid for 24 hours from your scheduled time</p>
            </div>

            <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden;text-align:left;margin-bottom:1.5rem;">
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;border-bottom:1px solid #0f172a;width:100px;">Host</td>
                <td style="padding:0.8rem 1rem;font-weight:600;border-bottom:1px solid #0f172a;">${hostName}</td>
              </tr>
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;border-bottom:1px solid #0f172a;">Purpose</td>
                <td style="padding:0.8rem 1rem;color:#94a3b8;border-bottom:1px solid #0f172a;">${purpose}</td>
              </tr>
              <tr>
                <td style="padding:0.8rem 1rem;color:#64748b;font-size:0.8rem;font-weight:600;text-transform:uppercase;">Date</td>
                <td style="padding:0.8rem 1rem;color:#94a3b8;">${dateStr}</td>
              </tr>
            </table>
            <p style="color:#475569;font-size:0.78rem;">Present this QR code at the entrance. The security staff will scan it to let you in.</p>
          </div>
        </div>
      `,
    })
    console.log('✉️  Approval + QR pass email sent to visitor:', visitorEmail)
    return true
  } catch (err) {
    console.error('❌ Failed to send approval email:', err.message)
    return false
  }
}

// send rejection notice to visitor
export async function sendRejectionEmail({ visitorEmail, visitorName, hostName, purpose }) {
  try {
    const transporter = createTransporter()

    await transporter.sendMail({
      from: FROM(),
      to: visitorEmail,
      subject: `Update on Your Visit Request to ${hostName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
          <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:1.75rem 2rem;">
            <h1 style="margin:0;font-size:1.4rem;color:white;font-weight:800;">🛡️ PassGuard</h1>
          </div>
          <div style="padding:2rem;text-align:center;">
            <div style="font-size:1.8rem;margin-bottom:1rem;">❌</div>
            <h2 style="color:#f87171;margin:0 0 0.75rem;font-size:1.2rem;">Visit Request Not Approved</h2>
            <p style="color:#94a3b8;margin-bottom:1rem;">Hi <strong style="color:#f1f5f9;">${visitorName}</strong>,</p>
            <p style="color:#94a3b8;margin-bottom:1.5rem;">Unfortunately your visit request to meet <strong style="color:#f1f5f9;">${hostName}</strong> regarding "<em>${purpose}</em>" was not approved at this time.</p>
            <p style="color:#475569;font-size:0.8rem;">Please contact the host directly if you believe this is an error.</p>
          </div>
        </div>
      `,
    })
    console.log('✉️  Rejection email sent to visitor:', visitorEmail)
    return true
  } catch (err) {
    console.error('❌ Failed to send rejection email:', err.message)
    return false
  }
}

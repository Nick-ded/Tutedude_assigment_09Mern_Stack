import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Generate a visitor pass PDF as a Buffer.
 * @param {Object} data - { visitorName, visitorEmail, visitorPhone, visitorCompany, hostName, purpose, scheduledDate, qrCodeData, passId }
 * @returns {Promise<Buffer>}
 */
export const generatePassPDF = async (data) => {
  const {
    visitorName, visitorEmail, visitorPhone, visitorCompany,
    hostName, purpose, scheduledDate, qrCodeData,
  } = data;

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(qrCodeData, {
    errorCorrectionLevel: 'H',
    width: 160,
    margin: 1,
  });

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: 'A6', margin: 30 });
    const chunks = [];

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', err   => reject(err));

    const W = doc.page.width;

    // ── Header bar ──────────────────────────────────────────
    doc.rect(0, 0, W, 70).fill('#6366f1');

    doc.fillColor('white')
       .fontSize(18).font('Helvetica-Bold')
       .text('PassGuard', 30, 18);

    doc.fontSize(9).font('Helvetica')
       .text('VISITOR PASS', 30, 42)
       .text('OFFICIAL ACCESS DOCUMENT', 30, 54);

    // ── QR Code (right side of header) ──────────────────────
    doc.image(qrBuffer, W - 100, 5, { width: 90, height: 90 });

    // ── Visitor info ────────────────────────────────────────
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
       .text(visitorName, 30, 90);

    if (visitorCompany) {
      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
         .text(visitorCompany, 30, 108);
    }

    // Divider
    const divY = visitorCompany ? 125 : 115;
    doc.moveTo(30, divY).lineTo(W - 30, divY)
       .lineWidth(0.5).strokeColor('#e2e8f0').stroke();

    // Details table
    const rows = [
      ['Host',      hostName],
      ['Purpose',   purpose],
      ['Date',      new Date(scheduledDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
      ['Email',     visitorEmail],
      ['Phone',     visitorPhone || '—'],
    ];

    let y = divY + 12;
    doc.fontSize(8);
    rows.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fillColor('#94a3b8').text(label.toUpperCase(), 30, y, { width: 55 });
      doc.font('Helvetica').fillColor('#1e293b').text(value, 90, y, { width: W - 120 });
      y += 20;
    });

    // ── Footer ───────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, W, 40).fill('#f8fafc');

    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
       .text('Present this pass at the security desk. Valid 24 hours from scheduled time.', 30, footerY + 8, { width: W - 60, align: 'center' })
       .text(`Pass valid until: ${new Date(new Date(scheduledDate).getTime() + 86400000).toLocaleString()}`, 30, footerY + 22, { width: W - 60, align: 'center' });

    doc.end();
  });
};

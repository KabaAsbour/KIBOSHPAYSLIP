export const runtime = 'nodejs';

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Ensure only POST requests are processed
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Please use POST.'
    });
  }

  try {
    const {
      to,
      subject,
      text,
      html,
      fromEmail,
      fromName,
      pdfBase64,
      filename,
      smtpSettings
    } = req.body || {};

    // 1. Recipient Validation
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Adresse e-mail destinataire invalide ou manquante.'
      });
    }

    const recipient = to.trim();

    // 2. Format From Address (Defaults to onboarding@resend.dev for Resend free tier/unverified domains)
    let senderAddress = process.env.RESEND_FROM_EMAIL?.trim();
    if (!senderAddress) {
      // Check if fromEmail is a custom verified domain
      if (
        fromEmail &&
        fromEmail.includes('@') &&
        !fromEmail.endsWith('@enterprise-corp.com') &&
        !fromEmail.endsWith('@example.com') &&
        !fromEmail.endsWith('@gmail.com')
      ) {
        senderAddress = fromName
          ? `"${fromName.replace(/[\r\n]/g, '')}" <${fromEmail}>`
          : fromEmail;
      } else {
        // Resend Free Tier requires onboarding@resend.dev
        senderAddress = fromName
          ? `"${fromName.replace(/[\r\n]/g, '')}" <onboarding@resend.dev>`
          : 'KIBOSH Service Paie <onboarding@resend.dev>';
      }
    }

    // 3. Handle PDF Attachment (strip data URI prefix if present)
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (pdfBase64 && typeof pdfBase64 === 'string') {
      const cleanBase64 = pdfBase64
        .replace(/^data:[^;]+;base64,/, '')
        .replace(/\s/g, '');

      if (cleanBase64) {
        const buffer = Buffer.from(cleanBase64, 'base64');
        attachments.push({
          filename: filename || 'Bulletin_de_paie.pdf',
          content: buffer
        });
      }
    }

    // 4. Initialize Resend if API key is provided
    const resendApiKey = process.env.RESEND_API_KEY?.trim();

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const sendResult = await resend.emails.send({
        from: senderAddress,
        to: recipient,
        subject: (subject || 'Votre bulletin de paie KIBOSH').replace(/[\r\n]/g, ''),
        text: text || 'Veuillez trouver ci-joint votre bulletin de paie.',
        html: html || (text ? `<p>${text.replace(/\n/g, '<br>')}</p>` : undefined),
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (sendResult.error) {
        return res.status(500).json({
          success: false,
          error: sendResult.error.message || 'Erreur lors de la transmission via Resend',
          details: sendResult.error
        });
      }

      return res.status(200).json({
        success: true,
        isRealSmtp: true,
        provider: 'resend',
        messageId: sendResult.data?.id || `resend-${Date.now()}`,
        note: `E-mail transmis avec succès via Resend à ${recipient}`
      });
    }

    // 5. Fallback for Local Express Dev / SMTP credentials if RESEND_API_KEY is not set
    const host = smtpSettings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(smtpSettings?.smtpPort || process.env.SMTP_PORT || 587);
    const user = smtpSettings?.smtpUser || process.env.SMTP_USER || fromEmail;
    const pass = smtpSettings?.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (pass && pass.trim() !== '') {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: user.trim(), pass: pass.trim() },
        tls: { rejectUnauthorized: true }
      });

      const mailOptions: nodemailer.SendMailOptions = {
        from: senderAddress,
        to: recipient,
        subject: (subject || 'Votre bulletin de paie').replace(/[\r\n]/g, ''),
        text: text || 'Veuillez trouver ci-joint votre bulletin de paie.',
        html: html || (text ? `<p>${text.replace(/\n/g, '<br>')}</p>` : undefined),
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: 'application/pdf'
        }))
      };

      const info = await transporter.sendMail(mailOptions);
      return res.status(200).json({
        success: true,
        isRealSmtp: true,
        provider: 'smtp',
        messageId: info.messageId,
        note: `E-mail transmis avec succès via SMTP (${host})`
      });
    }

    // 6. Simulation Sandbox Mode if neither Resend nor SMTP passwords are configured
    return res.status(200).json({
      success: true,
      isRealSmtp: false,
      provider: 'sandbox',
      messageId: `sim-${Date.now()}`,
      note: 'Mode simulation (Bac à sable) : Configurez la variable RESEND_API_KEY sur Vercel pour l\'envoi réel des e-mails.'
    });

  } catch (error: any) {
    // Robust Catch: Never let the function crash silently or return empty body
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erreur serveur inattendue lors de l\'envoi de l\'e-mail'
    });
  }
}

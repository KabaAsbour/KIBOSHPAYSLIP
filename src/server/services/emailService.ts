import nodemailer from 'nodemailer';
import { BLOCKED_HOSTNAMES, BLOCKED_IP_RANGES } from '../config';

export class SsrfValidator {
  /**
   * Validates target hostnames and ports against SSRF vectors
   */
  public static validateSmtpTarget(host: string, port: number): { valid: boolean; reason?: string } {
    if (!host || typeof host !== 'string') {
      return { valid: false, reason: 'Hôte SMTP obligatoire' };
    }

    const cleanHost = host.trim().toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(cleanHost)) {
      return { valid: false, reason: 'Hôte non autorisé (Tentative de contournement SSRF / Réseau interne)' };
    }

    // Check IP range matches
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(cleanHost)) {
        return { valid: false, reason: 'Adresse IP privée ou locale non autorisée (Protection SSRF)' };
      }
    }

    // Check valid port
    if (isNaN(port) || port <= 0 || port > 65535) {
      return { valid: false, reason: 'Port réseau invalide' };
    }

    return { valid: true };
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
  pdfBase64?: string;
  filename?: string;
  smtpSettings?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
  };
}

export class EmailService {
  public static async sendMail(payload: EmailPayload): Promise<{
    success: boolean;
    isRealSmtp: boolean;
    messageId: string;
    note: string;
  }> {
    const { to, subject, text, html, fromEmail = 'paie@enterprise-corp.com', fromName = 'EPDP Service Paie', pdfBase64, filename, smtpSettings } = payload;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to.trim())) {
      throw new Error('Adresse e-mail destinataire invalide');
    }

    // Determine host & port
    const host = smtpSettings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(smtpSettings?.smtpPort || process.env.SMTP_PORT || 587);

    // SSRF Check on outbound target
    const ssrfCheck = SsrfValidator.validateSmtpTarget(host, port);
    if (!ssrfCheck.valid) {
      throw new Error(`Sécurité SSRF : ${ssrfCheck.reason}`);
    }

    const user = smtpSettings?.smtpUser || process.env.SMTP_USER || fromEmail;
    const pass = smtpSettings?.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    let transporter: nodemailer.Transporter;
    let isRealSmtp = false;

    if (pass && pass.trim() !== '') {
      isRealSmtp = true;
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: user.trim(),
          pass: pass.trim()
        },
        tls: {
          rejectUnauthorized: true // Enforce strict TLS certificate validation
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      
      // Limit attachment size to 20MB
      if (buffer.length > 20 * 1024 * 1024) {
        throw new Error('La pièce jointe dépasse la limite de 20 Mo');
      }

      attachments.push({
        filename: filename || 'Fiche_de_paie.pdf',
        content: buffer,
        contentType: 'application/pdf'
      });
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName.replace(/[\r\n]/g, '')}" <${fromEmail.replace(/[\r\n]/g, '')}>`,
      to: to.trim(),
      subject: (subject || 'Votre bulletin de paie').replace(/[\r\n]/g, ''),
      text: text || 'Veuillez trouver ci-joint votre bulletin de paie.',
      html: html || `<p>${(text || 'Veuillez trouver ci-joint votre bulletin de paie.').replace(/\n/g, '<br>')}</p>`,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      isRealSmtp,
      messageId: info.messageId || `msg-${Date.now()}`,
      note: isRealSmtp
        ? 'E-mail transmis avec succès via le serveur SMTP sécurisé.'
        : 'Mode simulation (Bac à sable) : Renseignez les identifiants SMTP réels dans Paramètres Système pour envoyer de vrais courriels.'
    };
  }

  public static async verifySmtpConnection(smtpSettings?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
  }): Promise<{ reachable: boolean; isRealSmtp: boolean; latencyMs: number; host: string; port: number; error?: string }> {
    const start = Date.now();
    const host = smtpSettings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(smtpSettings?.smtpPort || process.env.SMTP_PORT || 587);

    // SSRF Validation
    const ssrfCheck = SsrfValidator.validateSmtpTarget(host, port);
    if (!ssrfCheck.valid) {
      return {
        reachable: false,
        isRealSmtp: false,
        latencyMs: Date.now() - start,
        host,
        port,
        error: `SSRF Validation Failed: ${ssrfCheck.reason}`
      };
    }

    const user = smtpSettings?.smtpUser || process.env.SMTP_USER || '';
    const pass = smtpSettings?.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';

    if (!pass || pass.trim() === '') {
      return {
        reachable: true,
        isRealSmtp: false,
        latencyMs: Date.now() - start,
        host,
        port,
        error: 'Mode Simulation / Bac à sable (Identifiants SMTP non configurés)'
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: user.trim(), pass: pass.trim() },
        tls: { rejectUnauthorized: true }
      });

      await transporter.verify();
      const latencyMs = Date.now() - start;
      return {
        reachable: true,
        isRealSmtp: true,
        latencyMs,
        host,
        port
      };
    } catch (err: any) {
      return {
        reachable: false,
        isRealSmtp: true,
        latencyMs: Date.now() - start,
        host,
        port,
        error: err.message || 'Échec de connexion au serveur SMTP'
      };
    }
  }
}

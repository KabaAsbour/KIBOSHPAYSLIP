import express from 'express';
import { authenticateToken, enforceTenantIsolation, requirePermission, requirePlatformOwner } from '../middleware/authMiddleware';
import { StorageService } from '../../services/storageService';
import { AuditService } from '../services/auditService';
import { PdfStoreService } from '../services/pdfStoreService';
import { EmailService } from '../services/emailService';

const router = express.Router();

// All routes here require valid JWT authentication
router.use(authenticateToken);

/**
 * GET /api/employees
 * Fetch tenant employees (BOLA & Tenant-isolated)
 */
router.get('/employees', enforceTenantIsolation, requirePermission('export_employees'), (req: any, res) => {
  const companyId = req.user.companyId;
  const allEmployees = StorageService.getEmployees();
  const employees = allEmployees.filter(e => !companyId || e.companyId === companyId || e.company === req.user.companyName);
  return res.json({ success: true, data: employees });
});

/**
 * GET /api/campaigns
 * Fetch tenant distribution campaigns
 */
router.get('/campaigns', enforceTenantIsolation, requirePermission('view_reports'), (req: any, res) => {
  const companyId = req.user.companyId;
  const allCampaigns = StorageService.getCampaigns();
  const campaigns = allCampaigns.filter(c => !companyId || c.companyId === companyId);
  return res.json({ success: true, data: campaigns });
});

/**
 * GET /api/audit-logs
 * Fetch tenant audit trail (Immutable server-stored logs)
 */
router.get('/audit-logs', enforceTenantIsolation, requirePermission('view_audit_logs'), (req: any, res) => {
  const companyId = req.user.companyId;
  const logs = AuditService.getLogsByCompany(companyId);
  return res.json({ success: true, data: logs });
});

/**
 * POST /api/audit-logs
 * Write an entry to the immutable audit log
 */
router.post('/audit-logs', enforceTenantIsolation, (req: any, res) => {
  const { action, category, details, result = 'Success' } = req.body;

  const log = AuditService.log({
    companyId: req.user.companyId,
    userId: req.user.userId,
    userEmail: req.user.email,
    action: action || 'ACTION',
    category: category || 'SECURITY',
    details: details || '',
    result
  });

  return res.json({ success: true, data: log });
});

/**
 * POST /api/payslip/upload-secure
 * Uploads payslip PDF to secure server store
 */
router.post('/payslip/upload-secure', enforceTenantIsolation, requirePermission('upload_payroll_pdf'), (req: any, res) => {
  try {
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'Contenu PDF Base64 requis' });
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const result = PdfStoreService.storePdf({
      buffer,
      filename: filename || 'Fiche_de_paie.pdf',
      companyId: req.user.companyId,
      uploadedByUserId: req.user.userId
    });

    AuditService.log({
      companyId: req.user.companyId,
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'PAYSLIP_SECURE_STORED',
      category: 'PAYROLL',
      details: `Fichier PDF sécurisé enregistré : ${result.filename} (ID: ${result.pdfId})`,
      result: 'Success'
    });

    return res.json({
      success: true,
      data: {
        pdfId: result.pdfId,
        signedToken: result.signedToken,
        downloadUrl: `/api/download-payslip/${result.pdfId}?token=${result.signedToken}`
      }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/send-email-secure
 * Sends payroll emails using server-side security checks
 */
router.post('/send-email-secure', enforceTenantIsolation, requirePermission('send_payslips'), async (req: any, res) => {
  try {
    const { to, subject, text, html, pdfBase64, filename } = req.body;

    // Get company SMTP settings from secure server storage if available
    const systemSettings = StorageService.getEmailSettings();

    const emailResult = await EmailService.sendMail({
      to,
      subject,
      text,
      html,
      fromEmail: systemSettings?.senderEmail || 'paie@enterprise-corp.com',
      fromName: systemSettings?.senderName || 'EPDP Service Paie',
      pdfBase64,
      filename,
      smtpSettings: systemSettings ? {
        smtpHost: systemSettings.smtpHost,
        smtpPort: Number(systemSettings.smtpPort),
        smtpUser: systemSettings.smtpUser,
        smtpPass: systemSettings.smtpPass
      } : undefined
    });

    AuditService.log({
      companyId: req.user.companyId,
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'EMAIL_SENT_SECURE',
      category: 'PAYROLL',
      details: `Bulletin envoyé à ${to} via ${emailResult.isRealSmtp ? 'SMTP' : 'Bac à sable'}. MsgID: ${emailResult.messageId}`,
      result: 'Success'
    });

    return res.json({
      success: true,
      data: emailResult
    });
  } catch (error: any) {
    AuditService.log({
      companyId: req.user.companyId,
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'EMAIL_SEND_FAILED',
      category: 'PAYROLL',
      details: `Échec d'envoi e-mail à ${req.body?.to} : ${error.message}`,
      result: 'Failure'
    });

    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/platform/companies
 * Platform Super Admin endpoint to manage tenants
 */
router.get('/platform/companies', requirePlatformOwner, (req, res) => {
  const companies = StorageService.getCompanies();
  return res.json({ success: true, data: companies });
});

/**
 * GET /api/platform/audit-logs
 * Platform Super Admin endpoint to inspect platform-wide audit journal
 */
router.get('/platform/audit-logs', requirePlatformOwner, (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const logs = AuditService.getAllLogs(limit);
  return res.json({ success: true, data: logs });
});

/**
 * GET /api/platform/users
 * Platform Super Admin endpoint to inspect all users across the SaaS platform
 */
router.get('/platform/users', requirePlatformOwner, (req, res) => {
  const users = StorageService.getCompanyUsers();
  return res.json({ success: true, data: users });
});

export default router;

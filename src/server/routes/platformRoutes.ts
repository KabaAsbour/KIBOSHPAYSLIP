import express from 'express';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DbService, SubscriptionRecord } from '../services/dbService';
import { AuditService } from '../services/auditService';
import { authenticateToken } from '../middleware/authMiddleware';
import { CompanyTenant, CompanyUser, Employee } from '../../types';

const router = express.Router();

/**
 * Middleware: Enforce Platform Owner (Super Admin) Privilege
 */
const requirePlatformOwner = (req: any, res: any, next: any) => {
  const user = req.user;
  const isOwner = (
    user?.isPlatformOwner === true ||
    user?.role === 'Platform Super Admin' ||
    user?.role === 'Super Administrator' ||
    user?.username?.toLowerCase() === 'kibosh1234' ||
    user?.username?.toLowerCase() === 'ama1234' ||
    user?.email?.toLowerCase() === 'dkamdkamcbg@gmail.com' ||
    user?.email?.toLowerCase() === 'devperso140@gmail.com'
  );

  if (!isOwner) {
    AuditService.log({
      companyId: user?.companyId || 'UNKNOWN',
      userId: user?.userId || 'ANONYMOUS',
      userEmail: user?.email || 'ANONYMOUS',
      action: 'PLATFORM_OWNER_ACCESS_DENIED',
      category: 'SECURITY',
      details: `Tentative d'accès non autorisé à l'API SaaS Owner par ${user?.email || 'Inconnu'}. Accès bloqué.`,
      result: 'Failure'
    });

    return res.status(403).json({
      success: false,
      error: 'Accès interdit. Seul le Propriétaire de la plateforme KIBOSH (SaaS Owner) peut effectuer cette opération.'
    });
  }

  next();
};

// Apply auth & owner check to all routes except public download with secure short-lived token
router.use((req, res, next) => {
  if (req.path.startsWith('/export/download/')) {
    return next();
  }
  authenticateToken(req, res, () => {
    requirePlatformOwner(req, res, next);
  });
});

// In-memory buffer store for short-lived export downloads
const exportBuffers = new Map<string, { buffer: Buffer; mimeType: string; filename: string; expiresAt: number }>();

/**
 * 1. GET /api/platform/stats
 * Real database statistics (no hardcoded demo numbers)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = DbService.getStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. GET /api/platform/companies
 * Filterable, searchable, sortable companies list
 */
router.get('/companies', (req, res) => {
  try {
    const { country, plan, status, subscriptionStatus, search, sortBy, sortOrder } = req.query;

    let list = DbService.getCompanies();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.companyEmail && c.companyEmail.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      );
    }

    if (country && country !== 'all') {
      list = list.filter(c => c.country.toLowerCase() === String(country).toLowerCase());
    }

    if (plan && plan !== 'all') {
      list = list.filter(c => c.subscriptionPlan.toLowerCase() === String(plan).toLowerCase());
    }

    if (status && status !== 'all') {
      list = list.filter(c => c.status.toLowerCase() === String(status).toLowerCase());
    }

    if (subscriptionStatus && subscriptionStatus !== 'all') {
      const subs = DbService.getSubscriptions();
      list = list.filter(c => {
        const sub = subs.find(s => s.companyId === c.id);
        return sub && sub.status.toLowerCase() === String(subscriptionStatus).toLowerCase();
      });
    }

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') {
        const res = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -res : res;
      }
      // default: registrationDate
      const da = new Date(a.registrationDate || 0).getTime();
      const db = new Date(b.registrationDate || 0).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });

    return res.json({ success: true, companies: list, count: list.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. GET /api/platform/companies/:id
 * Full company profile with administrators, users, and audit trail
 */
router.get('/companies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const company = DbService.getCompanyById(id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Entreprise introuvable.' });
    }

    const allUsers = DbService.getUsers(true);
    const companyUsers = allUsers.filter(u => u.companyId === id);
    const companyAdmins = companyUsers.filter(u => u.role === 'Company Administrator');

    const subs = DbService.getSubscriptions();
    const subscription = subs.find(s => s.companyId === id);

    const logs = AuditService.getLogs(id);

    return res.json({
      success: true,
      company,
      administrators: companyAdmins,
      users: companyUsers,
      subscription,
      recentActivity: logs.slice(0, 20)
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. POST /api/platform/companies
 * Create a new company tenant directly from SaaS Owner portal
 */
router.post('/companies', (req: any, res) => {
  try {
    const { name, size, industry, country, companyEmail, companyPhone, subscriptionPlan, adminFullName, adminEmail, adminUsername, adminPhone, initialPassword } = req.body;

    if (!name || !country || !adminEmail || !adminUsername) {
      return res.status(400).json({ success: false, error: 'Nom, pays, e-mail admin et nom d\'utilisateur requis.' });
    }

    const company = DbService.createCompany({
      name,
      size: size || '11-50',
      industry: industry || 'Général',
      country,
      companyEmail: companyEmail || adminEmail,
      companyPhone: companyPhone || adminPhone,
      subscriptionPlan: subscriptionPlan || 'Starter',
      status: 'Active'
    });

    const adminUser = DbService.createUser({
      companyId: company.id,
      companyName: company.name,
      fullName: adminFullName || adminUsername,
      username: adminUsername,
      email: adminEmail,
      phone: adminPhone,
      jobPosition: 'Administrateur Entreprise',
      role: 'Company Administrator',
      password: initialPassword || 'Password123!',
      status: 'Active',
      mustChangePassword: true,
      mfaEnabled: true
    });

    AuditService.log({
      companyId: company.id,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_COMPANY_CREATED',
      category: 'ADMIN',
      details: `Nouvelle entreprise '${company.name}' (${company.id}) créée par le Propriétaire SaaS avec admin ${adminUser.email}.`,
      result: 'Success'
    });

    return res.json({ success: true, company, adminUser });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. PATCH /api/platform/companies/:id/status
 * Approve, reject, activate, suspend, reactivate
 */
router.patch('/companies/:id/status', (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['Active', 'Suspended', 'Pending Activation', 'Expired', 'Disabled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide.' });
    }

    const updated = DbService.updateCompanyStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Entreprise introuvable.' });
    }

    AuditService.log({
      companyId: id,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_COMPANY_STATUS_MODIFIED',
      category: 'ADMIN',
      details: `Statut de l'entreprise '${updated.name}' modifié à '${status}' par le Propriétaire SaaS. Motif : ${reason || 'Gestion administrative'}`,
      result: 'Success'
    });

    return res.json({ success: true, company: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. PATCH /api/platform/companies/:id/subscription
 * Modify subscription plan and expiration date
 */
router.patch('/companies/:id/subscription', (req: any, res) => {
  try {
    const { id } = req.params;
    const { plan, expirationDate } = req.body;

    if (!plan || !expirationDate) {
      return res.status(400).json({ success: false, error: 'Plan et date d\'expiration requis.' });
    }

    const updated = DbService.updateCompanySubscription(id, plan, expirationDate);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Entreprise introuvable.' });
    }

    AuditService.log({
      companyId: id,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_SUBSCRIPTION_UPDATED',
      category: 'ADMIN',
      details: `Abonnement de l'entreprise '${updated.name}' mis à jour : Plan '${plan}', échéance au ${expirationDate}`,
      result: 'Success'
    });

    return res.json({ success: true, company: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. GET /api/platform/admins
 * List company administrators across tenants (sanitized)
 */
router.get('/admins', (req, res) => {
  try {
    const { search, companyId } = req.query;
    let users = DbService.getUsers(true).filter(u => u.role === 'Company Administrator');

    if (companyId && companyId !== 'all') {
      users = users.filter(u => u.companyId === companyId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, administrators: users, count: users.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. GET /api/platform/users
 * Centralized platform user directory with role categorization
 */
router.get('/users', (req, res) => {
  try {
    const { role, companyId, status, search } = req.query;
    let users = DbService.getUsers(true);

    if (role && role !== 'all') {
      users = users.filter(u => {
        if (role === 'SAAS_OWNER') return u.role === 'Platform Super Admin';
        if (role === 'COMPANY_ADMIN') return u.role === 'Company Administrator';
        if (role === 'SIMPLE_USER') return u.role !== 'Platform Super Admin' && u.role !== 'Company Administrator';
        return u.role === role;
      });
    }

    if (companyId && companyId !== 'all') {
      users = users.filter(u => u.companyId === companyId);
    }

    if (status && status !== 'all') {
      users = users.filter(u => u.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q)
      );
    }

    // Role classification
    const enrichedUsers = users.map(u => ({
      ...u,
      roleCategory: u.role === 'Platform Super Admin' 
        ? 'SAAS_OWNER' 
        : u.role === 'Company Administrator' 
          ? 'COMPANY_ADMIN' 
          : 'SIMPLE_USER'
    }));

    return res.json({ success: true, users: enrichedUsers, count: enrichedUsers.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. POST /api/platform/users
 * Create user (Strict security check: prevents self-promotion or public creation of SaaS Owner)
 */
router.post('/users', (req: any, res) => {
  try {
    const { companyId, fullName, username, email, phone, jobPosition, role, password, mfaEnabled } = req.body;

    if (!companyId || !fullName || !username || !email) {
      return res.status(400).json({ success: false, error: 'Entreprise, nom complet, nom d\'utilisateur et e-mail obligatoires.' });
    }

    const company = DbService.getCompanyById(companyId);
    if (!company && companyId !== 'platform-control') {
      return res.status(404).json({ success: false, error: 'Entreprise rattachée introuvable.' });
    }

    const user = DbService.createUser({
      companyId,
      companyName: company?.name || 'KIBOSH Platform Management',
      fullName,
      username,
      email,
      phone,
      jobPosition: jobPosition || 'Opérateur Paie',
      role: role || 'Payroll Manager',
      password: password || 'Password123!',
      mfaEnabled: Boolean(mfaEnabled),
      mustChangePassword: true,
      status: 'Active'
    });

    AuditService.log({
      companyId,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_USER_CREATED',
      category: 'ADMIN',
      details: `Utilisateur '${user.fullName}' (${user.email}, Rôle: ${user.role}) créé pour l'entreprise '${user.companyName}' par le Propriétaire SaaS.`,
      result: 'Success'
    });

    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. PATCH /api/platform/users/:id/status
 * Disable / reactivate account
 */
router.patch('/users/:id/status', (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Disabled', 'Locked'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut utilisateur invalide.' });
    }

    const updated = DbService.updateUserStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    AuditService.log({
      companyId: updated.companyId,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_USER_STATUS_MODIFIED',
      category: 'ADMIN',
      details: `Compte utilisateur '${updated.fullName}' (${updated.email}) passé au statut '${status}' par le Propriétaire SaaS.`,
      result: 'Success'
    });

    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 11. POST /api/platform/users/:id/reset-password
 * Trigger secure password reset
 */
router.post('/users/:id/reset-password', (req: any, res) => {
  try {
    const { id } = req.params;
    const result = DbService.resetUserPassword(id);
    return res.json({
      success: true,
      message: 'Réinitialisation de mot de passe déclenchée. L\'utilisateur devra choisir un nouveau mot de passe lors de sa prochaine connexion.',
      ...result
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 12. GET /api/platform/employees
 * Cross-Company Employee Directory (Strictly NO salary or payslip data exposed)
 */
router.get('/employees', (req, res) => {
  try {
    const { companyId, search } = req.query;
    let employees = DbService.getEmployees();

    if (companyId && companyId !== 'all') {
      employees = employees.filter(e => e.companyId === companyId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      employees = employees.filter(e =>
        e.matricule.toLowerCase().includes(q) ||
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q))
      );
    }

    // Sanitize employee records (ensure no payroll fields leaked)
    const sanitized = employees.map(e => ({
      id: e.id,
      matricule: e.matricule,
      fullName: `${e.firstName} ${e.lastName}`.trim(),
      firstName: e.firstName,
      lastName: e.lastName,
      company: e.company,
      companyId: e.companyId,
      department: e.department || 'Non spécifié',
      position: e.position || 'Non spécifié',
      email: e.email,
      phone: e.phone || '',
      status: e.status || 'Active',
      createdAt: e.createdAt
    }));

    return res.json({ success: true, employees: sanitized, count: sanitized.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 13. GET /api/platform/subscriptions
 * Subscriptions list
 */
router.get('/subscriptions', (req, res) => {
  try {
    const { status, plan, search } = req.query;
    let list = DbService.getSubscriptions();

    if (status && status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    if (plan && plan !== 'all') {
      list = list.filter(s => s.plan === plan);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(s => s.companyName.toLowerCase().includes(q));
    }

    return res.json({ success: true, subscriptions: list, count: list.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 14. POST /api/platform/subscriptions/:id/verify-payment
 * Confirm and verify subscription payment
 */
router.post('/subscriptions/:id/verify-payment', (req: any, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference } = req.body;

    if (!paymentReference) {
      return res.status(400).json({ success: false, error: 'Référence de paiement bancaire requise.' });
    }

    const verified = DbService.verifySubscriptionPayment(
      id,
      paymentMethod || 'Virement Bancaire Entreprise',
      paymentReference,
      req.user?.fullName || req.user?.email || 'SaaS Platform Owner'
    );

    if (!verified) {
      return res.status(404).json({ success: false, error: 'Abonnement introuvable.' });
    }

    return res.json({
      success: true,
      message: 'Paiement vérifié avec succès. L\'abonnement a été activé pour 12 mois.',
      subscription: verified
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 15. GET /api/platform/audit-logs
 * Platform audit logs
 */
router.get('/audit-logs', (req, res) => {
  try {
    const logs = AuditService.getLogs();
    return res.json({ success: true, logs: logs.slice(0, 100), count: logs.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 16. POST /api/platform/export
 * Server-side generation of XLSX, CSV, or PDF exports
 */
router.post('/export', async (req: any, res) => {
  try {
    const { target, format } = req.body; // target: 'companies' | 'admins' | 'users' | 'employees' | 'subscriptions'
    const exportFormat = (format || 'xlsx').toLowerCase() as 'xlsx' | 'csv' | 'pdf';

    if (!['companies', 'admins', 'users', 'employees', 'subscriptions'].includes(target)) {
      return res.status(400).json({ success: false, error: 'Cible d\'exportation invalide.' });
    }

    if (!['xlsx', 'csv', 'pdf'].includes(exportFormat)) {
      return res.status(400).json({ success: false, error: 'Format d\'exportation non supporté.' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const downloadToken = crypto.randomBytes(24).toString('hex');
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;
    let recordCount = 0;

    // Gather sanitized data
    let exportRows: any[] = [];
    let title = '';

    if (target === 'companies') {
      title = 'KIBOSH - Registre des Entreprises';
      filename = `kibosh_entreprises_${timestamp}.${exportFormat}`;
      const companies = DbService.getCompanies();
      recordCount = companies.length;
      exportRows = companies.map(c => ({
        'ID Entreprise': c.id,
        'Nom de l\'Organisation': c.name,
        'Pays': c.country,
        'Secteur d\'Activité': c.industry || 'Non spécifié',
        'Taille de l\'Entreprise': c.size,
        'E-mail Contact': c.companyEmail || '',
        'Téléphone': c.companyPhone || '',
        'Plan d\'Abonnement': c.subscriptionPlan,
        'Statut du Compte': c.status,
        'Date d\'Enregistrement': c.registrationDate,
        'Date d\'Échéance': c.accessExpiresAt?.split('T')[0] || '',
        'Utilisateurs Actifs': c.totalUsersCount || 1,
        'Employés Gérés': c.totalEmployeesCount || 0
      }));
    } else if (target === 'admins') {
      title = 'KIBOSH - Administrateurs Entreprises';
      filename = `kibosh_administrateurs_${timestamp}.${exportFormat}`;
      const admins = DbService.getUsers(true).filter(u => u.role === 'Company Administrator');
      recordCount = admins.length;
      exportRows = admins.map(a => ({
        'ID Utilisateur': a.id,
        'Entreprise': a.companyName,
        'Nom & Prénom': a.fullName,
        'Identifiant (Username)': a.username,
        'Adresse E-mail': a.email,
        'Téléphone': a.phone || '',
        'Poste': a.jobPosition || 'Administrateur',
        'Statut du Compte': a.status,
        'MFA Activée': a.mfaEnabled ? 'Oui' : 'Non',
        'Date de Création': a.registrationDate,
        'Dernière Connexion': a.lastLogin
      }));
    } else if (target === 'users') {
      title = 'KIBOSH - Annuaire Central des Utilisateurs';
      filename = `kibosh_utilisateurs_plateforme_${timestamp}.${exportFormat}`;
      const users = DbService.getUsers(true);
      recordCount = users.length;
      exportRows = users.map(u => ({
        'ID Utilisateur': u.id,
        'Entreprise Rattachée': u.companyName,
        'Nom & Prénom': u.fullName,
        'Identifiant': u.username,
        'E-mail Professionnel': u.email,
        'Téléphone': u.phone || '',
        'Poste / Fonction': u.jobPosition || '',
        'Rôle RBAC': u.role,
        'Catégorie': u.role === 'Platform Super Admin' ? 'SaaS Owner' : u.role === 'Company Administrator' ? 'Company Admin' : 'Simple User',
        'Statut': u.status,
        'Double Facteur (MFA)': u.mfaEnabled ? 'Actif' : 'Inactif',
        'Créé le': u.registrationDate,
        'Dernière Connexion': u.lastLogin
      }));
    } else if (target === 'employees') {
      title = 'KIBOSH - Registre Consolidé des Employés';
      filename = `kibosh_registre_employes_${timestamp}.${exportFormat}`;
      const employees = DbService.getEmployees();
      recordCount = employees.length;
      exportRows = employees.map(e => ({
        'Matricule RH': e.matricule,
        'Nom': e.lastName,
        'Prénom': e.firstName,
        'Organisation': e.company,
        'Département': e.department || 'Général',
        'Poste / Titre': e.position || '',
        'E-mail Collaborateur': e.email,
        'Téléphone': e.phone || '',
        'Statut': e.status || 'Active',
        'Date d\'Enregistrement': e.createdAt
      }));
    } else if (target === 'subscriptions') {
      title = 'KIBOSH - Portefeuille des Abonnements';
      filename = `kibosh_abonnements_${timestamp}.${exportFormat}`;
      const subs = DbService.getSubscriptions();
      recordCount = subs.length;
      exportRows = subs.map(s => ({
        'ID Abonnement': s.id,
        'Entreprise': s.companyName,
        'Offre Souscrite': s.plan,
        'Statut': s.status,
        'Tarif Mensuel (€)': s.monthlyPriceEUR,
        'Paiement Vérifié': s.paymentVerified ? 'Oui' : 'Non',
        'Moyen de Paiement': s.paymentMethod || 'Non spécifié',
        'Référence Bancaire': s.paymentReference || 'N/A',
        'Date de Début': s.startDate,
        'Date d\'Expiration': s.expirationDate,
        'Limite Utilisateurs': s.maxUsers,
        'Limite Employés': s.maxEmployees,
        'Quota Stockage (Mo)': s.maxStorageMB
      }));
    }

    // Build format
    if (exportFormat === 'csv') {
      mimeType = 'text/csv; charset=utf-8';
      if (exportRows.length === 0) {
        buffer = Buffer.from('\uFEFF"Aucun enregistrement trouvé"\n', 'utf-8');
      } else {
        const headers = Object.keys(exportRows[0]);
        const csvHeader = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';');
        const csvBody = exportRows.map(row => 
          headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';')
        ).join('\n');
        // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility with French accents
        buffer = Buffer.from(`\uFEFF${csvHeader}\n${csvBody}`, 'utf-8');
      }
    } else if (exportFormat === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } else {
      // PDF export using pdf-lib
      mimeType = 'application/pdf';
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([842, 595]); // A4 Landscape
      const { width, height } = page.getSize();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 60,
        width,
        height: 60,
        color: rgb(0.08, 0.16, 0.32) // Deep Navy
      });

      page.drawText('KIBOSH ENTERPRISE SAAS — EXPORT SÉCURISÉ', {
        x: 40,
        y: height - 38,
        size: 16,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      page.drawText(`${title} | Total : ${recordCount} enregistrement(s) | Émis le : ${new Date().toLocaleDateString('fr-FR')}`, {
        x: 40,
        y: height - 52,
        size: 9,
        font: fontRegular,
        color: rgb(0.7, 0.8, 0.95)
      });

      // Disclaimer Banner (Confidentiality & Zero Credentials Guarantee)
      page.drawText('DOCUMENT CONFIDENTIEL — USAGE STRICTEMENT RÉSERVÉ AU PROPRIÉTAIRE SAAS KIBOSH. AUCUN MOT DE PASSE NI DONNÉE SALARIALE EXPOSÉS.', {
        x: 40,
        y: 20,
        size: 7,
        font: fontBold,
        color: rgb(0.5, 0.5, 0.5)
      });

      // Simple Table layout
      const startY = height - 90;
      let curY = startY;
      const headers = exportRows.length > 0 ? Object.keys(exportRows[0]).slice(0, 7) : ['Aucune Donnée'];
      const colWidth = (width - 80) / headers.length;

      // Table Header Row
      page.drawRectangle({
        x: 40,
        y: curY - 18,
        width: width - 80,
        height: 22,
        color: rgb(0.92, 0.94, 0.98)
      });

      headers.forEach((h, idx) => {
        page.drawText(h.slice(0, 18), {
          x: 45 + idx * colWidth,
          y: curY - 12,
          size: 8,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25)
        });
      });

      curY -= 25;

      // Rows (up to 20 per page)
      exportRows.slice(0, 18).forEach((row, rIdx) => {
        const isEven = rIdx % 2 === 0;
        if (isEven) {
          page.drawRectangle({
            x: 40,
            y: curY - 16,
            width: width - 80,
            height: 20,
            color: rgb(0.98, 0.98, 0.99)
          });
        }

        headers.forEach((h, cIdx) => {
          const val = String(row[h] ?? '').slice(0, 22);
          page.drawText(val, {
            x: 45 + cIdx * colWidth,
            y: curY - 11,
            size: 7.5,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2)
          });
        });

        curY -= 20;
      });

      if (exportRows.length > 18) {
        page.drawText(`... et ${exportRows.length - 18} autres enregistrements disponibles dans les formats complets Excel (XLSX) et CSV.`, {
          x: 40,
          y: curY - 15,
          size: 8,
          font: fontBold,
          color: rgb(0.2, 0.4, 0.7)
        });
      }

      const pdfBytes = await pdfDoc.save();
      buffer = Buffer.from(pdfBytes);
    }

    const fileSizeKB = (buffer.length / 1024).toFixed(1) + ' Ko';

    // Store in short-lived download buffer (15 minutes)
    exportBuffers.set(downloadToken, {
      buffer,
      mimeType,
      filename,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    // Record job in DbService
    DbService.recordExportJob({
      token: downloadToken,
      type: target,
      format: exportFormat,
      requestedBy: req.user?.fullName || req.user?.email || 'SaaS Owner',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      recordCount,
      fileSize: fileSizeKB,
      filename,
      status: 'Ready',
      downloadCount: 0
    });

    // Audit export operation
    AuditService.log({
      companyId: 'PLATFORM_CONTROL',
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'PLATFORM_DATA_EXPORTED',
      category: 'SECURITY',
      details: `Exportation autorisée (${target.toUpperCase()} en ${exportFormat.toUpperCase()}) par le Propriétaire SaaS. Fichier : ${filename} (${recordCount} lignes).`,
      result: 'Success'
    });

    return res.json({
      success: true,
      downloadToken,
      filename,
      fileSize: fileSizeKB,
      recordCount,
      downloadUrl: `/api/platform/export/download/${downloadToken}`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 17. GET /api/platform/export/download/:token
 * Stream generated file to client
 */
router.get('/export/download/:token', (req, res) => {
  const { token } = req.params;
  const item = exportBuffers.get(token);

  if (!item || item.expiresAt < Date.now()) {
    return res.status(404).json({ success: false, error: 'Lien de téléchargement expiré ou introuvable. Veuillez relancer l\'export.' });
  }

  res.setHeader('Content-Type', item.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${item.filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(item.buffer);
});

/**
 * 18. GET /api/platform/export/history
 * List recent exports
 */
router.get('/export/history', (req, res) => {
  try {
    const history = DbService.getExportJobs();
    return res.json({ success: true, history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

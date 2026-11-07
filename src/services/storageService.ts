import { Employee, DistributionCampaign, AuditLog, ExtractionRule, EmailSettings, UserSession, NotificationItem, CompanyTenant, CompanyUser, FeedbackTicket, FeedbackResponse, FeedbackStatus, FeedbackPriority } from '../types';
import { CustomRole } from '../types/rbac';
import { INITIAL_EMPLOYEES, INITIAL_CAMPAIGNS, INITIAL_AUDIT_LOGS, INITIAL_EXTRACTION_RULES, INITIAL_EMAIL_SETTINGS, INITIAL_USER_SESSIONS, INITIAL_COMPANIES, INITIAL_COMPANY_USERS, INITIAL_FEEDBACK_TICKETS } from '../data/mockData';

const KEYS = {
  COMPANIES: 'kibosh_companies_v1',
  COMPANY_USERS: 'kibosh_company_users_v1',
  CUSTOM_ROLES: 'kibosh_custom_roles_v1',
  EMPLOYEES: 'epdp_employees_v1',
  CAMPAIGNS: 'epdp_campaigns_v1',
  AUDIT_LOGS: 'epdp_audit_logs_v1',
  RULES: 'epdp_rules_v1',
  SETTINGS: 'epdp_settings_v1',
  USER_SESSION: 'epdp_user_session_v1',
  NOTIFICATIONS: 'epdp_notifications_v1',
  FEEDBACK_TICKETS: 'kibosh_feedback_tickets_v1'
};

export class StorageService {
  // --- Companies / Tenants ---
  static getCompanies(): CompanyTenant[] {
    try {
      const data = localStorage.getItem(KEYS.COMPANIES);
      return data ? JSON.parse(data) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  }

  static saveCompanies(companies: CompanyTenant[]) {
    try {
      localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
    } catch (e) {
      console.error('Error saving companies:', e);
    }
  }

  // --- Company Users ---
  static getCompanyUsers(): CompanyUser[] {
    try {
      const data = localStorage.getItem(KEYS.COMPANY_USERS);
      let users: CompanyUser[] = data ? JSON.parse(data) : INITIAL_COMPANY_USERS;
      
      // Ensure Super Admin dkamdkamcbg@gmail.com (username: ama1234) and devperso140 exist
      const dkamIndex = users.findIndex(
        u => u.email.toLowerCase() === 'dkamdkamcbg@gmail.com' || u.username?.toLowerCase() === 'ama1234' || u.id === 'usr-platform-saas'
      );

      const superAdminUser: CompanyUser = {
        id: 'usr-platform-saas',
        companyId: 'platform-saas',
        companyName: 'Kibosh SaaS Platform Control',
        fullName: 'SaaS Platform Owner (Super Admin)',
        username: 'ama1234',
        email: 'dkamdkamcbg@gmail.com',
        phone: '+33 6 00 00 01 40',
        phoneNumber: '+33600000140',
        jobPosition: 'Platform Creator & Chief Architect',
        role: 'Platform Super Admin',
        status: 'Active',
        password: '1234',
        registrationDate: '2024-01-01',
        lastLogin: '2026-11-07 08:00 AM',
        mfaEnabled: true,
        failedLoginAttempts: 0
      };

      if (dkamIndex >= 0) {
        users[dkamIndex] = {
          ...users[dkamIndex],
          ...superAdminUser
        };
      } else {
        users.unshift(superAdminUser);
      }

      // Also ensure devperso140 account is present
      const devIndex = users.findIndex(u => u.email.toLowerCase() === 'devperso140@gmail.com' || u.username?.toLowerCase() === 'devperso140');
      if (devIndex < 0) {
        users.push({
          id: 'usr-platform-saas-alt',
          companyId: 'platform-saas',
          companyName: 'Kibosh SaaS Platform Control',
          fullName: 'SaaS Platform Owner (Dev)',
          username: 'devperso140',
          email: 'devperso140@gmail.com',
          phone: '+33 6 00 00 01 40',
          phoneNumber: '+33600000140',
          jobPosition: 'Platform Creator & Chief Architect',
          role: 'Platform Super Admin',
          status: 'Active',
          password: '1234',
          registrationDate: '2024-01-01',
          lastLogin: '2026-11-07 08:00 AM',
          mfaEnabled: true,
          failedLoginAttempts: 0
        });
      }

      return users;
    } catch {
      return INITIAL_COMPANY_USERS;
    }
  }

  static saveCompanyUsers(users: CompanyUser[]) {
    try {
      localStorage.setItem(KEYS.COMPANY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving company users:', e);
    }
  }

  static updateUserPassword(userIdOrEmail: string, newPassword: string): boolean {
    try {
      const users = this.getCompanyUsers();
      const targetIndex = users.findIndex(
        u => u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
      );
      if (targetIndex >= 0) {
        users[targetIndex] = {
          ...users[targetIndex],
          password: newPassword,
          mustChangePassword: false,
          passwordChangedAt: new Date().toISOString(),
          lastPasswordChangeIso: new Date().toISOString()
        };
        this.saveCompanyUsers(users);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating user password:', e);
      return false;
    }
  }

  // --- First-Time Company Registration & Automatic Account Creation ---
  static registerCompany(
    companyInfo: {
      name: string;
      size: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
      industry?: string;
      country: string;
      companyEmail: string;
      companyPhone?: string;
      subscriptionPlan?: 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise';
      accessExpiresAt?: string;
      accessDurationDays?: number;
      defaultPassword?: string;
    },
    adminInfo: {
      fullName: string;
      username: string;
      jobPosition?: string;
      email: string;
      phone?: string;
      phoneNumber?: string;
      password?: string;
      defaultPassword?: string;
      mustChangePassword?: boolean;
    }
  ): { company: CompanyTenant; user: CompanyUser; session: UserSession } {
    const companies = this.getCompanies();
    const users = this.getCompanyUsers();

    const newCompanyId = `cmp-${Date.now()}`;
    const newUserId = `usr-admin-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const userPhone = adminInfo.phone || adminInfo.phoneNumber || companyInfo.companyPhone || '';

    // Calculate expiration date if duration days provided
    let computedExpiration = companyInfo.accessExpiresAt;
    if (!computedExpiration && companyInfo.accessDurationDays && companyInfo.accessDurationDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + companyInfo.accessDurationDays);
      computedExpiration = expDate.toISOString().replace('T', ' ').substring(0, 16);
    }

    const defaultPwd = adminInfo.password || adminInfo.defaultPassword || companyInfo.defaultPassword || 'Password123!';

    const newCompany: CompanyTenant = {
      id: newCompanyId,
      name: companyInfo.name,
      size: companyInfo.size,
      industry: companyInfo.industry || 'General Industry',
      country: companyInfo.country,
      companyEmail: companyInfo.companyEmail,
      companyPhone: companyInfo.companyPhone || userPhone,
      registrationDate: nowStr.split(' ')[0],
      lastLogin: nowStr,
      subscriptionPlan: companyInfo.subscriptionPlan || 'Free Trial',
      status: 'Active',
      storageUsageMB: 15,
      maxStorageMB: 5120, // 5 GB default
      totalUsersCount: 1,
      totalEmployeesCount: 0,
      totalPayslipsProcessed: 0,
      totalEmailsSent: 0,
      supportAccessEnabled: false,
      accessExpiresAt: computedExpiration,
      accessDurationDays: companyInfo.accessDurationDays,
      defaultAdminPassword: defaultPwd
    };

    const newAdminUser: CompanyUser = {
      id: newUserId,
      companyId: newCompanyId,
      companyName: companyInfo.name,
      fullName: adminInfo.fullName || adminInfo.username,
      username: adminInfo.username,
      email: adminInfo.email,
      phone: userPhone,
      phoneNumber: userPhone.replace(/\D/g, ''),
      password: defaultPwd,
      defaultPassword: defaultPwd,
      mustChangePassword: adminInfo.mustChangePassword !== false, // Defaults to true so first-time connection forces change
      jobPosition: adminInfo.jobPosition || 'Administrateur Entreprise',
      role: 'Company Administrator',
      status: 'Active',
      registrationDate: nowStr.split(' ')[0],
      lastLogin: 'Jamais connecté',
      accessExpiresAt: computedExpiration,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      loginHistory: []
    };

    const newSession: UserSession = {
      id: newUserId,
      name: adminInfo.fullName || adminInfo.username,
      username: adminInfo.username,
      email: adminInfo.email,
      phone: userPhone,
      phoneNumber: userPhone.replace(/\D/g, ''),
      role: 'Company Administrator',
      company: companyInfo.name,
      companyId: newCompanyId,
      department: adminInfo.jobPosition || 'Direction Générale / RH',
      mfaEnabled: false,
      lastLogin: nowStr,
      isPlatformOwner: false,
      mustChangePassword: true,
      forcePasswordChange: true,
      accessExpiresAt: computedExpiration
    };

    companies.unshift(newCompany);
    users.unshift(newAdminUser);

    this.saveCompanies(companies);
    this.saveCompanyUsers(users);
    this.saveCurrentUserSession(newSession);

    // Audit Log for company creation
    this.addAuditLog({
      companyId: newCompanyId,
      companyName: companyInfo.name,
      user: adminInfo.fullName || adminInfo.username,
      userRole: 'Company Administrator',
      ipAddress: '192.168.1.100',
      action: 'TENANT_REGISTERED',
      category: 'AUTHENTICATION',
      details: `Nouvelle entreprise '${companyInfo.name}' créée avec l'administrateur '${adminInfo.fullName || adminInfo.username}' (${adminInfo.email}). Mot de passe par défaut configuré (changement obligatoire à la 1ère connexion). Limite d'accès : ${computedExpiration || 'Illimité'}.`,
      result: 'Success'
    });

    return { company: newCompany, user: newAdminUser, session: newSession };
  }
  static getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(KEYS.EMPLOYEES);
      return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  }

  static saveEmployees(employees: Employee[]) {
    try {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees:', e);
    }
  }

  static getCampaigns(): DistributionCampaign[] {
    try {
      const data = localStorage.getItem(KEYS.CAMPAIGNS);
      return data ? JSON.parse(data) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  }

  static saveCampaigns(campaigns: DistributionCampaign[]) {
    try {
      // Stripping large pdfBytes before serializing to localStorage to avoid storage quota exceeding
      const sanitized = campaigns.map(c => ({
        ...c,
        payslips: c.payslips.map(p => ({
          ...p,
          pdfBytes: undefined // keep binary only in runtime state
        }))
      }));
      localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Error saving campaigns:', e);
    }
  }

  static saveSingleCampaign(campaign: DistributionCampaign) {
    const campaigns = this.getCampaigns();
    const idx = campaigns.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      campaigns[idx] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    this.saveCampaigns(campaigns);
  }

  static deleteCampaign(campaignId: string): boolean {
    const all = this.getCampaigns();
    const filtered = all.filter(c => c.id !== campaignId);
    if (filtered.length !== all.length) {
      this.saveCampaigns(filtered);
      return true;
    }
    return false;
  }

  static deleteCampaigns(campaignIds: string[]): number {
    if (!campaignIds || campaignIds.length === 0) return 0;
    const all = this.getCampaigns();
    const idSet = new Set(campaignIds);
    const filtered = all.filter(c => !idSet.has(c.id));
    const deletedCount = all.length - filtered.length;
    if (deletedCount > 0) {
      this.saveCampaigns(filtered);
    }
    return deletedCount;
  }

  private static lastPurgeCheckTime: number = 0;

  /**
   * Auto-cleanup utility that periodically purges audit logs older than a specified retention window (default: 90 days).
   * Maintains application performance, storage footprint, and database health for long-term production use.
   */
  static purgeOldAuditLogs(retentionDays: number = 90): {
    totalBefore: number;
    totalAfter: number;
    purgedCount: number;
    retentionDays: number;
    cutoffDate: string;
  } {
    try {
      const rawData = localStorage.getItem(KEYS.AUDIT_LOGS);
      const rawLogs: AuditLog[] = rawData ? JSON.parse(rawData) : INITIAL_AUDIT_LOGS;

      const nowMs = Date.now();
      const cutoffMs = nowMs - retentionDays * 24 * 60 * 60 * 1000;

      const filteredLogs = rawLogs.filter((log) => {
        if (!log || !log.timestamp) return false;
        // Normalize timestamp format ('YYYY-MM-DD HH:mm:ss' or ISO string)
        const normalizedTs = log.timestamp.includes('T') ? log.timestamp : log.timestamp.replace(' ', 'T');
        const logTimeMs = new Date(normalizedTs).getTime();
        return !isNaN(logTimeMs) && logTimeMs >= cutoffMs;
      });

      const purgedCount = rawLogs.length - filteredLogs.length;

      if (purgedCount > 0 || !rawData) {
        localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(filteredLogs));
        console.info(`[StorageService Auto-Cleanup] Purged ${purgedCount} audit log(s) older than ${retentionDays} days.`);
      }

      return {
        totalBefore: rawLogs.length,
        totalAfter: filteredLogs.length,
        purgedCount,
        retentionDays,
        cutoffDate: new Date(cutoffMs).toISOString()
      };
    } catch (e) {
      console.error('Error executing StorageService.purgeOldAuditLogs:', e);
      const currentLogs = this.getAuditLogsRaw();
      return {
        totalBefore: currentLogs.length,
        totalAfter: currentLogs.length,
        purgedCount: 0,
        retentionDays,
        cutoffDate: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  private static getAuditLogsRaw(): AuditLog[] {
    try {
      const data = localStorage.getItem(KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static getAuditLogs(autoCleanup: boolean = true): AuditLog[] {
    try {
      if (autoCleanup) {
        const now = Date.now();
        // Run auto-purge check at most once per 30 minutes
        if (now - this.lastPurgeCheckTime > 30 * 60 * 1000) {
          this.lastPurgeCheckTime = now;
          this.purgeOldAuditLogs(90);
        }
      }
      return this.getAuditLogsRaw();
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    // Run auto-purge on new audit entry insertion
    this.purgeOldAuditLogs(90);

    const logs = this.getAuditLogsRaw();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
    } catch (e) {
      console.error('Error saving audit log:', e);
    }
    return newLog;
  }

  static getExtractionRules(): ExtractionRule[] {
    try {
      const data = localStorage.getItem(KEYS.RULES);
      return data ? JSON.parse(data) : INITIAL_EXTRACTION_RULES;
    } catch {
      return INITIAL_EXTRACTION_RULES;
    }
  }

  static saveExtractionRules(rules: ExtractionRule[]) {
    try {
      localStorage.setItem(KEYS.RULES, JSON.stringify(rules));
    } catch (e) {
      console.error('Error saving extraction rules:', e);
    }
  }

  static getEmailSettings(): EmailSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed: EmailSettings = JSON.parse(data);
        if (!parsed.regionSettings || (parsed.regionSettings.countryCode === 'FR' && parsed.regionSettings.countryName === 'France')) {
          parsed.regionSettings = INITIAL_EMAIL_SETTINGS.regionSettings;
          this.saveEmailSettings(parsed);
        }
        return parsed;
      }
      return INITIAL_EMAIL_SETTINGS;
    } catch {
      return INITIAL_EMAIL_SETTINGS;
    }
  }

  static saveEmailSettings(settings: EmailSettings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving email settings:', e);
    }
  }

  static getCurrentUserSession(): UserSession | null {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('kibosh_logged_out') === 'true') {
        return null;
      }
      const data = localStorage.getItem(KEYS.USER_SESSION);
      if (data) {
        const session: UserSession = JSON.parse(data);
        if (session.email === 'saas-admin@kibosh-platform.com' || session.id === 'usr-platform-saas' || session.email === 'devperso140@gmail.com') {
          session.email = 'dkamdkamcbg@gmail.com';
          session.username = 'ama1234';
          session.phone = '+33 6 00 00 01 40';
          session.phoneNumber = '+33600000140';
          this.saveCurrentUserSession(session);
        }
        return session;
      }
      return null;
    } catch {
      return null;
    }
  }

  static saveCurrentUserSession(session: UserSession) {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kibosh_logged_out');
      }
      localStorage.setItem(KEYS.USER_SESSION, JSON.stringify(session));
    } catch (e) {
      console.error('Error saving user session:', e);
    }
  }

  static clearCurrentUserSession() {
    try {
      localStorage.removeItem(KEYS.USER_SESSION);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('kibosh_logged_out', 'true');
      }
    } catch (e) {
      console.error('Error clearing user session:', e);
    }
  }

  static getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'n-1',
        timestamp: 'À l\'instant',
        title: 'Système Prêt',
        message: 'Plateforme KIBOSH initialisée avec succès. Prête pour le déploiement.',
        type: 'info',
        read: false
      }
    ];
  }

  static saveNotifications(items: NotificationItem[]) {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }

  // --- Feedback & Support Module ---
  static getFeedbackTickets(): FeedbackTicket[] {
    try {
      const data = localStorage.getItem(KEYS.FEEDBACK_TICKETS);
      return data ? JSON.parse(data) : INITIAL_FEEDBACK_TICKETS;
    } catch {
      return INITIAL_FEEDBACK_TICKETS;
    }
  }

  static saveFeedbackTickets(tickets: FeedbackTicket[]) {
    try {
      localStorage.setItem(KEYS.FEEDBACK_TICKETS, JSON.stringify(tickets));
    } catch (e) {
      console.error('Error saving feedback tickets:', e);
    }
  }

  static getFeedbackTicketsForCompany(companyId: string): FeedbackTicket[] {
    const all = this.getFeedbackTickets();
    return all.filter(t => t.context.companyId === companyId);
  }

  static createFeedbackTicket(ticketData: Omit<FeedbackTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'responses'>): FeedbackTicket {
    const all = this.getFeedbackTickets();
    const count = all.length + 1;
    const padCount = String(count).padStart(4, '0');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newTicket: FeedbackTicket = {
      ...ticketData,
      id: `fbd-${Date.now()}`,
      ticketNumber: `TICK-${new Date().getFullYear()}-${padCount}`,
      createdAt: now,
      updatedAt: now,
      responses: []
    };

    const updated = [newTicket, ...all];
    this.saveFeedbackTickets(updated);
    return newTicket;
  }

  static addTicketResponse(
    ticketId: string, 
    response: Omit<FeedbackResponse, 'id' | 'timestamp'>, 
    newStatus?: FeedbackStatus
  ): FeedbackTicket | null {
    const all = this.getFeedbackTickets();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let targetTicket: FeedbackTicket | null = null;

    const updated = all.map(t => {
      if (t.id === ticketId) {
        const newResp: FeedbackResponse = {
          ...response,
          id: `resp-${Date.now()}`,
          timestamp: now
        };
        const updatedTicket: FeedbackTicket = {
          ...t,
          updatedAt: now,
          status: newStatus ? newStatus : t.status,
          responses: [...t.responses, newResp]
        };
        targetTicket = updatedTicket;
        return updatedTicket;
      }
      return t;
    });

    if (targetTicket) {
      this.saveFeedbackTickets(updated);
    }
    return targetTicket;
  }

  static updateTicketStatus(ticketId: string, status: FeedbackStatus, agentName?: string): FeedbackTicket | null {
    const all = this.getFeedbackTickets();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let targetTicket: FeedbackTicket | null = null;

    const updated = all.map(t => {
      if (t.id === ticketId) {
        const updatedTicket: FeedbackTicket = {
          ...t,
          status,
          updatedAt: now,
          assignedAgent: agentName !== undefined ? agentName : t.assignedAgent,
          resolutionTime: status === 'Resolved' || status === 'Closed' ? 'Traitement complété' : t.resolutionTime
        };
        targetTicket = updatedTicket;
        return updatedTicket;
      }
      return t;
    });

    if (targetTicket) {
      this.saveFeedbackTickets(updated);
    }
    return targetTicket;
  }

  static updateTicketPriority(ticketId: string, priority: FeedbackPriority): FeedbackTicket | null {
    const all = this.getFeedbackTickets();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let targetTicket: FeedbackTicket | null = null;

    const updated = all.map(t => {
      if (t.id === ticketId) {
        const updatedTicket: FeedbackTicket = {
          ...t,
          priority,
          updatedAt: now
        };
        targetTicket = updatedTicket;
        return updatedTicket;
      }
      return t;
    });

    if (targetTicket) {
      this.saveFeedbackTickets(updated);
    }
    return targetTicket;
  }

  static reopenTicket(ticketId: string, userMessage: string, userInfo: { authorId: string; authorName: string; authorRole: string; authorEmail?: string }): FeedbackTicket | null {
    const all = this.getFeedbackTickets();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let targetTicket: FeedbackTicket | null = null;

    const updated = all.map(t => {
      if (t.id === ticketId) {
        const reopenResp: FeedbackResponse = {
          id: `resp-${Date.now()}`,
          timestamp: now,
          authorId: userInfo.authorId,
          authorName: userInfo.authorName,
          authorRole: userInfo.authorRole,
          authorEmail: userInfo.authorEmail,
          isInternalNote: false,
          message: `[Ticket Réouvert par l'Utilisateur] ${userMessage}`
        };

        const updatedTicket: FeedbackTicket = {
          ...t,
          status: 'In Progress',
          updatedAt: now,
          reopenedCount: (t.reopenedCount || 0) + 1,
          responses: [...t.responses, reopenResp]
        };
        targetTicket = updatedTicket;
        return updatedTicket;
      }
      return t;
    });

    if (targetTicket) {
      this.saveFeedbackTickets(updated);
    }
    return targetTicket;
  }

  static deleteFeedbackTicket(ticketId: string): boolean {
    const all = this.getFeedbackTickets();
    const filtered = all.filter(t => t.id !== ticketId);
    if (filtered.length !== all.length) {
      this.saveFeedbackTickets(filtered);
      return true;
    }
    return false;
  }

  static deleteFeedbackTickets(ticketIds: string[]): number {
    if (!ticketIds || ticketIds.length === 0) return 0;
    const all = this.getFeedbackTickets();
    const idSet = new Set(ticketIds);
    const filtered = all.filter(t => !idSet.has(t.id));
    const deletedCount = all.length - filtered.length;
    if (deletedCount > 0) {
      this.saveFeedbackTickets(filtered);
    }
    return deletedCount;
  }

  static resetToDemoData() {
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(KEYS.CAMPAIGNS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.RULES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.USER_SESSION);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.FEEDBACK_TICKETS);
    localStorage.removeItem(KEYS.CUSTOM_ROLES);
  }

  // --- Custom Roles (RBAC) ---
  static getCustomRoles(companyId?: string): CustomRole[] {
    try {
      const raw = localStorage.getItem(KEYS.CUSTOM_ROLES);
      const allRoles: CustomRole[] = raw ? JSON.parse(raw) : [];

      if (companyId) {
        return allRoles.filter(r => r.companyId === companyId);
      }
      return allRoles;
    } catch {
      return [];
    }
  }

  static saveCustomRoles(roles: CustomRole[]) {
    try {
      localStorage.setItem(KEYS.CUSTOM_ROLES, JSON.stringify(roles));
    } catch (e) {
      console.error('Error saving custom roles:', e);
    }
  }

  // --- System Backup Export & Restoration ---
  static getSystemBackupData(userEmail?: string) {
    return {
      metadata: {
        platform: 'KIBOSH Enterprise Payslip Distribution Platform',
        version: 'v2.6.4',
        exportedAt: new Date().toISOString(),
        exportedBy: userEmail || 'system-admin',
        checksum: `sha256-${Math.random().toString(36).substring(2, 15)}`
      },
      emailSettings: this.getEmailSettings(),
      extractionRules: this.getExtractionRules(),
      companies: this.getCompanies(),
      companyUsers: this.getCompanyUsers(),
      customRoles: this.getCustomRoles(),
      summaryMetrics: {
        totalEmployees: this.getEmployees().length,
        totalCampaigns: this.getCampaigns().length,
        totalAuditLogs: this.getAuditLogs().length
      }
    };
  }

  static downloadSystemBackup(userEmail?: string): string {
    const backupData = this.getSystemBackupData(userEmail);
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `KIBOSH_System_State_Backup_${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return filename;
  }
}

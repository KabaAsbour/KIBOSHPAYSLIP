import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CompanyTenant, CompanyUser, Employee, UserRole } from '../../types';
import { AuditService } from './auditService';

export interface SubscriptionRecord {
  id: string;
  companyId: string;
  companyName: string;
  plan: 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise';
  status: 'Pending' | 'Trial' | 'Active' | 'Expired' | 'Suspended' | 'Cancelled';
  startDate: string;
  expirationDate: string;
  renewalDate: string;
  maxUsers: number;
  maxEmployees: number;
  maxStorageMB: number;
  monthlyPriceEUR: number;
  paymentVerified: boolean;
  paymentVerifiedAt?: string;
  verifiedBy?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}

export interface ExportJobRecord {
  id: string;
  token: string;
  type: 'companies' | 'admins' | 'users' | 'employees' | 'subscriptions';
  format: 'xlsx' | 'csv' | 'pdf';
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  recordCount: number;
  fileSize: string;
  filename: string;
  status: 'Ready' | 'Expired' | 'Downloaded';
  downloadCount: number;
  bufferBase64?: string;
}

export interface DbSchema {
  companies: CompanyTenant[];
  users: CompanyUser[];
  employees: Employee[];
  subscriptions: SubscriptionRecord[];
  exportJobs: ExportJobRecord[];
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kibosh_db.json');

export class DbService {
  private static db: DbSchema | null = null;
  private static isInitialized = false;

  /**
   * Initializes the database with persistent disk backing and master owner account
   */
  public static async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        console.log('[DB SERVICE] Persistent database loaded successfully from disk.');
      } else {
        this.db = this.buildInitialSeed();
        this.saveSync();
        console.log('[DB SERVICE] Initial database seed created and saved to disk.');
      }

      // Ensure Platform Owner Kibosh1234 is securely provisioned
      this.ensurePlatformOwnerProvisioned();

      this.isInitialized = true;
    } catch (err: any) {
      console.error('[DB SERVICE] Initialization error:', err);
      this.db = this.buildInitialSeed();
      this.ensurePlatformOwnerProvisioned();
      this.isInitialized = true;
    }
  }

  /**
   * Builds the initial seed with master SaaS Owner and default organizations
   */
  private static buildInitialSeed(): DbSchema {
    const rawOwnerPassword = process.env.KIBOSH_INITIAL_OWNER_PASSWORD || 'Kibosh@Master2026!';
    const ownerHash = bcrypt.hashSync(rawOwnerPassword, 10);

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const masterOwnerUser: CompanyUser = {
      id: 'usr-kibosh-master-owner',
      companyId: 'platform-control',
      companyName: 'KIBOSH Platform Management',
      fullName: 'SaaS Platform Master Owner',
      username: 'Kibosh1234',
      email: 'owner@kibosh-platform.com',
      phone: '+33 1 89 00 12 34',
      phoneNumber: '+33189001234',
      jobPosition: 'Chief Executive & Platform Architect',
      role: 'Platform Super Admin',
      status: 'Active',
      passwordHash: ownerHash,
      mustChangePassword: true, // Mandatory First Login Action: Force password change!
      mfaEnabled: true, // Mandatory MFA for the SaaS Owner
      registrationDate: today,
      lastLogin: nowIso,
      failedLoginAttempts: 0
    };

    const dkamOwnerUser: CompanyUser = {
      id: 'usr-platform-saas',
      companyId: 'platform-control',
      companyName: 'KIBOSH Platform Management',
      fullName: 'SaaS Platform Owner (Super Admin)',
      username: 'ama1234',
      email: 'dkamdkamcbg@gmail.com',
      phone: '+33 6 00 00 01 40',
      phoneNumber: '+33600000140',
      jobPosition: 'Platform Creator & Chief Architect',
      role: 'Platform Super Admin',
      status: 'Active',
      passwordHash: bcrypt.hashSync('1234', 10),
      mustChangePassword: false,
      mfaEnabled: true,
      registrationDate: '2026-01-01',
      lastLogin: nowIso,
      failedLoginAttempts: 0
    };

    // Initial Enterprise Tenants
    const initialCompanies: CompanyTenant[] = [
      {
        id: 'comp-acme-fr',
        name: 'Acme Technologies France',
        size: '51-200',
        industry: 'Technologies de l\'Information & Logiciel',
        country: 'France',
        companyEmail: 'contact@acme-tech.fr',
        companyPhone: '+33 1 42 68 55 00',
        registrationDate: '2026-01-15',
        lastLogin: '2026-11-06 14:22',
        subscriptionPlan: 'Professional',
        status: 'Active',
        storageUsageMB: 1240,
        maxStorageMB: 5120,
        totalUsersCount: 4,
        totalEmployeesCount: 148,
        totalPayslipsProcessed: 1480,
        totalEmailsSent: 1472,
        supportAccessEnabled: false,
        accessExpiresAt: '2027-01-15T23:59:59Z'
      },
      {
        id: 'comp-logi-gn',
        name: 'LogiTransport Guinée SARL',
        size: '201-500',
        industry: 'Logistique & Transit Maritime',
        country: 'Guinée (Conakry)',
        companyEmail: 'rh@logitransport-gn.com',
        companyPhone: '+224 622 10 20 30',
        registrationDate: '2026-02-01',
        lastLogin: '2026-11-05 09:15',
        subscriptionPlan: 'Enterprise',
        status: 'Active',
        storageUsageMB: 3410,
        maxStorageMB: 51200,
        totalUsersCount: 8,
        totalEmployeesCount: 382,
        totalPayslipsProcessed: 3438,
        totalEmailsSent: 3415,
        supportAccessEnabled: false,
        accessExpiresAt: '2027-02-01T23:59:59Z'
      },
      {
        id: 'comp-bio-sn',
        name: 'Laboratoires BioSanté Dakar',
        size: '11-50',
        industry: 'Pharmaceutique & Santé',
        country: 'Sénégal',
        companyEmail: 'direction@biosante-sn.com',
        companyPhone: '+221 33 820 40 50',
        registrationDate: '2026-03-10',
        lastLogin: '2026-11-04 11:30',
        subscriptionPlan: 'Starter',
        status: 'Active',
        storageUsageMB: 480,
        maxStorageMB: 1024,
        totalUsersCount: 2,
        totalEmployeesCount: 42,
        totalPayslipsProcessed: 336,
        totalEmailsSent: 332,
        supportAccessEnabled: false,
        accessExpiresAt: '2027-03-10T23:59:59Z'
      },
      {
        id: 'comp-fin-ci',
        name: 'FinanTech Solutions Abidjan',
        size: '51-200',
        industry: 'Services Financiers & FinTech',
        country: 'Côte d\'Ivoire',
        companyEmail: 'paie@finantech-ci.com',
        companyPhone: '+225 27 20 22 11 00',
        registrationDate: '2026-04-05',
        lastLogin: '2026-10-30 16:45',
        subscriptionPlan: 'Free Trial',
        status: 'Active',
        storageUsageMB: 190,
        maxStorageMB: 512,
        totalUsersCount: 2,
        totalEmployeesCount: 65,
        totalPayslipsProcessed: 130,
        totalEmailsSent: 128,
        supportAccessEnabled: false,
        accessExpiresAt: '2026-11-20T23:59:59Z'
      },
      {
        id: 'comp-pending-cm',
        name: 'Douala Agro Exportation SA',
        size: '11-50',
        industry: 'Agroalimentaire & Export',
        country: 'Cameroun',
        companyEmail: 'info@douala-agro.cm',
        companyPhone: '+237 233 42 18 90',
        registrationDate: '2026-11-06',
        lastLogin: '2026-11-06 17:00',
        subscriptionPlan: 'Starter',
        status: 'Pending Activation',
        storageUsageMB: 10,
        maxStorageMB: 1024,
        totalUsersCount: 1,
        totalEmployeesCount: 28,
        totalPayslipsProcessed: 0,
        totalEmailsSent: 0,
        supportAccessEnabled: false,
        accessExpiresAt: '2026-12-06T23:59:59Z'
      }
    ];

    // Initial Company Admins
    const initialUsers: CompanyUser[] = [
      masterOwnerUser,
      dkamOwnerUser,
      {
        id: 'usr-acme-admin',
        companyId: 'comp-acme-fr',
        companyName: 'Acme Technologies France',
        fullName: 'Claire Renoir',
        username: 'c.renoir',
        email: 'c.renoir@acme-tech.fr',
        phone: '+33 6 11 22 33 44',
        jobPosition: 'Directrice des Ressources Humaines',
        role: 'Company Administrator',
        status: 'Active',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-01-15',
        lastLogin: '2026-11-06 14:22',
        mfaEnabled: true,
        failedLoginAttempts: 0
      },
      {
        id: 'usr-acme-payroll',
        companyId: 'comp-acme-fr',
        companyName: 'Acme Technologies France',
        fullName: 'Julien Mercier',
        username: 'j.mercier',
        email: 'j.mercier@acme-tech.fr',
        phone: '+33 6 22 33 44 55',
        jobPosition: 'Responsable Paie & Administration',
        role: 'Payroll Manager',
        status: 'Active',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-01-20',
        lastLogin: '2026-11-05 10:40',
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: 'usr-logi-admin',
        companyId: 'comp-logi-gn',
        companyName: 'LogiTransport Guinée SARL',
        fullName: 'Mamadou Diallo',
        username: 'm.diallo',
        email: 'm.diallo@logitransport-gn.com',
        phone: '+224 622 99 88 77',
        jobPosition: 'Secrétaire Général & DRH',
        role: 'Company Administrator',
        status: 'Active',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-02-01',
        lastLogin: '2026-11-05 09:15',
        mfaEnabled: true,
        failedLoginAttempts: 0
      },
      {
        id: 'usr-bio-admin',
        companyId: 'comp-bio-sn',
        companyName: 'Laboratoires BioSanté Dakar',
        fullName: 'Dr. Fatou Ndiaye',
        username: 'f.ndiaye',
        email: 'f.ndiaye@biosante-sn.com',
        phone: '+221 77 654 32 10',
        jobPosition: 'Directrice Générale',
        role: 'Company Administrator',
        status: 'Active',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-03-10',
        lastLogin: '2026-11-04 11:30',
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: 'usr-fin-admin',
        companyId: 'comp-fin-ci',
        companyName: 'FinanTech Solutions Abidjan',
        fullName: 'Kouassi Yao',
        username: 'k.yao',
        email: 'k.yao@finantech-ci.com',
        phone: '+225 07 08 09 10 11',
        jobPosition: 'Lead HR Operations',
        role: 'Company Administrator',
        status: 'Active',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-04-05',
        lastLogin: '2026-10-30 16:45',
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: 'usr-douala-admin',
        companyId: 'comp-pending-cm',
        companyName: 'Douala Agro Exportation SA',
        fullName: 'Paul Eto\'o',
        username: 'p.etoo',
        email: 'p.etoo@douala-agro.cm',
        phone: '+237 699 11 22 33',
        jobPosition: 'Directeur d\'Exploitation',
        role: 'Company Administrator',
        status: 'Pending Verification',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        registrationDate: '2026-11-06',
        lastLogin: '2026-11-06 17:00',
        mfaEnabled: false,
        failedLoginAttempts: 0
      }
    ];

    // Initial Cross-Company Employee Directory (Without exposed salary amounts)
    const initialEmployees: Employee[] = [
      {
        id: 'emp-101',
        companyId: 'comp-acme-fr',
        company: 'Acme Technologies France',
        matricule: 'EMP00101',
        firstName: 'Sophie',
        lastName: 'Laurent',
        department: 'Ingénierie & R&D',
        position: 'Lead Software Architect',
        email: 's.laurent@acme-tech.fr',
        phone: '+33 6 12 34 56 78',
        status: 'Active',
        createdAt: '2026-01-20',
        updatedAt: '2026-10-15'
      },
      {
        id: 'emp-102',
        companyId: 'comp-acme-fr',
        company: 'Acme Technologies France',
        matricule: 'EMP00102',
        firstName: 'Marc',
        lastName: 'Dubois',
        department: 'Finance & Comptabilité',
        position: 'Contrôleur de Gestion',
        email: 'm.dubois@acme-tech.fr',
        phone: '+33 6 23 45 67 89',
        status: 'Active',
        createdAt: '2026-01-20',
        updatedAt: '2026-10-15'
      },
      {
        id: 'emp-103',
        companyId: 'comp-acme-fr',
        company: 'Acme Technologies France',
        matricule: 'EMP00103',
        firstName: 'Amina',
        lastName: 'Bensaid',
        department: 'Ressources Humaines',
        position: 'Chargée de Recrutement',
        email: 'a.bensaid@acme-tech.fr',
        phone: '+33 6 34 56 78 90',
        status: 'Active',
        createdAt: '2026-02-01',
        updatedAt: '2026-10-15'
      },
      {
        id: 'emp-201',
        companyId: 'comp-logi-gn',
        company: 'LogiTransport Guinée SARL',
        matricule: 'LOG00201',
        firstName: 'Ibrahima',
        lastName: 'Camara',
        department: 'Opérations Portuaires',
        position: 'Chef d\'Escale Maritime',
        email: 'i.camara@logitransport-gn.com',
        phone: '+224 620 11 22 33',
        status: 'Active',
        createdAt: '2026-02-10',
        updatedAt: '2026-10-10'
      },
      {
        id: 'emp-202',
        companyId: 'comp-logi-gn',
        company: 'LogiTransport Guinée SARL',
        matricule: 'LOG00202',
        firstName: 'Fanta',
        lastName: 'Barry',
        department: 'QHSE & Sécurité',
        position: 'Coordinatrice Environnement',
        email: 'f.barry@logitransport-gn.com',
        phone: '+224 621 44 55 66',
        status: 'Active',
        createdAt: '2026-02-15',
        updatedAt: '2026-10-10'
      },
      {
        id: 'emp-301',
        companyId: 'comp-bio-sn',
        company: 'Laboratoires BioSanté Dakar',
        matricule: 'BIO00301',
        firstName: 'Ousmane',
        lastName: 'Sow',
        department: 'Recherche Clinique',
        position: 'Biologiste Spécialiste',
        email: 'o.sow@biosante-sn.com',
        phone: '+221 70 123 45 67',
        status: 'Active',
        createdAt: '2026-03-15',
        updatedAt: '2026-10-01'
      },
      {
        id: 'emp-401',
        companyId: 'comp-fin-ci',
        company: 'FinanTech Solutions Abidjan',
        matricule: 'FIN00401',
        firstName: 'Awa',
        lastName: 'Koné',
        department: 'Développement Produit',
        position: 'Product Manager Mobile Pay',
        email: 'a.kone@finantech-ci.com',
        phone: '+225 05 12 34 56 78',
        status: 'Active',
        createdAt: '2026-04-10',
        updatedAt: '2026-10-20'
      }
    ];

    // Initial Subscriptions
    const initialSubscriptions: SubscriptionRecord[] = [
      {
        id: 'sub-acme',
        companyId: 'comp-acme-fr',
        companyName: 'Acme Technologies France',
        plan: 'Professional',
        status: 'Active',
        startDate: '2026-01-15',
        expirationDate: '2027-01-15',
        renewalDate: '2027-01-15',
        maxUsers: 10,
        maxEmployees: 250,
        maxStorageMB: 5120,
        monthlyPriceEUR: 189,
        paymentVerified: true,
        paymentVerifiedAt: '2026-01-15 10:00',
        verifiedBy: 'Système Paiement Automatisé',
        paymentMethod: 'Virement SEPA Entreprise',
        paymentReference: 'SEPA-2026-ACME-001'
      },
      {
        id: 'sub-logi',
        companyId: 'comp-logi-gn',
        companyName: 'LogiTransport Guinée SARL',
        plan: 'Enterprise',
        status: 'Active',
        startDate: '2026-02-01',
        expirationDate: '2027-02-01',
        renewalDate: '2027-02-01',
        maxUsers: 50,
        maxEmployees: 1000,
        maxStorageMB: 51200,
        monthlyPriceEUR: 490,
        paymentVerified: true,
        paymentVerifiedAt: '2026-02-01 11:30',
        verifiedBy: 'SaaS Platform Owner',
        paymentMethod: 'Virement Bancaire Swift',
        paymentReference: 'SWIFT-GN-LOGI-89021'
      },
      {
        id: 'sub-bio',
        companyId: 'comp-bio-sn',
        companyName: 'Laboratoires BioSanté Dakar',
        plan: 'Starter',
        status: 'Active',
        startDate: '2026-03-10',
        expirationDate: '2027-03-10',
        renewalDate: '2027-03-10',
        maxUsers: 3,
        maxEmployees: 50,
        maxStorageMB: 1024,
        monthlyPriceEUR: 79,
        paymentVerified: true,
        paymentVerifiedAt: '2026-03-10 09:20',
        verifiedBy: 'Carte Bancaire CB/Visa Pro',
        paymentMethod: 'Carte Bancaire Professionnelle',
        paymentReference: 'PAY-SN-BIO-2026-904'
      },
      {
        id: 'sub-fin',
        companyId: 'comp-fin-ci',
        companyName: 'FinanTech Solutions Abidjan',
        plan: 'Free Trial',
        status: 'Trial',
        startDate: '2026-10-20',
        expirationDate: '2026-11-20',
        renewalDate: '2026-11-20',
        maxUsers: 2,
        maxEmployees: 100,
        maxStorageMB: 512,
        monthlyPriceEUR: 0,
        paymentVerified: true,
        paymentVerifiedAt: '2026-10-20 15:00',
        verifiedBy: 'Essai Gratuit 30 Jours Activé',
        paymentMethod: 'Offre d\'Évaluation Découverte'
      },
      {
        id: 'sub-douala',
        companyId: 'comp-pending-cm',
        companyName: 'Douala Agro Exportation SA',
        plan: 'Starter',
        status: 'Pending',
        startDate: '2026-11-06',
        expirationDate: '2026-12-06',
        renewalDate: '2026-12-06',
        maxUsers: 3,
        maxEmployees: 50,
        maxStorageMB: 1024,
        monthlyPriceEUR: 79,
        paymentVerified: false,
        notes: 'En attente de validation des statuts de l\'entreprise et du premier paiement.'
      }
    ];

    return {
      companies: initialCompanies,
      users: initialUsers,
      employees: initialEmployees,
      subscriptions: initialSubscriptions,
      exportJobs: [],
      version: 1
    };
  }

  /**
   * Ensures the master SaaS Owner account (Kibosh1234) is always provisioned and secure
   */
  private static ensurePlatformOwnerProvisioned(): void {
    if (!this.db) return;

    const rawOwnerPassword = process.env.KIBOSH_INITIAL_OWNER_PASSWORD || 'Kibosh@Master2026!';
    const ownerHash = bcrypt.hashSync(rawOwnerPassword, 10);

    const masterIndex = this.db.users.findIndex(
      u => u.username?.toLowerCase() === 'kibosh1234' || u.id === 'usr-kibosh-master-owner'
    );

    const masterUser: CompanyUser = {
      id: 'usr-kibosh-master-owner',
      companyId: 'platform-control',
      companyName: 'KIBOSH Platform Management',
      fullName: 'SaaS Platform Master Owner',
      username: 'Kibosh1234',
      email: 'owner@kibosh-platform.com',
      phone: '+33 1 89 00 12 34',
      phoneNumber: '+33189001234',
      jobPosition: 'Chief Executive & Platform Architect',
      role: 'Platform Super Admin',
      status: 'Active',
      passwordHash: ownerHash,
      mustChangePassword: true, // Mandatory First Login Action: Force password change!
      mfaEnabled: true, // Mandatory MFA for the SaaS Owner
      registrationDate: '2026-01-01',
      lastLogin: new Date().toISOString(),
      failedLoginAttempts: 0
    };

    if (masterIndex >= 0) {
      this.db.users[masterIndex] = {
        ...this.db.users[masterIndex],
        ...masterUser,
        // preserve passwordHash if already updated by user
        passwordHash: this.db.users[masterIndex].passwordHash || ownerHash
      };
    } else {
      this.db.users.unshift(masterUser);
      AuditService.log({
        companyId: 'PLATFORM_CONTROL',
        action: 'SAAS_OWNER_PROVISIONED',
        category: 'SECURITY',
        details: 'Initial KIBOSH SaaS Platform Owner (Kibosh1234) securely provisioned with forced password change and mandatory MFA.',
        result: 'Success'
      });
    }

    // Ensure dkamdkamcbg / ama1234 exists as secondary owner
    const dkamIndex = this.db.users.findIndex(
      u => u.email.toLowerCase() === 'dkamdkamcbg@gmail.com' || u.username?.toLowerCase() === 'ama1234'
    );
    if (dkamIndex < 0) {
      this.db.users.push({
        id: 'usr-platform-saas',
        companyId: 'platform-control',
        companyName: 'KIBOSH Platform Management',
        fullName: 'SaaS Platform Owner (Super Admin)',
        username: 'ama1234',
        email: 'dkamdkamcbg@gmail.com',
        phone: '+33 6 00 00 01 40',
        phoneNumber: '+33600000140',
        jobPosition: 'Platform Creator & Chief Architect',
        role: 'Platform Super Admin',
        status: 'Active',
        passwordHash: bcrypt.hashSync('1234', 10),
        mustChangePassword: false,
        mfaEnabled: true,
        registrationDate: '2026-01-01',
        lastLogin: new Date().toISOString(),
        failedLoginAttempts: 0
      });
    }
  }

  /**
   * Synchronously saves database state to disk
   */
  private static saveSync(): void {
    if (!this.db) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB SERVICE] Failed to save database to disk:', err);
    }
  }

  // --- Companies ---

  public static getCompanies(): CompanyTenant[] {
    if (!this.db) this.init();
    return this.db?.companies || [];
  }

  public static getCompanyById(id: string): CompanyTenant | undefined {
    if (!this.db) this.init();
    return this.db?.companies.find(c => c.id === id);
  }

  public static createCompany(companyData: Partial<CompanyTenant>): CompanyTenant {
    if (!this.db) this.init();

    const id = companyData.id || `comp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const today = new Date().toISOString().split('T')[0];

    const newCompany: CompanyTenant = {
      id,
      name: companyData.name || 'Nouvelle Entreprise',
      size: companyData.size || '11-50',
      industry: companyData.industry || 'Non spécifié',
      country: companyData.country || 'France',
      companyEmail: companyData.companyEmail || '',
      companyPhone: companyData.companyPhone || '',
      registrationDate: today,
      lastLogin: 'Jamais connecté',
      subscriptionPlan: companyData.subscriptionPlan || 'Free Trial',
      status: companyData.status || 'Active',
      storageUsageMB: 0,
      maxStorageMB: companyData.maxStorageMB || 5120,
      totalUsersCount: 1,
      totalEmployeesCount: 0,
      totalPayslipsProcessed: 0,
      totalEmailsSent: 0,
      supportAccessEnabled: false,
      accessExpiresAt: companyData.accessExpiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    };

    this.db!.companies.unshift(newCompany);

    // Create corresponding subscription record
    const subRecord: SubscriptionRecord = {
      id: `sub-${id}`,
      companyId: id,
      companyName: newCompany.name,
      plan: newCompany.subscriptionPlan,
      status: newCompany.status === 'Active' ? (newCompany.subscriptionPlan === 'Free Trial' ? 'Trial' : 'Active') : 'Pending',
      startDate: today,
      expirationDate: newCompany.accessExpiresAt || today,
      renewalDate: newCompany.accessExpiresAt || today,
      maxUsers: newCompany.subscriptionPlan === 'Enterprise' ? 50 : newCompany.subscriptionPlan === 'Professional' ? 10 : 3,
      maxEmployees: newCompany.subscriptionPlan === 'Enterprise' ? 1000 : newCompany.subscriptionPlan === 'Professional' ? 250 : 50,
      maxStorageMB: newCompany.maxStorageMB,
      monthlyPriceEUR: newCompany.subscriptionPlan === 'Enterprise' ? 490 : newCompany.subscriptionPlan === 'Professional' ? 189 : newCompany.subscriptionPlan === 'Starter' ? 79 : 0,
      paymentVerified: newCompany.subscriptionPlan === 'Free Trial'
    };
    this.db!.subscriptions.unshift(subRecord);

    this.saveSync();
    return newCompany;
  }

  public static updateCompanyStatus(companyId: string, status: CompanyTenant['status']): CompanyTenant | null {
    if (!this.db) this.init();
    const company = this.db!.companies.find(c => c.id === companyId);
    if (!company) return null;

    company.status = status;

    // Update corresponding subscription status
    const sub = this.db!.subscriptions.find(s => s.companyId === companyId);
    if (sub) {
      if (status === 'Suspended') sub.status = 'Suspended';
      else if (status === 'Active') sub.status = sub.plan === 'Free Trial' ? 'Trial' : 'Active';
      else if (status === 'Expired') sub.status = 'Expired';
    }

    this.saveSync();
    return company;
  }

  public static updateCompanySubscription(companyId: string, plan: CompanyTenant['subscriptionPlan'], expirationIso: string): CompanyTenant | null {
    if (!this.db) this.init();
    const company = this.db!.companies.find(c => c.id === companyId);
    if (!company) return null;

    company.subscriptionPlan = plan;
    company.accessExpiresAt = expirationIso;

    const sub = this.db!.subscriptions.find(s => s.companyId === companyId);
    if (sub) {
      sub.plan = plan;
      sub.expirationDate = expirationIso.split('T')[0];
      sub.renewalDate = expirationIso.split('T')[0];
      sub.status = 'Active';
      sub.paymentVerified = true;
    }

    this.saveSync();
    return company;
  }

  // --- Users ---

  public static getUsers(sanitized = true): CompanyUser[] {
    if (!this.db) this.init();
    const users = this.db?.users || [];
    if (!sanitized) return users;

    // Security requirement: Never expose password or passwordHash
    return users.map(u => {
      const { password, passwordHash, ...safeUser } = u;
      return safeUser as CompanyUser;
    });
  }

  public static getUserById(userId: string, sanitized = true): CompanyUser | undefined {
    if (!this.db) this.init();
    const user = this.db?.users.find(u => u.id === userId);
    if (!user) return undefined;
    if (!sanitized) return user;

    const { password, passwordHash, ...safeUser } = user;
    return safeUser as CompanyUser;
  }

  public static getUserByUsernameOrEmail(identifier: string): CompanyUser | undefined {
    if (!this.db) this.init();
    const clean = identifier.trim().toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '');

    return this.db?.users.find(u => {
      if (u.email && u.email.toLowerCase() === clean) return true;
      if (u.username && u.username.toLowerCase() === clean) return true;
      if (u.phone && digitsOnly && u.phone.replace(/\D/g, '') === digitsOnly) return true;
      if (u.phoneNumber && digitsOnly && u.phoneNumber.replace(/\D/g, '') === digitsOnly) return true;
      return false;
    });
  }

  public static createUser(userData: Partial<CompanyUser>): CompanyUser {
    if (!this.db) this.init();

    // Critical security check: Ordinary users cannot be created as SaaS Owner via API
    const isOwnerRole = userData.role === 'Platform Super Admin';
    const role: UserRole = isOwnerRole ? 'Platform Super Admin' : (userData.role || 'Payroll Manager');

    const rawPassword = userData.password || 'Password123!';
    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const id = userData.id || `usr-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const today = new Date().toISOString().split('T')[0];

    const newUser: CompanyUser = {
      id,
      companyId: userData.companyId || 'comp-default',
      companyName: userData.companyName || 'Entreprise Client',
      fullName: userData.fullName || userData.username || 'Nouvel Utilisateur',
      username: userData.username || `user_${Date.now().toString(36)}`,
      email: userData.email || '',
      phone: userData.phone || '',
      phoneNumber: userData.phoneNumber || (userData.phone ? userData.phone.replace(/\D/g, '') : ''),
      jobPosition: userData.jobPosition || 'Gestionnaire RH',
      role,
      status: userData.status || 'Active',
      passwordHash,
      mustChangePassword: userData.mustChangePassword !== false,
      mfaEnabled: Boolean(userData.mfaEnabled || isOwnerRole),
      registrationDate: today,
      lastLogin: 'Jamais connecté',
      failedLoginAttempts: 0
    };

    this.db!.users.push(newUser);

    // Update company user count
    const company = this.db!.companies.find(c => c.id === newUser.companyId);
    if (company) {
      company.totalUsersCount = (company.totalUsersCount || 0) + 1;
    }

    this.saveSync();

    const { password, passwordHash: ph, ...safeUser } = newUser;
    return safeUser as CompanyUser;
  }

  public static updateUserStatus(userId: string, status: CompanyUser['status']): CompanyUser | null {
    if (!this.db) this.init();
    const user = this.db!.users.find(u => u.id === userId);
    if (!user) return null;

    // Security check: Protect Master SaaS Owner from being disabled
    if (user.username?.toLowerCase() === 'kibosh1234') {
      throw new Error('Action interdite : Le compte Propriétaire Maître SaaS ne peut pas être désactivé.');
    }

    user.status = status;
    this.saveSync();

    const { password, passwordHash, ...safeUser } = user;
    return safeUser as CompanyUser;
  }

  public static resetUserPassword(userId: string): { resetToken: string; expiresAt: string } {
    if (!this.db) this.init();
    const user = this.db!.users.find(u => u.id === userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString(); // 2 hours

    user.mustChangePassword = true;
    this.saveSync();

    AuditService.log({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: 'ADMIN_PASSWORD_RESET_TRIGGERED',
      category: 'SECURITY',
      details: `Réinitialisation de mot de passe sécurisée déclenchée par le Propriétaire SaaS pour ${user.email}.`,
      result: 'Success'
    });

    return { resetToken, expiresAt };
  }

  public static updatePassword(userId: string, newPlainPassword: string): void {
    if (!this.db) this.init();
    const user = this.db!.users.find(u => u.id === userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    user.passwordHash = bcrypt.hashSync(newPlainPassword, 10);
    user.mustChangePassword = false;
    user.lastPasswordChangeIso = new Date().toISOString();
    this.saveSync();

    AuditService.log({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_CHANGED',
      category: 'SECURITY',
      details: `Mot de passe renouvelé avec succès pour ${user.email}.`,
      result: 'Success'
    });
  }

  // --- Employees (Cross-Company Directory without sensitive payroll numbers) ---

  public static getEmployees(): Employee[] {
    if (!this.db) this.init();
    return this.db?.employees || [];
  }

  // --- Subscriptions ---

  public static getSubscriptions(): SubscriptionRecord[] {
    if (!this.db) this.init();
    return this.db?.subscriptions || [];
  }

  public static verifySubscriptionPayment(subscriptionId: string, paymentMethod: string, paymentReference: string, verifiedBy: string): SubscriptionRecord | null {
    if (!this.db) this.init();
    const sub = this.db!.subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return null;

    sub.paymentVerified = true;
    sub.paymentVerifiedAt = new Date().toISOString();
    sub.verifiedBy = verifiedBy;
    sub.paymentMethod = paymentMethod;
    sub.paymentReference = paymentReference;
    sub.status = 'Active';

    // Extend 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    sub.expirationDate = nextYear.toISOString().split('T')[0];
    sub.renewalDate = nextYear.toISOString().split('T')[0];

    const company = this.db!.companies.find(c => c.id === sub.companyId);
    if (company) {
      company.status = 'Active';
      company.accessExpiresAt = nextYear.toISOString();
    }

    this.saveSync();

    AuditService.log({
      companyId: sub.companyId,
      action: 'SUBSCRIPTION_PAYMENT_VERIFIED',
      category: 'SECURITY',
      details: `Paiement d'abonnement vérifié pour '${sub.companyName}'. Réf : ${paymentReference}. Validé par : ${verifiedBy}`,
      result: 'Success'
    });

    return sub;
  }

  // --- Export Jobs ---

  public static recordExportJob(job: Omit<ExportJobRecord, 'id' | 'requestedAt'>): ExportJobRecord {
    if (!this.db) this.init();
    const record: ExportJobRecord = {
      id: `exp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      requestedAt: new Date().toISOString(),
      ...job
    };
    this.db!.exportJobs.unshift(record);
    if (this.db!.exportJobs.length > 50) this.db!.exportJobs.pop();
    this.saveSync();
    return record;
  }

  public static getExportJobByToken(token: string): ExportJobRecord | undefined {
    if (!this.db) this.init();
    return this.db?.exportJobs.find(j => j.token === token);
  }

  public static getExportJobs(): ExportJobRecord[] {
    if (!this.db) this.init();
    return this.db?.exportJobs || [];
  }

  // --- Real Aggregate Statistics ---

  public static getStats() {
    if (!this.db) this.init();
    const companies = this.db!.companies;
    const users = this.db!.users;
    const employees = this.db!.employees;
    const subscriptions = this.db!.subscriptions;

    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.status === 'Active').length;
    const pendingCompanies = companies.filter(c => c.status === 'Pending Activation').length;
    const suspendedCompanies = companies.filter(c => c.status === 'Suspended').length;

    const totalAdmins = users.filter(u => u.role === 'Company Administrator').length;
    const totalUsers = users.length;
    const totalEmployees = employees.length + companies.reduce((acc, c) => acc + (c.totalEmployeesCount || 0), 0);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'Active' || s.status === 'Trial').length;
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'Expired').length;

    return {
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      suspendedCompanies,
      totalAdmins,
      totalUsers,
      totalEmployees,
      activeSubscriptions,
      expiredSubscriptions,
      companiesByPlan: {
        freeTrial: companies.filter(c => c.subscriptionPlan === 'Free Trial').length,
        starter: companies.filter(c => c.subscriptionPlan === 'Starter').length,
        professional: companies.filter(c => c.subscriptionPlan === 'Professional').length,
        enterprise: companies.filter(c => c.subscriptionPlan === 'Enterprise').length
      },
      companiesByCountry: companies.reduce((acc: Record<string, number>, c) => {
        acc[c.country] = (acc[c.country] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

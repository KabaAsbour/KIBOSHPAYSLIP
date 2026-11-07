import { Employee, DistributionCampaign, AuditLog, ExtractionRule, EmailSettings, UserSession, CompanyTenant, CompanyUser, FeedbackTicket } from '../types';

export const INITIAL_COMPANIES: CompanyTenant[] = [];

export const INITIAL_COMPANY_USERS: CompanyUser[] = [
  {
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
    registrationDate: '2026-01-01',
    lastLogin: '2026-11-07 08:00 AM',
    mfaEnabled: true,
    failedLoginAttempts: 0
  },
  {
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
    registrationDate: '2026-01-01',
    lastLogin: '2026-11-07 08:00 AM',
    mfaEnabled: true,
    failedLoginAttempts: 0
  }
];

export const INITIAL_USER_SESSIONS: UserSession[] = [
  {
    id: 'usr-platform-saas',
    name: 'SaaS Platform Owner (Super Admin)',
    username: 'ama1234',
    email: 'dkamdkamcbg@gmail.com',
    phone: '+33 6 00 00 01 40',
    role: 'Platform Super Admin',
    company: 'Kibosh SaaS Platform Control',
    companyId: 'platform-saas',
    department: 'Global Platform Engineering',
    mfaEnabled: true,
    lastLogin: '2026-11-07 08:00 AM',
    isPlatformOwner: true
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_EXTRACTION_RULES: ExtractionRule[] = [
  {
    id: 'rule-1',
    name: 'Standard Employee ID Header Regex',
    regexPattern: '(?:MATRICULE|EMPLOYEE ID|EMP ID|MAT|ID)\\s*[:#-]?\\s*([A-Z]{3}\\d{6}|\\d{6})',
    searchLocation: 'Header',
    ocrFallback: true,
    minConfidence: 95,
    isDefault: true
  },
  {
    id: 'rule-2',
    name: 'Strict 6-Digit Matricule Code',
    regexPattern: '\\bEMP[0-9]{6}\\b',
    searchLocation: 'Full Page',
    ocrFallback: true,
    minConfidence: 90,
    isDefault: false
  },
  {
    id: 'rule-3',
    name: 'Footer Reference Block Extraction',
    regexPattern: 'REF-EMP:?\\s*([A-Z0-9-]{6,10})',
    searchLocation: 'Footer',
    ocrFallback: false,
    minConfidence: 85,
    isDefault: false
  }
];

export const INITIAL_EMAIL_SETTINGS: EmailSettings = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  senderEmail: 'paie@votre-entreprise.com',
  senderName: 'KIBOSH Service Paie',
  useTLS: true,
  throttleRatePerMin: 120,
  maxRetries: 3,
  companyLogoUrl: '',
  defaultSubject: 'Votre bulletin de paie confidentiel - {Month} {Year}',
  whatsappSettings: {
    enabled: false,
    provider: 'simulation',
    phoneNumberId: '',
    accessToken: '',
    fromPhoneNumber: '',
    defaultTemplate: `Bonjour {FirstName} {LastName},\n\nVotre bulletin de paie électronique pour la période {Month} {Year} est disponible.\n\nLien de consultation sécurisé :\n{PdfLink}`,
    autoFallbackToEmail: true
  },
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUppercase: true,
    defaultFormat: 'Matricule',
    customSaltPrefix: 'KIBOSH-'
  },
  regionSettings: {
    countryCode: 'GN',
    countryName: 'Guinée (Conakry)',
    currencyCode: 'GNF',
    currencySymbol: 'FG',
    taxRegime: 'Code du Travail Guinéen & RTS (Retenue sur Traitements et Salaires / CNSS)',
    defaultTaxRate: 10.0,
    employerSocialRate: 18.0,
    locale: 'fr-GN',
    timeZone: 'Africa/Conakry',
    legalFramework: 'Code du Travail de la République de Guinée & CNSS',
    minWage: 550000
  },
  defaultTemplate: `Bonjour {FirstName} {LastName},

Veuillez trouver ci-joint votre bulletin de paie électronique confidentiel pour la période {Month} {Year}.

Récapitulatif des informations :
------------------------------------------
Matricule Employé : {Matricule}
Département : {Department}
Montant Net à Payer : {NetPay} FG
Période de Paie : {Month} {Year}
------------------------------------------

Lien de consultation / téléchargement direct du PDF :
{PdfLink}

AVIS DE SÉCURITÉ ET DE CONFIDENTIALITÉ :
Ce document est chiffré et strictement destiné au destinataire désigné ci-dessus.

Cordialement,
La Direction des Ressources Humaines & Service Paie
KIBOSH Service Paie System`
};

export const INITIAL_CAMPAIGNS: DistributionCampaign[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_FEEDBACK_TICKETS: FeedbackTicket[] = [];

export type UserRole = 
  | 'Company Administrator'
  | 'Super Administrator'
  | 'HR Administrator'
  | 'Payroll Manager'
  | 'IT Administrator'
  | 'Auditor'
  | 'Platform Super Admin';

export interface CompanyTenant {
  id: string;
  name: string;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  industry?: string;
  country: string;
  companyEmail: string;
  companyPhone?: string;
  registrationDate: string;
  lastLogin: string;
  subscriptionPlan: 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Pending Activation' | 'Expired';
  storageUsageMB: number;
  maxStorageMB: number;
  totalUsersCount: number;
  totalEmployeesCount: number;
  totalPayslipsProcessed: number;
  totalEmailsSent: number;
  supportAccessEnabled?: boolean;
  supportAccessExpiresAt?: string;
  accessExpiresAt?: string; // ISO string e.g. "2026-09-01T23:59:59" or YYYY-MM-DD
  accessDurationDays?: number;
  defaultAdminPassword?: string;
}

export interface CompanyUser {
  id: string;
  companyId: string;
  companyName: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  jobPosition: string;
  role: UserRole;
  status: 'Active' | 'Disabled' | 'Locked' | 'Pending Verification' | 'Expired';
  isActive?: boolean;
  password?: string;
  defaultPassword?: string;
  mustChangePassword?: boolean;
  passwordChangedAt?: string;
  passwordHash?: string;
  registrationDate: string;
  lastLogin: string;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lastPasswordChangeIso?: string;
  accessExpiresAt?: string;
  loginHistory?: {
    id: string;
    timestamp: string;
    ipAddress: string;
    browser: string;
    device: string;
    result: 'Success' | 'Failed' | 'MFA Challenge';
  }[];
}

export interface UserSession {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: UserRole;
  avatar?: string;
  company: string;
  companyId: string;
  department: string;
  mfaEnabled: boolean;
  lastLogin: string;
  isPlatformOwner?: boolean;
  supportAccessActive?: boolean;
  mustChangePassword?: boolean;
  forcePasswordChange?: boolean;
  accessExpiresAt?: string;
  isExpired?: boolean;
}

export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated';

export interface Employee {
  id: string;
  companyId?: string;
  matricule: string; // Unique Employee ID e.g. EMP000245
  firstName: string;
  lastName: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone?: string;
  birthdate?: string; // e.g. 1990-05-14
  customPdfPassword?: string;
  status: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type PayslipStatus = 'Matched' | 'Missing Email' | 'Unmatched Matricule' | 'Flagged' | 'Pending Verification';

export type DeliveryChannel = 'Email' | 'WhatsApp' | 'Both';

export interface ExtractedPayslip {
  id: string;
  matricule: string;
  employeeId?: string;
  employeeName: string;
  email: string;
  phone?: string;
  deliveryChannel?: DeliveryChannel;
  department: string;
  position: string;
  startPage: number;
  endPage: number;
  pageCount: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  payPeriod: string;
  confidenceScore: number; // e.g. 98%
  status: PayslipStatus;
  pdfBytes?: Uint8Array; // Raw individual PDF binary
  pdfBlobUrl?: string;
  isExcluded?: boolean;
  notes?: string;
  pdfPasswordProtected?: boolean;
  pdfPassword?: string;
  rawTextSnippet?: string;
  ocrVerified?: boolean;
  ocrCorrected?: boolean;
  originalExtractedMatricule?: string;
  generatedFileName?: string;
}

export type CampaignStatus = 'Draft' | 'Processing PDF' | 'Pending Validation' | 'Scheduled' | 'Distributing' | 'Completed' | 'Completed with Errors' | 'Cancelled';

export type EmailDeliveryStatus = 'Pending' | 'Processing' | 'Sent' | 'Delivered' | 'Failed' | 'Cancelled';
export type WhatsAppDeliveryStatus = 'Pending' | 'Sent' | 'Delivered' | 'Read' | 'Failed' | 'N/A';

export interface DeliveryRecord {
  id: string;
  payslipId: string;
  matricule: string;
  employeeName: string;
  email: string;
  phone?: string;
  channel?: DeliveryChannel;
  department: string;
  netPay: number;
  payPeriod: string;
  status: EmailDeliveryStatus;
  whatsappStatus?: WhatsAppDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  whatsappSentAt?: string;
  whatsappDeliveredAt?: string;
  errorMessage?: string;
  whatsappErrorMessage?: string;
  retryCount: number;
  pdfFileName: string;
  pdfBlobUrl?: string;
}

export type BatchDocumentType = 'Payslip' | 'Invoice' | 'Academic' | 'Contract' | 'Other';

export interface DocumentValidationResult {
  isValid: boolean;
  selectedDocType: BatchDocumentType;
  detectedDocType: string;
  confidenceScore: number;
  matchedKeywords: string[];
  missingMandatoryKeywords: string[];
  unexpectedKeywords: string[];
  pageCount: number;
  message: string;
  structureValid: boolean;
}

export interface PdfSplitProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  stage: string;
  currentMatricule?: string;
  currentEmployeeName?: string;
  matchedCount: number;
  unmatchedCount: number;
  stepIndex: number; // 1: validation, 2: parsing, 3: extraction, 4: encryption/finalizing
  totalSteps: number;
  elapsedMs?: number;
}

export interface PayslipDetectionResult {
  isPayslip: boolean;
  confidenceScore: number; // 0 to 100
  documentType: 'PAYSLIP_BATCH' | 'SINGLE_PAYSLIP' | 'NON_PAYSLIP_DOCUMENT' | 'ACADEMIC_REPORT_CARD' | 'COMMERCIAL_INVOICE' | 'IMAGE_OR_SCANNED_UNKNOWN';
  detectedKeywords: string[];
  missingKeywords: string[];
  nonPayslipIndicators: string[];
  pageCount: number;
  reason: string;
}

export interface DistributionCampaign {
  id: string; // e.g. CAMP-2026-07
  companyId?: string;
  companyName?: string;
  title: string;
  payrollMonth: string; // e.g. July 2026
  uploadedBy: string;
  uploadedAt: string;
  pdfFileName: string;
  pdfFileSize: string;
  totalPages: number;
  totalEmployees: number;
  matchedCount: number;
  unmatchedCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  pendingCount: number;
  status: CampaignStatus;
  scheduledAt?: string;
  durationSeconds?: number;
  payslips: ExtractedPayslip[];
  records: DeliveryRecord[];
  defaultChannel?: DeliveryChannel;
  emailSubject: string;
  emailTemplate: string;
  whatsappTemplate?: string;
  requirePasswordProtect: boolean;
  passwordFormat?: 'Matricule' | 'Birthdate' | 'CodeRH' | 'CustomGlobal' | 'CustomIndividual';
  customPassword?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  companyId?: string;
  companyName?: string;
  user: string;
  userRole: UserRole;
  ipAddress: string;
  browser?: string;
  device?: string;
  action: string;
  category: 'AUTHENTICATION' | 'UPLOAD' | 'SPLITTING' | 'DISTRIBUTION' | 'EMPLOYEE' | 'SECURITY' | 'REPORT' | 'PLATFORM_ADMIN';
  details: string;
  result: 'Success' | 'Warning' | 'Failure';
}

export interface ExtractionRule {
  id: string;
  name: string;
  regexPattern: string;
  searchLocation: 'Header' | 'Full Page' | 'Footer';
  ocrFallback: boolean;
  minConfidence: number;
  isDefault: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  requireUppercase: boolean;
  defaultFormat: 'Matricule' | 'Birthdate' | 'Custom';
  customSaltPrefix?: string;
}

export interface RegionSettings {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  taxRegime: string;
  defaultTaxRate: number;
  employerSocialRate: number;
  locale: string;
  timeZone: string;
  legalFramework: string;
  minWage: number;
}

export interface WhatsAppSettings {
  enabled: boolean;
  provider: 'meta_cloud_api' | 'twilio' | 'green_api' | 'simulation';
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  accountSid?: string;
  authToken?: string;
  fromPhoneNumber?: string;
  defaultTemplate: string;
  autoFallbackToEmail: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPass?: string;
  senderEmail: string;
  senderName: string;
  useTLS: boolean;
  throttleRatePerMin: number;
  maxRetries: number;
  companyLogoUrl: string;
  defaultSubject: string;
  defaultTemplate: string;
  passwordPolicy?: PasswordPolicy;
  whatsappSettings?: WhatsAppSettings;
  regionSettings?: RegionSettings;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

// --- User Feedback & Support Module Types ---

export type FeedbackCategory =
  | 'Bug Report'
  | 'Feature Request'
  | 'Improvement Suggestion'
  | 'Complaint'
  | 'Technical Support'
  | 'Performance Issue'
  | 'User Experience (UI/UX)'
  | 'Security Concern'
  | 'Billing or Subscription'
  | 'General Comment'
  | 'Other';

export type FeedbackPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type FeedbackStatus =
  | 'New'
  | 'Under Review'
  | 'In Progress'
  | 'Waiting for User'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export interface FeedbackAttachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // e.g. "image/png", "application/pdf"
  dataUrl?: string; // base64 or object url preview
}

export interface FeedbackResponse {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  isInternalNote: boolean; // True if private note for Platform Owner / support staff
  message: string;
  attachments?: FeedbackAttachment[];
}

export interface FeedbackContext {
  userId: string;
  userName: string;
  username: string;
  email: string;
  companyName: string;
  companyId: string;
  userRole: UserRole;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  appVersion: string;
  currentPage: string;
  language: string;
  timeZone: string;
}

export interface FeedbackTicket {
  id: string; // Internal UUID
  ticketNumber: string; // e.g. TICKET-2026-0801
  createdAt: string;
  updatedAt: string;
  title: string;
  category: FeedbackCategory;
  subject: string;
  description: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  attachments: FeedbackAttachment[];
  context: FeedbackContext;
  assignedAgent?: string;
  resolutionTime?: string;
  responses: FeedbackResponse[];
  reopenedCount?: number;
}

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
  downloadUrl?: string;
}



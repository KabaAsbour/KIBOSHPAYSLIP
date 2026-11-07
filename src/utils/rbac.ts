import { UserRole, UserSession } from '../types';
import { PermissionKey, CustomRole, ALL_PERMISSIONS } from '../types/rbac';
import { StorageService } from '../services/storageService';

// Default role permissions mapping
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  'Platform Super Admin': ALL_PERMISSIONS.map(p => p.key),
  'Super Administrator': ALL_PERMISSIONS.map(p => p.key),
  'Company Administrator': ALL_PERMISSIONS
    .filter(p => p.category !== 'platform_administration')
    .map(p => p.key),
  'HR Administrator': [
    'create_employee', 'edit_employee', 'import_employees', 'export_employees',
    'upload_payroll_pdf', 'split_payslips', 'preview_payslips', 'validate_distribution', 'send_payslips', 'retry_failed_emails',
    'view_reports', 'export_reports', 'download_reports'
  ],
  'Payroll Manager': [
    'create_employee', 'edit_employee', 'import_employees', 'export_employees',
    'upload_payroll_pdf', 'split_payslips', 'preview_payslips', 'validate_distribution', 'send_payslips', 'retry_failed_emails',
    'view_reports', 'export_reports', 'download_reports'
  ],
  'HR / Payroll Officer': [
    'create_employee', 'edit_employee', 'import_employees', 'export_employees',
    'upload_payroll_pdf', 'split_payslips', 'preview_payslips', 'validate_distribution', 'send_payslips', 'retry_failed_emails',
    'view_reports', 'export_reports', 'download_reports'
  ],
  'Manager': [
    'export_employees',
    'preview_payslips',
    'view_reports', 'export_reports', 'download_reports'
  ],
  'IT Administrator': [
    'reset_password', 'disable_user',
    'view_audit_logs',
    'manage_company_settings', 'configure_email', 'manage_storage', 'manage_integrations'
  ],
  'Auditor': [
    'export_employees',
    'preview_payslips',
    'view_reports', 'export_reports',
    'view_audit_logs', 'export_audit_logs'
  ],
  'Standard User': [
    'view_reports'
  ]
};

/**
 * Check if a role or custom role has a specific permission key.
 * Respects tenant isolation (RB-03) and platform owner hierarchy (RB-07).
 */
export function hasPermission(
  userRole: UserRole | string,
  permission: PermissionKey,
  session?: UserSession | null,
  customRoles?: CustomRole[]
): boolean {
  if (!userRole) return false;

  // Platform owner always has full access
  if (session?.isPlatformOwner || userRole === 'Platform Super Admin') {
    return true;
  }

  // Company admins cannot access platform owner administration features (RB-07)
  const isPlatformPerm = ALL_PERMISSIONS.find(p => p.key === permission)?.category === 'platform_administration';
  if (isPlatformPerm && !session?.isPlatformOwner && userRole !== 'Platform Super Admin') {
    return false;
  }

  // Check default role permissions mapping first
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole];
  if (defaultPerms && defaultPerms.includes(permission)) {
    return true;
  }

  // Check custom roles for tenant
  const rolesToSearch = customRoles || (session?.companyId ? StorageService.getCustomRoles(session.companyId) : []);
  const matchingCustomRole = rolesToSearch.find(r => r.name.toLowerCase() === userRole.toLowerCase());

  if (matchingCustomRole) {
    return matchingCustomRole.permissions.includes(permission);
  }

  return false;
}

/**
 * Returns all permissions granted to a given role.
 */
export function getRolePermissions(
  userRole: UserRole | string,
  session?: UserSession | null,
  customRoles?: CustomRole[]
): PermissionKey[] {
  if (session?.isPlatformOwner || userRole === 'Platform Super Admin') {
    return ALL_PERMISSIONS.map(p => p.key);
  }

  if (DEFAULT_ROLE_PERMISSIONS[userRole]) {
    return DEFAULT_ROLE_PERMISSIONS[userRole];
  }

  const rolesToSearch = customRoles || (session?.companyId ? StorageService.getCustomRoles(session.companyId) : []);
  const matchingCustomRole = rolesToSearch.find(r => r.name.toLowerCase() === userRole.toLowerCase());

  if (matchingCustomRole) {
    return matchingCustomRole.permissions;
  }

  return [];
}

/**
 * Log unauthorized access attempt to audit log (RB-06).
 */
export function logAccessDenial(
  actionAttempted: string,
  session: UserSession,
  onLogAudit?: (action: string, category: 'SECURITY', details: string, result: 'Failure') => void
) {
  const details = `Accès refusé (RBAC) : L'utilisateur ${session.name} (${session.role}) a tenté d'exécuter une action non autorisée (${actionAttempted}).`;
  if (onLogAudit) {
    onLogAudit('ACCESS_DENIED', 'SECURITY', details, 'Failure');
  }
}

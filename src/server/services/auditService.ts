export interface AuditLogEntry {
  id: string;
  timestamp: string;
  companyId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  category: 'SECURITY' | 'PAYROLL' | 'EMPLOYEE' | 'SYSTEM' | 'AUTH' | 'ADMIN';
  details: string;
  result: 'Success' | 'Failure';
  ipAddress?: string;
  userAgent?: string;
}

const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 5000;

export class AuditService {
  public static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };

    auditLogs.unshift(fullEntry);
    if (auditLogs.length > MAX_LOGS) {
      auditLogs.pop();
    }

    console.log(`[AUDIT LOG] [${fullEntry.category}] ${fullEntry.action} | Tenant: ${fullEntry.companyId} | User: ${fullEntry.userEmail || 'System'} | Result: ${fullEntry.result} | Details: ${fullEntry.details}`);
    return fullEntry;
  }

  public static getLogsByCompany(companyId: string, limit = 100): AuditLogEntry[] {
    return auditLogs.filter(log => log.companyId === companyId).slice(0, limit);
  }

  public static getAllLogs(limit = 200): AuditLogEntry[] {
    return auditLogs.slice(0, limit);
  }

  public static getLogs(companyId?: string, limit = 100): AuditLogEntry[] {
    if (companyId && companyId !== 'all') {
      return this.getLogsByCompany(companyId, limit);
    }
    return this.getAllLogs(limit);
  }
}

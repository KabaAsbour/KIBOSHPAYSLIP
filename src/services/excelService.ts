import * as XLSX from 'xlsx';
import { Employee, DistributionCampaign, DeliveryRecord, AuditLog, RegionSettings } from '../types';

export interface ExcelImportResult {
  validEmployees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[];
  invalidRows: { rowNumber: number; data: any; reason: string }[];
  duplicateMatricules: string[];
  totalRows: number;
}

export class ExcelService {
  /**
   * Parse uploaded Excel (XLSX, XLS) or CSV file for employee data.
   */
  static async parseEmployeeFile(file: File, existingEmployees: Employee[]): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const validEmployees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[] = [];
          const invalidRows: { rowNumber: number; data: any; reason: string }[] = [];
          const duplicateMatricules: string[] = [];
          const seenMatriculesInFile = new Set<string>();

          const existingMatricules = new Set(existingEmployees.map(e => e.matricule.trim().toUpperCase()));

          rawRows.forEach((row, idx) => {
            const rowNumber = idx + 2; // header is row 1

            // Normalizing column keys
            const matricule = (row['Matricule'] || row['Employee ID'] || row['Matricule Number'] || row['ID'] || '').toString().trim();
            const firstName = (row['First Name'] || row['FirstName'] || row['Prénom'] || '').toString().trim();
            const lastName = (row['Last Name'] || row['LastName'] || row['Nom'] || '').toString().trim();
            const company = (row['Company'] || row['Société'] || 'Enterprise Global Inc.').toString().trim();
            const department = (row['Department'] || row['Département'] || 'General').toString().trim();
            const position = (row['Position'] || row['Title'] || row['Poste'] || 'Employee').toString().trim();
            const email = (row['Email'] || row['Email Address'] || row['Courriel'] || '').toString().trim();
            const statusStr = (row['Status'] || row['Statut'] || 'Active').toString().trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!matricule) {
              invalidRows.push({ rowNumber, data: row, reason: 'Missing Matricule / Employee ID' });
              return;
            }

            if (!email) {
              invalidRows.push({ rowNumber, data: row, reason: 'Missing Email Address' });
              return;
            }

            if (!emailRegex.test(email)) {
              invalidRows.push({ rowNumber, data: row, reason: `Invalid email format: "${email}"` });
              return;
            }

            const upperMatricule = matricule.toUpperCase();
            if (seenMatriculesInFile.has(upperMatricule) || existingMatricules.has(upperMatricule)) {
              duplicateMatricules.push(matricule);
            }
            seenMatriculesInFile.add(upperMatricule);

            validEmployees.push({
              matricule,
              firstName: firstName || 'Employee',
              lastName: lastName || matricule,
              company: company || 'Enterprise Global Inc.',
              department: department || 'General',
              position: position || 'Staff',
              email,
              status: statusStr === 'On Leave' ? 'On Leave' : statusStr === 'Terminated' ? 'Terminated' : 'Active'
            });
          });

          resolve({
            validEmployees,
            invalidRows,
            duplicateMatricules,
            totalRows: rawRows.length
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Export Employee List to Excel
   */
  static exportEmployeesToExcel(employees: Employee[], filename = 'KIBOSH_Employee_Roster.xlsx') {
    const exportData = employees.map(emp => ({
      'Matricule': emp.matricule,
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'Company': emp.company,
      'Department': emp.department,
      'Position': emp.position,
      'Email Address': emp.email,
      'Status': emp.status,
      'Created Date': emp.createdAt,
      'Last Updated': emp.updatedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export Campaign Delivery Report to Excel
   */
  static exportCampaignReport(campaign: DistributionCampaign, region?: RegionSettings, filename?: string) {
    const symbol = region?.currencySymbol || 'FG';
    const country = region?.countryName || 'Guinée (Conakry)';
    const name = filename || `KIBOSH_Campaign_Report_${campaign.id}.xlsx`;
    const summaryData = [
      { Metric: 'Campaign ID', Value: campaign.id },
      { Metric: 'Payroll Month', Value: campaign.payrollMonth },
      { Metric: 'Tax Jurisdiction', Value: `${country} (${region?.currencyCode || 'GNF'})` },
      { Metric: 'Tax Regime', Value: region?.taxRegime || 'Standard' },
      { Metric: 'Uploaded By', Value: campaign.uploadedBy },
      { Metric: 'Uploaded Date', Value: campaign.uploadedAt },
      { Metric: 'Total Employees', Value: campaign.totalEmployees },
      { Metric: 'Successfully Delivered', Value: campaign.deliveredCount },
      { Metric: 'Failed Deliveries', Value: campaign.failedCount },
      { Metric: 'Campaign Status', Value: campaign.status }
    ];

    const recordsData = campaign.records.map(rec => ({
      'Matricule': rec.matricule,
      'Employee Name': rec.employeeName,
      'Department': rec.department,
      'Email': rec.email,
      [`Net Pay (${symbol})`]: rec.netPay,
      'Status': rec.status,
      'Sent At': rec.sentAt || '-',
      'Delivered At': rec.deliveredAt || '-',
      'Error Detail': rec.errorMessage || 'N/A'
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsRecords = XLSX.utils.json_to_sheet(recordsData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(workbook, wsRecords, 'Delivery Records');
    XLSX.writeFile(workbook, name);
  }

  /**
   * Export Regional Tax & Social Security Breakdown Report to Excel
   */
  static exportRegionalTaxReport(campaign: DistributionCampaign, region?: RegionSettings, filename?: string) {
    const symbol = region?.currencySymbol || '€';
    const country = region?.countryName || 'France';
    const taxRate = region?.defaultTaxRate || 12.5;
    const socialRate = region?.employerSocialRate || 28.0;
    const name = filename || `KIBOSH_Regional_Tax_Report_${country}_${campaign.id}.xlsx`;

    const totalNet = campaign.records.reduce((acc, r) => acc + r.netPay, 0);
    const totalEstGross = totalNet / (1 - taxRate / 100);
    const totalEstTax = totalEstGross * (taxRate / 100);
    const totalEstSocial = totalEstGross * (socialRate / 100);

    const summaryData = [
      { Parametre: 'Pays & Juridiction Fiscale', Valeur: country },
      { Parametre: 'Code Devise', Valeur: region?.currencyCode || 'EUR' },
      { Parametre: 'Régime Fiscal de Paie', Valeur: region?.taxRegime || 'Code du Travail & PAS' },
      { Parametre: 'Cadre Réglementaire', Valeur: region?.legalFramework || 'RGPD' },
      { Parametre: 'Taux Moyen d\'Impôt Salarial (%)', Valeur: `${taxRate}%` },
      { Parametre: 'Taux Charges Patronales (%)', Valeur: `${socialRate}%` },
      { Parametre: 'Masse Salariale Brute Estimée', Valeur: `${totalEstGross.toFixed(2)} ${symbol}` },
      { Parametre: 'Total Retenues d\'Impôt à la Source', Valeur: `${totalEstTax.toFixed(2)} ${symbol}` },
      { Parametre: 'Total Cotisations Patronales', Valeur: `${totalEstSocial.toFixed(2)} ${symbol}` },
      { Parametre: 'Total Net Distribution', Valeur: `${totalNet.toFixed(2)} ${symbol}` }
    ];

    const recordsData = campaign.records.map(rec => {
      const gross = rec.netPay / (1 - taxRate / 100);
      const tax = gross * (taxRate / 100);
      const social = gross * (socialRate / 100);

      return {
        'Matricule': rec.matricule,
        'Nom Employé': rec.employeeName,
        'Département': rec.department,
        'Email': rec.email,
        [`Salaire Brut Estimé (${symbol})`]: parseFloat(gross.toFixed(2)),
        [`Retenue Impôt (${taxRate}%) (${symbol})`]: parseFloat(tax.toFixed(2)),
        [`Cotisations Patronales (${socialRate}%) (${symbol})`]: parseFloat(social.toFixed(2)),
        [`Net à Payer (${symbol})`]: parseFloat(rec.netPay.toFixed(2)),
        'Conformité SMIC/SMIG': gross >= (region?.minWage || 1766.92) ? 'Conforme' : 'Alerte SMIG',
        'Statut Envoi': rec.status
      };
    });

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsRecords = XLSX.utils.json_to_sheet(recordsData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Synthese Fiscale');
    XLSX.utils.book_append_sheet(workbook, wsRecords, 'Detail par Salarie');
    XLSX.writeFile(workbook, name);
  }

  /**
   * Export Audit Logs to Excel
   */
  static exportAuditLogsToExcel(logs: AuditLog[], filename = 'KIBOSH_Audit_Logs.xlsx') {
    const data = logs.map(l => ({
      'Log ID': l.id,
      'Timestamp': l.timestamp,
      'User': l.user,
      'Role': l.userRole,
      'IP Address': l.ipAddress,
      'Category': l.category,
      'Action': l.action,
      'Result': l.result,
      'Details': l.details
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
    XLSX.writeFile(workbook, filename);
  }
}

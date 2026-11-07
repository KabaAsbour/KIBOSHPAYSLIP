import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DistributionCampaign, AuditLog, RegionSettings } from '../types';

export class ReportService {
  /**
   * Formats currency according to regional settings.
   */
  static formatCurrency(amount: number, region?: RegionSettings): string {
    const symbol = region?.currencySymbol || 'FG';
    const locale = region?.locale || 'fr-GN';
    const isZeroDecimal = region?.currencyCode === 'GNF' || (!region && symbol === 'FG');
    try {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: isZeroDecimal ? 0 : 2,
        maximumFractionDigits: isZeroDecimal ? 0 : 2
      }).format(amount);
      return region?.currencyCode === 'XOF' || region?.currencyCode === 'XAF' || region?.currencyCode === 'GNF' || symbol === 'FG' || symbol === 'FCFA'
        ? `${formatted} ${symbol}`
        : `${symbol} ${formatted}`;
    } catch {
      return `${amount.toLocaleString()} ${symbol}`;
    }
  }

  /**
   * Generates a PDF summary report for a campaign with regional settings.
   */
  static async generateCampaignPdfReport(campaign: DistributionCampaign, region?: RegionSettings): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const timesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const currSymbol = region?.currencySymbol || 'FG';
    const countryName = region?.countryName || 'Guinée (Conakry)';
    const taxRegime = region?.taxRegime || 'Code du Travail Guinéen & RTS / CNSS';

    // Title Banner
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width: width,
      height: 70,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText('ENTERPRISE PAYSLIP DISTRIBUTION PLATFORM', {
      x: 35,
      y: height - 35,
      size: 14,
      font: timesBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`CAMPAIGN AUDIT & REGIONAL COMPLIANCE REPORT (${countryName.toUpperCase()})`, {
      x: 35,
      y: height - 52,
      size: 10,
      font: timesFont,
      color: rgb(0.8, 0.9, 1),
    });

    page.drawText(`CAMPAIGN ID: ${campaign.id}`, {
      x: width - 200,
      y: height - 35,
      size: 11,
      font: timesBold,
      color: rgb(1, 0.85, 0.3),
    });

    // Overview Table
    let y = height - 100;
    page.drawText('1. CAMPAIGN & REGIONAL TAX JURISDICTION OVERVIEW', { x: 35, y, size: 12, font: timesBold, color: rgb(0.1, 0.2, 0.5) });
    y -= 20;

    const metadata = [
      ['Payroll Period:', campaign.payrollMonth, 'Jurisdiction:', `${countryName} (${region?.currencyCode || 'EUR'})`],
      ['Uploaded By:', campaign.uploadedBy, 'Tax Regime:', taxRegime.substring(0, 30)],
      ['Total Employees:', `${campaign.totalEmployees}`, 'Legal Framework:', (region?.legalFramework || 'RGPD').substring(0, 30)],
      ['Delivered Count:', `${campaign.deliveredCount}`, 'Failed Count:', `${campaign.failedCount}`],
      ['Campaign Status:', campaign.status, 'Min Wage Reference:', ReportService.formatCurrency(region?.minWage || 1766.92, region)]
    ];

    metadata.forEach((row) => {
      page.drawText(row[0], { x: 35, y, size: 9, font: timesBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(row[1], { x: 140, y, size: 9, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(row[2], { x: 300, y, size: 9, font: timesBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(row[3], { x: 410, y, size: 9, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      y -= 18;
    });

    y -= 15;
    page.drawText('2. EMPLOYEE DELIVERY RECORDS LIST', { x: 35, y, size: 12, font: timesBold, color: rgb(0.1, 0.2, 0.5) });
    y -= 25;

    // Table Headers
    page.drawRectangle({
      x: 35,
      y: y - 5,
      width: width - 70,
      height: 20,
      color: rgb(0.9, 0.93, 0.96),
    });

    page.drawText('MATRICULE', { x: 45, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('EMPLOYEE NAME', { x: 120, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('DEPARTMENT', { x: 240, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`NET PAY (${currSymbol})`, { x: 350, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('STATUS', { x: 450, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });

    y -= 22;

    campaign.records.slice(0, 20).forEach((rec, rIdx) => {
      if (rIdx % 2 === 0) {
        page.drawRectangle({
          x: 35,
          y: y - 4,
          width: width - 70,
          height: 18,
          color: rgb(0.98, 0.98, 0.99),
        });
      }

      const statusColor = rec.status === 'Delivered' ? rgb(0.1, 0.6, 0.2) : rgb(0.8, 0.2, 0.2);

      page.drawText(rec.matricule, { x: 45, y, size: 8, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(rec.employeeName.substring(0, 20), { x: 120, y, size: 8, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(rec.department.substring(0, 16), { x: 240, y, size: 8, font: timesFont, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(ReportService.formatCurrency(rec.netPay, region), { x: 350, y, size: 8, font: timesFont, color: rgb(0.1, 0.4, 0.2) });
      page.drawText(rec.status, { x: 450, y, size: 8, font: timesBold, color: statusColor });

      y -= 19;
    });

    // Signature Block at Bottom
    page.drawText('REPORT CERTIFICATION & REGIONAL REGULATORY SIGN-OFF', { x: 35, y: 90, size: 9, font: timesBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Jurisdiction: ${countryName} | Tax Regime: ${taxRegime}`, { x: 35, y: 75, size: 8, font: timesFont, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('HR Auditor Signature: _______________________      Payroll Officer Signature: _______________________', { x: 35, y: 45, size: 8, font: timesFont, color: rgb(0.4, 0.4, 0.4) });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KIBOSH_Regional_Report_${countryName}_${campaign.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a Regional Tax & Social Contributions PDF Report
   */
  static async generateRegionalTaxPdfReport(campaign: DistributionCampaign, region?: RegionSettings): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const timesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const country = region?.countryName || 'Guinée (Conakry)';
    const currency = region?.currencyCode || 'GNF';
    const taxRate = region?.defaultTaxRate || 10.0;
    const socialRate = region?.employerSocialRate || 18.0;

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 75,
      width: width,
      height: 75,
      color: rgb(0.05, 0.25, 0.2),
    });

    page.drawText('RAPPORT DE CONFORMITÉ FISCALE & SOCIALE RÉGIONALISÉE', {
      x: 35,
      y: height - 35,
      size: 13,
      font: timesBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`JURIDICTION : ${country.toUpperCase()} (${currency}) — RÉGIME : ${region?.taxRegime || 'PAS / CSG'}`, {
      x: 35,
      y: height - 52,
      size: 9,
      font: timesFont,
      color: rgb(0.7, 0.95, 0.8),
    });

    let y = height - 105;

    // Totals calculated from campaign
    const totalNet = campaign.records.reduce((acc, r) => acc + r.netPay, 0);
    const estGross = totalNet / (1 - taxRate / 100);
    const estTaxWithheld = estGross * (taxRate / 100);
    const estEmployerSocial = estGross * (socialRate / 100);

    page.drawText('1. SYNTHÈSE DES RETENUES ET COTISATIONS PAR CAMPAGNE', { x: 35, y, size: 11, font: timesBold, color: rgb(0.05, 0.3, 0.2) });
    y -= 20;

    const summaryRows = [
      ['Période de Paie :', campaign.payrollMonth, 'Taux Impôt Moy. :', `${taxRate}%`],
      ['Masse Salariale Brute Estimée :', ReportService.formatCurrency(estGross, region), 'Taux Charges Patronales :', `${socialRate}%`],
      ['Total Impôt / Retenue Source :', ReportService.formatCurrency(estTaxWithheld, region), 'Cadre Réglementaire :', (region?.legalFramework || 'RGPD').substring(0, 28)],
      ['Total Net Distribuable :', ReportService.formatCurrency(totalNet, region), 'Cotisations Patronales :', ReportService.formatCurrency(estEmployerSocial, region)]
    ];

    summaryRows.forEach((r) => {
      page.drawText(r[0], { x: 35, y, size: 9, font: timesBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(r[1], { x: 180, y, size: 9, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(r[2], { x: 320, y, size: 9, font: timesBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(r[3], { x: 440, y, size: 9, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      y -= 18;
    });

    y -= 15;
    page.drawText('2. DÉTAIL PAR SALARIÉ (JURIDICTION FISCALE)', { x: 35, y, size: 11, font: timesBold, color: rgb(0.05, 0.3, 0.2) });
    y -= 22;

    page.drawRectangle({
      x: 35,
      y: y - 5,
      width: width - 70,
      height: 20,
      color: rgb(0.9, 0.95, 0.92),
    });

    page.drawText('MATRICULE', { x: 45, y, size: 8, font: timesBold, color: rgb(0.1, 0.2, 0.1) });
    page.drawText('EMPLOYÉ', { x: 120, y, size: 8, font: timesBold, color: rgb(0.1, 0.2, 0.1) });
    page.drawText('BRUT EST.', { x: 230, y, size: 8, font: timesBold, color: rgb(0.1, 0.2, 0.1) });
    page.drawText('RETENUE IMPÔT', { x: 320, y, size: 8, font: timesBold, color: rgb(0.1, 0.2, 0.1) });
    page.drawText('NET À PAYER', { x: 430, y, size: 8, font: timesBold, color: rgb(0.1, 0.2, 0.1) });

    y -= 22;

    campaign.records.slice(0, 22).forEach((rec, idx) => {
      if (idx % 2 === 0) {
        page.drawRectangle({
          x: 35,
          y: y - 4,
          width: width - 70,
          height: 18,
          color: rgb(0.97, 0.99, 0.98),
        });
      }

      const gross = rec.netPay / (1 - taxRate / 100);
      const tax = gross * (taxRate / 100);

      page.drawText(rec.matricule, { x: 45, y, size: 8, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(rec.employeeName.substring(0, 18), { x: 120, y, size: 8, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(ReportService.formatCurrency(gross, region), { x: 230, y, size: 8, font: timesFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(ReportService.formatCurrency(tax, region), { x: 320, y, size: 8, font: timesFont, color: rgb(0.7, 0.1, 0.1) });
      page.drawText(ReportService.formatCurrency(rec.netPay, region), { x: 430, y, size: 8, font: timesBold, color: rgb(0.1, 0.5, 0.2) });

      y -= 19;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KIBOSH_Rapport_Fiscal_${country}_${campaign.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a System Security & Audit PDF Report
   */
  static async generateAuditPdfReport(logs: AuditLog[]): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const timesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 0,
      y: height - 70,
      width: width,
      height: 70,
      color: rgb(0.15, 0.18, 0.25),
    });

    page.drawText('ENTERPRISE SECURITY & AUDIT TRAIL LOG', {
      x: 35,
      y: height - 40,
      size: 14,
      font: timesBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Exported: ${new Date().toLocaleString()} | Total Log Records: ${logs.length}`, {
      x: 35,
      y: height - 56,
      size: 9,
      font: timesFont,
      color: rgb(0.8, 0.85, 0.9),
    });

    let y = height - 100;

    page.drawRectangle({
      x: 35,
      y: y - 5,
      width: width - 70,
      height: 20,
      color: rgb(0.9, 0.92, 0.95),
    });

    page.drawText('TIMESTAMP', { x: 45, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('USER & ROLE', { x: 150, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('ACTION / EVENT', { x: 280, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('RESULT', { x: 460, y, size: 8, font: timesBold, color: rgb(0.2, 0.2, 0.2) });

    y -= 22;

    logs.slice(0, 25).forEach((log, idx) => {
      if (idx % 2 === 0) {
        page.drawRectangle({
          x: 35,
          y: y - 4,
          width: width - 70,
          height: 18,
          color: rgb(0.98, 0.98, 0.99),
        });
      }

      const resColor = log.result === 'Success' ? rgb(0.1, 0.5, 0.2) : log.result === 'Warning' ? rgb(0.8, 0.5, 0.1) : rgb(0.8, 0.2, 0.2);

      page.drawText(log.timestamp.substring(0, 16), { x: 45, y, size: 8, font: timesFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`${log.user.substring(0, 16)} (${log.userRole.substring(0, 2)})`, { x: 150, y, size: 8, font: timesFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(log.action.substring(0, 28), { x: 280, y, size: 8, font: timesFont, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(log.result, { x: 460, y, size: 8, font: timesBold, color: resColor });

      y -= 19;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KIBOSH_Audit_Security_Trail.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

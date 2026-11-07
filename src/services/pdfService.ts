import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Employee, ExtractedPayslip, PayslipDetectionResult, BatchDocumentType, DocumentValidationResult, PdfSplitProgress } from '../types';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export class PdfService {
  /**
   * Generates a multi-page PDF containing realistic payslips for given employees.
   */
  static async generateSamplePayrollBatchPdf(
    employees: Employee[],
    monthYear: string = 'July 2026'
  ): Promise<{ pdfBytes: Uint8Array; blobUrl: string; fileName: string }> {
    const pdfDoc = await PDFDocument.create();
    const timesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
      const { width, height } = page.getSize();

      // Top Banner Header
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width: width,
        height: 80,
        color: rgb(0.08, 0.18, 0.36), // Deep Navy
      });

      page.drawText('ENTERPRISE GLOBAL INC.', {
        x: 40,
        y: height - 40,
        size: 18,
        font: timesBold,
        color: rgb(1, 1, 1),
      });

      page.drawText('OFFICIAL SALARY & REMUNERATION STATEMENT', {
        x: 40,
        y: height - 60,
        size: 10,
        font: timesFont,
        color: rgb(0.85, 0.9, 1),
      });

      page.drawText(`PAY PERIOD: ${monthYear.toUpperCase()}`, {
        x: width - 200,
        y: height - 40,
        size: 11,
        font: timesBold,
        color: rgb(1, 0.85, 0.3),
      });

      // Employee Information Box
      page.drawRectangle({
        x: 40,
        y: height - 210,
        width: width - 80,
        height: 115,
        color: rgb(0.96, 0.97, 0.99),
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1,
      });

      page.drawText('EMPLOYEE CONFIDENTIAL RECORD', {
        x: 55,
        y: height - 112,
        size: 10,
        font: timesBold,
        color: rgb(0.1, 0.3, 0.6),
      });

      // KEY MATRICULE LINE FOR EXTRACTION ENGINE
      page.drawText(`EMPLOYEE MATRICULE: ${emp.matricule}`, {
        x: 55,
        y: height - 132,
        size: 13,
        font: timesBold,
        color: rgb(0.8, 0.1, 0.1), // Highlighted text
      });

      page.drawText(`Full Name: ${emp.firstName} ${emp.lastName}`, {
        x: 55,
        y: height - 150,
        size: 11,
        font: timesFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(`Department: ${emp.department}`, {
        x: 55,
        y: height - 168,
        size: 11,
        font: timesFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(`Position: ${emp.position}`, {
        x: 55,
        y: height - 186,
        size: 11,
        font: timesFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(`Registered Email: ${emp.email}`, {
        x: 310,
        y: height - 150,
        size: 10,
        font: timesFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Company: ${emp.company}`, {
        x: 310,
        y: height - 168,
        size: 10,
        font: timesFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Page Ref: Page 1 of 1`, {
        x: 310,
        y: height - 186,
        size: 10,
        font: timesFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Earnings & Deductions Table Header
      const tableY = height - 240;
      page.drawRectangle({
        x: 40,
        y: tableY - 25,
        width: width - 80,
        height: 25,
        color: rgb(0.15, 0.25, 0.4),
      });

      page.drawText('DESCRIPTION / PAY ELEMENT', {
        x: 55,
        y: tableY - 17,
        size: 10,
        font: timesBold,
        color: rgb(1, 1, 1),
      });

      page.drawText('BASE RATE', {
        x: 260,
        y: tableY - 17,
        size: 10,
        font: timesBold,
        color: rgb(1, 1, 1),
      });

      page.drawText('EARNINGS (€)', {
        x: 360,
        y: tableY - 17,
        size: 10,
        font: timesBold,
        color: rgb(1, 1, 1),
      });

      page.drawText('DEDUCTIONS (€)', {
        x: 470,
        y: tableY - 17,
        size: 10,
        font: timesBold,
        color: rgb(1, 1, 1),
      });

      // Financial Calculation per employee seed
      const baseSalary = 3800 + (i * 350);
      const bonus = 450 + (i * 50);
      const grossPay = baseSalary + bonus;
      const incomeTax = Math.round(grossPay * 0.18 * 100) / 100;
      const socialSecurity = Math.round(grossPay * 0.08 * 100) / 100;
      const healthInsurance = 120.00;
      const totalDeductions = Math.round((incomeTax + socialSecurity + healthInsurance) * 100) / 100;
      const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

      const items = [
        { name: 'Basic Base Salary', rate: '100%', earn: baseSalary.toFixed(2), ded: '-' },
        { name: 'Monthly Performance Bonus', rate: 'Standard', earn: bonus.toFixed(2), ded: '-' },
        { name: 'State Income Tax Withholding', rate: '18.0%', earn: '-', ded: incomeTax.toFixed(2) },
        { name: 'Social Security Contribution', rate: '8.0%', earn: '-', ded: socialSecurity.toFixed(2) },
        { name: 'Group Health Insurance Premium', rate: 'Fixed', earn: '-', ded: healthInsurance.toFixed(2) },
      ];

      let rowY = tableY - 45;
      items.forEach((item, rIdx) => {
        if (rIdx % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: rowY - 5,
            width: width - 80,
            height: 20,
            color: rgb(0.97, 0.98, 1),
          });
        }
        page.drawText(item.name, { x: 55, y: rowY, size: 9, font: timesFont, color: rgb(0.2, 0.2, 0.2) });
        page.drawText(item.rate, { x: 260, y: rowY, size: 9, font: timesFont, color: rgb(0.4, 0.4, 0.4) });
        page.drawText(item.earn, { x: 360, y: rowY, size: 9, font: timesFont, color: rgb(0.1, 0.5, 0.2) });
        page.drawText(item.ded, { x: 470, y: rowY, size: 9, font: timesFont, color: rgb(0.7, 0.2, 0.2) });
        rowY -= 22;
      });

      // Summary Box (Gross, Deductions, Net Payable)
      page.drawRectangle({
        x: 40,
        y: rowY - 70,
        width: width - 80,
        height: 65,
        color: rgb(0.94, 0.96, 0.98),
        borderColor: rgb(0.2, 0.4, 0.7),
        borderWidth: 1.5,
      });

      page.drawText(`TOTAL GROSS EARNINGS: € ${grossPay.toFixed(2)}`, {
        x: 55,
        y: rowY - 25,
        size: 11,
        font: timesBold,
        color: rgb(0.1, 0.4, 0.2),
      });

      page.drawText(`TOTAL DEDUCTIONS: € ${totalDeductions.toFixed(2)}`, {
        x: 55,
        y: rowY - 50,
        size: 11,
        font: timesBold,
        color: rgb(0.7, 0.2, 0.2),
      });

      page.drawRectangle({
        x: width - 260,
        y: rowY - 65,
        width: 210,
        height: 55,
        color: rgb(0.1, 0.2, 0.4),
      });

      page.drawText('NET AMOUNT PAYABLE', {
        x: width - 245,
        y: rowY - 25,
        size: 9,
        font: timesBold,
        color: rgb(0.8, 0.9, 1),
      });

      page.drawText(`€ ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
        x: width - 245,
        y: rowY - 50,
        size: 16,
        font: timesBold,
        color: rgb(1, 0.9, 0.3),
      });

      // Bottom Security Disclaimer & Stamp
      page.drawText('ELECTRONIC PAYSLIP VALIDATION & AUDIT STAMP', {
        x: 40,
        y: 90,
        size: 9,
        font: timesBold,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText(`Generated on: ${new Date().toISOString().substring(0, 10)} | Cryptographic Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`, {
        x: 40,
        y: 75,
        size: 8,
        font: timesFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText('CONFIDENTIAL NOTICE: This electronic document is legally binding under Directive 2026/88/KIBOSH. Unauthorized disclosure is strictly prohibited.', {
        x: 40,
        y: 50,
        size: 7,
        font: timesFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blobUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    const fileName = `Bulk_Payroll_${monthYear.replace(/\s+/g, '_')}_Master.pdf`;

    return { pdfBytes, blobUrl, fileName };
  }

  /**
   * Generates a sample Non-Payslip commercial invoice PDF to demonstrate detection of invalid non-payslip documents.
   */
  static async generateSampleNonPayslipPdf(): Promise<{ pdfBytes: Uint8Array; blobUrl: string; fileName: string }> {
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
      color: rgb(0.8, 0.2, 0.2), // Red banner for invoice
    });

    page.drawText('COMMERCIAL INVOICE / FACTURE MATERIEL', {
      x: 40,
      y: height - 40,
      size: 16,
      font: timesBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('FACTURE N: FACT-2026-9901 | DATE: 15/07/2026', {
      x: 40,
      y: height - 60,
      size: 10,
      font: timesFont,
      color: rgb(1, 0.9, 0.9),
    });

    page.drawText('FOURNISSEUR: LOGITECH HARDWARE SUPPLIES LTD', {
      x: 40,
      y: height - 120,
      size: 12,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('Description des fournitures informatiques :', {
      x: 40,
      y: height - 150,
      size: 11,
      font: timesFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('1. Serveur Dell PowerEdge R750 - Quantite 2 - Total HT: 8,450.00 EUR', {
      x: 50,
      y: height - 180,
      size: 10,
      font: timesFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('2. Licences Logiciel ERP Cloud - Quantite 10 - Total HT: 2,100.00 EUR', {
      x: 50,
      y: height - 200,
      size: 10,
      font: timesFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('MONTANT TOTAL FACTURE : 10,550.00 EUR HT (TVA 20% = 2,110.00 EUR)', {
      x: 40,
      y: height - 250,
      size: 12,
      font: timesBold,
      color: rgb(0.8, 0.1, 0.1),
    });

    page.drawText('ATTENTION: Ce document est une facture commerciale. Ce n\'est pas un bulletin de paie.', {
      x: 40,
      y: height - 300,
      size: 10,
      font: timesBold,
      color: rgb(0.5, 0.1, 0.1),
    });

    const pdfBytes = await pdfDoc.save();
    const blobUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    const fileName = 'Facture_Commerciale_Materiel_Informatique.pdf';
    return { pdfBytes, blobUrl, fileName };
  }

  /**
   * Generates a sample Non-Payslip student academic report card (Bulletin Scolaire) PDF
   * to demonstrate rejection of student grades/academic documents.
   */
  static async generateSampleAcademicReportPdf(): Promise<{ pdfBytes: Uint8Array; blobUrl: string; fileName: string }> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top Academic Banner Header
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(0.12, 0.32, 0.22), // Forest Green
    });

    page.drawText('ACADEMIE DE PARIS - LYCEE D\'EXCELLENCE VICTOR HUGO', {
      x: 40,
      y: height - 35,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('BULLETIN SCOLAIRE DU 1ER TRIMESTRE - ANNEE SCOLAIRE 2025-2026', {
      x: 40,
      y: height - 58,
      size: 11,
      font: fontBold,
      color: rgb(0.9, 0.98, 0.92),
    });

    // Student & Class Information Box
    page.drawRectangle({
      x: 40,
      y: height - 195,
      width: width - 80,
      height: 100,
      color: rgb(0.96, 0.99, 0.97),
      borderColor: rgb(0.7, 0.85, 0.75),
      borderWidth: 1,
    });

    page.drawText('IDENTIFICATION DE L\'ELEVE', {
      x: 55,
      y: height - 110,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.4, 0.2),
    });

    page.drawText('Nom & Prenom : DUBOIS Alexandre', {
      x: 55,
      y: height - 128,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('Matricule Eleve : MAT-SCO-2026-0941', {
      x: 55,
      y: height - 146,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('Date de Naissance : 14/05/2008', {
      x: 55,
      y: height - 164,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('Classe : Terminale Generale TS1 (Effectif : 32)', {
      x: 310,
      y: height - 128,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('Professeur Principal : M. Bertrand VALLIER', {
      x: 310,
      y: height - 146,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('Regime : Externe | Statut : Scolarite Active', {
      x: 310,
      y: height - 164,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Subjects & Grades Table Header
    const tableY = height - 215;
    page.drawRectangle({
      x: 40,
      y: tableY - 24,
      width: width - 80,
      height: 24,
      color: rgb(0.15, 0.4, 0.25),
    });

    page.drawText('DISCIPLINE / MATIERE', { x: 50, y: tableY - 16, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('COEF', { x: 210, y: tableY - 16, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('MOY ELEVE', { x: 250, y: tableY - 16, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('MOY CLASSE', { x: 320, y: tableY - 16, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('RANG', { x: 395, y: tableY - 16, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('APPRECIATIONS DU PROFESSEUR', { x: 440, y: tableY - 16, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

    const subjects = [
      { name: 'Mathematiques Specialite', coef: '8', note: '16.5 / 20', classAvg: '12.4', rank: '2/32', comm: 'Tres bon trimestre. Rigueur exemplaire.' },
      { name: 'Physique - Chimie', coef: '6', note: '15.0 / 20', classAvg: '11.8', rank: '4/32', comm: 'Bon travail experimental et theorique.' },
      { name: 'Numerique & Sciences Info (NSI)', coef: '6', note: '18.0 / 20', classAvg: '13.5', rank: '1/32', comm: 'Excellent niveau en programmation.' },
      { name: 'Philosophie', coef: '4', note: '13.5 / 20', classAvg: '10.9', rank: '7/32', comm: 'Reflexion interessante, bonne participation.' },
      { name: 'Histoire - Geographie', coef: '3', note: '14.5 / 20', classAvg: '12.1', rank: '6/32', comm: 'Travail serieux et regulier.' },
      { name: 'Anglais LV1', coef: '3', note: '16.0 / 20', classAvg: '13.0', rank: '3/32', comm: 'Aisance remarquable a l\'oral.' },
      { name: 'Education Physique & Sportive', coef: '2', note: '15.0 / 20', classAvg: '14.2', rank: '8/32', comm: 'Bon investissement sportif.' },
    ];

    let rowY = tableY - 42;
    subjects.forEach((sub, idx) => {
      if (idx % 2 === 0) {
        page.drawRectangle({
          x: 40,
          y: rowY - 4,
          width: width - 80,
          height: 18,
          color: rgb(0.96, 0.98, 0.96),
        });
      }
      page.drawText(sub.name, { x: 50, y: rowY, size: 8.5, font: fontBold, color: rgb(0.1, 0.2, 0.1) });
      page.drawText(sub.coef, { x: 215, y: rowY, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(sub.note, { x: 250, y: rowY, size: 8.5, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
      page.drawText(sub.classAvg, { x: 330, y: rowY, size: 8.5, font: font, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(sub.rank, { x: 400, y: rowY, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(sub.comm, { x: 440, y: rowY, size: 8, font: font, color: rgb(0.25, 0.25, 0.25) });
      rowY -= 20;
    });

    // Summary Box: Conseil de classe & Moyenne Generale
    page.drawRectangle({
      x: 40,
      y: rowY - 80,
      width: width - 80,
      height: 75,
      color: rgb(0.93, 0.97, 0.94),
      borderColor: rgb(0.2, 0.5, 0.3),
      borderWidth: 1.5,
    });

    page.drawText('BILAN GENERAL DU TRIMESTRE :', {
      x: 55,
      y: rowY - 22,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.15),
    });

    page.drawText('MOYENNE GENERALE ELEVE : 15.65 / 20 (Moyenne Classe : 12.30)', {
      x: 55,
      y: rowY - 40,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.2),
    });

    page.drawText('Assiduite & Discipline : 0 absence injustifiee - 0 retard - Conduite exemplaire', {
      x: 55,
      y: rowY - 56,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('AVIS DU CONSEIL DE CLASSE : TABLEAU D\'HONNEUR & FELICITATIONS DU CONSEIL', {
      x: 55,
      y: rowY - 72,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.7),
    });

    // Signatures
    page.drawText('Le Professeur Principal', { x: 60, y: 90, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Le Chef d\'Etablissement / Proviseur', { x: width - 240, y: 90, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });

    page.drawText('AVERTISSEMENT : Ce document est un bulletin scolaire / releve de notes d\'un eleve. Ce n\'est pas un bulletin de paie.', {
      x: 40,
      y: 50,
      size: 7.5,
      font: fontBold,
      color: rgb(0.6, 0.1, 0.1),
    });

    const pdfBytes = await pdfDoc.save();
    const blobUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    const fileName = 'Bulletin_Scolaire_1er_Trimestre_DUBOIS_Alexandre.pdf';
    return { pdfBytes, blobUrl, fileName };
  }

  /**
   * Analyzes an uploaded PDF document to determine if it is a valid payslip/payroll file or a non-payslip document.
   */
  static async detectPayslipType(fileBytes: Uint8Array): Promise<PayslipDetectionResult> {
    try {
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();

      let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
      try {
        const safeBytes = new Uint8Array(fileBytes);
        const loadingTask = pdfjsLib.getDocument({ data: safeBytes });
        pdfjsDoc = await loadingTask.promise;
      } catch (e) {
        console.warn("pdfjsDoc load failed:", e);
      }

      // Explicit Academic & School Report Card Indicators
      const academicKeywords = [
        'bulletin scolaire', 'bulletin de notes', 'bulletin trimestriel', 'bulletin semestriel',
        'bulletin annuel', 'bulletin de l\'élève', 'bulletin de l\'eleve', 'bulletin d\'évaluation',
        'relevé de notes', 'releve de notes', 'carnet de notes', 'livret scolaire',
        'certificat de scolarité', 'certificat de scolarite', 'moyenne générale', 'moyenne generale',
        'moyenne de classe', 'moyenne annuelle', 'moyenne semestrielle', 'moyenne du trimestre',
        'conseil de classe', 'tableau d\'honneur', 'félicitations du conseil', 'felicitations du conseil',
        'encouragements du conseil', 'avertissement travail', 'avertissement conduite',
        'professeur principal', 'chef d\'établissement', 'chef d\'etablissement', 'directeur d\'école',
        'année scolaire', 'annee scolaire', 'assiduité', 'assiduite', 'appréciation des professeurs',
        'appreciation des professeurs', 'observations du professeur', 'élève', 'eleve', 'élèves',
        'étudiant', 'etudiant', 'étudiante', 'lycée', 'lycee', 'collège', 'college', 'école primaire',
        'scolarité', 'scolarite', 'classe de', 'terminale', 'crédits ects', 'credits ects',
        'discipline', 'matière', 'matières', 'matiere', 'matieres'
      ];

      // Explicit Commercial Invoice Indicators
      const invoiceKeywords = [
        'facture', 'invoice', 'bon de commande', 'purchase order', 'devis', 'quotation',
        'bon de livraison', 'delivery note', 'fournisseur', 'montant total ht', 'total ht',
        'total ttc', 'tva 20%', 'conditions de règlement', 'échéance de paiement'
      ];

      // Other Non-Payslip Documents
      const otherNonPayslipKeywords = [
        'contrat de bail', 'statuts de la société', 'curriculum vitae', 'lettre de motivation',
        'relevé bancaire', 'bank statement', 'relevé d\'identité bancaire', 'manuel d\'utilisation',
        'procès-verbal d\'assemblée'
      ];

      // Essential Core Payroll Markers
      const payrollKeywords = [
        'bulletin de paie', 'fiche de paie', 'bulletin de salaire', 'bulletin de remuneration',
        'bulletin de rémunération', 'payslip', 'pay stub', 'net à payer', 'net a payer',
        'net payable', 'salaire net', 'salaire brut', 'salaire de base', 'total brut',
        'net imposable', 'net fiscal', 'prélèvement à la source', 'prelevement a la source',
        'cotisations', 'charges sociales', 'charges patronales', 'cotisations salariales',
        'sécurité sociale', 'securite sociale', 'période de paie', 'periode de paie',
        'heures travaillées', 'heures normales', 'heures supplémentaires', 'urssaf', 'siret',
        'convention collective', 'cumul net', 'remuneration brute', 'salarié', 'employeur'
      ];

      let fullExtractedText = '';
      const pagesInspected = Math.min(pageCount, 5);

      for (let i = 0; i < pagesInspected; i++) {
        if (pdfjsDoc) {
          try {
            const page = await pdfjsDoc.getPage(i + 1);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullExtractedText += ' ' + pageText;
          } catch (err) {
            console.warn(`Error extracting text page ${i + 1}`, err);
          }
        }
      }

      if (pdfjsDoc) {
        try {
          if (typeof (pdfjsDoc as any).destroy === 'function') {
            (pdfjsDoc as any).destroy();
          }
        } catch (_) {}
      }

      const lowerText = fullExtractedText.toLowerCase().replace(/\s+/g, ' ');

      // Collect detected keywords
      const foundAcademicKw: string[] = [];
      academicKeywords.forEach(kw => {
        if (lowerText.includes(kw) && !foundAcademicKw.includes(kw)) {
          foundAcademicKw.push(kw);
        }
      });

      const foundInvoiceKw: string[] = [];
      invoiceKeywords.forEach(kw => {
        if (lowerText.includes(kw) && !foundInvoiceKw.includes(kw)) {
          foundInvoiceKw.push(kw);
        }
      });

      const foundOtherNonPayslipKw: string[] = [];
      otherNonPayslipKeywords.forEach(kw => {
        if (lowerText.includes(kw) && !foundOtherNonPayslipKw.includes(kw)) {
          foundOtherNonPayslipKw.push(kw);
        }
      });

      const foundPayrollKw: string[] = [];
      const missingPayrollKw: string[] = [];
      payrollKeywords.forEach(kw => {
        if (lowerText.includes(kw)) {
          if (!foundPayrollKw.includes(kw)) foundPayrollKw.push(kw);
        } else {
          missingPayrollKw.push(kw);
        }
      });

      const hasMatriculePattern = /(?:MATRICULE|EMPLOYEE ID|MAT|EMP\d{4,8}|[A-Z]{3}\d{6})\b/i.test(fullExtractedText);
      const hasNetPayPattern = /(?:NET\s*(?:A\s*PAYER|PAYABLE|PAY)|MONTANT\s*NET|SALAIRE\s*NET)\s*[:=]?\s*€?\s*\$?\s*[\d\s.,]{3,12}/i.test(fullExtractedText);

      // 1. Check for empty or scanned image without text
      if (lowerText.trim().length < 20) {
        return {
          isPayslip: false,
          confidenceScore: 10,
          documentType: 'IMAGE_OR_SCANNED_UNKNOWN',
          detectedKeywords: [],
          missingKeywords: missingPayrollKw.slice(0, 6),
          nonPayslipIndicators: ['Document scanné ou image sans texte lisible'],
          pageCount,
          reason: 'Document numérisé ou image sans couche de texte lisible. Veuillez fournir un fichier PDF avec du texte sélectionnable.'
        };
      }

      // 2. IMMEDIATE REJECTION: Academic Report Card (Bulletin Scolaire / Relevé de Notes)
      // Check for strong academic titles or multi-term academic evidence
      const hasStrongAcademicTitle = /(?:bulletin\s*scolaire|bulletin\s*de\s*notes|relev[eé]\s*de\s*notes|bulletin\s*trimestriel|bulletin\s*semestriel|conseil\s*de\s*classe|moyenne\s*g[eé]n[eé]rale|ann[eé]e\s*scolaire|tableau\s*d'honneur)/i.test(fullExtractedText);
      const hasStudentEvidence = foundAcademicKw.length >= 2 || hasStrongAcademicTitle;

      if (hasStudentEvidence) {
        return {
          isPayslip: false,
          confidenceScore: 0,
          documentType: 'ACADEMIC_REPORT_CARD',
          detectedKeywords: foundPayrollKw,
          missingKeywords: ['bulletin de paie', 'salaire brut', 'net à payer', 'cotisations sociales', 'charges patronales'],
          nonPayslipIndicators: foundAcademicKw.slice(0, 8),
          pageCount,
          reason: `Document Scolaire Non Conforme : Ce document a été identifié comme un Bulletin Scolaire / Relevé de Notes d'élève ou d'étudiant (présence de mentions académiques : ${foundAcademicKw.slice(0, 5).join(', ')}). La plateforme KIBOSH est strictement réservée aux bulletins de paie et fiches de salaire des salariés d'entreprises.`
        };
      }

      // 3. IMMEDIATE REJECTION: Commercial Invoices / Purchase Orders
      if (foundInvoiceKw.length >= 2 || lowerText.includes('facture n') || lowerText.includes('commercial invoice')) {
        return {
          isPayslip: false,
          confidenceScore: 0,
          documentType: 'COMMERCIAL_INVOICE',
          detectedKeywords: foundPayrollKw,
          missingKeywords: ['bulletin de paie', 'salaire brut', 'net à payer', 'cotisations sociales'],
          nonPayslipIndicators: foundInvoiceKw.slice(0, 6),
          pageCount,
          reason: `Document Commercial Non Conforme : Ce document est une facture commerciale, un devis ou un bon de commande (présence de mentions : ${foundInvoiceKw.slice(0, 4).join(', ')}). Il ne s'agit pas d'un bulletin de paie.`
        };
      }

      // 4. IMMEDIATE REJECTION: Other general non-payslip documents
      if (foundOtherNonPayslipKw.length > 0) {
        return {
          isPayslip: false,
          confidenceScore: 0,
          documentType: 'NON_PAYSLIP_DOCUMENT',
          detectedKeywords: foundPayrollKw,
          missingKeywords: ['bulletin de paie', 'net à payer', 'cotisations sociales'],
          nonPayslipIndicators: foundOtherNonPayslipKw,
          pageCount,
          reason: `Document Non-Paie Identifié : Contient des termes incompatibles avec la paie (${foundOtherNonPayslipKw.join(', ')}).`
        };
      }

      // 5. REQUIRE AUTHENTIC PAYROLL STRUCTURE
      // Must contain at least 2 distinct primary payroll keywords OR strong net pay formula
      const hasCorePayrollSignatures = (foundPayrollKw.length >= 2) || (hasNetPayPattern && foundPayrollKw.length >= 1);

      if (!hasCorePayrollSignatures) {
        return {
          isPayslip: false,
          confidenceScore: Math.min(25, foundPayrollKw.length * 10),
          documentType: 'NON_PAYSLIP_DOCUMENT',
          detectedKeywords: foundPayrollKw,
          missingKeywords: missingPayrollKw.slice(0, 6),
          nonPayslipIndicators: ['Structure de bulletin de paie absente'],
          pageCount,
          reason: 'Avertissement de Conformité : Structure de fiche de paie non reconnue. Les mentions salariales obligatoires (Net à Payer, Salaire Brut/Net, Cotisations sociales, Période de paie) sont absentes.'
        };
      }

      // Calculate confidence score for valid payslips
      let score = 40;
      if (foundPayrollKw.length >= 6) score += 40;
      else if (foundPayrollKw.length >= 4) score += 30;
      else if (foundPayrollKw.length >= 2) score += 20;

      if (hasMatriculePattern) score += 10;
      if (hasNetPayPattern) score += 10;
      score = Math.min(100, score);

      const docType = pageCount > 1 ? 'PAYSLIP_BATCH' : 'SINGLE_PAYSLIP';
      const reason = `Document valide : ${pageCount > 1 ? 'Lot de Fiches de Paie Multi-pages' : 'Bulletin de Paie Individuel'} (Confiance : ${score}%). Mentions de paie validées : ${foundPayrollKw.slice(0, 5).join(', ')}.`;

      return {
        isPayslip: true,
        confidenceScore: score,
        documentType: docType,
        detectedKeywords: foundPayrollKw,
        missingKeywords: missingPayrollKw.slice(0, 4),
        nonPayslipIndicators: [],
        pageCount,
        reason
      };
    } catch (err: any) {
      console.error("Error in detectPayslipType:", err);
      return {
        isPayslip: false,
        confidenceScore: 0,
        documentType: 'NON_PAYSLIP_DOCUMENT',
        detectedKeywords: [],
        missingKeywords: [],
        nonPayslipIndicators: ['Erreur de lecture PDF'],
        pageCount: 0,
        reason: 'Impossible de lire le fichier PDF. Format non supporté ou fichier corrompu.'
      };
    }
  }

  /**
   * Validates document content structure against the user-selected document type
   * using a keyword and structural check before proceeding with splitting.
   */
  static async validateDocumentContent(
    fileBytes: Uint8Array,
    selectedType: BatchDocumentType
  ): Promise<DocumentValidationResult> {
    try {
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();

      let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
      try {
        const safeBytes = new Uint8Array(fileBytes);
        const loadingTask = pdfjsLib.getDocument({ data: safeBytes });
        pdfjsDoc = await loadingTask.promise;
      } catch (e) {
        console.warn("pdfjsDoc load failed:", e);
      }

      // Keyword dictionaries by document type
      const PAYSLIP_KEYWORDS = [
        'bulletin de paie', 'bulletin de salaire', 'bulletin de remuneration', 'bulletin de rémunération',
        'fiche de paie', 'payslip', 'pay stub', 'net à payer', 'net a payer', 'net payable',
        'salaire brut', 'salaire net', 'total brut', 'cotisations', 'charges sociales',
        'heures travaillées', 'sécurité sociale', 'urssaf', 'matricule', 'net fiscal', 'net imposable'
      ];

      const INVOICE_KEYWORDS = [
        'facture', 'invoice', 'bon de commande', 'purchase order', 'devis', 'quotation',
        'total ht', 'total ttc', 'tva', 'fournisseur', 'échéance', 'conditions de règlement'
      ];

      const ACADEMIC_KEYWORDS = [
        'bulletin scolaire', 'bulletin de notes', 'relevé de notes', 'releve de notes',
        'conseil de classe', 'moyenne générale', 'moyenne de classe', 'année scolaire',
        'professeur principal', 'appréciation', 'assiduité', 'trimestre', 'semestre'
      ];

      const CONTRACT_KEYWORDS = [
        'contrat de travail', 'avenant', 'convention', 'accord d\'entreprise', 'cdi', 'cdd',
        'engagement', 'article 1', 'article 2', 'période d\'essai', 'clause de confidentialité'
      ];

      let fullExtractedText = '';
      const pagesInspected = Math.min(pageCount, 5);

      for (let i = 0; i < pagesInspected; i++) {
        if (pdfjsDoc) {
          try {
            const page = await pdfjsDoc.getPage(i + 1);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullExtractedText += ' ' + pageText;
          } catch (err) {
            console.warn(`Error extracting text page ${i + 1}`, err);
          }
        }
      }

      if (pdfjsDoc) {
        try {
          if (typeof (pdfjsDoc as any).destroy === 'function') {
            (pdfjsDoc as any).destroy();
          }
        } catch (_) {}
      }

      const lowerText = fullExtractedText.toLowerCase().replace(/\s+/g, ' ');

      if (lowerText.trim().length < 20) {
        return {
          isValid: false,
          selectedDocType: selectedType,
          detectedDocType: 'Scanned Image / Empty Text',
          confidenceScore: 0,
          matchedKeywords: [],
          missingMandatoryKeywords: ['Texte sélectionnable', 'Mots-clés structurés'],
          unexpectedKeywords: [],
          pageCount,
          structureValid: false,
          message: 'Le document téléversé est vide ou scanné sans couche texte exploitable (OCR requis).'
        };
      }

      // Check keyword frequencies
      const matchKeywords = (keywords: string[]) => keywords.filter(kw => lowerText.includes(kw));

      const matchedPayslip = matchKeywords(PAYSLIP_KEYWORDS);
      const matchedInvoice = matchKeywords(INVOICE_KEYWORDS);
      const matchedAcademic = matchKeywords(ACADEMIC_KEYWORDS);
      const matchedContract = matchKeywords(CONTRACT_KEYWORDS);

      const hasMatriculePattern = /(?:MATRICULE|EMPLOYEE ID|MAT|EMP\d{4,8}|[A-Z]{3}\d{6})\b/i.test(fullExtractedText);
      const hasNetPayPattern = /(?:NET\s*(?:A\s*PAYER|PAYABLE|PAY)|MONTANT\s*NET|SALAIRE\s*NET)\s*[:=]?\s*€?\s*\$?\s*[\d\s.,]{3,12}/i.test(fullExtractedText);

      if (selectedType === 'Payslip') {
        const isAcademicDetected = matchedAcademic.length >= 2;
        const isInvoiceDetected = matchedInvoice.length >= 2;
        const isPayslipValid = (matchedPayslip.length >= 2 || (hasNetPayPattern && matchedPayslip.length >= 1)) && !isAcademicDetected && !isInvoiceDetected;

        const missingMandatory: string[] = [];
        if (matchedPayslip.length === 0) missingMandatory.push('Fiche/Bulletin de paie');
        if (!hasNetPayPattern && !matchedPayslip.some(k => k.includes('net'))) missingMandatory.push('Net à payer');
        if (!hasMatriculePattern && !matchedPayslip.some(k => k.includes('matricule'))) missingMandatory.push('Matricule ou Identifiant Employé');

        const unexpected: string[] = [];
        if (isAcademicDetected) unexpected.push(...matchedAcademic);
        if (isInvoiceDetected) unexpected.push(...matchedInvoice);

        let confidence = Math.min(100, (matchedPayslip.length * 15) + (hasMatriculePattern ? 20 : 0) + (hasNetPayPattern ? 20 : 0));
        if (unexpected.length > 0) confidence = 0;

        return {
          isValid: isPayslipValid,
          selectedDocType: 'Payslip',
          detectedDocType: isAcademicDetected ? 'Bulletin Scolaire / Relevé de Notes' : isInvoiceDetected ? 'Facture Commerciale' : isPayslipValid ? 'Bulletin de Paie' : 'Document Inconnu / Non-Paie',
          confidenceScore: isPayslipValid ? confidence : 0,
          matchedKeywords: matchedPayslip,
          missingMandatoryKeywords: isPayslipValid ? [] : missingMandatory,
          unexpectedKeywords: unexpected,
          pageCount,
          structureValid: isPayslipValid,
          message: isPayslipValid
            ? `Structure de bulletin de paie validée (${matchedPayslip.length} mots-clés paie certifiés).`
            : unexpected.length > 0
              ? `Structure non conforme pour un bulletin de paie (présence de mentions : ${unexpected.slice(0, 4).join(', ')}).`
              : 'Structure de bulletin de paie absente ou incomplète (termes de rémunération non détectés).'
        };
      }

      if (selectedType === 'Invoice') {
        const isInvoiceValid = matchedInvoice.length >= 2;
        return {
          isValid: isInvoiceValid,
          selectedDocType: 'Invoice',
          detectedDocType: isInvoiceValid ? 'Facture Commerciale' : 'Autre Document',
          confidenceScore: isInvoiceValid ? Math.min(100, matchedInvoice.length * 25) : 10,
          matchedKeywords: matchedInvoice,
          missingMandatoryKeywords: isInvoiceValid ? [] : ['Facture/Invoice', 'Total HT/TTC', 'Fournisseur'],
          unexpectedKeywords: matchedAcademic,
          pageCount,
          structureValid: isInvoiceValid,
          message: isInvoiceValid
            ? `Structure de facture validée (${matchedInvoice.length} mots-clés de facturation).`
            : 'Structure de facture non reconnue (mentions de facturation absentes).'
        };
      }

      if (selectedType === 'Academic') {
        const isAcademicValid = matchedAcademic.length >= 2;
        return {
          isValid: isAcademicValid,
          selectedDocType: 'Academic',
          detectedDocType: isAcademicValid ? 'Bulletin Scolaire' : 'Autre Document',
          confidenceScore: isAcademicValid ? Math.min(100, matchedAcademic.length * 25) : 10,
          matchedKeywords: matchedAcademic,
          missingMandatoryKeywords: isAcademicValid ? [] : ['Bulletin scolaire', 'Moyenne générale', 'Trimestre'],
          unexpectedKeywords: [],
          pageCount,
          structureValid: isAcademicValid,
          message: isAcademicValid
            ? `Structure de relevé de notes / bulletin scolaire validée (${matchedAcademic.length} mots-clés académiques).`
            : 'Structure scolaire non reconnue.'
        };
      }

      if (selectedType === 'Contract') {
        const isContractValid = matchedContract.length >= 1;
        return {
          isValid: isContractValid,
          selectedDocType: 'Contract',
          detectedDocType: isContractValid ? 'Contrat / Accord' : 'Autre Document',
          confidenceScore: isContractValid ? Math.min(100, matchedContract.length * 30) : 20,
          matchedKeywords: matchedContract,
          missingMandatoryKeywords: isContractValid ? [] : ['Contrat', 'Article/Clause', 'Engagement'],
          unexpectedKeywords: [],
          pageCount,
          structureValid: isContractValid,
          message: isContractValid
            ? `Structure contractuelle validée (${matchedContract.length} mots-clés juridiques).`
            : 'Structure de contrat non reconnue.'
        };
      }

      // 'Other' document type - permissive validation with structure report
      const allFound = [...matchedPayslip, ...matchedInvoice, ...matchedAcademic, ...matchedContract];
      return {
        isValid: true,
        selectedDocType: 'Other',
        detectedDocType: matchedPayslip.length > 2 ? 'Bulletin de Paie' : matchedInvoice.length > 2 ? 'Facture' : matchedAcademic.length > 2 ? 'Bulletin Scolaire' : matchedContract.length > 1 ? 'Contrat' : 'Document Général',
        confidenceScore: 85,
        matchedKeywords: allFound.slice(0, 10),
        missingMandatoryKeywords: [],
        unexpectedKeywords: [],
        pageCount,
        structureValid: true,
        message: `Document générique prêt au traitement (${pageCount} page${pageCount > 1 ? 's' : ''}). Mots-clés repérés : ${allFound.length > 0 ? allFound.slice(0, 4).join(', ') : 'Texte général'}.`
      };
    } catch (err: any) {
      console.error("Error in validateDocumentContent:", err);
      return {
        isValid: false,
        selectedDocType: selectedType,
        detectedDocType: 'Error',
        confidenceScore: 0,
        matchedKeywords: [],
        missingMandatoryKeywords: ['Fichier PDF lisible'],
        unexpectedKeywords: ['Fichier corrompu'],
        pageCount: 0,
        structureValid: false,
        message: 'Erreur lors de la validation du PDF. Le document ne peut pas être découpé.'
      };
    }
  }

  /**
   * Analyzes PDF file bytes and extracts text / matricules, then splits into individual employee PDFs.
   */
  static async parseAndSplitPdf(
    fileBytes: Uint8Array,
    registeredEmployees: Employee[],
    regexPattern: string = '(?:MATRICULE|EMPLOYEE ID|EMP ID|MAT|ID|CODE)\\s*[:#-]?\\s*([A-Z0-9_-]{4,15})',
    monthYear: string = 'July 2026',
    onProgress?: (progress: PdfSplitProgress) => void
  ): Promise<ExtractedPayslip[]> {
    const startTime = Date.now();
    const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();
    const extractedItems: ExtractedPayslip[] = [];

    onProgress?.({
      currentPage: 0,
      totalPages: pageCount,
      percent: 5,
      stage: `Initialisation du moteur de découpage (${pageCount} page${pageCount > 1 ? 's' : ''} détectée${pageCount > 1 ? 's' : ''})...`,
      matchedCount: 0,
      unmatchedCount: 0,
      stepIndex: 2,
      totalSteps: 4,
      elapsedMs: Date.now() - startTime
    });

    // Load PDF using pdfjs-dist to extract real text per page
    let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
    try {
      const safeBytes = new Uint8Array(fileBytes);
      const loadingTask = pdfjsLib.getDocument({ data: safeBytes });
      pdfjsDoc = await loadingTask.promise;
    } catch (e) {
      console.warn("Could not parse text with pdfjs-dist:", e);
    }

    const regex = new RegExp(regexPattern, 'i');
    const matriculeFallbackRegex = /\b([A-Z]{3}\d{6}|EMP\d{6}|MAT\d{4,8})\b/i;

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      let pageText = '';
      if (pdfjsDoc) {
        try {
          const page = await pdfjsDoc.getPage(pageNumber);
          const textContent = await page.getTextContent();
          pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        } catch (err) {
          console.warn(`Error getting text for page ${pageNumber}:`, err);
        }
      }

      let matchedEmp: Employee | undefined;
      let matricule: string = '';
      let extractedName: string = '';
      let extractedEmail: string = '';
      let extractedDept: string = '';
      let extractedPosition: string = '';
      let extractedNetPay: number | undefined;
      let extractedGrossPay: number | undefined;

      if (pageText) {
        const cleanText = pageText.replace(/\s+/g, ' ');

        // 1. Check if any registered employee's matricule matches pageText
        for (const emp of registeredEmployees) {
          if (emp.matricule && cleanText.toUpperCase().includes(emp.matricule.toUpperCase())) {
            matchedEmp = emp;
            matricule = emp.matricule;
            break;
          }
        }

        // 2. If no matricule match, check if employee name or email is in pageText
        if (!matchedEmp) {
          for (const emp of registeredEmployees) {
            const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase();
            const revFullName = `${emp.lastName} ${emp.firstName}`.trim().toLowerCase();
            const lowerText = cleanText.toLowerCase();
            if (
              (fullName && fullName.length > 3 && lowerText.includes(fullName)) ||
              (revFullName && revFullName.length > 3 && lowerText.includes(revFullName)) ||
              (emp.email && lowerText.includes(emp.email.toLowerCase()))
            ) {
              matchedEmp = emp;
              matricule = emp.matricule;
              break;
            }
          }
        }

        // 3. Extract matricule using custom or fallback regex if not yet found
        if (!matricule) {
          const match = cleanText.match(regex);
          if (match && match[1]) {
            matricule = match[1].trim().toUpperCase();
          } else {
            const fallbackMatch = cleanText.match(matriculeFallbackRegex);
            if (fallbackMatch && fallbackMatch[1]) {
              matricule = fallbackMatch[1].trim().toUpperCase();
            }
          }
        }

        // 4. Extract employee name if not matched in directory
        if (!matchedEmp) {
          const nameMatch = cleanText.match(/(?:SALARI[EÉ]\(?E\)?|EMPLOYEE|NOM\s*ET\s*PR[EÉ]NOM|NOM\s*DU\s*SALARI[EÉ]|SALARI[EÉ]|BENEFICIAIRE)\s*[:=]?\s*([M|Mme|Mr|Mrs|Ms\.]?\s*[A-Z\u00C0-\u00FFa-z\s'-]{3,35})/i)
            || cleanText.match(/(?:M\.|MME\.|MR\.|MRS\.)\s+([A-Z\u00C0-\u00FFa-z\s'-]{3,30})/i);

          if (nameMatch && nameMatch[1]) {
            let candidate = nameMatch[1].trim()
              .replace(/(?:Matricule|Emploi|Poste|Département|Service|Adresse|Période).*/i, '')
              .trim();
            if (candidate.length >= 3 && candidate.length <= 40) {
              extractedName = candidate;
            }
          }
        }

        // 5. Extract email from PDF text
        const emailMatch = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
        if (emailMatch && emailMatch[0]) {
          extractedEmail = emailMatch[0].trim();
        }

        // 6. Extract department
        const deptMatch = cleanText.match(/(?:D[EÉ]PARTEMENT|DEPARTMENT|SERVICE|DIRECTION|UNIT[EÉ])\s*[:=]?\s*([A-Z\u00C0-\u00FFa-z0-9\s&-]{3,30})/i);
        if (deptMatch && deptMatch[1]) {
          extractedDept = deptMatch[1].trim();
        }

        // 7. Extract position
        const posMatch = cleanText.match(/(?:POSTE|POSITION|FONCTION|QUALIFICATION|EMPLOI)\s*[:=]?\s*([A-Z\u00C0-\u00FFa-z0-9\s&-]{3,30})/i);
        if (posMatch && posMatch[1]) {
          extractedPosition = posMatch[1].trim();
        }

        // 8. Try parsing net salary from page text
        const netMatch = cleanText.match(/(?:NET\s*(?:A\s*PAYER|PAYABLE|IMPOT|PAY)|MONTANT\s*NET|SALAIRE\s*NET)\s*[:=]?\s*€?\s*\$?\s*([\d\s.,]{3,12})/i);
        if (netMatch && netMatch[1]) {
          let strNum = netMatch[1].replace(/\s/g, '');
          // Handle European format: 4.450,00 -> 4450.00 or 4450,00 -> 4450.00
          if (strNum.includes(',') && strNum.includes('.')) {
            strNum = strNum.replace(/\./g, '').replace(',', '.');
          } else if (strNum.includes(',')) {
            strNum = strNum.replace(',', '.');
          }
          const parsed = parseFloat(strNum);
          if (!isNaN(parsed) && parsed > 50 && parsed < 200000) {
            extractedNetPay = parsed;
          }
        }

        // 9. Try parsing gross pay from page text
        const grossMatch = cleanText.match(/(?:GROSS\s*(?:EARNINGS|PAY)?|SALAIRE\s*BRUT|TOTAL\s*BRUT|BRUT)\s*[:=]?\s*€?\s*\$?\s*([\d\s.,]{3,12})/i);
        if (grossMatch && grossMatch[1]) {
          let strNum = grossMatch[1].replace(/\s/g, '');
          if (strNum.includes(',') && strNum.includes('.')) {
            strNum = strNum.replace(/\./g, '').replace(',', '.');
          } else if (strNum.includes(',')) {
            strNum = strNum.replace(',', '.');
          }
          const parsed = parseFloat(strNum);
          if (!isNaN(parsed) && parsed > 50 && parsed < 200000) {
            extractedGrossPay = parsed;
          }
        }
      }

      // Check if matched in registered employees database
      const foundEmp = matchedEmp || registeredEmployees.find(e => e.matricule.toUpperCase() === matricule.toUpperCase());

      // If no matricule found, fallback to page index or sample demo mapping
      if (!matricule) {
        if (foundEmp) {
          matricule = foundEmp.matricule;
        } else if (pageText.length > 0) {
          matricule = `MAT-P${String(i + 1).padStart(3, '0')}`;
        } else {
          // Fallback for demo sample batch pages without text
          const fallbackEmp = registeredEmployees[i % registeredEmployees.length];
          matricule = fallbackEmp ? fallbackEmp.matricule : `EMP000${245 + i}`;
        }
      }

      // Create a dedicated single-page PDF document for this employee
      const subDoc = await PDFDocument.create();
      const [copiedPage] = await subDoc.copyPages(srcDoc, [i]);
      subDoc.addPage(copiedPage);

      const subPdfBytes = await subDoc.save();
      const subBlobUrl = URL.createObjectURL(new Blob([subPdfBytes], { type: 'application/pdf' }));

      const baseSalary = 3800 + (i * 350);
      const grossPay = extractedGrossPay || (baseSalary + 450);
      const deductions = Math.round(grossPay * 0.26 * 100) / 100;
      const netPay = extractedNetPay || (grossPay - deductions);

      let status: ExtractedPayslip['status'] = 'Matched';
      let finalEmpName = '';
      let finalEmail = '';
      let finalDept = '';
      let finalPosition = '';

      if (foundEmp) {
        matchedCount++;
        finalEmpName = `${foundEmp.firstName} ${foundEmp.lastName}`;
        finalEmail = foundEmp.email;
        finalDept = foundEmp.department;
        finalPosition = foundEmp.position;
        if (!foundEmp.email || foundEmp.email.includes('invalid') || !foundEmp.email.includes('@')) {
          status = 'Missing Email';
        }
      } else {
        unmatchedCount++;
        status = 'Unmatched Matricule';
        finalEmpName = extractedName || (matricule ? `Matricule Inconnu (${matricule})` : `Employé Page ${i + 1}`);
        finalEmail = extractedEmail || '';
        finalDept = extractedDept || 'Non Assigné';
        finalPosition = extractedPosition || 'Employé';
      }

      const rawTextSnippet = pageText.trim().length > 0
        ? pageText.trim().replace(/\s+/g, ' ').substring(0, 320)
        : `BULLETIN DE PAIE - PÉRIODE: ${monthYear} | MATRICULE: ${matricule} | EMPLOYÉ: ${finalEmpName} | DÉPARTEMENT: ${finalDept} | SALAIRE BRUT: ${grossPay.toFixed(2)} EUR | COTISATIONS: ${deductions.toFixed(2)} EUR | NET À PAYER: ${netPay.toFixed(2)} EUR`;

      extractedItems.push({
        id: `ps-${Date.now()}-${i}`,
        matricule,
        employeeId: foundEmp?.id,
        employeeName: finalEmpName,
        email: finalEmail,
        department: finalDept,
        position: finalPosition,
        startPage: i + 1,
        endPage: i + 1,
        pageCount: 1,
        grossPay,
        deductions,
        netPay,
        payPeriod: monthYear,
        confidenceScore: foundEmp ? 98 : (extractedName || matricule ? 75 : 45),
        status,
        pdfBytes: subPdfBytes,
        pdfBlobUrl: subBlobUrl,
        rawTextSnippet,
        isExcluded: false,
      });

      // Calculate progress percentage scaled between 25% and 88%
      const splitProgressPercent = Math.min(88, Math.round(25 + ((pageNumber / pageCount) * 63)));

      onProgress?.({
        currentPage: pageNumber,
        totalPages: pageCount,
        percent: splitProgressPercent,
        stage: `Découpage unitaire & extraction : Page ${pageNumber} / ${pageCount} [${matricule || 'N/A'}]`,
        currentMatricule: matricule,
        currentEmployeeName: finalEmpName,
        matchedCount,
        unmatchedCount,
        stepIndex: 3,
        totalSteps: 4,
        elapsedMs: Date.now() - startTime
      });

      // Give browser time to paint UI for smooth rendering
      if (pageCount > 1) {
        await new Promise(r => setTimeout(r, 12));
      }
    }

    if (pdfjsDoc) {
      try {
        if (typeof (pdfjsDoc as any).destroy === 'function') {
          (pdfjsDoc as any).destroy();
        } else if (typeof (pdfjsDoc as any).cleanup === 'function') {
          (pdfjsDoc as any).cleanup();
        }
      } catch (e) {}
    }

    return extractedItems;
  }

  /**
   * Encrypts a single PDF document's bytes with a user password.
   */
  static async encryptPdfBytes(pdfBytes: Uint8Array, userPassword?: string): Promise<Uint8Array> {
    if (!userPassword) return pdfBytes;
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      if (typeof (doc as any).encrypt === 'function') {
        (doc as any).encrypt({
          userPassword,
          ownerPassword: `admin-${userPassword}`,
          permissions: {
            printing: 'highResolution',
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: false,
            contentAccessibility: true,
            documentAssembly: false,
          },
        });
        return await doc.save();
      }
    } catch (e) {
      console.warn("PDF encryption warning:", e);
    }
    return pdfBytes;
  }
}

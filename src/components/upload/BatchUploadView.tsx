import React, { useState } from 'react';
import { 
  FileUp, 
  Sparkles, 
  Settings, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Cpu, 
  ArrowRight,
  AlertCircle,
  Play,
  AlertTriangle,
  UserX,
  Copy,
  RefreshCw,
  UserPlus,
  Check,
  Filter,
  Layers,
  X,
  ShieldAlert,
  ShieldCheck,
  Key,
  Edit2,
  Grid,
  List,
  Eye,
  EyeOff,
  ZoomIn,
  FileCheck,
  FileX,
  HelpCircle,
  Info,
  FileCode,
  Scan,
  GraduationCap,
  Receipt,
  FileSpreadsheet,
  FileSignature,
  FileStack,
  Loader2,
  Timer,
  Activity,
  Zap
} from 'lucide-react';
import { 
  ExtractionRule, 
  Employee, 
  ExtractedPayslip, 
  DistributionCampaign, 
  PayslipDetectionResult,
  BatchDocumentType,
  DocumentValidationResult,
  PdfSplitProgress
} from '../../types';
import { PdfService } from '../../services/pdfService';
import { PayslipThumbnailCard } from './PayslipThumbnailCard';
import { PayslipPdfInspectorModal } from './PayslipPdfInspectorModal';
import { OcrVerificationWorkspace } from './OcrVerificationWorkspace';

interface BatchUploadViewProps {
  extractionRules: ExtractionRule[];
  registeredEmployees: Employee[];
  onUploadComplete: (
    campaignData: Partial<DistributionCampaign>,
    extractedPayslips: ExtractedPayslip[],
    rawPdfBlobUrl?: string
  ) => void;
  onRegisterNewEmployee?: (newEmp: Employee) => void;
}

export interface ExtractionConflict {
  id: string;
  type: 'DUPLICATE_MATRICULE' | 'MISSING_EMPLOYEE' | 'MISSING_EMAIL';
  title: string;
  description: string;
  payslipId: string;
  matricule: string;
  pageNumber: number;
  duplicatePageNumbers?: number[];
}

export const DOCUMENT_TYPES: {
  id: BatchDocumentType;
  label: string;
  shortLabel: string;
  description: string;
  badge: string;
  icon: any;
}[] = [
  {
    id: 'Payslip',
    label: 'Bulletin de Paie / Fiche de Salaire',
    shortLabel: 'Fiche de Paie',
    description: 'Vérification stricte des rubriques salariales (salaire brut, net à payer, matricules)',
    badge: 'Contrôle Paie RH',
    icon: FileText
  },
  {
    id: 'Other',
    label: 'Autre Document / Format Libre',
    shortLabel: 'Autre Document',
    description: 'Découpage universel sans validation stricte des mots-clés de rémunération',
    badge: 'Format Libre',
    icon: FileStack
  },
  {
    id: 'Invoice',
    label: 'Facture Commerciale / Bon de Commande',
    shortLabel: 'Facture',
    description: 'Vérification des montants HT/TTC, TVA et mentions de facturation',
    badge: 'Comptabilité',
    icon: Receipt
  },
  {
    id: 'Academic',
    label: 'Bulletin Scolaire / Relevé de Notes',
    shortLabel: 'Bulletin Scolaire',
    description: 'Reconnaissance des notes, semestres et moyennes scolaires',
    badge: 'Académique',
    icon: GraduationCap
  },
  {
    id: 'Contract',
    label: 'Contrat de Travail / Avenant',
    shortLabel: 'Contrat RH',
    description: 'Validation des clauses d\'embauche, articles et engagements',
    badge: 'Juridique RH',
    icon: FileSignature
  }
];

export const BatchUploadView: React.FC<BatchUploadViewProps> = ({
  extractionRules,
  registeredEmployees,
  onUploadComplete,
  onRegisterNewEmployee
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [payrollMonth, setPayrollMonth] = useState('Juillet 2026');
  const [campaignTitle, setCampaignTitle] = useState('Distribution de Paie Juillet 2026');
  const [selectedRuleId, setSelectedRuleId] = useState(extractionRules[0]?.id || 'rule-1');
  const [requirePasswordProtect, setRequirePasswordProtect] = useState(true);
  const [passwordFormat, setPasswordFormat] = useState<'Matricule' | 'Birthdate' | 'CodeRH' | 'CustomGlobal' | 'CustomIndividual'>('Matricule');
  const [customPassword, setCustomPassword] = useState('Kibosh2026!');
  const [showGlobalPasswordText, setShowGlobalPasswordText] = useState(false);

  // Document Type Selector & Content Structure Validation State
  const [selectedDocType, setSelectedDocType] = useState<BatchDocumentType>('Payslip');
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);

  // Processing state & real-time splitting tracker
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [splitProgress, setSplitProgress] = useState<PdfSplitProgress | null>(null);
  const [processingFileInfo, setProcessingFileInfo] = useState<{ fileName: string; fileSize: string } | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Payslip Detection & Conformity State
  const [detectionResult, setDetectionResult] = useState<PayslipDetectionResult | null>(null);
  const [showNonPayslipModal, setShowNonPayslipModal] = useState(false);
  const [pendingNonPayslipData, setPendingNonPayslipData] = useState<{ pdfBytes: Uint8Array; fileName: string; blobUrl: string } | null>(null);

  // Extracted Results & Conflicts Workspace State
  const [activeTab, setActiveTab] = useState<'setup' | 'ocr' | 'conflicts' | 'pages'>('setup');
  const [extractedItems, setExtractedItems] = useState<ExtractedPayslip[]>([]);
  const [stagedCampaign, setStagedCampaign] = useState<Partial<DistributionCampaign> | null>(null);
  const [rawPdfBlobUrl, setRawPdfBlobUrl] = useState<string | undefined>(undefined);
  const [pagesViewMode, setPagesViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectedPayslip, setInspectedPayslip] = useState<ExtractedPayslip | null>(null);

  // Quick Employee Creation Modal / Inline Form State
  const [quickCreateTargetId, setQuickCreateTargetId] = useState<string | null>(null);
  const [quickEmpForm, setQuickEmpForm] = useState({
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    department: 'Génie Logiciel',
    position: 'Spécialiste'
  });

  // Conflict type filter
  const [conflictFilter, setConflictFilter] = useState<'ALL' | 'DUPLICATE_MATRICULE' | 'MISSING_EMPLOYEE' | 'MISSING_EMAIL'>('ALL');

  // Bulk Renaming & Filename Format Pattern State
  const FILENAME_PRESETS = [
    { id: 'Bulletin_Paie_{Période}_{Matricule}', label: 'Bulletin_Paie_Date_Matricule.pdf', example: 'Bulletin_Paie_Juillet_2026_EMP000245.pdf', pattern: 'Bulletin_Paie_{Période}_{Matricule}' },
    { id: 'Fiche_{Matricule}', label: 'Fiche_Matricule.pdf', example: 'Fiche_EMP000245.pdf', pattern: 'Fiche_{Matricule}' },
    { id: 'Payslip_{Période}_{Nom}_{Matricule}', label: 'Payslip_Date_Nom_Matricule.pdf', example: 'Payslip_Juillet_2026_Jean_Dupont_EMP000245.pdf', pattern: 'Payslip_{Période}_{Nom}_{Matricule}' },
    { id: '{Nom}_{Matricule}_{Période}', label: 'Nom_Matricule_Date.pdf', example: 'Jean_Dupont_EMP000245_Juillet_2026.pdf', pattern: '{Nom}_{Matricule}_{Période}' },
    { id: 'Bulletin_{Département}_{Matricule}', label: 'Bulletin_Département_Matricule.pdf', example: 'Bulletin_Genie_Logiciel_EMP000245.pdf', pattern: 'Bulletin_{Département}_{Matricule}' },
    { id: 'CUSTOM', label: 'Format Personnalisé (Template)...', example: 'Custom_Template.pdf', pattern: '' }
  ];

  const [filenamePatternFormat, setFilenamePatternFormat] = useState<string>('Bulletin_Paie_{Période}_{Matricule}');
  const [customFilenamePattern, setCustomFilenamePattern] = useState<string>('Bulletin_Paie_{Période}_{Matricule}');
  const [bulkRenamingToast, setBulkRenamingToast] = useState<string | null>(null);

  const getActiveFilenamePattern = (): string => {
    if (filenamePatternFormat === 'CUSTOM') {
      return customFilenamePattern.trim() || 'Bulletin_Paie_{Période}_{Matricule}';
    }
    return filenamePatternFormat;
  };

  const generateFilenameForItem = (
    matricule: string,
    employeeName: string,
    department: string,
    period: string,
    patternStr: string
  ): string => {
    let cleanPeriod = (period || 'Juillet_2026')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    let cleanName = (employeeName || 'Salarie')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    let cleanDept = (department || 'General')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    let cleanMat = (matricule || 'EMP000000').replace(/[^a-zA-Z0-9_-]/g, '');

    let filename = (patternStr || 'Bulletin_Paie_{Période}_{Matricule}')
      .replace(/{Matricule}/gi, cleanMat)
      .replace(/{Période}|{Periode}|{Date}/gi, cleanPeriod)
      .replace(/{Nom}|{EmployeeName}/gi, cleanName)
      .replace(/{Département}|{Departement}|{Dept}/gi, cleanDept)
      .replace(/{Prefixe}|{Prefix}/gi, 'Bulletin');

    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }
    return filename.replace(/_+/g, '_');
  };

  const handleApplyFilenamePatternToExtracted = (newPattern: string) => {
    if (extractedItems.length === 0) return;
    const updated = extractedItems.map(item => ({
      ...item,
      generatedFileName: generateFilenameForItem(item.matricule, item.employeeName, item.department, payrollMonth, newPattern)
    }));
    setExtractedItems(updated);
    setBulkRenamingToast(`Renommage en masse appliqué à ${updated.length} bulletin(s) !`);
    setTimeout(() => setBulkRenamingToast(null), 3000);
  };

  // Compute password for a payslip based on chosen formula
  const computePasswordForItem = (
    item: ExtractedPayslip,
    fmt: 'Matricule' | 'Birthdate' | 'CodeRH' | 'CustomGlobal' | 'CustomIndividual',
    customText: string,
    employees: Employee[]
  ): string => {
    if (fmt === 'CustomIndividual' && item.pdfPassword) {
      return item.pdfPassword;
    }
    if (fmt === 'Matricule') {
      return item.matricule;
    }
    if (fmt === 'CodeRH') {
      return `KB-${item.matricule}`;
    }
    if (fmt === 'CustomGlobal') {
      return customText || 'Kibosh2026!';
    }
    if (fmt === 'Birthdate') {
      const emp = employees.find(e => e.matricule.toUpperCase() === item.matricule.toUpperCase());
      if (emp && emp.birthdate) {
        return emp.birthdate.replace(/-/g, '');
      }
      const matDigits = item.matricule.replace(/\D/g, '') || '245';
      const yr = 1980 + (parseInt(matDigits) % 20);
      const mo = String((parseInt(matDigits) % 12) + 1).padStart(2, '0');
      const da = String((parseInt(matDigits) % 28) + 1).padStart(2, '0');
      return `${yr}${mo}${da}`;
    }
    return item.matricule;
  };

  const handleApplyPasswordFormulaToAll = (
    fmt: 'Matricule' | 'Birthdate' | 'CodeRH' | 'CustomGlobal' | 'CustomIndividual',
    customText: string,
    isProtected: boolean
  ) => {
    setExtractedItems(prev => prev.map(item => ({
      ...item,
      pdfPasswordProtected: isProtected,
      pdfPassword: computePasswordForItem(item, fmt, customText, registeredEmployees)
    })));
    setStagedCampaign(prev => prev ? {
      ...prev,
      requirePasswordProtect: isProtected,
      passwordFormat: fmt,
      customPassword: customText
    } : null);
  };

  const handleUpdatePassword = (id: string, newPass: string) => {
    setExtractedItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          pdfPasswordProtected: true,
          pdfPassword: newPass
        };
      }
      return item;
    }));
  };

  // Compute Conflicts dynamically
  const getConflicts = (): ExtractionConflict[] => {
    const conflicts: ExtractionConflict[] = [];

    // Group items by matricule to detect duplicates
    const matriculeMap = new Map<string, ExtractedPayslip[]>();
    extractedItems.forEach(item => {
      if (item.isExcluded) return;
      const list = matriculeMap.get(item.matricule) || [];
      list.push(item);
      matriculeMap.set(item.matricule, list);
    });

    // 1. Duplicate Matricules
    matriculeMap.forEach((duplicates, matricule) => {
      if (duplicates.length > 1) {
        const pageNos = duplicates.map(d => d.startPage);
        duplicates.forEach(dup => {
          conflicts.push({
            id: `dup-${dup.id}`,
            type: 'DUPLICATE_MATRICULE',
            title: `Matricule en Double: ${matricule}`,
            description: `Extrait sur la Page ${dup.startPage}. Correspond à des doublons sur la/les page(s) : ${pageNos.filter(p => p !== dup.startPage).join(', ')}.`,
            payslipId: dup.id,
            matricule,
            pageNumber: dup.startPage,
            duplicatePageNumbers: pageNos.filter(p => p !== dup.startPage)
          });
        });
      }
    });

    // 2. Missing Employee Records (Unmatched Matricules)
    extractedItems.forEach(item => {
      if (item.isExcluded) return;
      const exists = registeredEmployees.some(e => e.matricule === item.matricule);
      if (!exists || item.status === 'Unmatched Matricule' || !item.employeeId) {
        conflicts.push({
          id: `unmatched-${item.id}`,
          type: 'MISSING_EMPLOYEE',
          title: `Fiche Employé Manquante (${item.matricule})`,
          description: `Le matricule "${item.matricule}" sur la Page ${item.startPage} n'est pas enregistré dans l'annuaire RH.`,
          payslipId: item.id,
          matricule: item.matricule,
          pageNumber: item.startPage
        });
      }
    });

    // 3. Missing Email
    extractedItems.forEach(item => {
      if (item.isExcluded) return;
      if (item.status === 'Missing Email' || !item.email || !item.email.includes('@')) {
        conflicts.push({
          id: `email-${item.id}`,
          type: 'MISSING_EMAIL',
          title: `E-mail Destinataire Manquant / Invalide`,
          description: `Le bulletin pour ${item.employeeName} à la Page ${item.startPage} a une adresse e-mail vide ou invalide.`,
          payslipId: item.id,
          matricule: item.matricule,
          pageNumber: item.startPage
        });
      }
    });

    return conflicts;
  };

  const currentConflicts = getConflicts();
  const filteredConflicts = currentConflicts.filter(c => {
    if (conflictFilter === 'ALL') return true;
    return c.type === conflictFilter;
  });

  // Execute extraction logic with document structure keyword validation
  const processPdfBytes = async (
    pdfBytes: Uint8Array,
    fileName: string,
    blobUrl: string,
    forceProcess: boolean = false,
    docTypeOverride?: BatchDocumentType
  ) => {
    const startTime = Date.now();
    const currentType = docTypeOverride || selectedDocType;
    const formattedSize = `${(pdfBytes.length / (1024 * 1024)).toFixed(2)} Mo`;
    setProcessingFileInfo({ fileName, fileSize: formattedSize });
    setIsProcessing(true);

    // Initial Stage 1: Semantic Keyword & Document Validation
    setProcessingStage(`Validation Structurelle & Mots-Clés (${currentType})...`);
    setProgressPercent(12);
    setSplitProgress({
      currentPage: 0,
      totalPages: 0,
      percent: 12,
      stage: `Validation Sémantique & Mots-Clés (${currentType})`,
      matchedCount: 0,
      unmatchedCount: 0,
      stepIndex: 1,
      totalSteps: 4,
      elapsedMs: Date.now() - startTime
    });
    await new Promise(r => setTimeout(r, 300));

    // 1. Validate PDF Content Structure using Keyword Checking
    const validation = await PdfService.validateDocumentContent(pdfBytes, currentType);
    setValidationResult(validation);

    // Also run legacy payslip detection for compatibility
    const detection = await PdfService.detectPayslipType(pdfBytes);
    setDetectionResult(detection);

    if (!validation.isValid && !forceProcess) {
      setIsProcessing(false);
      setPendingNonPayslipData({ pdfBytes, fileName, blobUrl });
      setShowNonPayslipModal(true);
      return;
    }

    // Stage 2: Structural Indexing & Page Pre-parsing
    setProcessingStage('Indexation de la structure du PDF & flux de pages...');
    setProgressPercent(24);
    setSplitProgress({
      currentPage: 0,
      totalPages: validation.pageCount || 0,
      percent: 24,
      stage: 'Indexation de la structure du PDF & flux de pages...',
      matchedCount: 0,
      unmatchedCount: 0,
      stepIndex: 2,
      totalSteps: 4,
      elapsedMs: Date.now() - startTime
    });
    await new Promise(r => setTimeout(r, 250));

    const selectedRule = extractionRules.find(r => r.id === selectedRuleId);

    // Stage 3: Real-time Page Splitting & Matching with Live Progress Callbacks
    const extracted = await PdfService.parseAndSplitPdf(
      pdfBytes,
      registeredEmployees,
      selectedRule?.regexPattern,
      payrollMonth,
      (progress) => {
        setSplitProgress(progress);
        setProgressPercent(progress.percent);
        setProcessingStage(progress.stage);
      }
    );

    // Stage 4: Encryption, Password Generation & Staging
    setProcessingStage('Sécurisation, hachage des mots de passe & staging de la campagne...');
    setProgressPercent(94);
    setSplitProgress({
      currentPage: extracted.length,
      totalPages: extracted.length,
      percent: 94,
      stage: 'Sécurisation, hachage des mots de passe & staging...',
      matchedCount: extracted.filter(e => e.status === 'Matched').length,
      unmatchedCount: extracted.filter(e => e.status !== 'Matched').length,
      stepIndex: 4,
      totalSteps: 4,
      elapsedMs: Date.now() - startTime
    });

    const activePattern = getActiveFilenamePattern();

    const extractedWithPasswords = extracted.map(item => ({
      ...item,
      pdfPasswordProtected: requirePasswordProtect,
      pdfPassword: computePasswordForItem(item, passwordFormat, customPassword, registeredEmployees),
      generatedFileName: generateFilenameForItem(item.matricule, item.employeeName, item.department, payrollMonth, activePattern)
    }));

    setProgressPercent(100);
    setProcessingStage('Découpage, extraction et contrôle terminés avec succès !');
    setSplitProgress({
      currentPage: extractedWithPasswords.length,
      totalPages: extractedWithPasswords.length,
      percent: 100,
      stage: 'Découpage et validation terminés avec succès !',
      matchedCount: extractedWithPasswords.filter(e => e.status === 'Matched').length,
      unmatchedCount: extractedWithPasswords.filter(e => e.status !== 'Matched').length,
      stepIndex: 4,
      totalSteps: 4,
      elapsedMs: Date.now() - startTime
    });
    await new Promise(r => setTimeout(r, 350));

    const campaignMeta: Partial<DistributionCampaign> = {
      title: campaignTitle,
      payrollMonth,
      pdfFileName: fileName,
      pdfFileSize: formattedSize,
      totalPages: extractedWithPasswords.length,
      totalEmployees: extractedWithPasswords.length,
      requirePasswordProtect,
      passwordFormat,
      customPassword
    };

    setExtractedItems(extractedWithPasswords);
    setStagedCampaign(campaignMeta);
    setRawPdfBlobUrl(blobUrl);
    setIsProcessing(false);

    // If conflicts exist, automatically switch to Conflicts tab, otherwise OCR verification tab
    const initialConflicts = getExtractionConflicts(extracted, registeredEmployees);
    if (initialConflicts.length > 0) {
      setActiveTab('conflicts');
    } else {
      setActiveTab('ocr');
    }
  };

  const handleForceProcessNonPayslip = async () => {
    if (!pendingNonPayslipData) return;
    setShowNonPayslipModal(false);
    await processPdfBytes(
      pendingNonPayslipData.pdfBytes,
      pendingNonPayslipData.fileName,
      pendingNonPayslipData.blobUrl,
      true
    );
  };

  const handleSwitchDocTypeAndProcess = async (newType: BatchDocumentType) => {
    if (!pendingNonPayslipData) return;
    setSelectedDocType(newType);
    setShowNonPayslipModal(false);
    await processPdfBytes(
      pendingNonPayslipData.pdfBytes,
      pendingNonPayslipData.fileName,
      pendingNonPayslipData.blobUrl,
      false,
      newType
    );
  };

  const getExtractionConflicts = (items: ExtractedPayslip[], employees: Employee[]) => {
    const conflicts: ExtractionConflict[] = [];
    const map = new Map<string, ExtractedPayslip[]>();
    items.forEach(i => {
      if (i.isExcluded) return;
      const list = map.get(i.matricule) || [];
      list.push(i);
      map.set(i.matricule, list);
    });
    map.forEach((dups, mat) => {
      if (dups.length > 1) {
        dups.forEach(dup => {
          conflicts.push({
            id: `dup-${dup.id}`,
            type: 'DUPLICATE_MATRICULE',
            title: `Matricule en Double: ${mat}`,
            description: `La page ${dup.startPage} fait doublon du matricule ${mat}`,
            payslipId: dup.id,
            matricule: mat,
            pageNumber: dup.startPage
          });
        });
      }
    });
    items.forEach(item => {
      if (item.isExcluded) return;
      const exists = employees.some(e => e.matricule === item.matricule);
      if (!exists || item.status === 'Unmatched Matricule') {
        conflicts.push({
          id: `unm-${item.id}`,
          type: 'MISSING_EMPLOYEE',
          title: `Employé Non Correspondant`,
          description: `Matricule ${item.matricule} non enregistré`,
          payslipId: item.id,
          matricule: item.matricule,
          pageNumber: item.startPage
        });
      }
    });
    return conflicts;
  };

  const handleGenerateAndProcessDemo = async () => {
    try {
      setIsProcessing(true);
      setProcessingStage('Génération du PDF Exemple Officiel de Paie (10 Pages)...');
      setProgressPercent(15);
      await new Promise(r => setTimeout(r, 500));

      const { pdfBytes, blobUrl, fileName } = await PdfService.generateSamplePayrollBatchPdf(
        registeredEmployees,
        payrollMonth
      );

      await processPdfBytes(pdfBytes, fileName, blobUrl);
    } catch (error) {
      console.error('Error in demo generation:', error);
      setIsProcessing(false);
    }
  };

  const handleGenerateAndProcessNonPayslipDemo = async () => {
    try {
      setIsProcessing(true);
      setProcessingStage('Génération d\'une Facture Commerciale pour Test Non-Paie...');
      setProgressPercent(15);
      await new Promise(r => setTimeout(r, 400));

      const { pdfBytes, blobUrl, fileName } = await PdfService.generateSampleNonPayslipPdf();
      await processPdfBytes(pdfBytes, fileName, blobUrl);
    } catch (error) {
      console.error('Error in non-payslip demo generation:', error);
      setIsProcessing(false);
    }
  };

  const handleGenerateAndProcessAcademicReportDemo = async () => {
    try {
      setIsProcessing(true);
      setProcessingStage('Génération d\'un Bulletin Scolaire d\'élève pour Test de Détection Non-Paie...');
      setProgressPercent(15);
      await new Promise(r => setTimeout(r, 400));

      const { pdfBytes, blobUrl, fileName } = await PdfService.generateSampleAcademicReportPdf();
      await processPdfBytes(pdfBytes, fileName, blobUrl);
    } catch (error) {
      console.error('Error in academic report demo generation:', error);
      setIsProcessing(false);
    }
  };

  const handleFileUploadAndProcess = async (uploadedFile: File) => {
    setFile(uploadedFile);
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      const blobUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
      await processPdfBytes(pdfBytes, uploadedFile.name, blobUrl);
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      setIsProcessing(false);
    }
  };

  // Conflict Resolution Actions
  const handleExcludePage = (payslipId: string) => {
    setExtractedItems(prev =>
      prev.map(item => item.id === payslipId ? { ...item, isExcluded: true } : item)
    );
  };

  const handleIncludePage = (payslipId: string) => {
    setExtractedItems(prev =>
      prev.map(item => item.id === payslipId ? { ...item, isExcluded: false } : item)
    );
  };

  const handleReassignEmployee = (payslipId: string, empId: string) => {
    const emp = registeredEmployees.find(e => e.id === empId);
    if (!emp) return;

    setExtractedItems(prev =>
      prev.map(item => {
        if (item.id === payslipId) {
          const isEmailValid = emp.email && emp.email.includes('@') && !emp.email.includes('invalid');
          return {
            ...item,
            matricule: emp.matricule,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department,
            position: emp.position,
            status: isEmailValid ? 'Matched' : 'Missing Email',
            confidenceScore: 99
          };
        }
        return item;
      })
    );
  };

  const handleUpdateEmail = (payslipId: string, newEmail: string) => {
    setExtractedItems(prev =>
      prev.map(item => {
        if (item.id === payslipId) {
          const isMatched = !!item.employeeId;
          return {
            ...item,
            email: newEmail,
            status: isMatched ? 'Matched' : 'Unmatched Matricule'
          };
        }
        return item;
      })
    );
  };

  const handleAutoExcludeDuplicates = () => {
    const seenMatricules = new Set<string>();
    setExtractedItems(prev =>
      prev.map(item => {
        if (item.isExcluded) return item;
        if (seenMatricules.has(item.matricule)) {
          return { ...item, isExcluded: true };
        }
        seenMatricules.add(item.matricule);
        return item;
      })
    );
  };

  const handleQuickRegisterSubmit = (payslipId: string) => {
    if (!quickEmpForm.matricule || !quickEmpForm.firstName || !quickEmpForm.lastName) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      matricule: quickEmpForm.matricule,
      firstName: quickEmpForm.firstName,
      lastName: quickEmpForm.lastName,
      company: 'Enterprise Global Inc.',
      department: quickEmpForm.department,
      position: quickEmpForm.position,
      email: quickEmpForm.email || `${quickEmpForm.firstName.toLowerCase()}.${quickEmpForm.lastName.toLowerCase()}@enterprise-corp.com`,
      status: 'Active',
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10)
    };

    if (onRegisterNewEmployee) {
      onRegisterNewEmployee(newEmp);
    }
    registeredEmployees.push(newEmp);

    // Update payslip item
    setExtractedItems(prev =>
      prev.map(item => {
        if (item.id === payslipId) {
          return {
            ...item,
            matricule: newEmp.matricule,
            employeeId: newEmp.id,
            employeeName: `${newEmp.firstName} ${newEmp.lastName}`,
            email: newEmp.email,
            department: newEmp.department,
            position: newEmp.position,
            status: 'Matched',
            confidenceScore: 100
          };
        }
        return item;
      })
    );

    setQuickCreateTargetId(null);
  };

  const handleConfirmAndProceed = () => {
    if (!stagedCampaign) return;
    const activePayslips = extractedItems.filter(p => !p.isExcluded);
    onUploadComplete(
      {
        ...stagedCampaign,
        totalPages: extractedItems.length,
        totalEmployees: activePayslips.length
      },
      activePayslips,
      rawPdfBlobUrl
    );
  };

  const activeCount = extractedItems.filter(p => !p.isExcluded).length;
  const excludedCount = extractedItems.filter(p => p.isExcluded).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Modules 4, 5 & 6 — Moteur de Traitement par Lot
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Espace de Téléversement par Lot & Résolution des Conflits
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Téléversez des PDF de paie multipages, découpez-les automatiquement en bulletins individuels et résolvez les doublons de matricule ou fiches d'employés manquantes avant distribution.
          </p>
        </div>

        {activeTab === 'setup' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleGenerateAndProcessDemo}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Générer un Échantillon de Paie (10 Pages)</span>
            </button>

            <button
              onClick={handleGenerateAndProcessAcademicReportDemo}
              disabled={isProcessing}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Tester le rejet avec un Bulletin Scolaire d'élève (Notes, trimestres, mentions)"
            >
              <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tester Bulletin Scolaire</span>
            </button>

            <button
              onClick={handleGenerateAndProcessNonPayslipDemo}
              disabled={isProcessing}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Tester la détection avec un document non conforme (Facture Commerciale)"
            >
              <Receipt className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Tester Facture</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('setup')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nouveau Téléversement</span>
            </button>

            <button
              onClick={handleConfirmAndProceed}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Passer à la Vérification ({activeCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bar (Visible when extracted items exist or user toggles) */}
      {extractedItems.length > 0 && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'setup'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Téléversement & Paramètres</span>
            </button>

            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'ocr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scan className="w-4 h-4 text-blue-500" />
              <span>Vérification OCR ({extractedItems.length})</span>
              {extractedItems.some(i => i.ocrCorrected) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Contient des corrections"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('conflicts')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'conflicts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Résolution des Conflits</span>
              {currentConflicts.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {currentConflicts.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Résolu
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'pages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Aperçu des Pages Extraites ({extractedItems.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium hidden md:block">
            Actifs : <span className="font-bold text-slate-900">{activeCount}</span> | Exclus : <span className="font-bold text-slate-900">{excludedCount}</span>
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD & PARAMETERS */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Document Type Selector, Dropzone & Validation Results */}
          <div className="lg:col-span-2 space-y-5">
            {/* Document Type Selector Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>Type de Document Attendu & Règle de Validation</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sélectionnez le type pour activer la validation automatique de structure par mots-clés avant découpage.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.badge}
                </span>
              </div>

              {/* Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                {DOCUMENT_TYPES.map(doc => {
                  const Icon = doc.icon;
                  const isSelected = selectedDocType === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocType(doc.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-snug">{doc.shortLabel}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{doc.id}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active type rule hint */}
              <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">
                    {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label} :
                  </span>{' '}
                  {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.description}
                </div>
              </div>
            </div>

            {/* Dropzone Container */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileUp className="w-4 h-4 text-blue-600" />
                <span>
                  Téléverser le PDF Master ({DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.shortLabel})
                </span>
              </h3>

              {!isProcessing ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUploadAndProcess(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUploadAndProcess(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="pdf-file-input"
                  />
                  <label htmlFor="pdf-file-input" className="cursor-pointer block space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Cliquez pour Parcourir ou Glissez-Déposez votre document PDF
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Type sélectionné : <strong className="text-blue-700">{DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label}</strong>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                      <span>Format PDF multipages jusqu'à 500 Mo</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border border-blue-200 bg-gradient-to-b from-blue-50/70 via-white to-blue-50/40 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                  {/* Header: Live Status & Progress Percent */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                          <Cpu className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">
                            Découpage & Extraction du PDF
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                            En direct
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {processingFileInfo ? (
                            <span>Fichier : <strong className="text-slate-800 font-semibold">{processingFileInfo.fileName}</strong> ({processingFileInfo.fileSize})</span>
                          ) : (
                            <span>Traitement du lot PDF multipages...</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 self-start sm:self-auto bg-white px-4 py-2 rounded-xl border border-blue-200/80 shadow-xs">
                      <span className="text-xs font-semibold text-slate-500">Progression globale :</span>
                      <span className="text-2xl font-black text-blue-700 font-mono tracking-tight">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Visual Phase Stepper */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { step: 1, label: '1. Validation Mots-Clés', desc: 'Conformité du modèle' },
                      { step: 2, label: '2. Structure PDF', desc: 'Indexation des flux' },
                      { step: 3, label: '3. Découpage & OCR', desc: 'Appariement matricules' },
                      { step: 4, label: '4. Chiffrement', desc: 'Mots de passe & Staging' },
                    ].map((s) => {
                      const currentStep = splitProgress?.stepIndex || (progressPercent < 20 ? 1 : progressPercent < 45 ? 2 : progressPercent < 90 ? 3 : 4);
                      const isDone = currentStep > s.step || progressPercent >= 100;
                      const isActive = currentStep === s.step && progressPercent < 100;

                      return (
                        <div
                          key={s.step}
                          className={`p-3 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : isActive
                              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 shadow-xs'
                              : 'bg-slate-50/60 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-xs font-bold ${
                              isDone ? 'text-emerald-800' : isActive ? 'text-blue-900' : 'text-slate-500'
                            }`}>
                              {s.label}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                            )}
                          </div>
                          <p className={`text-[10px] ${
                            isDone ? 'text-emerald-700' : isActive ? 'text-blue-700 font-medium' : 'text-slate-400'
                          }`}>
                            {s.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Main Multi-Tone Animated Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span>{processingStage || 'Traitement en cours...'}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {splitProgress?.currentPage && splitProgress.totalPages ? (
                          <span>Page {splitProgress.currentPage} / {splitProgress.totalPages}</span>
                        ) : (
                          <span>{progressPercent}%</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/90 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Live Splitting Metrics & Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pages Traitées</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {splitProgress?.currentPage || 0}{' '}
                        <span className="text-xs font-medium text-slate-400">
                          / {splitProgress?.totalPages || '...'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Appariés
                      </div>
                      <div className="text-lg font-black text-emerald-700 mt-0.5">
                        {splitProgress?.matchedCount || 0}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Non Appariés
                      </div>
                      <div className="text-lg font-black text-amber-700 mt-0.5">
                        {splitProgress?.unmatchedCount || 0}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" /> Temps Écoulé
                      </div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {((splitProgress?.elapsedMs || 0) / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Real-time Document Stream Inspector Ticker */}
                  {splitProgress?.currentMatricule && (
                    <div className="px-4 py-3 bg-blue-900 text-blue-50 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white font-mono font-bold text-[10px] shrink-0">
                          PAGE {splitProgress.currentPage}
                        </span>
                        <span className="truncate font-medium">
                          Matricule repéré : <strong className="text-white font-mono">{splitProgress.currentMatricule}</strong>
                          {splitProgress.currentEmployeeName && ` • ${splitProgress.currentEmployeeName}`}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-blue-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Découpage en direct
                      </span>
                    </div>
                  )}

                  {/* Multi-page Local Privacy Guarantee */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Traitement sécurisé en mémoire WebAssembly locale. Optimisé pour le découpage fluide des documents volumineux et multipages.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Document Validation & Keyword Structure Card */}
            {validationResult && (
              <div className={`rounded-2xl p-5 border shadow-xs transition-all ${
                validationResult.isValid 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 shadow-xs ${
                      validationResult.isValid ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}>
                      {validationResult.isValid ? (
                        <FileCheck className="w-5 h-5" />
                      ) : (
                        <FileX className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          validationResult.isValid 
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' 
                            : 'bg-rose-200 text-rose-900 border border-rose-300'
                        }`}>
                          {validationResult.isValid ? 'STRUCTURE VALIDÉE AVEC SUCCÈS' : 'STRUCTURE NON CONFORME'}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Score : <strong className="text-slate-900">{validationResult.confidenceScore}%</strong>
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          (Type attendu : {validationResult.selectedDocType} | Détecté : {validationResult.detectedDocType})
                        </span>
                      </div>
                      <p className="text-xs font-medium mt-1.5 leading-relaxed">
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Keywords breakdown */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                  {validationResult.matchedKeywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Mots-Clés Validés :
                      </span>
                      {validationResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-900 font-bold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {validationResult.missingMandatoryKeywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Mots-Clés Requis Absents :
                      </span>
                      {validationResult.missingMandatoryKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-rose-300 text-rose-900 font-extrabold">
                          ✗ {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {validationResult.unexpectedKeywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Mentions Inattendues :
                      </span>
                      {validationResult.unexpectedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 font-medium">
                          ⚠️ {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guidelines Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Moteur de Découpage & Extraction Automatique :</span>
              </div>
              <p className="font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                Format standard : FicheDePaie_AAAA_MM_[MATRICULE].pdf (ex: FicheDePaie_2026_07_EMP000245.pdf)
              </p>
            </div>
          </div>

          {/* Right Column: Campaign Parameters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Paramètres de la Campagne</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type de Document Cible
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as BatchDocumentType)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de la Campagne
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mois de Paie
                </label>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="Juillet 2026">Juillet 2026</option>
                  <option value="Août 2026">Août 2026</option>
                  <option value="Septembre 2026">Septembre 2026</option>
                  <option value="Juin 2026">Juin 2026 (Historique)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Règle d'Extraction & Détection
                </label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  {extractionRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} (Regex: {rule.regexPattern.substring(0, 25)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Filename Formatting / Renaming Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span>Format de Nommage des PDF (Renommage)</span>
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                    En Masse
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Modèle de Nom pour les Fichiers Individuels
                  </label>
                  <select
                    value={filenamePatternFormat}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilenamePatternFormat(val);
                      const newPattern = val === 'CUSTOM' ? customFilenamePattern : val;
                      handleApplyFilenamePatternToExtracted(newPattern);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                  >
                    {FILENAME_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Template Input if Custom selected */}
                {filenamePatternFormat === 'CUSTOM' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Masque de Nommage Personnalisé :
                    </label>
                    <input
                      type="text"
                      value={customFilenamePattern}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFilenamePattern(val);
                        handleApplyFilenamePatternToExtracted(val);
                      }}
                      placeholder="ex: Bulletin_Paie_{Période}_{Matricule}"
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <span className="text-slate-400 font-medium">Balises :</span>
                      {['{Matricule}', '{Période}', '{Nom}', '{Département}'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const updated = customFilenamePattern + tag;
                            setCustomFilenamePattern(updated);
                            handleApplyFilenamePatternToExtracted(updated);
                          }}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded font-mono border border-slate-200 cursor-pointer transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Example Preview Box */}
                <div className="p-2.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Aperçu dynamique du nom généré :
                  </div>
                  <div className="font-mono font-bold text-emerald-400 truncate break-all">
                    {generateFilenameForItem('EMP000245', 'Jean Dupont', 'Génie Logiciel', payrollMonth, getActiveFilenamePattern())}
                  </div>
                </div>

                {/* Re-apply toast/button if items are already extracted */}
                {extractedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleApplyFilenamePatternToExtracted(getActiveFilenamePattern())}
                    className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Re-appliquer ce Nommage aux {extractedItems.length} Fiches</span>
                  </button>
                )}

                {bulkRenamingToast && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold text-center animate-in fade-in">
                    {bulkRenamingToast}
                  </div>
                )}
              </div>

              {/* PDF Encryption Settings */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Chiffrer les Pièces Jointes PDF</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={requirePasswordProtect}
                    onChange={(e) => setRequirePasswordProtect(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {requirePasswordProtect && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Format de Déchiffrement du Mot de Passe
                    </label>
                    <select
                      value={passwordFormat}
                      onChange={(e) => setPasswordFormat(e.target.value as any)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Matricule">Matricule Employé (Par défaut)</option>
                      <option value="Birthdate">Date de Naissance Employé (AAAAMMJJ)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OCR VERIFICATION WORKSPACE TAB */}
      {activeTab === 'ocr' && (
        <OcrVerificationWorkspace
          extractedItems={extractedItems}
          registeredEmployees={registeredEmployees}
          rawPdfBlobUrl={rawPdfBlobUrl}
          onUpdateItem={(updated) => {
            setExtractedItems(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
          onBatchVerifyAll={() => {
            setExtractedItems(prev => prev.map(p => ({ ...p, ocrVerified: true, confidenceScore: 100 })));
          }}
          onProceedToConflicts={() => setActiveTab('conflicts')}
          onProceedToCampaign={handleConfirmAndProceed}
          onRegisterNewEmployee={(newEmp) => {
            if (onRegisterNewEmployee) {
              onRegisterNewEmployee(newEmp);
            }
          }}
        />
      )}

      {/* TAB 3: CONFLICTS RESOLUTION TAB */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Summary & Toolbar Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>Conflits d'Extraction & Écarts d'Annuaire</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentConflicts.length} Conflit{currentConflicts.length !== 1 ? 's' : ''} Actif{currentConflicts.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Examen RH requis. Résolvez les matricules en double ou les fiches employés manquantes avant le découpage du PDF master.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              {currentConflicts.some(c => c.type === 'DUPLICATE_MATRICULE') && (
                <button
                  onClick={handleAutoExcludeDuplicates}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-colors border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Exclure Automatiquement Tous les Doublons</span>
                </button>
              )}

              <button
                onClick={handleConfirmAndProceed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer & Continuer ({activeCount})</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 pl-2">
                <Filter className="w-3.5 h-3.5" /> Filtrer par Type de Conflit :
              </span>
              {(['ALL', 'DUPLICATE_MATRICULE', 'MISSING_EMPLOYEE', 'MISSING_EMAIL'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setConflictFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    conflictFilter === type
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL' && `Tous (${currentConflicts.length})`}
                  {type === 'DUPLICATE_MATRICULE' && `Matricules en Double (${currentConflicts.filter(c => c.type === 'DUPLICATE_MATRICULE').length})`}
                  {type === 'MISSING_EMPLOYEE' && `Employés Manquants (${currentConflicts.filter(c => c.type === 'MISSING_EMPLOYEE').length})`}
                  {type === 'MISSING_EMAIL' && `E-mails Manquants (${currentConflicts.filter(c => c.type === 'MISSING_EMAIL').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict List */}
          {filteredConflicts.length === 0 ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-900">Aucun Conflit Actif Détecté</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Toutes les fiches de paie extraites correspondent à des employés enregistrés avec une adresse e-mail valide et un matricule unique. Vous pouvez procéder au découpage en toute sécurité.
              </p>
              <button
                onClick={handleConfirmAndProceed}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Passer à la Vérification ({activeCount} Bulletins)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConflicts.map(conflict => {
                const item = extractedItems.find(p => p.id === conflict.payslipId);
                if (!item) return null;

                return (
                  <div
                    key={conflict.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs space-y-4 ${
                      conflict.type === 'DUPLICATE_MATRICULE'
                        ? 'border-amber-300 bg-amber-50/20'
                        : conflict.type === 'MISSING_EMPLOYEE'
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-blue-300 bg-blue-50/20'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          conflict.type === 'DUPLICATE_MATRICULE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : conflict.type === 'MISSING_EMPLOYEE'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {conflict.type === 'DUPLICATE_MATRICULE' ? <Copy className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{conflict.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                              Page {conflict.pageNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{conflict.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => setInspectedPayslip(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                          <span>Inspecter la Découpe</span>
                        </button>

                        <button
                          onClick={() => handleExcludePage(item.id)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Exclure la Page {conflict.pageNumber}</span>
                        </button>
                      </div>
                    </div>

                    {/* Conflict Details & Interactive HR Resolution Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      {/* Left Side: Extracted Raw Data */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-blue-600" />
                            ÉLÉMENT BRUT EXTRAIT DU PDF
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                            Confiance OCR : {item.confidenceScore}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Matricule Extrait :</span>
                            <span className="font-mono font-extrabold text-slate-900 text-xs inline-block mt-0.5">
                              {item.matricule}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Nom Salarié Extrait :</span>
                            <span className="font-bold text-slate-900 text-xs block mt-0.5 truncate">
                              {item.employeeName}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">E-mail Extrait :</span>
                            <span className="font-mono text-slate-800 text-[11px] block mt-0.5 truncate">
                              {item.email || <span className="text-rose-500 italic font-semibold">Aucun e-mail dans le PDF</span>}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Période de Paie :</span>
                            <span className="font-bold text-slate-800 text-xs block mt-0.5">
                              {item.payPeriod}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Département & Poste :</span>
                            <span className="font-semibold text-slate-800 text-[11px] block mt-0.5 truncate">
                              {item.department} {item.position ? `(${item.position})` : ''}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-emerald-200 bg-emerald-50/30">
                            <span className="text-emerald-800 text-[10px] font-semibold uppercase tracking-wider block">Net à Payer Calculé :</span>
                            <span className="font-extrabold text-emerald-700 text-xs font-mono block mt-0.5">
                              €{item.netPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown table for Brut / Cotisations / Net */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Salaire Brut Extrait :</span>
                            <span className="font-mono font-bold text-slate-800">€{item.grossPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Cotisations / Déductions :</span>
                            <span className="font-mono font-bold text-rose-700">- €{item.deductions.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-slate-100">
                            <span>Net à Payer Final :</span>
                            <span className="font-mono text-emerald-700">€{item.netPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Extrait Texte Brut OCR/PDF */}
                        {item.rawTextSnippet && (
                          <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px]">
                            <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Extrait Lignes Réelles Lues dans le PDF (Page {item.startPage})</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </div>
                            <p className="leading-relaxed opacity-90 break-words whitespace-pre-wrap font-mono text-[10px]">
                              "{item.rawTextSnippet}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Resolution Form / Actions */}
                      <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Action de Résolution RH</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Choisir Solution</span>
                        </div>

                        {conflict.type === 'DUPLICATE_MATRICULE' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Option 1 : Réassigner la Page {conflict.pageNumber} à un Autre Employé
                            </label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleReassignEmployee(item.id, e.target.value);
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              defaultValue=""
                            >
                              <option value="" disabled>-- Sélectionner un Employé Enregistré --</option>
                              {registeredEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.firstName} {emp.lastName} ({emp.matricule}) - {emp.department}
                                </option>
                              ))}
                            </select>

                            <div className="pt-1 flex items-center gap-2">
                              <button
                                onClick={() => handleExcludePage(item.id)}
                                className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold border border-amber-300 text-center cursor-pointer"
                              >
                                Marquer comme Doublon Exclu
                              </button>
                            </div>
                          </div>
                        )}

                        {conflict.type === 'MISSING_EMPLOYEE' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Associer à un Employé Enregistré Existant :
                            </label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleReassignEmployee(item.id, e.target.value);
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              defaultValue=""
                            >
                              <option value="" disabled>-- Sélectionner dans l'Annuaire --</option>
                              {registeredEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.firstName} {emp.lastName} ({emp.matricule}) - {emp.email}
                                </option>
                              ))}
                            </select>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 font-medium">Pas encore dans le système ?</span>
                              <button
                                onClick={() => {
                                  setQuickCreateTargetId(item.id);
                                  setQuickEmpForm({
                                    matricule: item.matricule,
                                    firstName: '',
                                    lastName: '',
                                    email: '',
                                    department: 'Génie Logiciel',
                                    position: 'Cadre'
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Inscription Rapide Employé</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {conflict.type === 'MISSING_EMAIL' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Définir une Adresse E-mail Valide :
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                placeholder="employe@entreprise-corp.com"
                                defaultValue={item.email}
                                id={`input-email-${item.id}`}
                                className="flex-1 text-xs px-2.5 py-1.5 rounded border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                              />
                              <button
                                onClick={() => {
                                  const el = document.getElementById(`input-email-${item.id}`) as HTMLInputElement;
                                  if (el && el.value) handleUpdateEmail(item.id, el.value);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Register Inline Form */}
                    {quickCreateTargetId === item.id && (
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200 pb-2">
                          <span className="flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-blue-600" />
                            <span>Inscription Rapide pour le Matricule {item.matricule}</span>
                          </span>
                          <button
                            onClick={() => setQuickCreateTargetId(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Matricule</label>
                            <input
                              type="text"
                              value={quickEmpForm.matricule}
                              onChange={(e) => setQuickEmpForm(prev => ({ ...prev, matricule: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Prénom</label>
                            <input
                              type="text"
                              placeholder="Prénom"
                              value={quickEmpForm.firstName}
                              onChange={(e) => setQuickEmpForm(prev => ({ ...prev, firstName: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom</label>
                            <input
                              type="text"
                              placeholder="Nom"
                              value={quickEmpForm.lastName}
                              onChange={(e) => setQuickEmpForm(prev => ({ ...prev, lastName: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail Pro</label>
                            <input
                              type="email"
                              placeholder="nom@entreprise-corp.com"
                              value={quickEmpForm.email}
                              onChange={(e) => setQuickEmpForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setQuickCreateTargetId(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleQuickRegisterSubmit(item.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-sm cursor-pointer"
                          >
                            Créer l'Employé & Lier la Page
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXTRACTED PAGES PREVIEW TAB */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          
          {/* Dedicated PDF Password Protection & Encryption Panel */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Chiffrement AES-256 & Mot de Passe des PDF</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {requirePasswordProtect ? 'Protection Activée' : 'Désactivé'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Définissez le mot de passe requis pour ouvrir et consulter chaque bulletin de paie PDF envoyé par e-mail ou WhatsApp.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={requirePasswordProtect}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRequirePasswordProtect(checked);
                    handleApplyPasswordFormulaToAll(passwordFormat, customPassword, checked);
                  }}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span className="text-slate-200">Exiger un mot de passe à l'ouverture du PDF</span>
              </label>
            </div>

            {requirePasswordProtect && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Règle de Génération du Mot de Passe</span>
                  </label>
                  <select
                    value={passwordFormat}
                    onChange={(e) => {
                      const fmt = e.target.value as any;
                      setPasswordFormat(fmt);
                      handleApplyPasswordFormulaToAll(fmt, customPassword, true);
                    }}
                    className="w-full text-xs bg-slate-800 text-white font-medium border border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Matricule">Matricule Employé (Ex: EMP000245)</option>
                    <option value="Birthdate">Date de Naissance (Ex: 19900514 - AAAAMMJJ)</option>
                    <option value="CodeRH">Code RH kibosh (Ex: KB-EMP000245)</option>
                    <option value="CustomGlobal">Mot de passe unique pour tout le lot</option>
                    <option value="CustomIndividual">Mots de passe personnalisés par employé</option>
                  </select>
                </div>

                {passwordFormat === 'CustomGlobal' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Saisir le Mot de Passe Global Unique</label>
                    <div className="relative">
                      <input
                        type={showGlobalPasswordText ? "text" : "password"}
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Ex: PaieKibosh2026!"
                        className="w-full text-xs bg-slate-800 text-white font-mono font-bold border border-slate-700 rounded-xl px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGlobalPasswordText(!showGlobalPasswordText)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showGlobalPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block font-semibold">Aperçu du Format :</span>
                    <div className="font-mono font-bold text-emerald-400 text-xs truncate">
                      {passwordFormat === 'Matricule' && 'Ex: EMP000245'}
                      {passwordFormat === 'Birthdate' && 'Ex: 19920815 (AAAAMMJJ)'}
                      {passwordFormat === 'CodeRH' && 'Ex: KB-EMP000245'}
                      {passwordFormat === 'CustomIndividual' && 'Défini individuellement sur chaque fiche'}
                    </div>
                  </div>
                )}

                <div>
                  <button
                    onClick={() => handleApplyPasswordFormulaToAll(passwordFormat, customPassword, requirePasswordProtect)}
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Appliquer la Formule ({extractedItems.length} Bulletins)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Bulk Renaming & Filename Pattern Format Panel */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Renommage en Masse & Masque de Fichier des Bulletins</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Avant Découpage
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifiez le format de génération des fichiers individuels (ex: <code className="text-blue-300">Bulletin_Paie_Date_Matricule.pdf</code> ou <code className="text-blue-300">Fiche_Matricule.pdf</code>) avant la scission finale du lot.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Modèle de Nommage Prédéfini</span>
                </label>
                <select
                  value={filenamePatternFormat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilenamePatternFormat(val);
                    const newPattern = val === 'CUSTOM' ? customFilenamePattern : val;
                    handleApplyFilenamePatternToExtracted(newPattern);
                  }}
                  className="w-full text-xs bg-slate-800 text-white font-medium border border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {FILENAME_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {filenamePatternFormat === 'CUSTOM' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Masque Personnalisé :</label>
                  <input
                    type="text"
                    value={customFilenamePattern}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomFilenamePattern(val);
                      handleApplyFilenamePatternToExtracted(val);
                    }}
                    placeholder="ex: Bulletin_Paie_{Période}_{Matricule}"
                    className="w-full text-xs bg-slate-800 text-white font-mono font-bold border border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                    {['{Matricule}', '{Période}', '{Nom}', '{Département}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const updated = customFilenamePattern + tag;
                          setCustomFilenamePattern(updated);
                          handleApplyFilenamePatternToExtracted(updated);
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-blue-900 text-blue-300 rounded font-mono border border-slate-700 cursor-pointer transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block font-semibold">Exemple en direct :</span>
                  <div className="font-mono font-bold text-emerald-400 text-xs truncate">
                    {generateFilenameForItem('EMP000245', 'Jean Dupont', 'Génie Logiciel', payrollMonth, getActiveFilenamePattern())}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => handleApplyFilenamePatternToExtracted(getActiveFilenamePattern())}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-appliquer ce Nommage ({extractedItems.length} Fiches)</span>
                </button>
              </div>
            </div>

            {bulkRenamingToast && (
              <div className="p-2 bg-emerald-950/80 text-emerald-300 border border-emerald-700 rounded-xl text-xs font-bold text-center animate-in fade-in">
                {bulkRenamingToast}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Découpes du Document Extraites ({extractedItems.length} Pages Analysées)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspectez visuellement les limites des documents, vérifiez les découpes de pages et révisez les correspondances employés avant la distribution finale.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle Switch */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setPagesViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pagesViewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Vignettes PDF</span>
                </button>
                <button
                  onClick={() => setPagesViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pagesViewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tableau Compact</span>
                </button>
              </div>

              <button
                onClick={handleConfirmAndProceed}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Passer à la Vérification ({activeCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid View Mode: Render PDF Thumbnail Previews */}
          {pagesViewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
              {extractedItems.map((item, idx) => (
                <PayslipThumbnailCard
                  key={item.id}
                  payslip={item}
                  index={idx}
                  onExcludeToggle={(id) => {
                    if (item.isExcluded) {
                      handleIncludePage(id);
                    } else {
                      handleExcludePage(id);
                    }
                  }}
                  onOpenFullModal={(p) => setInspectedPayslip(p)}
                />
              ))}
            </div>
          ) : (
            /* Table View Mode */
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Page</th>
                    <th className="py-3 px-4">Matricule</th>
                    <th className="py-3 px-4">Nom de l'Employé</th>
                    <th className="py-3 px-4">Département</th>
                    <th className="py-3 px-4">E-mail Destinataire</th>
                    <th className="py-3 px-4">Mot de Passe PDF</th>
                    <th className="py-3 px-4">Net à Payer</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extractedItems.map(item => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.isExcluded ? 'bg-slate-100/70 text-slate-400 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold font-mono">Page {item.startPage}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.matricule}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.employeeName}</td>
                      <td className="py-3 px-4 text-slate-600">{item.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.email || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800 text-[11px]">
                          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{item.pdfPasswordProtected !== false ? (item.pdfPassword || item.matricule) : 'Non protégé'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">€{item.netPay.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {item.isExcluded ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            Exclu
                          </span>
                        ) : item.status === 'Matched' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Correspondant (99%)
                          </span>
                        ) : item.status === 'Unmatched Matricule' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Non Correspondant
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            E-mail Manquant
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setInspectedPayslip(item)}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          Inspecter PDF
                        </button>
                        {item.isExcluded ? (
                          <button
                            onClick={() => handleIncludePage(item.id)}
                            className="text-[11px] text-emerald-600 font-bold hover:underline cursor-pointer"
                          >
                            Inclure
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExcludePage(item.id)}
                            className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                          >
                            Exclure
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Full Document Boundary Inspector Modal */}
      {inspectedPayslip && (
        <PayslipPdfInspectorModal
          payslip={inspectedPayslip}
          onClose={() => setInspectedPayslip(null)}
          onExcludeToggle={(id) => {
            if (inspectedPayslip.isExcluded) {
              handleIncludePage(id);
            } else {
              handleExcludePage(id);
            }
            setInspectedPayslip(prev => prev ? { ...prev, isExcluded: !prev.isExcluded } : null);
          }}
          onUpdateEmail={(id, newEmail) => {
            handleUpdateEmail(id, newEmail);
            setInspectedPayslip(prev => prev ? { ...prev, email: newEmail } : null);
          }}
          onUpdatePassword={(id, newPassword) => {
            handleUpdatePassword(id, newPassword);
            setInspectedPayslip(prev => prev ? { ...prev, pdfPassword: newPassword, pdfPasswordProtected: true } : null);
          }}
        />
      )}

      {/* Non-Payslip Warning / Detection Alert Modal */}
      {showNonPayslipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0">
            {/* Modal Header Banner with dynamic colors based on document type */}
            <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-6 text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                {validationResult?.detectedDocType === 'Academic' || detectionResult?.documentType === 'ACADEMIC_REPORT_CARD' ? (
                  <GraduationCap className="w-7 h-7 text-white" />
                ) : validationResult?.detectedDocType === 'Invoice' || detectionResult?.documentType === 'COMMERCIAL_INVOICE' ? (
                  <Receipt className="w-7 h-7 text-white" />
                ) : validationResult?.detectedDocType === 'Contract' ? (
                  <FileSignature className="w-7 h-7 text-white" />
                ) : (
                  <ShieldAlert className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white uppercase tracking-wider">
                  Validation de Structure Documentaire
                </span>
                <h3 className="text-base font-extrabold text-white mt-1 truncate">
                  {validationResult?.detectedDocType && validationResult.detectedDocType !== 'Unknown'
                    ? `Document Détecté : ${DOCUMENT_TYPES.find(d => d.id === validationResult.detectedDocType)?.label || validationResult.detectedDocType}`
                    : 'Structure Non Conforme au Type Sélectionné'}
                </h3>
                <p className="text-xs text-rose-100 mt-0.5 font-mono truncate">
                  {pendingNonPayslipData?.fileName}
                </p>
              </div>
            </div>

            {/* Diagnostic Content Body */}
            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-4 space-y-2">
                <div className="font-bold flex items-center justify-between text-xs text-rose-900">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Rapport de Contrôle de Structure par Mots-Clés</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-extrabold text-[10px]">
                    Score : {validationResult?.confidenceScore ?? detectionResult?.confidenceScore ?? 0}%
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {validationResult?.message || detectionResult?.reason || 'Le contenu analysé ne correspond pas aux mots-clés requis pour le type sélectionné.'}
                </p>
              </div>

              {/* Document Type Comparison Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Type Attendu :</span>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.shortLabel || selectedDocType}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Type Identifié :</span>
                  <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>
                      {validationResult?.detectedDocType && validationResult.detectedDocType !== 'Unknown'
                        ? DOCUMENT_TYPES.find(d => d.id === validationResult.detectedDocType)?.shortLabel || validationResult.detectedDocType
                        : 'Format Non Reconnu'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matched Keywords */}
              {validationResult?.matchedKeywords && validationResult.matchedKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Mots-clés compatibles identifiés dans le document :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {validationResult.matchedKeywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Mandatory Keywords */}
              {validationResult?.missingMandatoryKeywords && validationResult.missingMandatoryKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-rose-800 text-[11px] uppercase tracking-wider block">
                    Mots-clés obligatoires absents pour "{selectedDocType}" :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {validationResult.missingMandatoryKeywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-mono">
                        ✗ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unexpected keywords */}
              {validationResult?.unexpectedKeywords && validationResult.unexpectedKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-amber-800 text-[11px] uppercase tracking-wider block">
                    Termes identifiés orientant vers un autre type documentaire :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {validationResult.unexpectedKeywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                        ⚠️ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution options banner */}
              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 text-blue-950 space-y-2">
                <div className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Comment souhaitez-vous traiter ce fichier ?</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Vous pouvez réassigner instantanément le type de document pour relancer la validation appropriée, ou basculer en mode "Autre Document" pour désactiver la contrainte stricte de paie.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {validationResult?.detectedDocType && validationResult.detectedDocType !== selectedDocType && validationResult.detectedDocType !== 'Unknown' && (
                    <button
                      onClick={() => handleSwitchDocTypeAndProcess(validationResult.detectedDocType)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Traiter comme {DOCUMENT_TYPES.find(d => d.id === validationResult.detectedDocType)?.shortLabel || validationResult.detectedDocType}</span>
                    </button>
                  )}
                  {selectedDocType !== 'Other' && (
                    <button
                      onClick={() => handleSwitchDocTypeAndProcess('Other')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileStack className="w-3.5 h-3.5 text-slate-600" />
                      <span>Traiter comme Format Libre (Other)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowNonPayslipModal(false);
                  setPendingNonPayslipData(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler & Choisir un autre fichier
              </button>

              <button
                onClick={handleForceProcessNonPayslip}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Forcer le découpage en tant que {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.shortLabel || selectedDocType}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

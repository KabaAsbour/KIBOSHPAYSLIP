import crypto from 'crypto';
import { MAX_PDF_STORE_SIZE, PDF_STORE_TTL_MS } from '../config';

interface StoredPdf {
  id: string;
  buffer: Buffer;
  filename: string;
  companyId: string;
  uploadedByUserId?: string;
  createdAt: number;
  expiresAt: number;
  signedToken: string;
}

const pdfMap = new Map<string, StoredPdf>();

// Periodically clean up expired PDFs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, pdf] of pdfMap.entries()) {
    if (now > pdf.expiresAt) {
      pdfMap.delete(id);
    }
  }
}, 5 * 60 * 1000);

export class PdfStoreService {
  /**
   * Validates if buffer is a legitimate PDF by checking magic bytes (%PDF-)
   */
  public static isValidPdfBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 5) return false;
    const header = buffer.subarray(0, 5).toString('utf-8');
    return header === '%PDF-';
  }

  /**
   * Sanitizes filenames against path traversal and header injection
   */
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\r\n]/g, '')
      .replace(/[\/\\]/g, '_')
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9_\-\.\ \(\)]/g, '')
      .trim() || 'Fiche_de_paie.pdf';
  }

  /**
   * Stores a PDF with a cryptographically secure ID and signed access token
   */
  public static storePdf(params: {
    buffer: Buffer;
    filename: string;
    companyId: string;
    uploadedByUserId?: string;
    ttlMs?: number;
  }): { pdfId: string; signedToken: string; filename: string } {
    const { buffer, filename, companyId, uploadedByUserId, ttlMs = PDF_STORE_TTL_MS } = params;

    // Validate size limit (20MB)
    if (buffer.length > 20 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux. La taille maximale autorisée est de 20 Mo.');
    }

    // Check PDF Magic bytes
    if (!this.isValidPdfBuffer(buffer)) {
      throw new Error('Format de fichier invalide. Le fichier doit être un document PDF valide.');
    }

    // Evict oldest item if max capacity reached
    if (pdfMap.size >= MAX_PDF_STORE_SIZE) {
      const firstKey = pdfMap.keys().next().value;
      if (firstKey) pdfMap.delete(firstKey);
    }

    const pdfId = `pdf-${crypto.randomUUID()}`;
    const signedToken = crypto.randomBytes(32).toString('hex');
    const cleanFilename = this.sanitizeFilename(filename);
    const now = Date.now();

    const storedPdf: StoredPdf = {
      id: pdfId,
      buffer,
      filename: cleanFilename,
      companyId,
      uploadedByUserId,
      createdAt: now,
      expiresAt: now + ttlMs,
      signedToken
    };

    pdfMap.set(pdfId, storedPdf);

    return {
      pdfId,
      signedToken,
      filename: cleanFilename
    };
  }

  /**
   * Retrieves a PDF ensuring tenant ownership and token validity
   */
  public static getPdf(pdfId: string, companyId?: string, signedToken?: string): StoredPdf | null {
    const pdf = pdfMap.get(pdfId);
    if (!pdf) return null;

    if (Date.now() > pdf.expiresAt) {
      pdfMap.delete(pdfId);
      return null;
    }

    // Validate tenant ownership if provided
    if (companyId && pdf.companyId !== companyId) {
      return null;
    }

    // Validate signed token if provided
    if (signedToken && pdf.signedToken !== signedToken) {
      return null;
    }

    return pdf;
  }

  public static getStoreSize(): number {
    return pdfMap.size;
  }
}

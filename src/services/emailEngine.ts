import { DistributionCampaign, DeliveryRecord, EmailSettings, ExtractedPayslip } from '../types';

export interface EmailSendProgress {
  campaignId: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  currentMatricule: string;
  currentEmployeeName: string;
  isFinished: boolean;
  throttleRatePerMin: number;
  calculatedDelayMs: number;
  currentSendRate: number;
  isThrottlingActive: boolean;
}

export class EmailEngine {
  /**
   * Helper to convert Uint8Array bytes into base64 for API transmission
   */
  static async bytesToBase64(bytes?: Uint8Array): Promise<string | undefined> {
    if (!bytes || bytes.length === 0) return undefined;
    try {
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error('Error converting PDF bytes to base64:', e);
      return undefined;
    }
  }

  /**
   * Calculates minimum delay in milliseconds per email send based on emails-per-minute throttle rate limit.
   */
  static getThrottleDelayMs(throttleRatePerMin: number): number {
    const rate = Math.max(1, throttleRatePerMin || 120);
    return Math.max(50, Math.round(60000 / rate));
  }

  /**
   * Helper to generate full PDF download/view link URL
   */
  static getPdfLink(payslip: Partial<ExtractedPayslip>): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const key = payslip.matricule || payslip.id || 'EMP-SAMPLE';
    return `${baseUrl}/api/download-payslip/${key}`;
  }

  /**
   * Interpolate template variables e.g. {FirstName}, {LastName}, {Matricule}, {NetPay}, {Month}, {Year}, {PdfLink}
   */
  static renderTemplate(
    template: string,
    payslip: ExtractedPayslip,
    monthYear: string
  ): string {
    const nameParts = (payslip.employeeName || '').split(' ');
    const firstName = nameParts[0] || 'Employee';
    const lastName = nameParts.slice(1).join(' ') || '';

    const parts = monthYear.split(' ');
    const month = parts[0] || '';
    const year = parts[1] || '2026';

    const pdfLink = this.getPdfLink(payslip);

    let result = (template || '')
      .replace(/\{name\}/gi, payslip.employeeName)
      .replace(/\{FirstName\}/g, firstName)
      .replace(/\{LastName\}/g, lastName)
      .replace(/\{Matricule\}/gi, payslip.matricule)
      .replace(/\{Department\}/gi, payslip.department || 'Général')
      .replace(/\{NetPay\}/gi, payslip.netPay ? payslip.netPay.toFixed(2) : '0.00')
      .replace(/\{Month\}/gi, month)
      .replace(/\{Year\}/gi, year)
      .replace(/\{PdfLink\}/gi, pdfLink)
      .replace(/\{DownloadLink\}/gi, pdfLink)
      .replace(/\{Link\}/gi, pdfLink);

    if (
      !template.toLowerCase().includes('pdflink') &&
      !template.toLowerCase().includes('downloadlink') &&
      !template.toLowerCase().includes('/api/download-payslip')
    ) {
      result += `\n\n----------------------------------------\n📄 Lien de téléchargement direct de votre bulletin de paie PDF :\n${pdfLink}`;
    }

    return result;
  }

  /**
   * Sends a campaign bulk queue asynchronously with live progress, real API delivery and SMTP throttling control.
   */
  static async executeDistributionCampaign(
    campaign: DistributionCampaign,
    settings: EmailSettings,
    onProgress: (progress: EmailSendProgress, updatedCampaign: DistributionCampaign) => void
  ): Promise<DistributionCampaign> {
    const payslips = campaign.payslips.filter(p => !p.isExcluded);
    const records: DeliveryRecord[] = [];

    const updatedCampaign: DistributionCampaign = {
      ...campaign,
      status: 'Distributing',
      totalEmployees: payslips.length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      records: []
    };

    const startTime = Date.now();
    const throttleRatePerMin = settings?.throttleRatePerMin || 120;
    const calculatedDelayMs = this.getThrottleDelayMs(throttleRatePerMin);

    for (let i = 0; i < payslips.length; i++) {
      const ps = payslips[i];
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Enforce rate throttling delay per message
      await new Promise(resolve => setTimeout(resolve, calculatedDelayMs));

      const targetChannel = ps.deliveryChannel || campaign.defaultChannel || 'Email';
      const isWhatsAppRequested = targetChannel === 'WhatsApp' || targetChannel === 'Both';
      const isEmailRequested = targetChannel === 'Email' || targetChannel === 'Both';

      const isInvalidEmail = isEmailRequested && (!ps.email || ps.email.includes('invalid') || !ps.email.includes('@'));
      const isInvalidPhone = isWhatsAppRequested && (!ps.phone || ps.phone.replace(/[^0-9]/g, '').length < 6);

      let record: DeliveryRecord;

      if (isWhatsAppRequested && !isEmailRequested) {
        // WhatsApp ONLY mode
        if (isInvalidPhone) {
          record = {
            id: `rec-${Date.now()}-${i}`,
            payslipId: ps.id,
            matricule: ps.matricule,
            employeeName: ps.employeeName,
            email: ps.email || 'N/A',
            phone: ps.phone || 'Non renseigné',
            channel: 'WhatsApp',
            department: ps.department,
            netPay: ps.netPay,
            payPeriod: ps.payPeriod,
            status: 'Failed',
            sentAt: now,
            errorMessage: 'WhatsApp Error: Numéro de téléphone invalide ou non renseigné',
            retryCount: 1,
            pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
            pdfBlobUrl: ps.pdfBlobUrl
          };
          updatedCampaign.failedCount += 1;
        } else {
          try {
            const pdfLink = this.getPdfLink(ps);
            const waText = this.renderTemplate(
              campaign.whatsappTemplate || settings?.whatsappSettings?.defaultTemplate || `🟢 *BULLETIN DE PAIE — {Month} {Year}*\n\nBonjour *{FirstName} {LastName}*,\nVoici votre bulletin de paie PDF : {PdfLink}`,
              ps,
              ps.payPeriod
            );

            const response = await fetch('/api/send-whatsapp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toPhone: ps.phone,
                employeeName: ps.employeeName,
                messageText: waText,
                pdfLink,
                whatsappSettings: settings.whatsappSettings
              })
            });

            const waData = await response.json();
            if (response.ok && waData.success) {
              record = {
                id: `rec-${Date.now()}-${i}`,
                payslipId: ps.id,
                matricule: ps.matricule,
                employeeName: ps.employeeName,
                email: ps.email || 'N/A',
                phone: ps.phone,
                channel: 'WhatsApp',
                department: ps.department,
                netPay: ps.netPay,
                payPeriod: ps.payPeriod,
                status: 'Delivered',
                sentAt: now,
                deliveredAt: now,
                retryCount: 0,
                pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
                pdfBlobUrl: ps.pdfBlobUrl
              };
              updatedCampaign.deliveredCount += 1;
            } else {
              record = {
                id: `rec-${Date.now()}-${i}`,
                payslipId: ps.id,
                matricule: ps.matricule,
                employeeName: ps.employeeName,
                email: ps.email || 'N/A',
                phone: ps.phone,
                channel: 'WhatsApp',
                department: ps.department,
                netPay: ps.netPay,
                payPeriod: ps.payPeriod,
                status: 'Failed',
                sentAt: now,
                errorMessage: waData.error || 'Erreur d\'envoi WhatsApp Business API',
                retryCount: 1,
                pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
                pdfBlobUrl: ps.pdfBlobUrl
              };
              updatedCampaign.failedCount += 1;
            }
          } catch (err: any) {
            record = {
              id: `rec-${Date.now()}-${i}`,
              payslipId: ps.id,
              matricule: ps.matricule,
              employeeName: ps.employeeName,
              email: ps.email || 'N/A',
              phone: ps.phone,
              channel: 'WhatsApp',
              department: ps.department,
              netPay: ps.netPay,
              payPeriod: ps.payPeriod,
              status: 'Failed',
              sentAt: now,
              errorMessage: err?.message || 'Échec de connexion au service WhatsApp',
              retryCount: 1,
              pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
              pdfBlobUrl: ps.pdfBlobUrl
            };
            updatedCampaign.failedCount += 1;
          }
        }
      } else if (isInvalidEmail) {
        record = {
          id: `rec-${Date.now()}-${i}`,
          payslipId: ps.id,
          matricule: ps.matricule,
          employeeName: ps.employeeName,
          email: ps.email || 'N/A',
          phone: ps.phone,
          channel: targetChannel,
          department: ps.department,
          netPay: ps.netPay,
          payPeriod: ps.payPeriod,
          status: 'Failed',
          sentAt: now,
          errorMessage: 'SMTP 550: Mailbox unavailable or invalid destination domain name',
          retryCount: 1,
          pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
          pdfBlobUrl: ps.pdfBlobUrl
        };
        updatedCampaign.failedCount += 1;
      } else {
        // Email OR Dual Channel (Both)
        try {
          const pdfBase64 = await this.bytesToBase64(ps.pdfBytes);
          const pdfLink = this.getPdfLink(ps);
          const renderedText = this.renderTemplate(
            campaign.emailTemplate || settings?.defaultTemplate || '',
            ps,
            ps.payPeriod
          );

          const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
                <h2 style="margin: 0; font-size: 18px;">KIBOSH - Service Paie & RH</h2>
              </div>
              <div style="padding: 20px 0; line-height: 1.6; white-space: pre-line; font-size: 14px; color: #334155;">
                ${renderedText}
              </div>
              <div style="margin-top: 20px; padding: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px; color: #0f172a;">📄 Accès Direct à votre Bulletin de Paie PDF</p>
                <a href="${pdfLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Ouvrir / Télécharger le PDF</a>
                <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">Lien direct : <a href="${pdfLink}" style="color: #2563eb;">${pdfLink}</a></p>
              </div>
            </div>
          `;

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: ps.email,
              subject: campaign.emailSubject || settings?.defaultSubject || `Fiche de Paie - ${ps.payPeriod}`,
              text: renderedText,
              html: htmlBody,
              fromEmail: settings?.senderEmail || 'paie@enterprise-corp.com',
              fromName: settings?.senderName || 'KIBOSH Service Paie System',
              pdfBase64,
              pdfId: ps.matricule || ps.id,
              filename: `Fiche_de_paie_${ps.matricule}.pdf`,
              smtpSettings: settings
            })
          });

          const rawText = await response.text();
          let resData: any = {};
          try {
            resData = rawText ? JSON.parse(rawText) : {};
          } catch {
            resData = { success: false, error: `Réponse serveur non-JSON (Code HTTP ${response.status})` };
          }

          // If BOTH is selected, also trigger WhatsApp send
          if (targetChannel === 'Both' && ps.phone) {
            try {
              const waText = this.renderTemplate(
                campaign.whatsappTemplate || settings?.whatsappSettings?.defaultTemplate || `🟢 *BULLETIN DE PAIE — {Month} {Year}*\n\nBonjour *{FirstName} {LastName}*,\nVoici votre bulletin de paie PDF : {PdfLink}`,
                ps,
                ps.payPeriod
              );
              await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  toPhone: ps.phone,
                  employeeName: ps.employeeName,
                  messageText: waText,
                  pdfLink,
                  whatsappSettings: settings.whatsappSettings
                })
              });
            } catch (wErr) {
              console.warn('[Dual channel WhatsApp send warning]:', wErr);
            }
          }

          if (response.ok && resData.success) {
            record = {
              id: `rec-${Date.now()}-${i}`,
              payslipId: ps.id,
              matricule: ps.matricule,
              employeeName: ps.employeeName,
              email: ps.email,
              phone: ps.phone,
              channel: targetChannel,
              department: ps.department,
              netPay: ps.netPay,
              payPeriod: ps.payPeriod,
              status: 'Delivered',
              sentAt: now,
              deliveredAt: now,
              retryCount: 0,
              pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
              pdfBlobUrl: ps.pdfBlobUrl
            };
            updatedCampaign.deliveredCount += 1;
          } else {
            record = {
              id: `rec-${Date.now()}-${i}`,
              payslipId: ps.id,
              matricule: ps.matricule,
              employeeName: ps.employeeName,
              email: ps.email,
              phone: ps.phone,
              channel: targetChannel,
              department: ps.department,
              netPay: ps.netPay,
              payPeriod: ps.payPeriod,
              status: 'Failed',
              sentAt: now,
              errorMessage: resData.error || 'Erreur SMTP lors du transfert du message',
              retryCount: 1,
              pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
              pdfBlobUrl: ps.pdfBlobUrl
            };
            updatedCampaign.failedCount += 1;
          }
        } catch (err: any) {
          record = {
            id: `rec-${Date.now()}-${i}`,
            payslipId: ps.id,
            matricule: ps.matricule,
            employeeName: ps.employeeName,
            email: ps.email,
            phone: ps.phone,
            channel: targetChannel,
            department: ps.department,
            netPay: ps.netPay,
            payPeriod: ps.payPeriod,
            status: 'Failed',
            sentAt: now,
            errorMessage: err?.message || 'Echec de connexion au serveur SMTP',
            retryCount: 1,
            pdfFileName: `Payslip_${ps.payPeriod.replace(/\s+/g, '_')}_${ps.matricule}.pdf`,
            pdfBlobUrl: ps.pdfBlobUrl
          };
          updatedCampaign.failedCount += 1;
        }
      }

      updatedCampaign.sentCount += 1;
      records.push(record);
      updatedCampaign.records = [...records];

      const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      updatedCampaign.durationSeconds = durationSec;

      const elapsedMin = durationSec / 60;
      const currentSendRate = Math.round(updatedCampaign.sentCount / (elapsedMin || 1/60));

      onProgress(
        {
          campaignId: campaign.id,
          total: payslips.length,
          sent: updatedCampaign.sentCount,
          delivered: updatedCampaign.deliveredCount,
          failed: updatedCampaign.failedCount,
          currentMatricule: ps.matricule,
          currentEmployeeName: ps.employeeName,
          isFinished: i === payslips.length - 1,
          throttleRatePerMin,
          calculatedDelayMs,
          currentSendRate: Math.min(currentSendRate, throttleRatePerMin),
          isThrottlingActive: true
        },
        updatedCampaign
      );
    }

    updatedCampaign.status = updatedCampaign.failedCount > 0 ? 'Completed with Errors' : 'Completed';
    return updatedCampaign;
  }

  /**
   * Retry single or multiple failed delivery records using real API endpoint
   */
  static async retryFailedRecord(
    record: DeliveryRecord,
    newEmail?: string,
    newPhone?: string,
    settings?: EmailSettings
  ): Promise<DeliveryRecord> {
    const emailToUse = newEmail || record.email;
    const phoneToUse = newPhone || record.phone;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const pdfLink = this.getPdfLink({ matricule: record.matricule, id: record.payslipId });

    let updatedRecord: DeliveryRecord = {
      ...record,
      email: emailToUse,
      phone: phoneToUse,
      retryCount: record.retryCount + 1
    };

    const targetChannel = record.channel || 'Email';

    // Handle WhatsApp retry if channel is WhatsApp or Both
    if (targetChannel === 'WhatsApp' || targetChannel === 'Both' || record.whatsappStatus === 'Failed') {
      if (!phoneToUse || phoneToUse.replace(/[^0-9]/g, '').length < 6) {
        updatedRecord.whatsappStatus = 'Failed';
        updatedRecord.whatsappErrorMessage = 'WhatsApp Error: Numéro de téléphone invalide ou non renseigné';
      } else {
        try {
          const waText = `🟢 *BULLETIN DE PAIE — ${record.payPeriod}*\n\nBonjour *${record.employeeName}*,\nVoici le lien direct vers votre bulletin de paie PDF : ${pdfLink}`;
          const waRes = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toPhone: phoneToUse,
              employeeName: record.employeeName,
              messageText: waText,
              pdfLink,
              whatsappSettings: settings?.whatsappSettings
            })
          });
          const waJson = await waRes.json();
          if (waRes.ok && waJson.success) {
            updatedRecord.whatsappStatus = 'Delivered';
            updatedRecord.whatsappSentAt = now;
            updatedRecord.whatsappDeliveredAt = now;
            updatedRecord.whatsappErrorMessage = undefined;
          } else {
            updatedRecord.whatsappStatus = 'Failed';
            updatedRecord.whatsappErrorMessage = waJson.error || 'Erreur d\'envoi WhatsApp lors de la rétentative';
          }
        } catch (wErr: any) {
          updatedRecord.whatsappStatus = 'Failed';
          updatedRecord.whatsappErrorMessage = wErr?.message || 'Erreur de connexion WhatsApp lors de la rétentative';
        }
      }
    }

    // Handle Email retry if channel is Email or Both
    if (targetChannel === 'Email' || targetChannel === 'Both' || record.status === 'Failed') {
      const isInvalidEmail = !emailToUse || emailToUse.includes('invalid') || !emailToUse.includes('@');
      if (isInvalidEmail) {
        updatedRecord.status = 'Failed';
        updatedRecord.errorMessage = 'SMTP 550: Adresse rejetée lors du nouvel essai - Domaine invalide';
      } else {
        try {
          const textContent = `Bonjour ${record.employeeName},\n\nVeuillez trouver ci-joint votre bulletin de paie pour la période ${record.payPeriod}.\n\nNet à payer: ${record.netPay} €\n\n----------------------------------------\n📄 Lien de téléchargement direct de votre bulletin de paie PDF :\n${pdfLink}`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
                <h2 style="margin: 0; font-size: 18px;">KIBOSH - Service Paie & RH</h2>
              </div>
              <div style="padding: 20px 0; line-height: 1.6; font-size: 14px; color: #334155;">
                Bonjour <strong>${record.employeeName}</strong>,<br><br>
                Veuillez trouver ci-joint votre bulletin de paie pour la période <strong>${record.payPeriod}</strong>.<br>
                Net à payer : <strong>${record.netPay} €</strong>
              </div>
              <div style="margin-top: 20px; padding: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px; color: #0f172a;">📄 Accès Direct à votre Bulletin de Paie PDF</p>
                <a href="${pdfLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Ouvrir / Télécharger le PDF</a>
                <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">Lien direct : <a href="${pdfLink}" style="color: #2563eb;">${pdfLink}</a></p>
              </div>
            </div>
          `;

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: emailToUse,
              subject: `Fiche de Paie - ${record.payPeriod}`,
              text: textContent,
              html: htmlContent,
              fromEmail: settings?.senderEmail || 'paie@enterprise-corp.com',
              fromName: settings?.senderName || 'KIBOSH Service Paie System',
              pdfId: record.matricule || record.payslipId,
              filename: record.pdfFileName || `Fiche_de_paie_${record.matricule}.pdf`,
              smtpSettings: settings
            })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            updatedRecord.status = 'Delivered';
            updatedRecord.sentAt = now;
            updatedRecord.deliveredAt = now;
            updatedRecord.errorMessage = undefined;
          } else {
            updatedRecord.status = 'Failed';
            updatedRecord.errorMessage = data.error || 'Erreur lors du nouvel essai SMTP';
          }
        } catch (e: any) {
          updatedRecord.status = 'Failed';
          updatedRecord.errorMessage = e?.message || 'Erreur de connexion SMTP lors du nouvel essai';
        }
      }
    }

    // If channel is WhatsApp only and whatsapp delivered, mark overall status Delivered
    if (targetChannel === 'WhatsApp' && updatedRecord.whatsappStatus === 'Delivered') {
      updatedRecord.status = 'Delivered';
    }

    return updatedRecord;
  }
}

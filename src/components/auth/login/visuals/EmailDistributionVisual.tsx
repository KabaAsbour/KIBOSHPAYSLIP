import React from 'react';
import { MailCheck, Send, CheckCircle2, ShieldCheck, Clock, Inbox, Paperclip } from 'lucide-react';

export const EmailDistributionVisual: React.FC = () => {
  return (
    <div className="relative w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Decorative ambient glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Étape 5 · Distribution Sécurisée en Boîte Réception
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 flex items-center gap-1">
          <MailCheck className="w-3 h-3 text-emerald-400" />
          Délivré 100%
        </span>
      </div>

      {/* Recipient Inbox Stream Mockup */}
      <div className="relative z-10 space-y-2.5 py-1">
        {[
          {
            recipient: 's.laurent@entreprise.com',
            subject: 'Votre bulletin de paie · Octobre 2026',
            attachment: 'Bulletin_EMP84920.pdf (182 Ko)',
            time: '08:42',
            status: 'Reçu & Certifié'
          },
          {
            recipient: 'm.dubois@entreprise.com',
            subject: 'Votre bulletin de paie · Octobre 2026',
            attachment: 'Bulletin_EMP84921.pdf (179 Ko)',
            time: '08:43',
            status: 'Reçu & Certifié'
          },
          {
            recipient: 'a.bensaid@entreprise.com',
            subject: 'Votre bulletin de paie · Octobre 2026',
            attachment: 'Bulletin_EMP84922.pdf (185 Ko)',
            time: '08:43',
            status: 'Reçu & Certifié'
          }
        ].map((item) => (
          <div
            key={item.recipient}
            className="p-3 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-xs space-y-2"
          >
            {/* Top row: Inbox destination & delivery stamp */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Inbox className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate font-mono">
                    {item.recipient}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    {item.subject}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.status}
                </span>
                <div className="text-[9px] font-mono text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{item.time}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Protected Attachment & Delivery Details */}
            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800 text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-cyan-300">
                <Paperclip className="w-3 h-3 text-cyan-400" />
                <span className="truncate">{item.attachment}</span>
              </div>
              <span className="text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Dépôt sécurisé
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Transmission unitaire SMTP avec traçabilité complète</span>
        </span>
        <span className="text-emerald-300 font-mono font-medium">148/148 délivrés</span>
      </div>
    </div>
  );
};

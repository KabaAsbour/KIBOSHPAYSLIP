import React from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, X, Gauge, Clock } from 'lucide-react';
import { DistributionCampaign } from '../../types';
import { EmailSendProgress } from '../../services/emailEngine';

interface SendingQueueProgressModalProps {
  progress: EmailSendProgress | null;
  campaign: DistributionCampaign | null;
  onClose: () => void;
}

export const SendingQueueProgressModal: React.FC<SendingQueueProgressModalProps> = ({
  progress,
  campaign,
  onClose
}) => {
  if (!progress || !campaign) return null;

  const percent = Math.round((progress.sent / progress.total) * 100) || 0;
  const throttleRate = progress.throttleRatePerMin || 120;
  const delayMs = progress.calculatedDelayMs || 500;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
              progress.isFinished ? 'bg-emerald-600' : 'bg-blue-600 animate-pulse'
            }`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {progress.isFinished ? 'Campaign Email Queue Complete!' : 'Distributing Encrypted Payslip Emails...'}
              </h3>
              <p className="text-xs text-slate-500">
                Campaign Ref: {campaign.id} ({campaign.payrollMonth})
              </p>
            </div>
          </div>

          {progress.isFinished && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Throttling Engine Control Badge & Real-time Rate Gauge */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Gauge className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span>SMTP Throttling Rate Engine</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Pacing: {delayMs}ms delay / email
                  </span>
                  <span>•</span>
                  <span>Limit: {throttleRate} emails/min</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Capacity Load</div>
              <div className="text-sm font-black text-blue-400">
                {Math.min(100, Math.round(((progress.currentSendRate || throttleRate) / throttleRate) * 100))}%
              </div>
            </div>
          </div>

          {/* Real-Time SVG Radial Arc Gauge */}
          <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 flex items-center justify-around gap-4">
            {/* SVG Arc Gauge */}
            <div className="relative flex flex-col items-center justify-center w-28 h-16">
              <svg className="w-28 h-28 overflow-visible" viewBox="0 0 100 60">
                {/* Background Track Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Meter Fill Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={
                    ((progress.currentSendRate || throttleRate) / throttleRate) > 0.95
                      ? '#e11d48'
                      : ((progress.currentSendRate || throttleRate) / throttleRate) > 0.85
                      ? '#f59e0b'
                      : '#3b82f6'
                  }
                  strokeWidth="8"
                  strokeDasharray="125.66"
                  strokeDashoffset={
                    125.66 - (125.66 * Math.min(1, (progress.currentSendRate || throttleRate) / throttleRate))
                  }
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
                {/* Tick marks */}
                <text x="8" y="58" className="text-[7px] fill-slate-500 font-mono font-bold">0</text>
                <text x="46" y="14" className="text-[7px] fill-slate-400 font-mono font-bold">{Math.round(throttleRate / 2)}</text>
                <text x="82" y="58" className="text-[7px] fill-slate-500 font-mono font-bold">{throttleRate}</text>
              </svg>

              {/* Center Needle / Value readout */}
              <div className="absolute top-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-white font-mono leading-none">
                  {progress.currentSendRate || throttleRate}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">emails/min</span>
              </div>
            </div>

            {/* Gauge Analytics Metrics */}
            <div className="flex-1 space-y-1.5 text-xs border-l border-slate-800 pl-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Live Delivery Speed:</span>
                <span className="font-mono font-bold text-blue-400">
                  {progress.currentSendRate || throttleRate} / min
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">SMTP Throttle Cap:</span>
                <span className="font-mono font-bold text-slate-300">
                  {throttleRate} / min
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Engine Pacing Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Protected ({delayMs}ms)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700">Sending Queue Progress</span>
            <span className="text-blue-600">{progress.sent} / {progress.total} Emails Dispatched ({percent}%)</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                progress.isFinished ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Current Active Employee */}
        {!progress.isFinished && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Current Dispatch Target:</span>
            <span className="font-bold text-slate-900 font-mono">
              {progress.currentMatricule} — {progress.currentEmployeeName}
            </span>
          </div>
        )}

        {/* Realtime Live Counts */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-800">Delivered</div>
              <div className="text-lg font-black text-emerald-600">{progress.delivered}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-red-800">Bounced / Failed</div>
              <div className="text-lg font-black text-red-600">{progress.failed}</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Action Button */}
        {progress.isFinished && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            View Completed Campaign Logs & Summary
          </button>
        )}
      </div>
    </div>
  );
};

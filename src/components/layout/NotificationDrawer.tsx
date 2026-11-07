import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  notifications,
  onClose,
  onClearAll,
  onMarkRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">Notifications Système</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-white font-medium"
              >
                Effacer Tout
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-10">
              Aucune nouvelle notification.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1 ${
                  !n.read ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    {n.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">{n.timestamp}</span>
                </div>
                <p className="text-slate-600">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

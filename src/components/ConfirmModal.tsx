import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm glass-card p-8 rounded-[32px] modern-shadow border border-zinc-800 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center",
                variant === 'danger' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
              )}>
                <AlertTriangle size={24} />
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-2xl transition-all shadow-lg",
                  variant === 'danger' ? "bg-red-500 shadow-red-500/20" : "bg-amber-500 shadow-amber-500/20"
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

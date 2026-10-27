import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border dark:border-zinc-800/80 border-zinc-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b dark:border-zinc-800/80 border-zinc-200">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 shrink-0 ${isDestructive ? 'dark:bg-rose-950/40 bg-rose-100 text-rose-500' : 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-200 text-zinc-800'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-zinc-950">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 dark:text-zinc-400 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-xs sm:text-base dark:text-zinc-400 text-zinc-600 leading-relaxed">{message}</p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t dark:border-zinc-800/80 border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border dark:border-zinc-700 border-zinc-300 px-5 py-2.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition text-center ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

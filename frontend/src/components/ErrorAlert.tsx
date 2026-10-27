import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  title = 'An error occurred',
}) => {
  return (
    <div className="rounded-2xl border dark:border-rose-900/50 border-rose-200 dark:bg-rose-950/30 bg-rose-50/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold dark:text-rose-200 text-rose-900">{title}</h4>
          <p className="mt-1 text-xs dark:text-rose-300/80 text-rose-700 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

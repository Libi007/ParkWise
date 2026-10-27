import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 sm:p-10 text-center shadow-sm border dark:border-zinc-800/80 border-zinc-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl dark:bg-zinc-800 dark:text-zinc-300 bg-zinc-100 text-zinc-600 shadow-inner">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-4xl sm:text-5xl font-black dark:text-white text-zinc-950">404</h2>
        <h3 className="mt-2 text-lg sm:text-xl font-bold dark:text-zinc-200 text-zinc-900">Page Not Found</h3>
        <p className="mt-2 text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 leading-relaxed">
          The requested page could not be found.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800 px-5 py-3 text-xs sm:text-sm font-bold shadow-sm transition active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

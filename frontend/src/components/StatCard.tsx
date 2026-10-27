import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badge?: {
    text: string;
    variant?: 'blue' | 'emerald' | 'amber' | 'slate';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50/80',
  badge,
}) => {
  const badgeClasses = {
    blue: 'dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50 bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 bg-amber-50 text-amber-700 border-amber-200',
    slate: 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 bg-slate-100 text-slate-600 border-slate-200',
  }[badge?.variant || 'blue'];

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border dark:border-sky-500/15 border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500 truncate">
            {title}
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight dark:text-white text-zinc-950 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs dark:text-zinc-400 text-zinc-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className="shrink-0 rounded-2xl p-2.5 sm:p-3 dark:bg-zinc-800 dark:text-zinc-200 bg-zinc-100 text-zinc-800 border dark:border-zinc-700 border-zinc-200 shadow-inner">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3.5 pt-3 border-t dark:border-zinc-800/80 border-zinc-200">
          <span className={`inline-block rounded-lg border px-2.5 py-0.5 text-[11px] sm:text-xs font-medium ${badgeClasses}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};

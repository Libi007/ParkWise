import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="glass-card animate-pulse rounded-2xl p-5 border dark:border-zinc-800/80 border-zinc-200">
    <div className="h-4 w-1/3 rounded-lg dark:bg-zinc-800/70 bg-zinc-200/80"></div>
    <div className="mt-3 h-8 w-1/2 rounded-lg dark:bg-zinc-800/70 bg-zinc-200/80"></div>
    <div className="mt-2 h-3 w-1/4 rounded-lg dark:bg-zinc-800/40 bg-zinc-100/80"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3">
    <div className="h-10 w-full rounded-xl dark:bg-zinc-800/70 bg-zinc-200/80"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 w-full rounded-xl dark:bg-zinc-800/40 bg-zinc-100/80"></div>
    ))}
  </div>
);

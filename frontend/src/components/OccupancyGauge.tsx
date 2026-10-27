import React from 'react';

interface OccupancyGaugeProps {
  percentage: number;
  status: string;
  occupied: number;
  available: number;
  capacity: number;
  size?: 'compact' | 'normal';
}

export const OccupancyGauge: React.FC<OccupancyGaugeProps> = ({
  percentage,
  status,
  occupied,
  available,
  capacity,
  size = 'normal',
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));

  // Determine current RPM state (Green -> Amber -> Orange -> Redline)
  const getRpmState = () => {
    if (clamped < 40) {
      return {
        label: 'Low Occupancy',
        color: 'text-emerald-400',
        badgeBg: 'dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        barColor: 'from-emerald-500 to-emerald-400',
      };
    }
    if (clamped < 75) {
      return {
        label: 'Moderate',
        color: 'text-amber-400',
        badgeBg: 'dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-400',
        barColor: 'from-emerald-500 via-amber-400 to-amber-500',
      };
    }
    if (clamped < 90) {
      return {
        label: 'High Load',
        color: 'text-orange-400',
        badgeBg: 'dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30 bg-orange-50 text-orange-700 border-orange-200',
        dotColor: 'bg-orange-500',
        barColor: 'from-emerald-500 via-amber-400 to-orange-500',
      };
    }
    return {
      label: 'Redline (Peak)',
      color: 'text-rose-500',
      badgeBg: 'dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40 bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      barColor: 'from-emerald-500 via-amber-400 via-orange-500 to-rose-500',
    };
  };

  const rpm = getRpmState();
  const totalSegments = 28;
  const activeSegments = Math.round((clamped / 100) * totalSegments);

  return (
    <div className="w-full space-y-4">
      {/* Digital Header: Large percentage + Status */}
      <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-2.5">
        <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3.5">
          <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight dark:text-white text-zinc-950 font-mono">
            {clamped.toFixed(0)}<span className="text-xl sm:text-2xl font-normal dark:text-zinc-500 text-zinc-400">%</span>
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${rpm.badgeBg}`}>
            <span className={`h-2 w-2 rounded-full ${rpm.dotColor} ${clamped >= 85 ? 'animate-pulse' : ''}`} />
            {rpm.label}
          </span>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-sm sm:text-base font-semibold dark:text-zinc-300 text-zinc-700 font-mono">
            <strong className="text-emerald-500 font-bold">{available}</strong>
            <span className="dark:text-zinc-400 text-zinc-500"> / {capacity} spots free</span>
          </span>
        </div>
      </div>

      {/* Minimalist Segmented RPM Bar (Green ➔ Yellow ➔ Orange ➔ Red) */}
      <div className="space-y-2">
        <div
          style={{ display: 'grid', gridTemplateColumns: `repeat(${totalSegments}, minmax(0, 1fr))` }}
          className="gap-0.5 sm:gap-1 p-1 rounded-xl dark:bg-zinc-950/90 bg-zinc-200/80 border dark:border-zinc-800/90 border-zinc-300 shadow-inner"
        >
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isActive = i < activeSegments;
            const ratio = i / totalSegments;

            // Compute segment color along the RPM spectrum
            let activeColor = 'bg-emerald-500';
            if (ratio >= 0.85) {
              activeColor = 'bg-rose-500';
            } else if (ratio >= 0.7) {
              activeColor = 'bg-orange-500';
            } else if (ratio >= 0.4) {
              activeColor = 'bg-amber-400';
            }

            return (
              <div
                key={i}
                className={`h-5 sm:h-6 rounded-[2px] transition-all duration-300 min-w-0 ${
                  isActive
                    ? `${activeColor} ${ratio >= 0.85 ? 'animate-pulse' : ''}`
                    : 'dark:bg-zinc-800/50 bg-zinc-300/70'
                }`}
                title={`RPM: ${Math.round(ratio * 100)}%`}
              />
            );
          })}
        </div>

        {/* Minimal Scale Legend */}
        <div className="flex justify-between items-center text-xs font-semibold dark:text-zinc-500 text-zinc-400 font-mono px-0.5">
          <span className="text-emerald-500">EMPTY (0%)</span>
          <span>50%</span>
          <span className="text-rose-500 font-bold">FULL (100%)</span>
        </div>
      </div>

      {/* Space Breakdown Counters */}
      {size === 'normal' && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-1">
          <div className="glass-panel-subtle rounded-2xl p-3 sm:p-3.5 border dark:border-zinc-800/80 border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 font-medium">Occupied Spots</span>
            <span className="text-sm sm:text-base font-bold dark:text-white text-zinc-950 font-mono">
              {occupied}
            </span>
          </div>

          <div className="glass-panel-subtle rounded-2xl p-3 sm:p-3.5 border dark:border-zinc-800/80 border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 font-medium">Available Spots</span>
            <span className="text-sm sm:text-base font-bold text-emerald-500 font-mono">
              {available}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


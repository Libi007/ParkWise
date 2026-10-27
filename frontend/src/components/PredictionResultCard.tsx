import React from 'react';
import { PredictionResponse } from '../types';
import { OccupancyGauge } from './OccupancyGauge';
import { formatFacilityDateTime } from '../utils/formatters';
import { Calendar, MapPin, Info } from 'lucide-react';

interface PredictionResultCardProps {
  prediction: PredictionResponse;
}

export const PredictionResultCard: React.FC<PredictionResultCardProps> = ({
  prediction,
}) => {
  const occ = prediction.occupancy_percentage;

  // Driver guidance message based on predicted occupancy
  const getDriverAdvice = () => {
    if (occ < 40) {
      return 'Plenty of free spots expected at this arrival time. Quick and easy parking.';
    }
    if (occ < 75) {
      return 'Steady traffic flow. Good spot availability with normal turnover.';
    }
    if (occ < 90) {
      return 'High occupancy anticipated. Consider arriving 10-15 minutes earlier.';
    }
    return 'Peak congestion expected. Very few spots open; consider nearby alternative car parks.';
  };

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg space-y-5 sm:space-y-6 border dark:border-sky-500/15 border-slate-200">
      {/* Header with Title and Facility Code */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b dark:border-slate-800/80 border-slate-200 pb-4">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="shrink-0 rounded-xl dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/30 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold">
            {prediction.facility_code}
          </span>
          <h3 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 tracking-tight truncate" title={prediction.display_name}>
            {prediction.display_name}
          </h3>
        </div>

        <span className="shrink-0 text-xs sm:text-sm dark:text-slate-400 text-slate-500 font-semibold font-mono">
          {prediction.reference_capacity} total spots
        </span>
      </div>

      {/* Minimal RPM Gauge Bar */}
      <OccupancyGauge
        percentage={prediction.occupancy_percentage}
        status={prediction.parking_status}
        occupied={prediction.occupied_spaces}
        available={prediction.available_spaces}
        capacity={prediction.reference_capacity}
      />

      {/* Target Timestamp & Location Details */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-3.5 border-t dark:border-slate-800/80 border-slate-200 text-xs sm:text-sm">
        <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
          <Calendar className="h-4 w-4 dark:text-cyan-400 text-cyan-600 shrink-0" />
          <span>Arrival:</span>
          <span className="font-bold dark:text-slate-200 text-slate-900 font-mono">
            {formatFacilityDateTime(prediction.requested_datetime)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 dark:text-slate-400 text-slate-500">
          <MapPin className="h-4 w-4 dark:text-emerald-400 text-emerald-600 shrink-0" />
          <span className="dark:text-slate-300 text-slate-700 font-medium">The Hague / Scheveningen</span>
        </div>
      </div>

      {/* Driver Guidance Tip */}
      <div className="flex items-start gap-2.5 text-xs sm:text-sm dark:text-slate-200 text-slate-800 dark:bg-emerald-950/20 bg-emerald-50/70 rounded-2xl p-3.5 border dark:border-emerald-500/25 border-emerald-200">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{getDriverAdvice()}</p>
      </div>
    </div>
  );
};

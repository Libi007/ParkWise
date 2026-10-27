import React, { useState, useEffect } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { Facility, PaginationMeta, PredictionRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ModernGarageSelect } from '../components/ModernGarageSelect';
import { formatDateTime, formatFacilityDateTime } from '../utils/formatters';
import {
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Car,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getSessionPredictions,
  clearSessionPredictions,
} from '../utils/sessionHistory';

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    page_size: 15,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  // Filter states
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load facilities for the filter dropdown
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await api.getFacilities();
        setFacilities(res.data);
      } catch {
        // non-fatal
      }
    };
    fetchFacilities();
  }, []);

  const loadHistory = (_pageToLoad?: number) => {
    try {
      setLoading(true);
      setError(null);
      let sessionData = getSessionPredictions();
      if (selectedFacility) {
        sessionData = sessionData.filter(
          (r) => r.facility?.facility_code === selectedFacility
        );
      }
      if (startDate) {
        sessionData = sessionData.filter(
          (r) => r.requested_datetime >= startDate
        );
      }
      if (endDate) {
        sessionData = sessionData.filter(
          (r) => r.requested_datetime <= endDate
        );
      }
      setRecords(sessionData);
      setMeta({
        page: 1,
        page_size: 15,
        total_items: sessionData.length,
        total_pages: Math.max(1, Math.ceil(sessionData.length / 15)),
        has_next: false,
        has_prev: false,
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedFacility, startDate, endDate]);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const handleClearFilters = () => {
    setSelectedFacility('');
    setStartDate('');
    setEndDate('');
  };

  const handleClearAllHistory = async () => {
    try {
      setClearing(true);
      clearSessionPredictions();
      setRecords([]);
      setMeta({
        page: 1,
        page_size: 15,
        total_items: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      });
      setClearSuccess('Your session forecast checks have been cleared.');
      setTimeout(() => setClearSuccess(null), 4000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setClearing(false);
      setConfirmClearOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white text-zinc-950">
              Recent Session Checks
            </h2>
            <span className="text-xs font-semibold dark:bg-zinc-800 bg-zinc-200 dark:text-zinc-300 text-zinc-700 px-2.5 py-1 rounded-full border dark:border-zinc-700 border-zinc-300">
              This Session
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-base dark:text-zinc-400 text-zinc-600">
            Compare car park occupancy forecasts checked during this session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {meta.total_items > 0 && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              disabled={loading || clearing}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition shadow-sm cursor-pointer"
              title="Clear all stored forecast records"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={() => loadHistory(meta.page)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl glass-panel px-4 py-2.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Activity
          </button>
        </div>
      </div>

      {clearSuccess && (
        <div className="rounded-2xl dark:bg-emerald-950/40 bg-emerald-50 border dark:border-emerald-900/60 border-emerald-200 p-4 text-xs sm:text-sm dark:text-emerald-300 text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-medium">{clearSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={() => loadHistory(meta.page)} />}

      {/* Filter Toolbar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border dark:border-zinc-800/80 border-zinc-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          {/* Facility Filter */}
          <div className="w-full">
            <ModernGarageSelect
              facilities={facilities}
              value={selectedFacility}
              onChange={setSelectedFacility}
              label="Filter by Car Park"
              allowAll={true}
              allOptionLabel={`All Car Parks (${facilities.length || 11})`}
            />
          </div>

          {/* Start Date */}
          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500 mb-1.5">
              From Timestamp
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-zinc-400 text-zinc-500 pointer-events-none" />
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm dark:text-zinc-100 text-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500 mb-1.5">
              To Timestamp
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-zinc-400 text-zinc-500 pointer-events-none" />
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input w-full rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm dark:text-zinc-100 text-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-2">
            {(selectedFacility || startDate || endDate) ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full rounded-2xl glass-panel px-4 py-2.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-600 hover:text-zinc-950 transition text-center cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <div className="hidden lg:block text-xs dark:text-zinc-500 text-zinc-400 py-2">
                Filtering {meta.total_items} forecasts
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-card rounded-3xl shadow-sm border dark:border-zinc-800/80 border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl dark:bg-zinc-800 dark:text-zinc-200 bg-zinc-100 text-zinc-700">
              <History className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-bold dark:text-white text-zinc-900">
              No Forecast Records Found
            </h3>
            <p className="mt-1 text-xs dark:text-zinc-400 text-zinc-500 max-w-sm mx-auto">
              {selectedFacility || startDate || endDate
                ? 'No past forecasts matched the active filters.'
                : 'No forecasts have been generated yet. Use "Forecast Arrival" to check availability.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="border-b dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-900/90 bg-zinc-50 dark:text-zinc-400 text-zinc-600 font-bold uppercase text-[11px] sm:text-xs tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap"># ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Car Park</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Arrival Time</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Expected Load</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Available Spots</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Checked At</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/80 divide-zinc-200">
                {records.map((rec) => {
                  const status =
                    rec.occupancy_percentage < 40
                      ? 'Low'
                      : rec.occupancy_percentage < 75
                      ? 'Moderate'
                      : rec.occupancy_percentage < 90
                      ? 'High'
                      : 'Nearly Full';

                  return (
                    <tr key={rec.id} className="dark:hover:bg-zinc-800/40 hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold dark:text-zinc-500 text-zinc-400 whitespace-nowrap">
                        #{rec.id}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold dark:text-zinc-200 dark:bg-zinc-800 text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg border dark:border-zinc-700 border-zinc-200 text-xs sm:text-sm">
                            {rec.facility?.facility_code || `PF#${rec.facility_id}`}
                          </span>
                          <span className="font-semibold dark:text-zinc-200 text-zinc-800">
                            {rec.facility?.display_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold dark:text-zinc-200 text-zinc-800 font-mono">
                          {formatFacilityDateTime(rec.requested_datetime)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold dark:text-white text-zinc-900 text-sm sm:text-base font-mono">
                            {rec.occupancy_percentage.toFixed(1)}%
                          </span>
                          <StatusBadge status={status} size="sm" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold dark:text-zinc-200 text-zinc-800 text-sm font-mono">
                          {rec.available_spaces} spots
                        </span>{' '}
                        <span className="dark:text-zinc-500 text-zinc-400 text-xs sm:text-sm">
                          / {rec.facility?.reference_capacity || (rec.occupied_spaces + rec.available_spaces)} total
                        </span>
                      </td>
                      <td className="py-3.5 px-4 dark:text-zinc-500 text-zinc-400 whitespace-nowrap font-mono text-xs">
                        {formatDateTime(rec.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between border-t dark:border-zinc-800/80 border-zinc-200 px-5 py-4 glass-panel-subtle text-xs sm:text-sm">
            <span className="dark:text-zinc-400 text-zinc-500">
              Page <strong className="dark:text-zinc-200 text-zinc-800">{meta.page}</strong> of{' '}
              <strong className="dark:text-zinc-200 text-zinc-800">{meta.total_pages}</strong> (
              {meta.total_items} total records)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={!meta.has_prev}
                onClick={() => loadHistory(meta.page - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl glass-panel px-3.5 py-2 font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                disabled={!meta.has_next}
                onClick={() => loadHistory(meta.page + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl glass-panel px-3.5 py-2 font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 disabled:opacity-40 transition"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing Session Checks */}
      <ConfirmationModal
        isOpen={confirmClearOpen}
        title="Clear Session Checks?"
        message="Are you sure you want to clear your forecast checks from this visit? This will reset your session list."
        confirmLabel={clearing ? "Clearing..." : "Yes, Clear Session"}
        isDestructive={true}
        onConfirm={handleClearAllHistory}
        onClose={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};

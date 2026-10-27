import React, { useState, useEffect } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { Facility } from '../types';
import { EditFacilityModal } from '../components/EditFacilityModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ErrorAlert } from '../components/ErrorAlert';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Building2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  Power,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [togglingFacility, setTogglingFacility] = useState<Facility | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFacilities();
      setFacilities(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleEditSuccess = (updated: Facility) => {
    setFacilities((prev) =>
      prev.map((f) => (f.facility_code === updated.facility_code ? updated : f))
    );
    setSuccessToast(`Facility ${updated.facility_code} successfully updated.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleToggleActiveConfirm = async () => {
    if (!togglingFacility) return;
    try {
      const res = await api.updateFacility(togglingFacility.facility_code, {
        is_active: !togglingFacility.is_active,
      });
      handleEditSuccess(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setTogglingFacility(null);
    }
  };

  const filtered = facilities.filter(
    (f) =>
      f.facility_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white text-zinc-950">
            Car Park Management
          </h2>
          <p className="mt-1 text-xs sm:text-base dark:text-zinc-400 text-zinc-600">
            Manage display names and operational status for all 11 monitored car parks.
          </p>
        </div>

        <button
          onClick={loadFacilities}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl glass-panel px-4 py-2.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Car Parks
        </button>
      </div>

      {successToast && (
        <div className="rounded-2xl dark:bg-emerald-950/40 bg-emerald-50 border dark:border-emerald-900/60 border-emerald-200 p-4 text-xs sm:text-sm dark:text-emerald-300 text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={loadFacilities} />}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-zinc-400 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or display name..."
            className="glass-input w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm dark:text-zinc-100 text-zinc-900 focus:outline-none"
          />
        </div>

        <div className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-500">
          Showing <strong className="dark:text-zinc-200 text-zinc-800">{filtered.length}</strong> of{' '}
          <strong className="dark:text-zinc-200 text-zinc-800">{facilities.length}</strong> car parks
        </div>
      </div>

      {/* Facilities Table */}
      <div className="glass-card rounded-3xl shadow-sm border dark:border-zinc-800/80 border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="border-b dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-900/90 bg-zinc-50 font-bold uppercase tracking-wider text-[11px] sm:text-xs dark:text-zinc-400 text-zinc-600">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Display Name</th>
                  <th className="py-3.5 px-4">Total Spots</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source UUID</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/80 divide-zinc-200">
                {filtered.map((fac) => (
                  <tr key={fac.id} className="dark:hover:bg-zinc-800/40 hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold dark:text-white text-zinc-900">
                      <span className="rounded-lg border dark:border-zinc-700 border-zinc-200 dark:bg-zinc-800 bg-zinc-100 px-2.5 py-1 text-xs sm:text-sm dark:text-zinc-200 text-zinc-800">
                        {fac.facility_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold dark:text-zinc-200 text-zinc-900">
                      {fac.display_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold dark:text-white text-zinc-900 text-xs sm:text-sm">{fac.reference_capacity}</span>{' '}
                      <span className="dark:text-zinc-500 text-zinc-400 text-xs">spots</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {fac.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full dark:bg-zinc-800 bg-zinc-100 px-3 py-1 text-xs font-semibold dark:text-emerald-400 text-emerald-700 border dark:border-zinc-700 border-zinc-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full dark:bg-zinc-800 bg-zinc-100 px-3 py-1 text-xs font-semibold dark:text-zinc-400 text-zinc-500 border dark:border-zinc-700 border-zinc-200">
                          <XCircle className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs dark:text-zinc-500 text-zinc-400 max-w-[160px] truncate">
                      {fac.source_uuid}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingFacility(fac)}
                          className="inline-flex items-center gap-1.5 rounded-xl glass-panel px-3 py-1.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 transition"
                          title="Edit Display Name"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setTogglingFacility(fac)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${
                            fac.is_active
                              ? 'dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                          title={fac.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {fac.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditFacilityModal
        facility={editingFacility}
        isOpen={!!editingFacility}
        onClose={() => setEditingFacility(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Confirmation Modal for Activation/Deactivation */}
      <ConfirmationModal
        isOpen={!!togglingFacility}
        title={togglingFacility?.is_active ? 'Deactivate Facility?' : 'Activate Facility?'}
        message={`Are you sure you want to ${
          togglingFacility?.is_active ? 'deactivate' : 'activate'
        } facility "${togglingFacility?.display_name}" (${togglingFacility?.facility_code})? ${
          togglingFacility?.is_active
            ? 'Inactive facilities will be blocked from future prediction requests until reactivated.'
            : 'Activated facilities will immediately be available for predictions.'
        }`}
        confirmLabel={togglingFacility?.is_active ? 'Deactivate' : 'Activate'}
        isDestructive={togglingFacility?.is_active}
        onConfirm={handleToggleActiveConfirm}
        onClose={() => setTogglingFacility(null)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Facility } from '../types';
import { api, extractErrorMessage } from '../api/client';
import { X, Lock, CheckCircle2 } from 'lucide-react';

interface EditFacilityModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedFacility: Facility) => void;
}

export const EditFacilityModal: React.FC<EditFacilityModalProps> = ({
  facility,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !facility) return null;

  const [displayName, setDisplayName] = useState(facility.display_name);
  const [isActive, setIsActive] = useState(facility.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Display name cannot exceed 100 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.updateFacility(facility.facility_code, {
        display_name: trimmed,
        is_active: isActive,
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border dark:border-zinc-800/80 border-zinc-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b dark:border-zinc-800/80 border-zinc-200 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black dark:text-white text-zinc-950">
              Edit Car Park Name
            </h3>
            <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 mt-0.5">
              Update the display name for this car park
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 dark:text-zinc-400 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl dark:bg-rose-950/40 bg-rose-50 border dark:border-rose-900/60 border-rose-200 p-3.5 text-xs sm:text-sm dark:text-rose-300 text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Read-only system identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl dark:bg-zinc-900/70 bg-zinc-100/70 p-4 border dark:border-zinc-800/80 border-zinc-200 text-xs sm:text-sm">
            <div>
              <span className="flex items-center gap-1.5 font-medium dark:text-zinc-400 text-zinc-500">
                <Lock className="h-3.5 w-3.5 dark:text-zinc-500 text-zinc-400" /> Car Park Code:
              </span>
              <p className="font-mono font-bold dark:text-zinc-100 text-zinc-800 mt-1 text-sm">
                {facility.facility_code}
              </p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 font-medium dark:text-zinc-400 text-zinc-500">
                <Lock className="h-3.5 w-3.5 dark:text-zinc-500 text-zinc-400" /> Total Spots:
              </span>
              <p className="font-bold dark:text-zinc-100 text-zinc-800 mt-1 text-sm">
                {facility.reference_capacity} spots
              </p>
            </div>
            <div className="sm:col-span-2 pt-2 border-t dark:border-zinc-800/80 border-zinc-200">
              <span className="flex items-center gap-1.5 font-medium dark:text-zinc-400 text-zinc-500">
                <Lock className="h-3.5 w-3.5 dark:text-zinc-500 text-zinc-400" /> Source UUID:
              </span>
              <p className="font-mono text-xs dark:text-zinc-400 text-zinc-600 truncate mt-1">
                {facility.source_uuid}
              </p>
            </div>
          </div>

          {/* Editable Display Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold dark:text-zinc-300 text-zinc-700 mb-1.5">
              Car Park Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              required
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm sm:text-base dark:text-zinc-100 text-zinc-900 focus:outline-none"
              placeholder="e.g. Scheveningen Bad Car Park"
            />
            <p className="mt-1 text-xs dark:text-zinc-400 text-zinc-500">
              Maximum 100 characters.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveCheckbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded dark:border-zinc-700 border-zinc-300 text-zinc-900 dark:text-white focus:ring-zinc-500"
            />
            <label htmlFor="isActiveCheckbox" className="text-xs sm:text-sm font-medium dark:text-zinc-300 text-zinc-700 cursor-pointer">
              Facility is active for forecasting
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t dark:border-zinc-800/80 border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto rounded-xl border dark:border-zinc-700 border-zinc-300 px-5 py-2.5 text-xs sm:text-sm font-semibold dark:text-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-2.5 text-xs sm:text-sm font-bold shadow transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

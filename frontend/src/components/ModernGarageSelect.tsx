import React, { useState, useRef, useEffect } from 'react';
import { Facility } from '../types';
import { Building2, ChevronDown, Check, Search, ShieldCheck } from 'lucide-react';

interface ModernGarageSelectProps {
  facilities: Facility[];
  value: string;
  onChange: (facilityCode: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  allowAll?: boolean;
  allOptionLabel?: string;
}

export const ModernGarageSelect: React.FC<ModernGarageSelectProps> = ({
  facilities,
  value,
  onChange,
  disabled = false,
  label = 'Car Park',
  placeholder = 'Select a car park...',
  allowAll = false,
  allOptionLabel = 'All Car Parks',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedFacility = facilities.find((f) => f.facility_code === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredFacilities = facilities.filter((f) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.facility_code.toLowerCase().includes(query) ||
      f.display_name.toLowerCase().includes(query) ||
      String(f.reference_capacity).includes(query)
    );
  });

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 relative ${isOpen ? 'z-[60]' : 'z-20'}`}>
      {/* Label Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="font-semibold dark:text-zinc-300 text-zinc-700">
          {label}
        </label>
        <span className="text-[11px] sm:text-xs font-mono dark:text-zinc-500 text-zinc-400">
          {facilities.length} Car Parks
        </span>
      </div>

      {/* Main Interactive Trigger with Bouncing Spring Hover */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full glass-panel rounded-2xl p-3 sm:p-3.5 border text-left transition-all select-none bounce-hover group ${
          isOpen
            ? 'dark:border-emerald-500 border-emerald-600 ring-2 dark:ring-emerald-500/20 ring-emerald-600/15 shadow-lg'
            : 'dark:border-sky-500/15 border-slate-200 hover:border-emerald-500/50'
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Icon Avatar Badge */}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl dark:bg-emerald-500/15 dark:border dark:border-emerald-500/30 dark:text-emerald-300 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg] shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              {selectedFacility ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black dark:text-emerald-300 text-emerald-800 dark:bg-emerald-950/40 bg-emerald-100 px-2 py-0.5 rounded-md border dark:border-emerald-800/60 border-emerald-200">
                      {selectedFacility.facility_code}
                    </span>
                    <span className="text-[11px] sm:text-xs dark:text-slate-400 text-slate-500 font-mono">
                      {selectedFacility.reference_capacity} spots
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-bold dark:text-white text-slate-900 truncate mt-0.5">
                    {selectedFacility.display_name}
                  </div>
                </>
              ) : allowAll && !value ? (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    Filter Selection
                  </div>
                  <div className="text-sm sm:text-base font-bold dark:text-white text-slate-900 truncate mt-0.5">
                    {allOptionLabel}
                  </div>
                </>
              ) : (
                <div className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 font-medium">
                  {placeholder}
                </div>
              )}
            </div>
          </div>

          {/* Right Chevron with Rotation Indicator */}
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl dark:bg-slate-800/80 bg-slate-100 flex items-center justify-center dark:text-slate-300 text-slate-600 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-slate-700 transition">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
      </button>

      {/* Bouncy Pop-Up Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 sm:p-2.5 dark:bg-slate-900 bg-white rounded-3xl shadow-2xl border dark:border-sky-500/20 border-slate-200 z-[80] bounce-pop-in space-y-2 max-h-80 overflow-y-auto">
          {/* Quick Search Input */}
          <div className="relative p-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 dark:text-slate-400 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search car park or code..."
              className="w-full rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-200 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
            {/* Optional "All Car Parks" item */}
            {allowAll && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition select-none bounce-item-hover ${
                  !value
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-sm'
                    : 'dark:text-slate-200 text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-semibold">{allOptionLabel}</span>
                </div>
                {!value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            )}

            {filteredFacilities.length === 0 ? (
              <div className="py-6 text-center text-xs dark:text-slate-400 text-slate-500">
                No matching car parks found.
              </div>
            ) : (
              filteredFacilities.map((fac) => {
                const isSelected = fac.facility_code === value;
                return (
                  <button
                    key={fac.facility_code}
                    type="button"
                    onClick={() => handleSelect(fac.facility_code)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-left transition select-none bounce-item-hover group cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-bold'
                        : 'dark:text-slate-200 text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Facility Code Pill */}
                      <span
                        className={`font-mono text-xs font-black px-2 py-0.5 rounded-md border shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isSelected
                            ? 'bg-slate-950/20 text-slate-950 border-slate-950/20'
                            : 'dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {fac.facility_code}
                      </span>

                      {/* Name and Details */}
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold truncate">
                          {fac.display_name}
                        </div>
                        <div
                          className={`text-[11px] font-mono mt-0.5 ${
                            isSelected
                              ? 'text-slate-800'
                              : 'dark:text-slate-400 text-slate-500'
                          }`}
                        >
                          {fac.reference_capacity} total spots
                        </div>
                      </div>
                    </div>

                    {/* Checkmark indicator for selected item */}
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0 ml-2 shadow-sm">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

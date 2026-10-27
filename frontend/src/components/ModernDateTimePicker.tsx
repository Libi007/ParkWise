import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Sparkles,
  X,
} from 'lucide-react';

interface ModernDateTimePickerProps {
  value: string; // Format: YYYY-MM-DDTHH:mm
  onChange: (newValue: string) => void;
  disabled?: boolean;
  label?: string;
}

export const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Target Arrival Date & Time',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date object from value
  const parseCurrent = (): Date => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const currentDate = parseCurrent();

  // Calendar month viewing state
  const [viewYear, setViewYear] = useState<number>(currentDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(currentDate.getMonth()); // 0-indexed

  // Sync view state when value changes from outside
  useEffect(() => {
    setViewYear(currentDate.getFullYear());
    setViewMonth(currentDate.getMonth());
  }, [value]);

  // Close dropdown when clicking outside
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

  const formatToLocalIso = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const isToday = (d: Date): boolean => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isTomorrow = (d: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  };

  // Quick Preset Actions
  const handleQuickPreset = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    onChange(formatToLocalIso(d));
  };

  const handleSelectDayOffset = (daysAhead: number) => {
    const d = new Date(currentDate);
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    d.setFullYear(target.getFullYear());
    d.setMonth(target.getMonth());
    d.setDate(target.getDate());
    onChange(formatToLocalIso(d));
  };

  const handleSelectExactDate = (day: number) => {
    const d = new Date(currentDate);
    d.setFullYear(viewYear);
    d.setMonth(viewMonth);
    d.setDate(day);
    onChange(formatToLocalIso(d));
  };

  const selectedHour = currentDate.getHours();
  const selectedMinute = currentDate.getMinutes();
  const isPM = selectedHour >= 12;
  const currentPeriod: 'AM' | 'PM' = isPM ? 'PM' : 'AM';
  const current12Hour = selectedHour % 12 === 0 ? 12 : selectedHour % 12;

  const handleTogglePeriod = (period: 'AM' | 'PM') => {
    if (period === currentPeriod) return;
    const d = new Date(currentDate);
    if (period === 'PM' && selectedHour < 12) {
      d.setHours(selectedHour + 12);
    } else if (period === 'AM' && selectedHour >= 12) {
      d.setHours(selectedHour - 12);
    }
    onChange(formatToLocalIso(d));
  };

  const handleSelect12Hour = (h12: number) => {
    const d = new Date(currentDate);
    let newHour: number;
    if (currentPeriod === 'PM') {
      newHour = h12 === 12 ? 12 : h12 + 12;
    } else {
      newHour = h12 === 12 ? 0 : h12;
    }
    d.setHours(newHour);
    onChange(formatToLocalIso(d));
  };

  const handleSelectMinute = (minute: number) => {
    const d = new Date(currentDate);
    d.setMinutes(minute);
    onChange(formatToLocalIso(d));
  };

  // Calendar calculations (Sunday to Saturday: 0 = Sun, 6 = Sat)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const startOffset = firstDayOfMonth;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Arrival Period classification (Traffic Context)
  const getTrafficContext = (d: Date) => {
    const h = d.getHours();
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      if (h >= 11 && h <= 18) return 'Weekend Scheveningen Flow';
      return 'Weekend Normal';
    }
    if (h >= 7 && h <= 9) return 'Morning Commute Rush';
    if (h >= 12 && h <= 14) return 'Midday City Traffic';
    if (h >= 16 && h <= 19) return 'Evening Peak Hours';
    if (h >= 22 || h <= 6) return 'Off-Peak Night';
    return 'Regular Flow';
  };

  const formattedDateString = currentDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTimeString = currentDate.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const quickDays = [
    { label: 'Today', offset: 0, active: isToday(currentDate) },
    { label: 'Tomorrow', offset: 1, active: isTomorrow(currentDate) },
    { label: '+2 Days', offset: 2, active: false },
    { label: '+3 Days', offset: 3, active: false },
  ];

  return (
    <div ref={containerRef} className={`w-full space-y-2 relative ${isOpen ? 'z-50' : 'z-20'}`}>
      {/* Label Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="font-semibold dark:text-zinc-300 text-zinc-700">
          {label}
        </label>
      </div>

      {/* Main Interactive Display Surface with Bouncing Spring Hover */}
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
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          {/* Date Segment */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl dark:bg-emerald-500/15 dark:border dark:border-emerald-500/30 dark:text-emerald-300 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg] shadow-sm">
              <CalendarIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                {isToday(currentDate) ? 'Today' : isTomorrow(currentDate) ? 'Tomorrow' : 'Target Date'}
              </div>
              <div className="text-sm sm:text-base font-bold dark:text-white text-slate-900 font-mono truncate">
                {formattedDateString}
              </div>
            </div>
          </div>

          {/* Time Segment */}
          <div className="flex items-center gap-2.5 sm:gap-3 pr-1 shrink-0 ml-auto sm:ml-0">
            <div className="text-right">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Arrival Time
              </div>
              <div className="text-sm sm:text-base font-black dark:text-white text-slate-900 font-mono">
                {formattedTimeString}
              </div>
            </div>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl dark:bg-slate-800/80 bg-slate-100 flex items-center justify-center dark:text-slate-300 text-slate-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]">
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
        </div>

        {/* Traffic Context Tag */}
        <div className="mt-3 pt-2.5 border-t dark:border-slate-800/60 border-slate-200/80 flex items-center justify-between text-xs sm:text-sm gap-2">
          <span className="dark:text-slate-400 text-slate-500 shrink-0">Traffic:</span>
          <span className="font-semibold dark:text-slate-300 text-slate-800 flex items-center gap-1.5 truncate text-right">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{getTrafficContext(currentDate)}</span>
          </span>
        </div>
      </button>

      {/* Structured 2-Row Quick Presets (Day row & Time row) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500 shrink-0 w-10">
            Day:
          </span>
          {quickDays.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectDayOffset(chip.offset)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer hover:scale-105 active:scale-95 ${
                chip.active
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'glass-panel dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500 shrink-0 w-10">
            Time:
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleQuickPreset(0)}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap glass-panel dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            Now
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleQuickPreset(2)}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap glass-panel dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            +2h
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(12, 0, 0, 0);
              onChange(formatToLocalIso(d));
            }}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap glass-panel dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            12:00 PM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(18, 0, 0, 0);
              onChange(formatToLocalIso(d));
            }}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap glass-panel dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            6:00 PM
          </button>
        </div>
      </div>

      {/* Modern Popover / Flyout Picker - Solid Opaque High-Z Surface with Bounce Pop-In */}
      {isOpen && (
        <div className="absolute z-[80] top-full left-0 right-0 mt-2 p-4 sm:p-5 dark:bg-slate-900 bg-white rounded-3xl shadow-2xl border dark:border-sky-500/20 border-slate-200 bounce-pop-in max-h-[min(82vh,520px)] overflow-y-auto space-y-3.5 sm:space-y-4">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 border-slate-200">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 dark:text-emerald-400 text-emerald-600" />
              <span className="text-sm font-bold dark:text-white text-slate-900">Target Arrival</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 dark:text-slate-400 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Close picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Modern Mini Calendar Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold dark:text-white text-slate-900 font-mono">
                  {monthNames[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg glass-panel-subtle dark:hover:text-emerald-400 text-slate-400 hover:text-slate-900 transition hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg glass-panel-subtle dark:hover:text-emerald-400 text-slate-400 hover:text-slate-900 transition hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day Labels (Sunday to Saturday) */}
              <div className="grid grid-cols-7 text-center text-xs font-mono font-semibold dark:text-slate-500 text-slate-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty offset padding */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-full aspect-square" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1;
                  const isSelectedDay =
                    currentDate.getDate() === dayNumber &&
                    currentDate.getMonth() === viewMonth &&
                    currentDate.getFullYear() === viewYear;

                  const isCurrentDay =
                    new Date().getDate() === dayNumber &&
                    new Date().getMonth() === viewMonth &&
                    new Date().getFullYear() === viewYear;

                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      onClick={() => handleSelectExactDate(dayNumber)}
                      className={`w-full max-w-[34px] sm:max-w-[38px] aspect-square mx-auto rounded-lg text-xs sm:text-sm font-mono font-semibold flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                        isSelectedDay
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                          : isCurrentDay
                          ? 'border dark:border-emerald-500/60 border-emerald-500 dark:text-emerald-300 text-emerald-700 hover:dark:bg-slate-800 hover:bg-slate-100'
                          : 'dark:text-slate-300 dark:hover:bg-slate-800 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Modern Precision Time Selector (12-Hour with AM/PM) */}
            <div className="space-y-3.5 md:border-l md:dark:border-slate-800 md:border-slate-200 md:pl-4">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs sm:text-sm font-bold dark:text-white text-slate-900">
                    Hour
                  </span>

                  {/* AM / PM Segmented Switch */}
                  <div className="inline-flex rounded-xl p-0.5 dark:bg-slate-800 bg-slate-200 text-xs font-bold shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleTogglePeriod('AM')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'AM'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-black'
                          : 'dark:text-slate-400 text-slate-600 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePeriod('PM')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'PM'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-black'
                          : 'dark:text-slate-400 text-slate-600 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* 12-Hour Grid */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                    const isHourSelected = current12Hour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelect12Hour(h)}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                          isHourSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                            : 'dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute selection (15-min intervals) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-bold dark:text-white text-slate-900">
                    Minute
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold dark:text-emerald-400 text-emerald-700">
                    :{String(selectedMinute).padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 15, 30, 45].map((m) => {
                    const isMinSelected = Math.abs(selectedMinute - m) < 8;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                          isMinSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                            : 'dark:bg-slate-800/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        :{String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Time Preview & Done Button */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t dark:border-slate-800 border-slate-200">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="dark:text-slate-400 text-slate-500 font-medium">Time:</span>
                  <span className="font-mono font-black dark:text-emerald-400 text-emerald-700 text-xs sm:text-sm">
                    {formattedTimeString}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-black shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

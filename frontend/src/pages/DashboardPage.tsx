import React, { useState, useEffect, useRef } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { Facility, PaginationMeta, PredictionRecord, PredictionResponse } from '../types';
import { PredictionResultCard } from '../components/PredictionResultCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { StatusBadge } from '../components/StatusBadge';
import { ModernDateTimePicker } from '../components/ModernDateTimePicker';
import { ModernGarageSelect } from '../components/ModernGarageSelect';
import {
  Building2,
  TrendingUp,
  History,
  Calendar,
  Sparkles,
  Search,
  Car,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatDateTime, formatFacilityDateTime } from '../utils/formatters';
import {
  getSessionPredictions,
  saveSessionPrediction,
  clearSessionPredictions,
} from '../utils/sessionHistory';

interface TooltipPayloadItem {
  payload: {
    name: string;
    fullName: string;
    occupancy: number;
    occupied: number;
    available: number;
    capacity: number;
    status: string;
    cellColor: string;
    time: string;
  };
}

const ChartCustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card rounded-2xl p-3 sm:p-4 border dark:border-slate-700 border-slate-300 dark:bg-slate-950/95 bg-white/95 shadow-2xl text-xs space-y-1.5 min-w-[210px] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b dark:border-slate-800 border-slate-200 pb-2">
          <span className="font-mono font-bold dark:text-emerald-300 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border dark:border-emerald-800/60 border-emerald-200 text-xs">
            {data.name}
          </span>
          <StatusBadge status={data.status} size="sm" />
        </div>
        <p className="font-bold dark:text-white text-slate-950 text-xs truncate">
          {data.fullName}
        </p>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="dark:text-slate-400 text-slate-500 font-medium">Expected Load:</span>
          <span className="font-mono font-black text-sm" style={{ color: data.cellColor }}>
            {data.occupancy.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="dark:text-slate-400 text-slate-500">Available Spots:</span>
          <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">
            {data.available} / {data.capacity} spots
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1 border-t dark:border-slate-800/60 border-slate-200/60">
          <span className="dark:text-slate-400 text-slate-500">Arrival:</span>
          <span className="font-mono font-semibold dark:text-slate-300 text-slate-700">
            {formatFacilityDateTime(data.time)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityCode, setSelectedFacilityCode] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');
  const [sessionPredictions, setSessionPredictions] = useState<PredictionRecord[]>(() => getSessionPredictions());
  const [latestPrediction, setLatestPrediction] = useState<PredictionResponse | null>(null);

  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFacility, setSearchFacility] = useState<string>('');

  // Section highlight effect states
  const [highlightForecast, setHighlightForecast] = useState(false);
  const [highlightHistory, setHighlightHistory] = useState(false);
  const [highlightGarages, setHighlightGarages] = useState(false);

  const forecastSectionRef = useRef<HTMLDivElement>(null);
  const historySectionRef = useRef<HTMLDivElement>(null);
  const garagesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSelectedDateTime(localIso);
  }, []);

  const fetchFacilities = async () => {
    try {
      setError(null);
      setLoadingFacilities(true);
      const facRes = await api.getFacilities();
      setFacilities(facRes.data);
      if (facRes.data.length > 0 && !selectedFacilityCode) {
        setSelectedFacilityCode(facRes.data[0].facility_code);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const selectedFacility = facilities.find(
    (f) => f.facility_code === selectedFacilityCode
  );

  const scrollToForecast = () => {
    forecastSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightForecast(true);
    setTimeout(() => setHighlightForecast(false), 2000);
  };

  const scrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightHistory(true);
    setTimeout(() => setHighlightHistory(false), 2000);
  };

  const scrollToGarages = () => {
    garagesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightGarages(true);
    setTimeout(() => setHighlightGarages(false), 2000);
  };

  const handleSelectFacilityAndFlow = (facilityCode: string) => {
    setSelectedFacilityCode(facilityCode);
    scrollToForecast();
  };

  const handlePresetTime = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSelectedDateTime(localIso);
  };

  const handleQuickPredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityCode || !selectedDateTime) return;

    try {
      setPredicting(true);
      setError(null);
      const res = await api.createPrediction({
        facility_code: selectedFacilityCode,
        datetime: selectedDateTime,
      });
      setLatestPrediction(res.data);
      const updated = saveSessionPrediction(res.data, selectedFacility);
      setSessionPredictions(updated);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById('prediction-result-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPredicting(false);
    }
  };

  const handleClearSession = () => {
    clearSessionPredictions();
    setSessionPredictions([]);
  };

  const activeFacilitiesCount = facilities.filter((f) => f.is_active).length;
  const totalCapacity = facilities.reduce(
    (acc, f) => acc + (f.is_active ? f.reference_capacity : 0),
    0
  );

  const filteredFacilities = facilities.filter(
    (f) =>
      f.display_name.toLowerCase().includes(searchFacility.toLowerCase()) ||
      f.facility_code.toLowerCase().includes(searchFacility.toLowerCase())
  );

  const chartData = sessionPredictions.slice(0, 8).map((rec) => {
    const status =
      rec.occupancy_percentage < 40
        ? 'Low'
        : rec.occupancy_percentage < 75
        ? 'Moderate'
        : rec.occupancy_percentage < 90
        ? 'High'
        : 'Nearly Full';

    const cellColor =
      rec.occupancy_percentage < 40
        ? '#10b981'
        : rec.occupancy_percentage < 75
        ? '#f59e0b'
        : rec.occupancy_percentage < 90
        ? '#f97316'
        : '#ef4444';

    return {
      name: rec.facility?.facility_code || `PF#${rec.facility_id}`,
      fullName: rec.facility?.display_name || 'Car Park',
      occupancy: rec.occupancy_percentage,
      occupied: rec.occupied_spaces,
      available: rec.available_spaces,
      capacity: rec.facility?.reference_capacity || (rec.occupied_spaces + rec.available_spaces),
      status,
      cellColor,
      time: rec.requested_datetime,
    };
  });

  const avgOccupancy =
    sessionPredictions.length > 0
      ? sessionPredictions.reduce((sum, r) => sum + r.occupancy_percentage, 0) / sessionPredictions.length
      : 0;

  const bestPick =
    sessionPredictions.length > 1
      ? [...sessionPredictions].reduce((best, curr) =>
          curr.occupancy_percentage < best.occupancy_percentage ? curr : best
        )
      : null;

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* 1. ParkWise Hero Banner */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border dark:border-sky-500/15 border-slate-200">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full glass-pill px-3 py-1 text-xs sm:text-sm font-semibold dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-50 text-emerald-800 border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            The Hague · Live Car Park Availability
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight dark:text-white text-slate-900">
            Car Park Availability & Occupancy
          </h1>
          <p className="text-sm sm:text-base dark:text-slate-300 text-slate-600 leading-relaxed">
            Live occupancy and arrival forecasting for 11 car parks across The Hague and Scheveningen.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => { fetchFacilities(); }} />}

      {/* 2. Bento Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Tile 1: Forecast Arrival */}
        <button
          onClick={scrollToForecast}
          className="bento-tile rounded-2xl p-4 sm:p-5 text-left group flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/30 bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 dark:group-hover:text-emerald-400 transition-colors">
              Forecast Arrival
            </h3>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
              Forecast spot availability and occupancy for your arrival.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t dark:border-sky-500/10 border-slate-200 flex items-center justify-between text-xs sm:text-sm font-semibold dark:text-emerald-400 text-emerald-700 group-hover:translate-x-0.5 transition">
            <span>Check Availability</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 2: Browse Car Parks */}
        <button
          onClick={scrollToGarages}
          className="bento-tile rounded-2xl p-4 sm:p-5 text-left group flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl dark:bg-cyan-500/15 dark:text-cyan-300 dark:border dark:border-cyan-500/30 bg-cyan-50 text-cyan-700 border border-cyan-200">
                <Building2 className="h-4.5 w-4.5" />
              </span>
              <span className="text-xs font-mono dark:text-cyan-400 text-cyan-700 font-semibold dark:bg-cyan-500/10 bg-cyan-50 px-2 py-0.5 rounded-md border dark:border-cyan-500/20 border-cyan-200">
                {activeFacilitiesCount || 11} Car Parks
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 dark:group-hover:text-cyan-400 transition-colors">
              Car Parks
            </h3>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
              {totalCapacity ? totalCapacity.toLocaleString() : '1,746'} monitored spots across the city.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t dark:border-sky-500/10 border-slate-200 flex items-center justify-between text-xs sm:text-sm font-semibold dark:text-cyan-400 text-cyan-700 group-hover:translate-x-0.5 transition">
            <span>View Car Parks</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 3: Recent Checks */}
        <button
          onClick={scrollToHistory}
          className="bento-tile rounded-2xl p-4 sm:p-5 text-left group flex flex-col justify-between sm:col-span-2 md:col-span-1 cursor-pointer"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl dark:bg-indigo-500/15 dark:text-indigo-300 dark:border dark:border-indigo-500/30 bg-indigo-50 text-indigo-700 border border-indigo-200">
                <History className="h-4.5 w-4.5" />
              </span>
              <span className="text-xs font-mono dark:text-indigo-400 text-indigo-700 font-semibold dark:bg-indigo-500/10 bg-indigo-50 px-2 py-0.5 rounded-md border dark:border-indigo-500/20 border-indigo-200">
                {sessionPredictions.length} Checked
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 dark:group-hover:text-indigo-400 transition-colors">
              Recent Checks
            </h3>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
              Compare car parks checked during this session.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t dark:border-sky-500/10 border-slate-200 flex items-center justify-between text-xs sm:text-sm font-semibold dark:text-indigo-400 text-indigo-700 group-hover:translate-x-0.5 transition">
            <span>Compare Car Parks</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* 3. PRIORITY #1: Forecast Generator & Live Results */}
      <div
        id="forecast-section"
        ref={forecastSectionRef}
        className={`relative z-30 transition-all duration-300 ${
          highlightForecast ? 'section-highlight ring-2 ring-emerald-400 dark:ring-emerald-400 rounded-3xl p-1' : ''
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Prediction Input Form */}
          <div className="lg:col-span-5 glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm relative z-30 border dark:border-sky-500/15 border-slate-200">
            <div className="border-b dark:border-slate-800/80 border-slate-200 pb-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900">
                Forecast Occupancy
              </h2>
              <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-1">
                Select a car park and target arrival time
              </p>
            </div>

            <form onSubmit={handleQuickPredict} className="space-y-4">
              <ModernGarageSelect
                facilities={facilities}
                value={selectedFacilityCode}
                onChange={setSelectedFacilityCode}
                disabled={loadingFacilities || predicting}
                label="Car Park"
              />

              <ModernDateTimePicker
                value={selectedDateTime}
                onChange={setSelectedDateTime}
                disabled={predicting}
                label="Target Arrival Date & Time"
              />

              <button
                type="submit"
                disabled={predicting || !selectedFacilityCode}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 text-slate-950 px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {predicting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Calculating Availability...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Check Availability
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Prediction Result Card */}
          <div id="prediction-result-container" className="lg:col-span-7 scroll-mt-20">
            {latestPrediction ? (
              <PredictionResultCard prediction={latestPrediction} />
            ) : (
              <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center shadow-sm border dark:border-sky-500/15 border-slate-200">
                <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl dark:bg-emerald-500/15 dark:border dark:border-emerald-500/30 dark:text-emerald-400 bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-inner">
                  <Car className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-bold dark:text-white text-slate-900">
                  Ready to Forecast
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm dark:text-slate-400 text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Select a car park and arrival time on the left to check expected spot availability.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PRIORITY #2: Public Car Parks Directory */}
      <div
        id="garages-section"
        ref={garagesSectionRef}
        className={`relative z-20 glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm transition-all duration-300 border dark:border-sky-500/15 border-slate-200 ${
          highlightGarages ? 'section-highlight ring-2 ring-cyan-400 dark:ring-cyan-400' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b dark:border-slate-800/80 border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              Car Parks
            </h2>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-0.5">
              Select a car park to forecast availability or view capacity
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFacility}
              onChange={(e) => setSearchFacility(e.target.value)}
              placeholder="Search car park name or code..."
              className="glass-input w-full rounded-2xl pl-10 pr-3.5 py-2 text-xs sm:text-sm placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loadingFacilities ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : filteredFacilities.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 text-xs sm:text-sm">
              No car parks match your search.
            </div>
          ) : (
            filteredFacilities.map((fac) => {
              const isSelected = fac.facility_code === selectedFacilityCode;
              return (
                <div
                  key={fac.facility_code}
                  className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all ${
                    isSelected
                      ? 'dark:border-emerald-500 border-emerald-600 ring-2 dark:ring-emerald-500/30 ring-emerald-600/20 dark:bg-emerald-950/20 bg-emerald-50/60'
                      : 'dark:border-slate-800/80 border-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="inline-block rounded-lg dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-mono text-xs font-bold mb-1.5">
                        {fac.facility_code}
                      </span>
                      <h4 className="font-bold dark:text-white text-slate-900 text-sm sm:text-base truncate" title={fac.display_name}>
                        {fac.display_name}
                      </h4>
                    </div>
                    <span className="shrink-0 text-xs sm:text-sm font-mono font-semibold dark:text-slate-400 text-slate-600 whitespace-nowrap">
                      {fac.reference_capacity} spots
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectFacilityAndFlow(fac.facility_code)}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-emerald-500 dark:hover:text-slate-950 bg-slate-100 text-slate-800 hover:bg-emerald-600 hover:text-white border dark:border-slate-700/80 border-slate-200 hover:border-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.99] cursor-pointer"
                  >
                    <span>Forecast</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. PRIORITY #3: Recent Checks (This Session) */}
      <div
        id="history-section"
        ref={historySectionRef}
        className={`relative z-10 glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm transition-all duration-300 border dark:border-sky-500/15 border-slate-200 ${
          highlightHistory ? 'section-highlight ring-2 ring-sky-400 dark:ring-sky-400' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-slate-800/80 border-slate-200 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl dark:bg-sky-500/15 dark:border dark:border-sky-500/30 dark:text-sky-300 bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-inner">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight dark:text-white text-slate-900">
                  Recent Checks
                </h2>
                <span className="text-[11px] font-semibold dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  This Session
                </span>
              </div>
              <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-0.5">
                Compare car park occupancy checked during this session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {sessionPredictions.length > 0 && (
              <button
                onClick={handleClearSession}
                className="inline-flex items-center gap-1.5 rounded-xl glass-panel px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition shrink-0 cursor-pointer"
                title="Clear checks made during this session"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Checks</span>
              </button>
            )}
          </div>
        </div>

        {sessionPredictions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl dark:bg-slate-800 dark:text-slate-300 bg-slate-100 text-slate-600 shadow-inner">
              <Car className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold dark:text-white text-slate-900">
              No Checks Yet
            </h3>
            <p className="mt-1 text-xs sm:text-sm dark:text-slate-400 text-slate-500 max-w-md mx-auto leading-relaxed">
              Select a car park and target arrival time above to forecast occupancy.
            </p>
            <button
              onClick={scrollToForecast}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition active:scale-[0.98] cursor-pointer"
            >
              <span>Check Car Park Availability</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Chart Summary Metric Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl dark:bg-slate-800/90 bg-slate-100 dark:text-slate-300 text-slate-700 px-3.5 py-1.5 text-xs font-semibold border dark:border-slate-700/80 border-slate-200 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Avg Expected Load: <strong className="font-mono text-xs sm:text-sm font-bold dark:text-white text-slate-950">{avgOccupancy.toFixed(1)}%</strong>
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl dark:bg-slate-800/90 bg-slate-100 dark:text-slate-300 text-slate-700 px-3.5 py-1.5 text-xs font-semibold border dark:border-slate-700/80 border-slate-200 shadow-sm">
                  Checked Car Parks: <strong className="font-mono text-xs sm:text-sm font-bold dark:text-white text-slate-950">{sessionPredictions.length}</strong>
                </span>

                {bestPick && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Best Availability: <strong className="font-mono font-bold">{bestPick.facility?.facility_code} ({bestPick.occupancy_percentage.toFixed(0)}% load)</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Modern Bar Chart Container */}
            <div className="p-4 sm:p-6 rounded-3xl glass-panel border dark:border-sky-500/15 border-slate-200 shadow-sm dark:bg-slate-900/40 bg-slate-50/60">
              <div className="h-48 sm:h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" strokeOpacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#38bdf8', opacity: 0.2 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      unit="%"
                      axisLine={{ stroke: '#38bdf8', opacity: 0.2 }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartCustomTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }} />
                    <Bar dataKey="occupancy" radius={[8, 8, 2, 2]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.cellColor}
                          className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modern History Telemetry Table */}
            <div className="overflow-hidden rounded-3xl border dark:border-sky-500/15 border-slate-200 shadow-sm glass-panel">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b dark:border-slate-800/80 border-slate-200 dark:bg-slate-900/90 bg-slate-100/90 font-bold uppercase tracking-wider text-[11px] sm:text-xs dark:text-slate-400 text-slate-600">
                      <th className="py-3.5 px-4 whitespace-nowrap">Car Park</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Arrival Time</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Expected Load</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Available Spots</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Checked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800/80 divide-slate-200/80">
                    {sessionPredictions.map((rec) => {
                      const status =
                        rec.occupancy_percentage < 40
                          ? 'Low'
                          : rec.occupancy_percentage < 75
                          ? 'Moderate'
                          : rec.occupancy_percentage < 90
                          ? 'High'
                          : 'Nearly Full';

                      return (
                        <tr
                          key={rec.id}
                          className="dark:hover:bg-slate-800/40 hover:bg-slate-100/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold dark:text-emerald-300 text-emerald-800 dark:bg-emerald-500/15 bg-emerald-50 px-2.5 py-1 rounded-lg border dark:border-emerald-500/30 border-emerald-200 text-xs sm:text-sm shadow-sm">
                                {rec.facility?.facility_code || `PF#${rec.facility_id}`}
                              </span>
                              <div>
                                <div className="font-bold dark:text-white text-slate-950 text-xs sm:text-sm">
                                  {rec.facility?.display_name || 'Car Park'}
                                </div>
                                <div className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">
                                  {rec.facility?.reference_capacity || (rec.occupied_spaces + rec.available_spaces)} max spots
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold dark:text-slate-200 text-slate-800 font-mono text-xs sm:text-sm">
                              {formatFacilityDateTime(rec.requested_datetime)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1.5 min-w-[130px]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black dark:text-white text-slate-950 text-xs sm:text-sm">
                                  {rec.occupancy_percentage.toFixed(1)}%
                                </span>
                                <StatusBadge status={status} size="sm" />
                              </div>
                              <div className="w-full h-1.5 rounded-full dark:bg-slate-800 bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    rec.occupancy_percentage < 40
                                      ? 'bg-emerald-500'
                                      : rec.occupancy_percentage < 75
                                      ? 'bg-amber-500'
                                      : rec.occupancy_percentage < 90
                                      ? 'bg-orange-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, rec.occupancy_percentage))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div>
                              <span className="font-mono font-bold dark:text-white text-slate-950 text-xs sm:text-sm">
                                {rec.available_spaces}
                              </span>{' '}
                              <span className="text-xs dark:text-slate-400 text-slate-500">free spots</span>
                              <div className="text-[11px] dark:text-slate-400 text-slate-500 font-mono mt-0.5">
                                {rec.occupied_spaces} occupied
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 dark:text-slate-400 text-slate-500 text-xs whitespace-nowrap font-mono">
                            {formatDateTime(rec.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

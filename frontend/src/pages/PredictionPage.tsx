import React, { useState, useEffect } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { Facility, PredictionResponse } from '../types';
import { PredictionResultCard } from '../components/PredictionResultCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { ModernDateTimePicker } from '../components/ModernDateTimePicker';
import { ModernGarageSelect } from '../components/ModernGarageSelect';
import {
  TrendingUp,
  Building,
  Calendar,
  Clock,
  Sparkles,
  Car,
  Compass,
} from 'lucide-react';

import { saveSessionPrediction } from '../utils/sessionHistory';

export const PredictionPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityCode, setSelectedFacilityCode] = useState<string>('');
  const [dateTimeString, setDateTimeString] = useState<string>('');
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default datetime to now
  useEffect(() => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDateTimeString(localIso);
  }, []);

  const loadFacilities = async () => {
    try {
      setLoadingFacilities(true);
      setError(null);
      const res = await api.getFacilities();
      setFacilities(res.data);
      if (res.data.length > 0 && !selectedFacilityCode) {
        setSelectedFacilityCode(res.data[0].facility_code);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handlePresetTime = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDateTimeString(localIso);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityCode) {
      setError('Please select a car park.');
      return;
    }
    if (!dateTimeString) {
      setError('Please select a valid target forecast date and time.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createPrediction({
        facility_code: selectedFacilityCode,
        datetime: dateTimeString,
      });
      setPredictionResult(res.data);
      saveSessionPrediction(res.data, selectedFacility);
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById('prediction-result-container')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFacility = facilities.find(
    (f) => f.facility_code === selectedFacilityCode
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white text-zinc-950">
          Check Arrival Availability
        </h2>
        <p className="mt-2 text-sm sm:text-base dark:text-zinc-400 text-zinc-600 leading-relaxed">
          Forecast car park occupancy across The Hague and Scheveningen for any upcoming arrival time.
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadFacilities} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Prediction Form */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-5 sm:p-8 shadow-sm border dark:border-zinc-800/80 border-zinc-200 relative z-30">
          <div className="flex items-center gap-3 border-b dark:border-zinc-800/80 border-zinc-200 pb-4">
            <div className="rounded-2xl dark:bg-zinc-800 dark:text-zinc-200 dark:border dark:border-zinc-700 bg-zinc-100 text-zinc-800 p-2.5">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold dark:text-white text-zinc-900">
                Trip Details
              </h3>
              <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 mt-0.5">
                Select your destination car park and expected arrival time
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Facility Selector */}
            {loadingFacilities ? (
              <div className="h-16 w-full animate-pulse rounded-2xl dark:bg-zinc-800/60 bg-zinc-200/80" />
            ) : (
              <ModernGarageSelect
                facilities={facilities}
                value={selectedFacilityCode}
                onChange={setSelectedFacilityCode}
                disabled={submitting}
                label="Destination Car Park"
              />
            )}

            {/* Selected Facility Details Card */}
            {selectedFacility && (
              <div className="rounded-2xl glass-panel-subtle p-3.5 sm:p-4 border dark:border-zinc-800/80 border-zinc-200 text-xs sm:text-sm space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="dark:text-zinc-400 text-zinc-500">Car Park Code:</span>
                  <span className="font-mono font-bold dark:text-zinc-100 text-zinc-900">
                    {selectedFacility.facility_code}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="dark:text-zinc-400 text-zinc-500">Location Name:</span>
                  <span className="font-semibold dark:text-zinc-100 text-zinc-900 truncate text-right">
                    {selectedFacility.display_name}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="dark:text-zinc-400 text-zinc-500">Total Monitored Spots:</span>
                  <span className="font-bold dark:text-zinc-100 text-zinc-900">
                    {selectedFacility.reference_capacity} spots
                  </span>
                </div>
              </div>
            )}

            {/* Modern Date Time Picker */}
            <ModernDateTimePicker
              value={dateTimeString}
              onChange={setDateTimeString}
              disabled={submitting}
              label="Expected Arrival Date & Time"
            />

            <button
              type="submit"
              disabled={submitting || loadingFacilities}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800 px-5 py-3.5 text-sm sm:text-base font-bold shadow-md transition disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {submitting ? (
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

        {/* Prediction Results Card */}
        <div id="prediction-result-container" className="lg:col-span-6 scroll-mt-20 relative z-20">
          {predictionResult ? (
            <PredictionResultCard prediction={predictionResult} />
          ) : (
            <div className="glass-card rounded-3xl p-8 sm:p-14 text-center border dark:border-zinc-800/80 border-zinc-200">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl dark:bg-zinc-800 dark:text-zinc-200 bg-zinc-100 text-zinc-600 shadow-inner">
                <Clock className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-bold dark:text-white text-zinc-900">
                Ready to Forecast
              </h3>
              <p className="mt-2 text-xs sm:text-sm dark:text-zinc-400 text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Select a car park and arrival time on the left to check expected spot availability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

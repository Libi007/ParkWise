import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  Clock,
  Sparkles,
  Compass,
  TrendingUp,
  History,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../api/client';
import { ReadinessStatus } from '../types';

export const AppLayout: React.FC = () => {
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('parkwise-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('parkwise-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.getReadiness();
        setReadiness(res.data);
        setIsBackendHealthy(res.data.ready);
      } catch {
        setIsBackendHealthy(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    }
  }, [location.hash]);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col transition-colors duration-300 w-full overflow-x-hidden">
      {/* Floating High-Contrast Glass Navbar */}
      <header className="sticky top-0 z-40 w-full px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3.5">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between shadow-xl">
          {/* Brand Logo */}
          <button
            onClick={() => scrollToSection('top')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left min-w-0 cursor-pointer"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all">
              <Car className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-black tracking-tight dark:text-white text-slate-900 flex items-center gap-0.5">
                Park<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">Wise</span>
              </div>
              <p className="hidden xs:block text-[11px] font-semibold tracking-wider dark:text-slate-400 text-slate-500 uppercase truncate">
                The Hague · Car Parks
              </p>
            </div>
          </button>

          {/* Flow-Through Navigation (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1.5 glass-panel-subtle rounded-2xl px-2.5 py-1.5 border dark:border-sky-500/15 border-slate-200">
            <button
              onClick={() => scrollToSection('forecast-section')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-slate-800/80 text-slate-700 hover:text-emerald-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <TrendingUp className="h-4 w-4 dark:text-emerald-400 text-emerald-600" />
              <span>Forecast Arrival</span>
            </button>
            <button
              onClick={() => scrollToSection('garages-section')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold dark:text-slate-300 dark:hover:text-cyan-400 dark:hover:bg-slate-800/80 text-slate-700 hover:text-cyan-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <Building2 className="h-4 w-4 dark:text-cyan-400 text-cyan-600" />
              <span>Car Parks</span>
            </button>
            <button
              onClick={() => scrollToSection('history-section')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold dark:text-slate-300 dark:hover:text-sky-400 dark:hover:bg-slate-800/80 text-slate-700 hover:text-sky-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <History className="h-4 w-4 dark:text-sky-400 text-sky-600" />
              <span>Recent Checks</span>
            </button>
          </nav>

          {/* Right Status Badges & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {/* Live Status indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full glass-pill px-3 sm:px-3.5 py-1 sm:py-1.5 shadow-sm border dark:border-emerald-500/30 dark:bg-emerald-950/20 border-emerald-200 bg-emerald-50/70">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isBackendHealthy === false ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="font-semibold text-xs sm:text-sm dark:text-emerald-300 text-emerald-800">
                {isBackendHealthy === false ? 'Offline' : 'Live Network'}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'Daylight Mist' : 'Midnight Slate'} Mode`}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl sm:rounded-2xl glass-panel-subtle hover:scale-105 transition-all dark:text-slate-300 dark:hover:text-white text-slate-600 hover:text-slate-950 border dark:border-sky-500/15 border-slate-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main id="top" className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Floating Bottom Bar Navigation for Mobile Phones */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto glass-panel rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border dark:border-zinc-700/80 border-zinc-300 backdrop-blur-xl">
        <button
          onClick={() => scrollToSection('forecast-section')}
          className="flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 active:scale-95 transition"
        >
          <TrendingUp className="h-4 w-4 dark:text-zinc-300 text-zinc-700" />
          <span>Forecast</span>
        </button>
        <button
          onClick={() => scrollToSection('garages-section')}
          className="flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 active:scale-95 transition"
        >
          <Building2 className="h-4 w-4 dark:text-zinc-300 text-zinc-700" />
          <span>Car Parks</span>
        </button>
        <button
          onClick={() => scrollToSection('history-section')}
          className="flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold dark:text-zinc-300 dark:hover:text-white text-zinc-700 hover:text-zinc-950 active:scale-95 transition"
        >
          <History className="h-4 w-4 dark:text-zinc-300 text-zinc-700" />
          <span>Recent</span>
        </button>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 border-t dark:border-zinc-800/80 border-zinc-200 mt-8 text-xs dark:text-zinc-400 text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-semibold dark:text-zinc-200 text-zinc-900">ParkWise</span>
          <span className="text-zinc-600 hidden xs:inline">·</span>
          <span>The Hague & Scheveningen</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 dark:text-zinc-500 text-zinc-400 text-[11px] sm:text-xs">
          <span>Live Car Park Occupancy</span>
        </div>
      </footer>
    </div>
  );
};

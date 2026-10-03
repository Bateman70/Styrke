import React, { useEffect, useState } from 'react';
import { Dumbbell, Calendar as CalendarIcon, Play, BarChart2, Info, Zap, Cloud, RefreshCw, AlertCircle, Check, User } from 'lucide-react';
import { APP_VERSION } from '../constants/version';
import { subscribeSyncStatus, SyncStatus } from '../utils/cloudSync';
import { WorkoutType, UserProfile } from '../types/workout';

interface NavbarProps {
  activeTab: 'calendar' | 'workout' | 'run' | 'stats' | 'guide';
  setActiveTab: (tab: 'calendar' | 'workout' | 'run' | 'stats' | 'guide') => void;
  userProfile?: UserProfile;
  onQuickStart: (type: WorkoutType) => void;
  onOpenCloudSync: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onQuickStart,
  onOpenCloudSync,
  onOpenProfile,
}) => {
  const [syncState, setSyncState] = useState<{ status: SyncStatus; lastSyncTime: string | null }>({
    status: 'idle',
    lastSyncTime: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((status, lastSyncTime) => {
      setSyncState({ status, lastSyncTime });
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Fixed Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800/90 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Brand */}
            <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('calendar')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Dumbbell className="w-5 h-5 text-white transform -rotate-12" />
              </div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                MyStrength
              </span>
            </div>

            {/* Desktop Nav Tabs */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Kalender & Plan</span>
              </button>

              <button
                onClick={() => setActiveTab('workout')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'workout'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Aktiv Økt</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Statistikk</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'guide'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Programguide</span>
              </button>
            </nav>

            {/* Right Header Actions: Min Profil & Sky-Sync Status Button */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
              
              {/* Profile Button */}
              <button
                onClick={onOpenProfile}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 transition-all flex items-center space-x-1.5 shadow-sm"
                title="Endre profil og treningsmål"
              >
                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="hidden sm:inline">Profil ({userProfile?.age || 55} år)</span>
                <span className="sm:hidden text-[11px]">Profil</span>
              </button>

              {/* Sky-Sync Button */}
              <button
                onClick={onOpenCloudSync}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5 shadow-sm"
                title="Åpne Sky-Synkronisering"
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : syncState.status === 'synced' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : syncState.status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                
                <span className="hidden sm:inline">
                  {syncState.status === 'syncing'
                    ? 'Synkroniserer...'
                    : syncState.status === 'synced' && syncState.lastSyncTime
                    ? `Sky-Synk (${syncState.lastSyncTime})`
                    : 'Sky-Synk'}
                </span>
                <span className="sm:hidden text-[11px] text-cyan-400">Sky-Synk</span>
              </button>

              {/* Quick Start Buttons - Hidden on small mobile screens */}
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={() => onQuickStart('okt-a')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center space-x-1 shadow-sm"
                  title="Start Økt A nå"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Økt A</span>
                </button>

                <button
                  onClick={() => onQuickStart('okt-b')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 transition-all flex items-center space-x-1 shadow-sm"
                  title="Start Økt B nå"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Økt B</span>
                </button>

                <button
                  onClick={() => onQuickStart('fri-okt')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 transition-all flex items-center space-x-1 shadow-sm"
                  title="Start Fri-økt nå"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fri-økt</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around shadow-2xl">
        
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'calendar' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px]">Kalender</span>
        </button>

        <button
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'workout' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Play className="w-5 h-5" />
          <span className="text-[10px]">Aktiv Økt</span>
        </button>

        <button
          onClick={onOpenCloudSync}
          className="flex flex-col items-center space-y-1 py-1 px-3 rounded-xl text-cyan-400 font-semibold"
        >
          <Cloud className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px]">Sky-Synk</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'stats' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px]">Statistikk</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'guide' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px]">Guide</span>
        </button>

      </div>
    </>
  );
};

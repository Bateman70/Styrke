import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutLog, WorkoutType, WorkoutProgram } from './types/workout';
import { getStoredLogs, saveStoredLogs, generateAutoSchedule, mergeWorkoutLogs, getUserProfile, saveUserProfile } from './utils/storage';
import { generateAIWorkoutPrograms } from './utils/aiProgramGenerator';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/calendar/CalendarView';
import { ActiveWorkoutView } from './components/workout/ActiveWorkoutView';
import { ProgramGuideView } from './components/info/ProgramGuideView';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { LogRunModal } from './components/run/LogRunModal';
import { AutoSchedulerModal } from './components/calendar/AutoSchedulerModal';
import { CloudSyncModal } from './components/common/CloudSyncModal';
import { ProfileModal } from './components/common/ProfileModal';
import { WhatsNewModal } from './components/common/WhatsNewModal';
import { autoSaveToCloud, autoFetchFromCloud, checkAndApplyUrlSupabaseConfig, CloudSyncPayload } from './utils/cloudSync';
import { APP_VERSION, BUILD_TIME } from './constants/version';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'workout' | 'run' | 'stats' | 'guide'>('calendar');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile);
  const isFirstLoad = useRef(true);
  
  // Dynamic AI workout programs generated based on current user profile
  const activePrograms = generateAIWorkoutPrograms(userProfile);
  
  // State for active workout execution
  const [activeWorkoutType, setActiveWorkoutType] = useState<WorkoutType>('okt-a');
  const [activeLogToEdit, setActiveLogToEdit] = useState<WorkoutLog | undefined>(undefined);

  // Modals state
  const [runModalData, setRunModalData] = useState<{ date: string; existingLog?: WorkoutLog } | null>(null);
  const [isAutoSchedulerOpen, setIsAutoSchedulerOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  // 1. Initial Load: Check for URL Supabase Config, load local logs, then silently auto-fetch cloud data
  useEffect(() => {
    checkAndApplyUrlSupabaseConfig();

    const initialLogs = getStoredLogs();
    setLogs(initialLogs);

    // Check if user has seen current version news popup
    const seenVersion = localStorage.getItem('styrke_seen_version');
    if (seenVersion !== APP_VERSION) {
      setIsWhatsNewOpen(true);
    }

    // Silent background fetch from cloud
    autoFetchFromCloud().then((cloudData) => {
      if (cloudData) {
        if (cloudData.logs && cloudData.logs.length > 0) {
          const currentLocal = getStoredLogs();
          const merged = mergeWorkoutLogs(currentLocal, cloudData.logs);
          setLogs(merged);
          saveStoredLogs(merged);
        }
        if (cloudData.userProfile) {
          setUserProfile(cloudData.userProfile);
          saveUserProfile(cloudData.userProfile);
        }
      }
      isFirstLoad.current = false;
    });
  }, []);

  const handleCloseWhatsNew = () => {
    localStorage.setItem('styrke_seen_version', APP_VERSION);
    setIsWhatsNewOpen(false);
  };

  // 2. Auto-fetch on window focus / tab switch
  useEffect(() => {
    const handleFocus = () => {
      autoFetchFromCloud().then((cloudData) => {
        if (cloudData) {
          if (cloudData.logs && cloudData.logs.length > 0) {
            const currentLocal = getStoredLogs();
            const merged = mergeWorkoutLogs(currentLocal, cloudData.logs);
            setLogs(merged);
            saveStoredLogs(merged);
          }
          if (cloudData.userProfile) {
            setUserProfile(cloudData.userProfile);
            saveUserProfile(cloudData.userProfile);
          }
        }
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleFocus();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save logs locally and automatically trigger background cloud upload
  const handleSaveLogs = (updatedLogs: WorkoutLog[]) => {
    setLogs(updatedLogs);
    saveStoredLogs(updatedLogs);
    
    // Automatic silent cloud save including profile
    autoSaveToCloud(updatedLogs, undefined, userProfile);
  };

  // Save profile locally and trigger cloud save & optionally generate calendar schedule
  const handleSaveProfile = (
    newProfile: UserProfile,
    generatedPrograms?: Record<string, WorkoutProgram>,
    selectedDays?: number[],
    startDate?: string
  ) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);

    let updatedLogs = logs;
    if (selectedDays && selectedDays.length > 0 && startDate) {
      updatedLogs = generateAutoSchedule(selectedDays, startDate, logs);
      setLogs(updatedLogs);
      saveStoredLogs(updatedLogs);
      setActiveTab('calendar');
    }

    autoSaveToCloud(updatedLogs, undefined, newProfile);
  };

  // Start a strength workout (Økt A or Økt B)
  const handleStartWorkout = (type: WorkoutType, date?: string, existingLog?: WorkoutLog) => {
    setActiveWorkoutType(type);
    setActiveLogToEdit(existingLog);
    setActiveTab('workout');
  };

  // Save completed/edited strength workout log
  const handleSaveWorkoutLog = (logToSave: WorkoutLog) => {
    const existingIndex = logs.findIndex((l) => l.id === logToSave.id);
    let updated: WorkoutLog[] = [];

    if (existingIndex >= 0) {
      updated = [...logs];
      updated[existingIndex] = logToSave;
    } else {
      updated = [logToSave, ...logs];
    }

    handleSaveLogs(updated);
  };

  // Save run log
  const handleSaveRunLog = (runLog: WorkoutLog) => {
    const existingIndex = logs.findIndex((l) => l.id === runLog.id);
    let updated: WorkoutLog[] = [];

    if (existingIndex >= 0) {
      updated = [...logs];
      updated[existingIndex] = runLog;
    } else {
      updated = [runLog, ...logs];
    }

    handleSaveLogs(updated);
  };

  // Delete a workout log
  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    handleSaveLogs(updated);
  };

  // Auto Schedule generation with custom selected days
  const handleGenerateAutoSchedule = (selectedDays: number[], startDate: string) => {
    const newLogs = generateAutoSchedule(selectedDays, startDate, logs);
    handleSaveLogs(newLogs);
    setActiveTab('calendar');
  };

  // Apply downloaded Cloud Sync data from modal
  const handleApplyCloudData = (payload: CloudSyncPayload) => {
    if (payload.logs) {
      const currentLocal = getStoredLogs();
      const merged = mergeWorkoutLogs(currentLocal, payload.logs);
      handleSaveLogs(merged);
    }
    if (payload.userProfile) {
      setUserProfile(payload.userProfile);
      saveUserProfile(payload.userProfile);
    }
    setActiveTab('calendar');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onQuickStart={(type) => handleStartWorkout(type, format(new Date(), 'yyyy-MM-dd'))}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main View Area with padding for fixed bars */}
      <main className="flex-grow pt-20 pb-24 md:pb-12">

        {/* Active Program Sub-Header Banner */}
        {userProfile && (
          <div className="bg-slate-900/90 border-b border-slate-800/90 px-4 py-2.5 mb-6 text-xs text-slate-300 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 text-[11px] flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Aktivt Program</span>
                </span>
                <span className="font-extrabold text-slate-100 text-sm">
                  {userProfile.goal === 'lopere'
                    ? 'Styrke for Løpere'
                    : userProfile.goal === 'helse_styrke'
                    ? 'Helse & Hverdagsstyrke'
                    : userProfile.goal === 'muskelvekst'
                    ? 'Muskelvekst & Styrke'
                    : 'Vektnedgang & Puls'}
                </span>
                <span className="text-slate-400 text-xs">
                  • {userProfile.location === 'hjemme' ? '🏠 Hjemmegym' : userProfile.location === 'kombinasjon' ? '🔄 Kombinasjon' : '🏋️‍♂️ Treningssenter'} ({userProfile.age} år, {userProfile.weightKg} kg)
                </span>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer text-xs ml-auto transition-colors"
              >
                Endre Profil / Generer Nytt
              </button>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            logs={logs}
            activePrograms={activePrograms}
            onStartWorkout={(type, date, existingLog) => handleStartWorkout(type, date, existingLog)}
            onLogRun={(date, existingLog) => setRunModalData({ date, existingLog })}
            onOpenAutoScheduler={() => setIsAutoSchedulerOpen(true)}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {activeTab === 'workout' && (
          <ActiveWorkoutView
            workoutType={activeWorkoutType}
            existingLog={activeLogToEdit}
            activePrograms={activePrograms}
            onSaveLog={handleSaveWorkoutLog}
            onCancel={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'stats' && <StatsOverview logs={logs} />}

        {activeTab === 'guide' && (
          <ProgramGuideView
            activePrograms={activePrograms}
            userProfile={userProfile}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Footer with App Version & Build Time */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MyStrength Treningsapp • Tilpasset din profil</span>
          <button
            onClick={() => setIsWhatsNewOpen(true)}
            className="font-mono text-[11px] text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 px-2.5 py-1 rounded-full border border-blue-800/40 transition-colors cursor-pointer flex items-center space-x-1"
            title="Klikk for å se nyheter i versjonen"
          >
            <span>Versjon {APP_VERSION} ({BUILD_TIME}) — Nyheter</span>
          </button>
        </div>
      </footer>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          currentProfile={userProfile}
          onSaveProfile={handleSaveProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* What's New Release Modal */}
      {isWhatsNewOpen && (
        <WhatsNewModal onClose={handleCloseWhatsNew} />
      )}

      {/* Run Logging Modal */}
      {runModalData && (
        <LogRunModal
          date={runModalData.date}
          existingLog={runModalData.existingLog}
          onSave={handleSaveRunLog}
          onClose={() => setRunModalData(null)}
        />
      )}

      {/* Auto Scheduler Modal */}
      {isAutoSchedulerOpen && (
        <AutoSchedulerModal
          onGenerate={handleGenerateAutoSchedule}
          onClose={() => setIsAutoSchedulerOpen(false)}
        />
      )}

      {/* Cloud Sync Modal */}
      {isCloudSyncOpen && (
        <CloudSyncModal
          logs={logs}
          onApplyCloudData={handleApplyCloudData}
          onClose={() => setIsCloudSyncOpen(false)}
        />
      )}

    </div>
  );
}

export default App;

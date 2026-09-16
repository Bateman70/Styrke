import React, { useState, useEffect } from 'react';
import { WorkoutLog, WorkoutType } from './types/workout';
import { getStoredLogs, saveStoredLogs, generateAutoSchedule } from './utils/storage';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/calendar/CalendarView';
import { ActiveWorkoutView } from './components/workout/ActiveWorkoutView';
import { ProgramGuideView } from './components/info/ProgramGuideView';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { LogRunModal } from './components/run/LogRunModal';
import { AutoSchedulerModal } from './components/calendar/AutoSchedulerModal';
import { CloudSyncModal } from './components/common/CloudSyncModal';
import { CloudSyncPayload } from './utils/cloudSync';
import { format } from 'date-fns';

export function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'workout' | 'run' | 'stats' | 'guide'>('calendar');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  
  // State for active workout execution
  const [activeWorkoutType, setActiveWorkoutType] = useState<WorkoutType>('okt-a');
  const [activeLogToEdit, setActiveLogToEdit] = useState<WorkoutLog | undefined>(undefined);

  // Modals state
  const [runModalData, setRunModalData] = useState<{ date: string; existingLog?: WorkoutLog } | null>(null);
  const [isAutoSchedulerOpen, setIsAutoSchedulerOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  useEffect(() => {
    const initialLogs = getStoredLogs();
    setLogs(initialLogs);
  }, []);

  const handleSaveLogs = (updatedLogs: WorkoutLog[]) => {
    setLogs(updatedLogs);
    saveStoredLogs(updatedLogs);
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
    setLogs(newLogs);
    setActiveTab('calendar');
  };

  // Apply downloaded Cloud Sync data
  const handleApplyCloudData = (payload: CloudSyncPayload) => {
    if (payload.logs) {
      handleSaveLogs(payload.logs);
      setActiveTab('calendar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickStart={(type) => handleStartWorkout(type, format(new Date(), 'yyyy-MM-dd'))}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
      />

      {/* Main View Area with padding for fixed bars */}
      <main className="flex-grow pt-20 pb-20 md:pb-8">
        {activeTab === 'calendar' && (
          <CalendarView
            logs={logs}
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
            onSaveLog={handleSaveWorkoutLog}
            onCancel={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'stats' && <StatsOverview logs={logs} />}

        {activeTab === 'guide' && <ProgramGuideView />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Styrketreningsprogram for Løpere (55 år) • Mobil & PC Sky-Synkronisert App</span>
          <span>Bygget med React, TypeScript & Tailwind CSS</span>
        </div>
      </footer>

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

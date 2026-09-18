import React, { useState } from 'react';
import { WorkoutLog, WorkoutType } from '../../types/workout';
import { WORKOUT_PROGRAMS } from '../../data/workoutProgramData';
import {
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Trash2,
  Dumbbell,
  Calendar as CalendarIcon,
  Filter,
  CheckSquare,
  ListTodo,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';

interface PlanListViewProps {
  logs: WorkoutLog[];
  onStartWorkout: (type: WorkoutType, date: string, existingLog?: WorkoutLog) => void;
  onLogRun: (date: string, existingLog?: WorkoutLog) => void;
  onDeleteLog: (id: string) => void;
}

export const PlanListView: React.FC<PlanListViewProps> = ({
  logs,
  onStartWorkout,
  onLogRun,
  onDeleteLog,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'strength' | 'run'>('all');

  // Filter logs by selected activity type
  const filteredLogs = logs.filter((log) => {
    if (filterType === 'strength') return log.type === 'okt-a' || log.type === 'okt-b';
    if (filterType === 'run') return log.type === 'lop';
    return true;
  });

  // Separate into Scheduled (Planned) vs Completed workouts
  const scheduledLogs = filteredLogs
    .filter((l) => l.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedLogs = filteredLogs
    .filter((l) => l.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2 text-slate-200 text-sm font-bold">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filtrer visning:</span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle aktiviteter ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('strength')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none ${
              filterType === 'strength'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Kun Styrke
          </button>
          <button
            onClick={() => setFilterType('run')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none ${
              filterType === 'run'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Kun Løp
          </button>
        </div>
      </div>

      {/* SECTION 1: Kommende / Planlagte økter */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
              <span>Kommende / Planlagte Økter</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                {scheduledLogs.length} økter
              </span>
            </h3>
            <p className="text-xs text-slate-400">Økter som står for tur i treningsplanen din</p>
          </div>
        </div>

        {scheduledLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-400 font-medium">Ingen planlagte økter i denne kategorien.</p>
            <p className="text-xs text-slate-500 mt-1">Trykk på «Generer ukesplan» eller legg til økter i kalenderen!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledLogs.map((log) => {
              const isTodayDate = log.date === format(new Date(), 'yyyy-MM-dd');

              if (log.type === 'okt-a' || log.type === 'okt-b') {
                const program = WORKOUT_PROGRAMS[log.type];

                return (
                  <div
                    key={log.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isTodayDate
                        ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500 shadow-xl'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide uppercase ${
                          log.type === 'okt-a'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {log.type === 'okt-a' ? 'Økt A' : 'Økt B'}
                        </span>
                        {isTodayDate && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] animate-pulse">
                            I DAG
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Slett økt fra plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-100">{program.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>{format(new Date(log.date), 'EEEE d. MMMM yyyy', { locale: nb })}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Planlagt ({program.estimatedTime})</span>
                      </span>

                      <button
                        onClick={() => onStartWorkout(log.type, log.date, log)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Økt</span>
                      </button>
                    </div>
                  </div>
                );
              }

              if (log.type === 'lop') {
                return (
                  <div
                    key={log.id}
                    className="p-5 rounded-2xl border bg-orange-950/20 border-orange-800/40 text-orange-200 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Løping</span>
                      </span>

                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Slett økt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-slate-100">
                        {log.runDetails?.runType || 'Løpeøkt'} — {log.runDetails?.distanceKm} km
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
                        <span>{format(new Date(log.date), 'EEEE d. MMMM yyyy', { locale: nb })}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-orange-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Planlagt ({log.runDetails?.durationMinutes || 45} min)</span>
                      </span>

                      <button
                        onClick={() => onLogRun(log.date, log)}
                        className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-600/20"
                      >
                        Rediger / Fullfør
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Fullførte økter (Historikk) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
              <span>Fullførte Økter (Historikk)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                {completedLogs.length} økter
              </span>
            </h3>
            <p className="text-xs text-slate-400">Oversikt over gjennomførte og loggførte økter</p>
          </div>
        </div>

        {completedLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-400 font-medium">Ingen fullførte økter ennå.</p>
            <p className="text-xs text-slate-500 mt-1">Start en økt fra kalenderen eller planen for å loggføre!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedLogs.map((log) => {
              if (log.type === 'okt-a' || log.type === 'okt-b') {
                const program = WORKOUT_PROGRAMS[log.type];

                return (
                  <div
                    key={log.id}
                    className="p-5 rounded-2xl border bg-emerald-950/20 border-emerald-800/40 text-emerald-200 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{log.type === 'okt-a' ? 'Økt A Fullført' : 'Økt B Fullført'}</span>
                      </span>

                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Slett økt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-100">{program.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Fullført: {format(new Date(log.date), 'EEEE d. MMMM yyyy', { locale: nb })}</span>
                      </p>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-emerald-300/90 italic bg-slate-950/50 p-2.5 rounded-xl border border-emerald-900/30">
                        "{log.notes}"
                      </p>
                    )}

                    <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fullført & Loggført</span>
                      </span>

                      <button
                        onClick={() => onStartWorkout(log.type, log.date, log)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                      >
                        Se Logg / Rediger
                      </button>
                    </div>
                  </div>
                );
              }

              if (log.type === 'lop') {
                return (
                  <div
                    key={log.id}
                    className="p-5 rounded-2xl border bg-orange-950/20 border-orange-800/40 text-orange-200 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Løping Fullført</span>
                      </span>

                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Slett økt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-100">
                        {log.runDetails?.runType || 'Løpeøkt'} — {log.runDetails?.distanceKm} km
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
                        <span>Fullført: {format(new Date(log.date), 'EEEE d. MMMM yyyy', { locale: nb })}</span>
                      </p>
                    </div>

                    {log.runDetails?.notes && (
                      <p className="text-xs text-orange-300/90 italic bg-slate-950/50 p-2.5 rounded-xl border border-orange-900/30">
                        "{log.runDetails.notes}"
                      </p>
                    )}

                    <div className="pt-3 border-t border-orange-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{log.runDetails?.durationMinutes} min fullført</span>
                      </span>

                      <button
                        onClick={() => onLogRun(log.date, log)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                      >
                        Se Logg / Rediger
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

    </div>
  );
};

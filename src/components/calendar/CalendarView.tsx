import React, { useState } from 'react';
import { WorkoutLog, WorkoutType } from '../../types/workout';
import { WORKOUT_PROGRAMS } from '../../data/workoutProgramData';
import { PlanListView } from './PlanListView';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Trash2,
  Calendar as CalendarIcon,
  ListTodo,
  Grid,
} from 'lucide-react';

interface CalendarViewProps {
  logs: WorkoutLog[];
  onStartWorkout: (type: WorkoutType, date: string, existingLog?: WorkoutLog) => void;
  onLogRun: (date: string, existingLog?: WorkoutLog) => void;
  onOpenAutoScheduler: () => void;
  onDeleteLog: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  logs,
  onStartWorkout,
  onLogRun,
  onOpenAutoScheduler,
  onDeleteLog,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getLogsForDate = (dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    return logs.filter((l) => l.date === dateStr);
  };

  const selectedDayLogs = logs.filter((l) => l.date === selectedDate);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top View Toggle & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Sub-nav Mode Toggle */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Kalendervisning</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Treningsplan & Liste</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
          {viewMode === 'grid' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Forrige måned"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="font-bold text-sm text-slate-200 capitalize min-w-[110px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: nb })}
              </span>

              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Neste måned"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Auto Schedule Button */}
          <button
            onClick={onOpenAutoScheduler}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generer ukesplan</span>
          </button>
        </div>

      </div>

      {/* Render selected view mode */}
      {viewMode === 'list' ? (
        <PlanListView
          logs={logs}
          onStartWorkout={onStartWorkout}
          onLogRun={onLogRun}
          onDeleteLog={onDeleteLog}
        />
      ) : (
        /* Calendar Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((dayObj) => {
                const dateStr = format(dayObj, 'yyyy-MM-dd');
                const dayLogs = getLogsForDate(dayObj);
                const isSelected = dateStr === selectedDate;
                const isCurrentMonth = isSameMonth(dayObj, currentMonth);
                const isCurrentDay = isToday(dayObj);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[80px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500 shadow-md'
                        : isCurrentDay
                        ? 'bg-slate-800/80 border-slate-600'
                        : isCurrentMonth
                        ? 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                        : 'bg-slate-950/20 border-slate-900 opacity-40 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-md w-5 h-5 flex items-center justify-center ${
                          isCurrentDay
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? 'text-blue-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {format(dayObj, 'd')}
                      </span>
                    </div>

                    {/* Activity badges */}
                    <div className="space-y-1 mt-1">
                      {dayLogs.map((log) => {
                        const isCompleted = log.status === 'completed';

                        if (log.type === 'okt-a') {
                          return (
                            <div
                              key={log.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center justify-between truncate ${
                                isCompleted
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                              }`}
                            >
                              <span className="truncate">Økt A</span>
                              {isCompleted ? <CheckCircle2 className="w-3 h-3 text-slate-950 shrink-0 ml-1" /> : <Clock className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                            </div>
                          );
                        }

                        if (log.type === 'okt-b') {
                          return (
                            <div
                              key={log.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center justify-between truncate ${
                                isCompleted
                                  ? 'bg-indigo-500 text-slate-950 font-black'
                                  : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
                              }`}
                            >
                              <span className="truncate">Økt B</span>
                              {isCompleted ? <CheckCircle2 className="w-3 h-3 text-slate-950 shrink-0 ml-1" /> : <Clock className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />}
                            </div>
                          );
                        }

                        if (log.type === 'lop') {
                          return (
                            <div
                              key={log.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-500 text-slate-950 flex items-center justify-between truncate"
                            >
                              <span className="truncate">{log.runDetails?.distanceKm || ''} km Løp</span>
                              <Flame className="w-3 h-3 text-slate-950 shrink-0 ml-1" />
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 flex flex-col justify-between">
            
            <div>
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100 capitalize">
                  {format(new Date(selectedDate), 'EEEE d. MMMM', { locale: nb })}
                </h3>
                <p className="text-xs text-slate-400">Aktiviteter for valgt dato</p>
              </div>

              <div className="mt-4 space-y-3">
                {selectedDayLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Ingen økter registrert på denne datoen.</p>
                  </div>
                ) : (
                  selectedDayLogs.map((log) => {
                    const isCompleted = log.status === 'completed';

                    if (log.type === 'okt-a' || log.type === 'okt-b') {
                      const program = WORKOUT_PROGRAMS[log.type];

                      return (
                        <div
                          key={log.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : log.type === 'okt-a' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {log.type === 'okt-a' ? 'Økt A' : 'Økt B'} {isCompleted ? '✓ Fullført' : ''}
                            </span>

                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Slett økt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4 className="font-bold text-sm text-slate-100">{program.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{program.subtitle}</p>

                          <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/60">
                            <span className="text-xs flex items-center space-x-1 text-slate-400">
                              {isCompleted ? (
                                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Fullført</span>
                                </span>
                              ) : (
                                <span className="text-amber-400 font-bold flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Planlagt</span>
                                </span>
                              )}
                            </span>

                            <button
                              onClick={() => onStartWorkout(log.type, selectedDate, log)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center space-x-1"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCompleted ? 'Vis Logg' : 'Start Økt'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (log.type === 'lop') {
                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl border bg-orange-950/20 border-orange-800/40 text-orange-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-slate-950 flex items-center space-x-1">
                              <Flame className="w-3 h-3" />
                              <span>Løpeøkt Fullført</span>
                            </span>

                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Slett økt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4 className="font-bold text-sm text-slate-100">
                            {log.runDetails?.runType || 'Løpeøkt'} — {log.runDetails?.distanceKm} km
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Varighet: {log.runDetails?.durationMinutes} minutter
                          </p>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => onLogRun(selectedDate, log)}
                              className="text-xs font-semibold text-orange-400 hover:underline"
                            >
                              Rediger løpeøkt
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Legg til på valgt dato:
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onStartWorkout('okt-a', selectedDate)}
                  className="py-2 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5 mb-0.5" />
                  <span>Økt A</span>
                </button>

                <button
                  onClick={() => onStartWorkout('okt-b', selectedDate)}
                  className="py-2 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5 mb-0.5" />
                  <span>Økt B</span>
                </button>

                <button
                  onClick={() => onLogRun(selectedDate)}
                  className="py-2 px-2 bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border border-orange-800/50 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center"
                >
                  <Flame className="w-3.5 h-3.5 mb-0.5" />
                  <span>Løp</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

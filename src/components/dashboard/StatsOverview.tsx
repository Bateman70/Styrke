import React from 'react';
import { WorkoutLog } from '../../types/workout';
import { Award, Flame, Dumbbell, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface StatsOverviewProps {
  logs: WorkoutLog[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ logs }) => {
  const completedLogs = logs.filter((l) => l.status === 'completed');
  
  const totalStrengthWorkouts = completedLogs.filter((l) => l.type === 'okt-a' || l.type === 'okt-b').length;
  const totalRunWorkouts = completedLogs.filter((l) => l.type === 'lop').length;

  const totalRunKm = completedLogs.reduce((acc, log) => {
    if (log.type === 'lop' && log.runDetails?.distanceKm) {
      return acc + log.runDetails.distanceKm;
    }
    return acc;
  }, 0);

  // Extract weight progression for Goblet Squat & Romanian Deadlift
  const getWeightHistoryForExercise = (exerciseId: string) => {
    const history: { date: string; maxWeight: number }[] = [];

    completedLogs.forEach((log) => {
      const ex = log.exercises?.find((e) => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) {
        const weights = ex.sets
          .map((s) => parseFloat(s.weightKg as string) || 0)
          .filter((w) => w > 0);
        if (weights.length > 0) {
          const maxW = Math.max(...weights);
          history.push({ date: log.date, maxWeight: maxW });
        }
      }
    });

    return history;
  };

  const gobletHistory = getWeightHistoryForExercise('goblet-squat');
  const rdlHistory = getWeightHistoryForExercise('rumensk-markloft');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Treningsstatistikk & Fremgang</h1>
        <p className="text-xs text-slate-400 mt-1">Oversikt over gjennomførte styrke- og løpeøkter</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Styrkeøkter
            </span>
            <span className="text-2xl font-extrabold text-slate-100">{totalStrengthWorkouts} økter</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Løpedistanse
            </span>
            <span className="text-2xl font-extrabold text-slate-100">{totalRunKm.toFixed(1)} km</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Totalt Fullført
            </span>
            <span className="text-2xl font-extrabold text-slate-100">
              {completedLogs.length} økter
            </span>
          </div>
        </div>

      </div>

      {/* Weight Progression Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goblet Squat History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Vektfremgang: Goblet Squat</span>
          </div>

          {gobletHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 italic">Ingen registrerte vekter ennå. Loggfør første økt!</p>
          ) : (
            <div className="space-y-2">
              {gobletHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-400">{item.date}</span>
                  <span className="font-bold text-emerald-400">{item.maxWeight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Romanian Deadlift History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Vektfremgang: Rumensk Markløft</span>
          </div>

          {rdlHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 italic">Ingen registrerte vekter ennå. Loggfør første økt!</p>
          ) : (
            <div className="space-y-2">
              {rdlHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-400">{item.date}</span>
                  <span className="font-bold text-indigo-400">{item.maxWeight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

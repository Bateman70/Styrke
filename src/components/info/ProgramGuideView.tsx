import React, { useState } from 'react';
import { PROGRAM_GUIDE_INFO, WORKOUT_PROGRAMS } from '../../data/workoutProgramData';
import { VideoModal } from '../VideoModal';
import { Exercise } from '../../types/workout';
import { BookOpen, ShieldCheck, Dumbbell, PlayCircle, Flame, CheckCircle, Clock, Lightbulb, Zap } from 'lucide-react';

export const ProgramGuideView: React.FC = () => {
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      
      <VideoModal exercise={selectedVideoExercise} onClose={() => setSelectedVideoExercise(null)} />

      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Offisiell Treningsguide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            {PROGRAM_GUIDE_INFO.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {PROGRAM_GUIDE_INFO.description} {PROGRAM_GUIDE_INFO.targetAudience}
          </p>
        </div>
      </div>

      {/* Core Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PROGRAM_GUIDE_INFO.strategy.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Exercises Overview: Økt A & Økt B */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          <span>Øvelseskatalog & Teknikkvideoer</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Økt A Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  Økt A
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">Knebøy-mønster & Horisontalt drag</h3>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {WORKOUT_PROGRAMS['okt-a'].exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ex.groupLabel || ex.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{ex.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {ex.defaultSets} sett × {ex.defaultReps} • {ex.focus}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedVideoExercise(ex)}
                    className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors shrink-0"
                    title="Se instruksjonsvideo"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Økt B Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400">
                  Økt B
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">Hoftehengsel & Ettbeinsstyrke</h3>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {WORKOUT_PROGRAMS['okt-b'].exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ex.groupLabel || ex.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{ex.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {ex.defaultSets} sett × {ex.defaultReps} • {ex.focus}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedVideoExercise(ex)}
                    className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors shrink-0"
                    title="Se instruksjonsvideo"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { PROGRAM_GUIDE_INFO, WORKOUT_PROGRAMS as DEFAULT_PROGRAMS } from '../../data/workoutProgramData';
import { VideoModal } from '../VideoModal';
import { Exercise, WorkoutProgram, WorkoutType, UserProfile } from '../../types/workout';
import { BookOpen, ShieldCheck, Dumbbell, PlayCircle, Clock, User } from 'lucide-react';

interface ProgramGuideViewProps {
  activePrograms?: Record<string, WorkoutProgram>;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
}

export const ProgramGuideView: React.FC<ProgramGuideViewProps> = ({
  activePrograms,
  userProfile,
  onOpenProfile,
}) => {
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise | null>(null);

  const programs = activePrograms || DEFAULT_PROGRAMS;
  const programA = programs['okt-a'] || DEFAULT_PROGRAMS['okt-a'];
  const programB = programs['okt-b'] || DEFAULT_PROGRAMS['okt-b'];

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

      {/* Active Profile Banner */}
      {userProfile && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Aktiv Profil & AI-Program</span>
              <h4 className="font-extrabold text-slate-100 text-sm">
                {userProfile.gender === 'mann' ? 'Mann' : userProfile.gender === 'kvinne' ? 'Kvinne' : 'Bruker'} ({userProfile.age} år, {userProfile.weightKg} kg) • {
                  userProfile.location === 'hjemme' ? '🏠 Hjemmegym' : userProfile.location === 'kombinasjon' ? '🔄 Kombinasjon' : '🏋️‍♂️ Treningssenter'
                } — {
                  userProfile.goal === 'lopere' ? 'Styrke for Løpere' : userProfile.goal === 'helse_styrke' ? 'Generell Helse & Styrke' : userProfile.goal === 'muskelvekst' ? 'Muskelvekst & Styrke' : 'Vektnedgang & Puls'
                }
              </h4>
            </div>
          </div>
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shrink-0"
            >
              Endre Profil / Generer nytt
            </button>
          )}
        </div>
      )}

      {/* Exercises Overview: Økt A & Økt B */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          <span>Ditt Skreddersydde Program & Teknikkvideoer</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Økt A Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  Økt A
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">{programA.title}</h3>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {programA.exercises.map((ex) => (
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

                  {ex.videoUrl && (
                    <button
                      onClick={() => setSelectedVideoExercise(ex)}
                      className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors shrink-0"
                      title="Se instruksjonsvideo"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
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
                <h3 className="text-lg font-bold text-slate-100 mt-1">{programB.title}</h3>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {programB.exercises.map((ex) => (
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

                  {ex.videoUrl && (
                    <button
                      onClick={() => setSelectedVideoExercise(ex)}
                      className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors shrink-0"
                      title="Se instruksjonsvideo"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

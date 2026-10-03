import React, { useState } from 'react';
import { UserProfile, FitnessGoal, Gender, ExperienceLevel, WorkoutProgram, WorkoutType } from '../../types/workout';
import { generateAIWorkoutPrograms } from '../../utils/aiProgramGenerator';
import { User, Target, Sparkles, CheckCircle2, X, Activity, Dumbbell, ShieldCheck, Flame } from 'lucide-react';

interface ProfileModalProps {
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile, generatedPrograms?: Record<string, WorkoutProgram>) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentProfile, onSaveProfile, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [age, setAge] = useState<number>(currentProfile.age || 55);
  const [gender, setGender] = useState<Gender>(currentProfile.gender || 'mann');
  const [weightKg, setWeightKg] = useState<number>(currentProfile.weightKg || 95);
  const [goal, setGoal] = useState<FitnessGoal>(currentProfile.goal || 'lopere');
  const [experience, setExperience] = useState<ExperienceLevel>(currentProfile.experience || 'middels');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(currentProfile.daysPerWeek || 2);

  const [previewPrograms, setPreviewPrograms] = useState<Record<string, WorkoutProgram> | null>(null);

  const handleGenerate = () => {
    const updatedProfile: UserProfile = {
      age,
      gender,
      weightKg,
      goal,
      experience,
      daysPerWeek,
      hasCompletedSetup: true,
    };

    const programs = generateAIWorkoutPrograms(updatedProfile);
    setPreviewPrograms(programs);
    setStep(3);
  };

  const handleFinalSave = () => {
    const updatedProfile: UserProfile = {
      age,
      gender,
      weightKg,
      goal,
      experience,
      daysPerWeek,
      hasCompletedSetup: true,
    };

    const programs = previewPrograms || generateAIWorkoutPrograms(updatedProfile);
    onSaveProfile(updatedProfile, programs);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">Din Profil & AI-Program</h3>
              <p className="text-xs text-slate-400">Skreddersy appen til din kropp og dine treningsmål</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Navigation */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-center">
          <button
            onClick={() => setStep(1)}
            className={`py-3 transition-all border-b-2 ${
              step === 1 ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Deg & Kropp
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-3 transition-all border-b-2 ${
              step === 2 ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Treningsmål
          </button>
          <button
            onClick={handleGenerate}
            className={`py-3 transition-all border-b-2 ${
              step === 3 ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. AI Program
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow text-slate-200">
          
          {/* STEP 1: Body & Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Alder (år)
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={95}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 55)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-base focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Vekt (kg)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseInt(e.target.value) || 95)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-base focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Kjønn
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mann', 'kvinne', 'annet'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                        gender === g
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Treningserfaring med Styrke
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'nybegynner', label: 'Nybegynner' },
                    { id: 'middels', label: 'Litt erfaring' },
                    { id: 'viderekommen', label: 'Erfaren' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setExperience(item.id as ExperienceLevel)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        experience === item.id
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  Neste: Velg Treningsmål →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Training Goal Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Velg ditt primære treningsmål:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div
                  onClick={() => setGoal('lopere')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    goal === 'lopere'
                      ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                    <Activity className="w-5 h-5" />
                    <span>1. Styrke for Løpere</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Spesialtilpasset for skadeforebygging, leggstabilitet, kjerne og beinstyrke.
                  </p>
                </div>

                <div
                  onClick={() => setGoal('helse_styrke')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    goal === 'helse_styrke'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>2. Helse & Hverdagsstyrke</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fokus på rygghelse, holdning, kjerne, bevegelighet og funksjonell styrke.
                  </p>
                </div>

                <div
                  onClick={() => setGoal('muskelvekst')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    goal === 'muskelvekst'
                      ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                    <Dumbbell className="w-5 h-5" />
                    <span>3. Muskelvekst & Styrke</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bygg muskler og øk løftestyrke med tunge sammensatte øvelser.
                  </p>
                </div>

                <div
                  onClick={() => setGoal('vektnedgang')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    goal === 'vektnedgang'
                      ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm">
                    <Flame className="w-5 h-5" />
                    <span>4. Vektnedgang & Puls</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Høyere tempo, supersett og helkroppsøvelser for maksimal kaloriforbrenning.
                  </p>
                </div>

              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  ← Tilbake
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generer AI Program! →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI Generated Program Preview */}
          {step === 3 && previewPrograms && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-blue-500/40 flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-slate-100 text-sm">Skreddersydd AI Program Generert!</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tilpasset {gender === 'mann' ? 'mann' : gender === 'kvinne' ? 'kvinne' : 'bruker'} ({age} år, {weightKg} kg).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Program A Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      Økt A
                    </span>
                    <span className="text-xs text-slate-400">{previewPrograms['okt-a'].estimatedTime}</span>
                  </div>
                  <h5 className="font-bold text-slate-100 text-sm">{previewPrograms['okt-a'].title}</h5>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-1">
                    {previewPrograms['okt-a'].exercises.map((ex) => (
                      <span key={ex.id} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                        {ex.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Program B Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                      Økt B
                    </span>
                    <span className="text-xs text-slate-400">{previewPrograms['okt-b'].estimatedTime}</span>
                  </div>
                  <h5 className="font-bold text-slate-100 text-sm">{previewPrograms['okt-b'].title}</h5>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-1">
                    {previewPrograms['okt-b'].exercises.map((ex) => (
                      <span key={ex.id} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                        {ex.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  ← Endre Mål
                </button>
                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aktiver Dette Programmet!</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

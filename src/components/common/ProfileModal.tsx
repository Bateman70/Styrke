import React, { useState } from 'react';
import { UserProfile, FitnessGoal, Gender, ExperienceLevel, WorkoutProgram, WorkoutType, TrainingLocation } from '../../types/workout';
import { generateAIWorkoutPrograms } from '../../utils/aiProgramGenerator';
import { User, Target, Sparkles, CheckCircle2, X, Activity, Dumbbell, ShieldCheck, Flame, Home, Building2, Repeat, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileModalProps {
  currentProfile: UserProfile;
  onSaveProfile: (
    profile: UserProfile,
    generatedPrograms?: Record<string, WorkoutProgram>,
    selectedDays?: number[],
    startDate?: string
  ) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentProfile, onSaveProfile, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [age, setAge] = useState<number>(currentProfile.age || 55);
  const [gender, setGender] = useState<Gender>(currentProfile.gender || 'mann');
  const [weightKg, setWeightKg] = useState<number>(currentProfile.weightKg || 95);
  const [goal, setGoal] = useState<FitnessGoal>(currentProfile.goal || 'lopere');
  const [location, setLocation] = useState<TrainingLocation>(currentProfile.location || 'senter');
  const [experience, setExperience] = useState<ExperienceLevel>(currentProfile.experience || 'middels');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(currentProfile.daysPerWeek || 2);

  // Schedule setup state for step 3 activation
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    return daysPerWeek === 3 ? [1, 3, 5] : [1, 4];
  });

  const [previewPrograms, setPreviewPrograms] = useState<Record<string, WorkoutProgram> | null>(null);

  const handleGenerate = () => {
    const updatedProfile: UserProfile = {
      age,
      gender,
      weightKg,
      goal,
      location,
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
      location,
      experience,
      daysPerWeek,
      hasCompletedSetup: true,
    };

    const programs = previewPrograms || generateAIWorkoutPrograms(updatedProfile);
    onSaveProfile(updatedProfile, programs, selectedDays, startDate);
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

              {/* Training Location Selection */}
              <div className="pt-2 space-y-2">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hvor trener du? (Tilpasser utstyr til apparater, manualer eller strikk):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'senter', label: 'Treningssenter', desc: 'Apparater, kabler & stenger', icon: Building2 },
                    { id: 'hjemme', label: 'Hjemmegym', desc: 'Manualer, strikk & kasse', icon: Home },
                    { id: 'kombinasjon', label: 'Kombinasjon', desc: 'Både hjemme og på senter', icon: Repeat },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLocation(item.id as TrainingLocation)}
                        className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-1 ${
                          location === item.id
                            ? 'bg-blue-950/50 text-blue-200 border-blue-500 ring-2 ring-blue-500 shadow-md'
                            : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                          <IconComp className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">{item.desc}</span>
                      </button>
                    );
                  })}
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

          {/* STEP 3: AI Generated Program Preview & Activation */}
          {step === 3 && previewPrograms && (
            <div className="space-y-4">
              
              {/* Program Overview Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/80 to-cyan-950/80 border border-blue-500/40 flex items-start space-x-3">
                <Sparkles className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-100 text-sm">
                    AI-Program: {
                      goal === 'lopere' ? 'Styrke for Løpere' : goal === 'helse_styrke' ? 'Helse & Hverdagsstyrke' : goal === 'muskelvekst' ? 'Muskelvekst & Styrke' : 'Vektnedgang & Puls'
                    }
                  </h4>
                  <p className="text-xs text-slate-300">
                    Tilpasset {gender === 'mann' ? 'Mann' : gender === 'kvinne' ? 'Kvinne' : 'Bruker'} ({age} år, {weightKg} kg) • {
                      location === 'hjemme' ? '🏠 Hjemmegym (Manualer & Strikk)' : location === 'kombinasjon' ? '🔄 Kombinasjon (Senter & Hjemme)' : '🏋️‍♂️ Treningssenter'
                    }
                  </p>
                </div>
              </div>

              {/* Workout Previews */}
              <div className="space-y-3">
                {/* Program A Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
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
                    <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-bold">
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

              {/* Schedule Setup for Calendar Generation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Sett Startdato & Treningsdager i Kalenderen:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Startdato:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-bold text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Velg Treningsdager:</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { day: 1, label: 'Man' },
                        { day: 2, label: 'Tir' },
                        { day: 3, label: 'Ons' },
                        { day: 4, label: 'Tor' },
                        { day: 5, label: 'Fre' },
                        { day: 6, label: 'Lør' },
                        { day: 0, label: 'Søn' },
                      ].map((item) => {
                        const isSelected = selectedDays.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (selectedDays.length > 1) {
                                  setSelectedDays(selectedDays.filter((d) => d !== item.day));
                                }
                              } else {
                                setSelectedDays([...selectedDays, item.day]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  ← Tilbake
                </button>
                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aktiver & Generer Plan i Kalender!</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

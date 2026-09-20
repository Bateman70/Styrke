import React, { useState } from 'react';
import { WorkoutProgram, Exercise, WorkoutLog, LoggedExercise, LoggedSet, WorkoutType } from '../../types/workout';
import { WORKOUT_PROGRAMS, POPULAR_CUSTOM_EXERCISES } from '../../data/workoutProgramData';
import { VideoModal } from '../VideoModal';
import { RestTimer } from '../RestTimer';
import { PlayCircle, CheckCircle2, Circle, Save, Award, Dumbbell, AlertTriangle, Plus, Trash2, PlusCircle, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ActiveWorkoutViewProps {
  workoutType: WorkoutType;
  existingLog?: WorkoutLog;
  onSaveLog: (log: WorkoutLog) => void;
  onCancel: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  workoutType,
  existingLog,
  onSaveLog,
  onCancel,
}) => {
  const safeWorkoutType = (workoutType === 'lop' ? 'okt-a' : workoutType) as 'okt-a' | 'okt-b' | 'fri-okt';
  const selectedProgram: WorkoutProgram = WORKOUT_PROGRAMS[safeWorkoutType] || WORKOUT_PROGRAMS['okt-a'];

  const [activeVideoExercise, setActiveVideoExercise] = useState<Exercise | null>(null);
  
  // Dynamic exercises list for this session (starts with program exercises, user can add extra)
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>(() => {
    if (existingLog && existingLog.exercises && existingLog.exercises.length > 0) {
      // Reconstruct exercise objects from existing log if editing
      return existingLog.exercises.map((logEx) => {
        const foundInProg = selectedProgram.exercises.find((e) => e.id === logEx.exerciseId);
        const foundInPop = POPULAR_CUSTOM_EXERCISES.find((e) => e.id === logEx.exerciseId);
        if (foundInProg) return foundInProg;
        if (foundInPop) return foundInPop;
        return {
          id: logEx.exerciseId,
          name: logEx.exerciseName,
          category: 'Custom',
          groupLabel: 'Friøvelse',
          defaultSets: logEx.sets.length || 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Egendefinert øvelse.',
        };
      });
    }
    return [...selectedProgram.exercises];
  });

  // State for logged set values: exerciseId -> LoggedSet[]
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, LoggedSet[]>>(() => {
    const initial: Record<string, LoggedSet[]> = {};

    sessionExercises.forEach((ex) => {
      const foundInLog = existingLog?.exercises?.find((e) => e.exerciseId === ex.id);

      if (foundInLog && foundInLog.sets.length > 0) {
        initial[ex.id] = foundInLog.sets;
      } else {
        const sets: LoggedSet[] = [];
        for (let i = 1; i <= ex.defaultSets; i++) {
          sets.push({
            setNumber: i,
            weightKg: '',
            repsCompleted: ex.defaultReps,
            completed: false,
          });
        }
        initial[ex.id] = sets;
      }
    });

    return initial;
  });

  const [sessionNotes, setSessionNotes] = useState<string>(existingLog?.notes || '');
  const [workoutFinished, setWorkoutFinished] = useState(false);

  // Modal for adding a new exercise
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExSets, setCustomExSets] = useState(3);
  const [customExReps, setCustomExReps] = useState('10–12');

  // Toggle set completion
  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    setExerciseLogs((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      currentSets[setIndex] = {
        ...currentSets[setIndex],
        completed: !currentSets[setIndex].completed,
      };
      return { ...prev, [exerciseId]: currentSets };
    });
  };

  // Update set weight
  const handleWeightChange = (exerciseId: string, setIndex: number, val: string) => {
    setExerciseLogs((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      currentSets[setIndex] = {
        ...currentSets[setIndex],
        weightKg: val,
      };
      return { ...prev, [exerciseId]: currentSets };
    });
  };

  // Update set reps
  const handleRepsChange = (exerciseId: string, setIndex: number, val: string) => {
    setExerciseLogs((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      currentSets[setIndex] = {
        ...currentSets[setIndex],
        repsCompleted: val,
      };
      return { ...prev, [exerciseId]: currentSets };
    });
  };

  // Add an extra set to an exercise
  const handleAddSet = (exerciseId: string) => {
    setExerciseLogs((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      const lastSet = currentSets[currentSets.length - 1];
      const newSetNumber = currentSets.length + 1;
      
      const newSet: LoggedSet = {
        setNumber: newSetNumber,
        weightKg: lastSet ? lastSet.weightKg : '',
        repsCompleted: lastSet ? lastSet.repsCompleted : '10–12',
        completed: false,
      };

      return { ...prev, [exerciseId]: [...currentSets, newSet] };
    });
  };

  // Remove a set from an exercise
  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setExerciseLogs((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      if (currentSets.length <= 1) return prev; // keep at least 1 set
      currentSets.splice(setIndex, 1);
      // Re-number set numbers
      const renumbered = currentSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return { ...prev, [exerciseId]: renumbered };
    });
  };

  // Add an exercise (from preset or custom input)
  const handleAddExercise = (newEx: Exercise) => {
    if (sessionExercises.some((e) => e.id === newEx.id)) {
      // If already present, make ID unique
      newEx = { ...newEx, id: `${newEx.id}-${Date.now()}` };
    }

    setSessionExercises((prev) => [...prev, newEx]);

    // Initialize set log
    const initialSets: LoggedSet[] = [];
    for (let i = 1; i <= newEx.defaultSets; i++) {
      initialSets.push({
        setNumber: i,
        weightKg: '',
        repsCompleted: newEx.defaultReps,
        completed: false,
      });
    }

    setExerciseLogs((prev) => ({
      ...prev,
      [newEx.id]: initialSets,
    }));

    setIsAddExerciseOpen(false);
    setCustomExName('');
  };

  const handleAddCustomTypedExercise = () => {
    if (!customExName.trim()) return;
    const customEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: customExName.trim(),
      category: 'Custom',
      groupLabel: 'Friøvelse',
      defaultSets: customExSets || 3,
      defaultReps: customExReps || '10–12',
      restSeconds: 60,
      focus: 'Egendefinert øvelse.',
    };
    handleAddExercise(customEx);
  };

  // Complete workout
  const handleSaveWorkout = () => {
    const formattedExercises: LoggedExercise[] = sessionExercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: exerciseLogs[ex.id] || [],
    }));

    const finalLog: WorkoutLog = {
      id: existingLog?.id || `log-${workoutType}-${format(new Date(), 'yyyy-MM-dd')}-${Date.now()}`,
      date: existingLog?.date || format(new Date(), 'yyyy-MM-dd'),
      type: workoutType,
      status: 'completed',
      completedAt: new Date().toISOString(),
      exercises: formattedExercises,
      notes: sessionNotes,
    };

    onSaveLog(finalLog);
    setWorkoutFinished(true);
  };

  // Calculate total sets completed
  const totalSets = Object.values(exerciseLogs).reduce((acc, sets) => acc + sets.length, 0);
  const completedSetsCount = Object.values(exerciseLogs).reduce(
    (acc, sets) => acc + sets.filter((s) => s.completed).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

  if (workoutFinished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Økt fullført! Bravo!</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          {selectedProgram.title} er lagret i kalenderen din!
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
        >
          Gå til Kalender
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Video Modal popup */}
      <VideoModal exercise={activeVideoExercise} onClose={() => setActiveVideoExercise(null)} />

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>{workoutType === 'fri-okt' ? 'Egendefinert Økt' : 'Gjennomføring av Styrkeøkt'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{selectedProgram.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{selectedProgram.subtitle}</p>
          </div>

          <button
            onClick={handleSaveWorkout}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Fullfør Økt</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Fremgang ({completedSetsCount} av {totalSets} sett fullført)</span>
          <span className="font-bold text-slate-200">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2.5 rounded-full mt-1.5 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Sticky / Top Rest Timer */}
      <RestTimer initialSeconds={90} />

      {/* RIR Strategy Reminder Banner */}
      {workoutType !== 'fri-okt' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-400 block mb-0.5">RIR-veiledning (Repetisjoner i reserve):</span>
            Hold 2–3 repetisjoner i reserve de første 1–4 ukene. Ikke tren til utmattelse i oppstartsfasen.
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-6">
        {sessionExercises.map((exercise) => {
          const sets = exerciseLogs[exercise.id] || [];

          return (
            <div
              key={exercise.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md transition-all hover:border-slate-700/80"
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30 inline-block">
                      {exercise.groupLabel || exercise.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {sets.length} sett × {exercise.defaultReps} {exercise.isPerSide ? '(per side)' : ''}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-100 tracking-tight pt-1">
                    {exercise.name}
                  </h3>
                </div>

                {/* Video Demo Button if available */}
                {exercise.videoUrl && (
                  <button
                    onClick={() => setActiveVideoExercise(exercise)}
                    className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all self-start sm:self-auto"
                  >
                    <PlayCircle className="w-4 h-4 text-blue-400" />
                    <span>Se video & teknikktips</span>
                  </button>
                )}
              </div>

              {/* PDF Focus Note */}
              {exercise.focus && (
                <div className="mt-3 py-2 px-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 border border-slate-800/60 italic">
                  💬 {exercise.focus}
                </div>
              )}

              {/* Set-by-Set Logging Table */}
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2">
                  <div className="col-span-3 text-left">Sett</div>
                  <div className="col-span-4">Vekt (kg)</div>
                  <div className="col-span-3">Reps</div>
                  <div className="col-span-2 text-right">Huk av</div>
                </div>

                {sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      set.completed
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    {/* Set Number + Remove icon */}
                    <div className="col-span-3 text-left font-bold text-xs pl-2 text-slate-300 flex items-center space-x-1.5">
                      <span>Sett {set.setNumber}</span>
                      {sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exercise.id, setIdx)}
                          className="text-slate-600 hover:text-rose-400 p-0.5 transition-colors"
                          title="Fjern dette settet"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Weight Input */}
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={set.weightKg}
                        onChange={(e) => handleWeightChange(exercise.id, setIdx, e.target.value)}
                        placeholder="Eks. 16"
                        className="w-full text-center px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Reps Input */}
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={set.repsCompleted}
                        onChange={(e) => handleRepsChange(exercise.id, setIdx, e.target.value)}
                        placeholder={exercise.defaultReps}
                        className="w-full text-center px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Checkbox */}
                    <div className="col-span-2 flex justify-end pr-2">
                      <button
                        onClick={() => handleToggleSet(exercise.id, setIdx)}
                        className={`p-1.5 rounded-lg transition-all ${
                          set.completed
                            ? 'text-emerald-400 hover:text-emerald-300 scale-110'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {set.completed ? (
                          <CheckCircle2 className="w-6 h-6 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Extra Set Button */}
                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exercise.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Legg til sett {sets.length + 1}</span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Button to Add Extra Exercise to Workout */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAddExerciseOpen(true)}
          className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-dashed border-blue-500/40 text-blue-400 font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-md hover:border-blue-500"
        >
          <PlusCircle className="w-5 h-5 text-blue-400" />
          <span>+ Legg til ekstra øvelse i denne økten</span>
        </button>
      </div>

      {/* Session Notes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Notat om økten (valgfritt)
        </label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
          placeholder="Eks. Føltes bra i kroppen, prøvde ekstra sett på armhevinger..."
        />
      </div>

      {/* Footer Save Button */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
        >
          Avbryt Økt
        </button>
        <button
          onClick={handleSaveWorkout}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>Fullfør & Lagre</span>
        </button>
      </div>

      {/* Add Extra Exercise Modal Popup */}
      {isAddExerciseOpen && (
        <div
          onClick={() => setIsAddExerciseOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-100 font-bold text-lg">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>Legg til ekstra øvelse</span>
              </div>
              <button
                onClick={() => setIsAddExerciseOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pick Popular Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Velg fra populære øvelser:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_CUSTOM_EXERCISES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddExercise(preset)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-left transition-colors flex flex-col"
                  >
                    <span className="font-bold text-xs text-slate-200">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{preset.defaultSets} sett × {preset.defaultReps}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Eller skriv inn egendefinert øvelse:
              </label>

              <div>
                <input
                  type="text"
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                  placeholder="Eks. Biceps curl, Sideplanke..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Antall sett</label>
                  <input
                    type="number"
                    value={customExSets}
                    onChange={(e) => setCustomExSets(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Reps / varighet</label>
                  <input
                    type="text"
                    value={customExReps}
                    onChange={(e) => setCustomExReps(e.target.value)}
                    placeholder="Eks. 10–12 eller 45 sek"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomTypedExercise}
                disabled={!customExName.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
              >
                Legg til "{customExName.trim() || 'øvelse'}"
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

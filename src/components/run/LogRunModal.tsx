import React, { useState } from 'react';
import { X, Flame, Calendar as CalendarIcon, Save } from 'lucide-react';
import { WorkoutLog, RunDetails } from '../../types/workout';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { DatePickerModal } from '../common/DatePickerModal';

interface LogRunModalProps {
  date: string; // YYYY-MM-DD
  existingLog?: WorkoutLog;
  onSave: (log: WorkoutLog) => void;
  onClose: () => void;
}

export const LogRunModal: React.FC<LogRunModalProps> = ({ date: initialDate, existingLog, onSave, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [distanceKm, setDistanceKm] = useState<string>(
    existingLog?.runDetails?.distanceKm?.toString() || '7.5'
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    existingLog?.runDetails?.durationMinutes?.toString() || '45'
  );
  const [runType, setRunType] = useState<RunDetails['runType']>(
    existingLog?.runDetails?.runType || 'Rolig langtur'
  );
  const [notes, setNotes] = useState<string>(existingLog?.runDetails?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedLog: WorkoutLog = {
      id: existingLog?.id || `run-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      type: 'lop',
      status: 'completed',
      completedAt: new Date().toISOString(),
      runDetails: {
        distanceKm: parseFloat(distanceKm) || 0,
        durationMinutes: parseInt(durationMinutes) || 0,
        runType,
        notes,
      },
    };

    onSave(updatedLog);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      
      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <DatePickerModal
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          onClose={() => setIsDatePickerOpen(false)}
          title="Velg Dato for Løpeøkt"
        />
      )}

      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Registrer Løpeøkt</h3>
              <p className="text-xs text-slate-400">Spor løpeturen din sammen med styrketreningen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Visual Date Picker Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Dato for økten
            </label>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-orange-500 rounded-xl text-slate-100 flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold text-sm">
                {format(new Date(selectedDate), 'EEEE d. MMMM yyyy', { locale: nb })}
              </span>
              <div className="flex items-center space-x-1.5 text-orange-400 text-xs font-semibold group-hover:text-orange-300">
                <CalendarIcon className="w-4 h-4" />
                <span>Velg i kalender</span>
              </div>
            </button>
          </div>

          {/* Run Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Økttype
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['Rolig langtur', 'Intervall', 'Tempo', 'Restitusjon'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setRunType(t)}
                  className={`py-2 px-2 text-xs rounded-xl font-medium border transition-all ${
                    runType === t
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300 font-semibold shadow-sm'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Distance & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Distanse (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-lg focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="0.0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Varighet (minutter)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-lg focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="45"
                required
              />
            </div>
          </div>

          {/* Calculated Pace Preview */}
          {parseFloat(distanceKm) > 0 && parseInt(durationMinutes) > 0 && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Beregnet fellesfart (Pace):</span>
              <span className="font-mono font-bold text-orange-400">
                {Math.floor(parseInt(durationMinutes) / parseFloat(distanceKm))}:
                {Math.round(((parseInt(durationMinutes) / parseFloat(distanceKm)) % 1) * 60)
                  .toString()
                  .padStart(2, '0')}{' '}
                min/km
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notater / Følelse
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Eks. Gode bein, fint tempotreningspas..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-sm transition-all shadow-lg shadow-orange-600/20 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Lagre Løpeøkt</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

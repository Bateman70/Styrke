import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Sparkles, Check } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { DatePickerModal } from '../common/DatePickerModal';

interface AutoSchedulerModalProps {
  onGenerate: (selectedDays: number[], startDate: string) => void;
  onClose: () => void;
}

const WEEKDAYS = [
  { id: 1, label: 'Mandag', short: 'Man' },
  { id: 2, label: 'Tirsdag', short: 'Tir' },
  { id: 3, label: 'Onsdag', short: 'Ons' },
  { id: 4, label: 'Torsdag', short: 'Tor' },
  { id: 5, label: 'Fredag', short: 'Fre' },
  { id: 6, label: 'Lørdag', short: 'Lør' },
  { id: 0, label: 'Søndag', short: 'Søn' },
];

export const AutoSchedulerModal: React.FC<AutoSchedulerModalProps> = ({ onGenerate, onClose }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]); // Mandag & Torsdag by default
  const [startDate, setStartDate] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(selectedDays, startDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Date Picker Popup */}
      {isDatePickerOpen && (
        <DatePickerModal
          selectedDate={startDate}
          onSelectDate={(d) => setStartDate(d)}
          onClose={() => setIsDatePickerOpen(false)}
          title="Velg Startdato for Treningsplanen"
        />
      )}

      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Generer Treningsplan</h3>
              <p className="text-xs text-slate-400">Velg dager og startdato for Økt A & Økt B</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Day Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Velg hvilke dager i uken du trener styrke:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    type="button"
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{day.short}</span>
                    {isSelected && <Check className="w-3 h-3 mt-1 text-white" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Valgt: {selectedDays.length} dager per uke. Økt A og Økt B vil alternere på disse dagene.
            </p>
          </div>

          {/* Interactive Date Picker Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Startdato for ukesplanen
            </label>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl text-slate-100 flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold text-sm">
                {format(new Date(startDate), 'EEEE d. MMMM yyyy', { locale: nb })}
              </span>
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold group-hover:text-blue-300">
                <CalendarIcon className="w-4 h-4" />
                <span>Velg i kalender</span>
              </div>
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            💡 Planen vil opprette styrkeøkter på dine valgte dager i 6 uker fremover. Du kan når som helst endre eller flytte enkeltøkter i kalenderen.
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generer Plan</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

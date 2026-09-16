import React, { useState } from 'react';
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
  isSameDay,
  isToday,
} from 'date-fns';
import { nb } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerModalProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  title?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  selectedDate,
  onSelectDate,
  onClose,
  title = 'Velg Dato',
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handlePickDay = (dayObj: Date) => {
    const formatted = format(dayObj, 'yyyy-MM-dd');
    onSelectDate(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <CalendarIcon className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-sm text-slate-100 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: nb })}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj) => {
              const dateStr = format(dayObj, 'yyyy-MM-dd');
              const isSelected = dateStr === selectedDate;
              const isCurrentMonth = isSameMonth(dayObj, currentMonth);
              const isTodayDate = isToday(dayObj);

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => handlePickDay(dayObj)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                      : isTodayDate
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-500/40'
                      : isCurrentMonth
                      ? 'bg-slate-950/60 text-slate-200 hover:bg-slate-800'
                      : 'bg-transparent text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {format(dayObj, 'd')}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => handlePickDay(new Date())}
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              Velg i dag ({format(new Date(), 'dd.MM.yyyy')})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

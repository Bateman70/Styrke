import React, { useEffect, useState } from 'react';
import { Sparkles, X, Dumbbell, Zap, Cloud, CheckCircle2 } from 'lucide-react';
import { APP_VERSION } from '../../constants/version';

interface WhatsNewModalProps {
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(30);

  // 30-second auto-close timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn cursor-pointer"
      title="Klikk hvor som helst for å lukke"
    >
      <div
        onClick={onClose}
        className="bg-slate-900 border border-blue-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[85vh] flex flex-col cursor-pointer relative ring-1 ring-blue-500/20"
      >
        {/* Top bar with auto-close countdown */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
            <span>Nyheter i Styrke & Løp ({APP_VERSION})</span>
          </div>
          <span className="bg-slate-950/40 px-2 py-0.5 rounded-full font-mono text-[11px] text-cyan-200">
            Lukkes om {secondsLeft}s
          </span>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">Velkommen til versjon {APP_VERSION}!</h3>
              <p className="text-xs text-slate-400">Klikk hvor som helst på skjermen for å lukke</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Lukke popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-grow text-slate-200 text-sm">
          
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Ny økttype: Fri-økt (Egentrening)</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Loggfør uplanlagte økter, hjemmetrening eller friøvelser! Velg fra populære friøvelser som Push-ups, Chins og Kettlebell Swings, eller legg til dine egne.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Dynamisk Øktredigering</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Nå kan du enkelt legge til eller slette sett på enkeltøvelser, samt legge til nye friøvelser undervegs i alle økter (Økt A, Økt B og Fri-økt).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Toveis Sky-Synkronisering</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Treningsøktene dine lagres trygt i skyen og synkroniseres automatisk på tvers av PC, iPhone og Pixel-enheter.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 pt-2 italic">
            💡 Tips: Trykk hvor som helst på meldingen for å lukke den med en gang.
          </p>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Automatisk lukking om <strong className="text-blue-400">{secondsLeft}s</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Skjønner! Lukk melding</span>
          </button>
        </div>
      </div>
    </div>
  );
};

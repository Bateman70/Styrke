import React from 'react';
import { X, ExternalLink, Lightbulb, PlayCircle } from 'lucide-react';
import { Exercise } from '../types/workout';

interface VideoModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ exercise, onClose }) => {
  if (!exercise) return null;

  const directYoutubeUrl = exercise.videoUrl ? exercise.videoUrl.replace('/embed/', '/watch?v=') : '#';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl transition-all cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{exercise.name}</h3>
              <p className="text-xs text-slate-400">{exercise.category} {exercise.groupLabel ? `(${exercise.groupLabel})` : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Video & Info */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Direct YouTube link fallback button if browser blocks inline player */}
          {exercise.videoUrl && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Teknikkvideo for øvelsen:</span>
              <a
                href={directYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Åpne direkte i YouTube</span>
              </a>
            </div>
          )}

          {/* Responsive Video Embed */}
          {exercise.videoUrl && (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
              <iframe
                src={exercise.videoUrl}
                title={exercise.videoTitle || exercise.name}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* PDF Focus Points Card */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-sm font-semibold">
              <Lightbulb className="w-4 h-4" />
              <span>Fokuspunkter & Teknikk fra programmet:</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-amber-500/40">
              {exercise.focus}
            </p>
          </div>

          {/* Recommended Reps / Sets */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="block text-xs text-slate-400">Anbefalt Sett</span>
              <span className="text-base font-bold text-slate-200">{exercise.defaultSets} sett</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="block text-xs text-slate-400">Repetisjoner</span>
              <span className="text-base font-bold text-blue-400">{exercise.defaultReps}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="block text-xs text-slate-400">Hvilestyrke / Pause</span>
              <span className="text-base font-bold text-emerald-400">{exercise.restSeconds} sek</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};

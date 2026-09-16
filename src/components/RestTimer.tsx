import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 90 }) => {
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setTimeLeft(targetSeconds);
  }, [targetSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (soundEnabled) {
        playBeep();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, soundEnabled]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio not supported or allowed', e);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = (sec?: number) => {
    const s = sec || targetSeconds;
    setTargetSeconds(s);
    setTimeLeft(s);
    setIsActive(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = ((targetSeconds - timeLeft) / targetSeconds) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Left: Timer Title & Quick Presets */}
      <div className="flex items-center space-x-3">
        <div className={`p-2.5 rounded-xl transition-all ${
          timeLeft === 0 
            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' 
            : isActive 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-slate-800 text-slate-400'
        }`}>
          <Timer className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Pause-timer</h4>
          <div className="flex items-center space-x-1.5 mt-1">
            {[90, 60, 45, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => resetTimer(sec)}
                className={`px-2 py-0.5 text-xs rounded-md font-medium transition-all ${
                  targetSeconds === sec
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: Digital Countdown */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center">
          <span className={`text-2xl font-mono font-bold tracking-wider ${
            timeLeft === 0 
              ? 'text-emerald-400' 
              : timeLeft <= 10 && isActive
              ? 'text-amber-400 animate-pulse'
              : 'text-slate-100'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Progress indicator bar */}
        <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              timeLeft === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTimer}
          className={`p-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center ${
            isActive
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
          }`}
          title={isActive ? 'Pause' : 'Start Timer'}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => resetTimer()}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Nullstill timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl transition-colors ${
            soundEnabled ? 'bg-slate-800 text-blue-400' : 'bg-slate-800/50 text-slate-600'
          }`}
          title={soundEnabled ? 'Lyd aktivert' : 'Lyd av'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};

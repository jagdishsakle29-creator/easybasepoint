import React, { useState, useEffect } from 'react';
import { Timer, Clock, Sparkles, ChevronDown, ChevronUp, RotateCw, Play, Pause, Flame } from 'lucide-react';

interface FloatingTimerProps {
  initialMinutes?: number;
  label?: string;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
  initialMinutes = 15,
  label = "Live Quota Cycle"
}) => {
  // Timer mode: 'countdown' or 'stopwatch'
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('ebp_floating_timer_sec');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return initialMinutes * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ebp_timer_minimized') === 'true';
    } catch {
      return false;
    }
  });

  // Tick effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Auto-restart cycle
          return initialMinutes * 60;
        }
        const next = prev - 1;
        try {
          sessionStorage.setItem('ebp_floating_timer_sec', next.toString());
        } catch {}
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, initialMinutes]);

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('ebp_timer_minimized', next.toString());
      } catch {}
      return next;
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSecondsRemaining(initialMinutes * 60);
    setIsRunning(true);
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning((prev) => !prev);
  };

  // Format time
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  // Formatted string
  const formattedTime = hours > 0 
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="fixed bottom-20 right-3.5 z-40 sm:bottom-6 sm:right-6 select-none font-sans transition-all duration-300">
      {isMinimized ? (
        // Minimized Floating Pill
        <button
          type="button"
          onClick={toggleMinimize}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-950/90 text-white border border-amber-500/50 shadow-[0_8px_24px_rgba(255,107,0,0.35)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Click to expand timer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <Timer className="w-3.5 h-3.5 text-[#FF6B00] group-hover:rotate-12 transition-transform" />
          
          <span className="font-mono font-black text-xs text-amber-300 tracking-wider">
            {formattedTime}
          </span>

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
        </button>
      ) : (
        // Expanded Glassmorphism Timer Card
        <div className="w-64 bg-slate-950/92 backdrop-blur-xl rounded-2xl border border-amber-500/40 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] text-white space-y-2.5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1 font-outfit">
                <Flame className="w-3 h-3 text-[#FF6B00]" />
                {label}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMinimize}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Minimize timer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Digital Timer Display */}
          <div className="bg-black/50 rounded-xl p-2.5 border border-white/10 text-center relative overflow-hidden">
            <div className="text-[10px] text-slate-400 font-medium tracking-wide mb-0.5">
              CYCLE SETTLEMENT COUNTDOWN
            </div>

            <div className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest flex items-center justify-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100 drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]">
              <span>{hours > 0 ? pad(hours) + ':' : ''}</span>
              <span>{pad(minutes)}</span>
              <span className="animate-pulse text-amber-400">:</span>
              <span>{pad(seconds)}</span>
            </div>

            <div className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Auto-refreshes every second
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-0.5 text-[10px]">
            <span className="text-slate-400 font-medium">Status: {isRunning ? '🟢 Active' : '⏸️ Paused'}</span>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePlayPause}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title={isRunning ? "Pause timer" : "Resume timer"}
              >
                {isRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>{isRunning ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-amber-300 font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Reset timer to 15m"
              >
                <RotateCw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Home, Sparkles, Wifi } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';
import type { GameMode } from '../types/game';

interface HeaderProps {
  mode: GameMode;
  currentRound?: number;
  totalRounds?: number;
  playerOneScore: number;
  playerTwoScore: number;
  playerOneName: string;
  playerTwoName: string;
  onHomeClick: () => void;
  onRestartClick?: () => void;
  isOnlineConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  currentRound = 1,
  totalRounds = 5,
  playerOneScore,
  playerTwoScore,
  playerOneName,
  playerTwoName,
  onHomeClick,
  onRestartClick,
  isOnlineConnected,
}) => {
  const [muted, setMuted] = React.useState(sound.getMuted());

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/95 backdrop-blur-md px-3 py-2.5 shadow-lg shadow-black/40" dir="rtl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Right side in RTL: Brand & Home */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onHomeClick();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700 text-xs font-bold"
            title="القائمة الرئيسية"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">القائمة</span>
          </button>

          <div className="flex flex-col">
            <span className="font-heading font-black text-sm sm:text-base tracking-wide bg-gradient-to-l from-cyan-400 via-sky-300 to-pink-500 bg-clip-text text-transparent">
              تحدي الأرقام
            </span>
            <div className="flex items-center gap-1.5">
              {mode === 'practice' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  وضع التدريب
                </span>
              )}
              {mode === 'online_room' && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isOnlineConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <Wifi className="w-2.5 h-2.5" />
                  {isOnlineConnected ? 'متصل بالخادم' : 'جاري الاتصال...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Match Scoreboard */}
        {(mode === 'practice' || mode === 'online_room') && (
          <div className="flex items-center gap-2.5 bg-slate-900/90 px-3 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {/* Player One */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-xs font-bold text-cyan-300 max-w-[65px] truncate sm:max-w-none">{playerOneName}</span>
              <span className="font-heading font-black text-sm text-cyan-400 tabular-nums bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/40">
                {toArabicDigits(playerOneScore)}
              </span>
            </div>

            <div className="text-slate-600 font-black text-xs px-1">ضد</div>

            {/* Player Two */}
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm text-pink-400 tabular-nums bg-pink-950/60 px-2 py-0.5 rounded-lg border border-pink-800/40">
                {toArabicDigits(playerTwoScore)}
              </span>
              <span className="text-xs font-bold text-pink-300 max-w-[65px] truncate sm:max-w-none">{playerTwoName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            </div>

            {/* Round Indicator */}
            <div className="hidden xs:flex items-center mr-1 pr-2 border-r border-slate-700/80 text-[11px] text-slate-400 font-bold whitespace-nowrap">
              جولة {toArabicDigits(currentRound)} / {toArabicDigits(totalRounds)}
            </div>
          </div>
        )}

        {/* Left side in RTL: Quick Controls */}
        <div className="flex items-center gap-1.5">
          {onRestartClick && (mode === 'practice' || mode === 'online_room') && (
            <button
              onClick={() => {
                sound.playClick();
                onRestartClick();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700"
              title="إعادة المباراة"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl transition active:scale-95 border ${
              muted 
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-400' 
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-cyan-400'
            }`}
            title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useMemo, useRef } from 'react';
import { Lock, Check, Shuffle } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';
import type { Role } from '../types/game';

interface NumberGridProps {
  playerRole: Role;
  playerName: string;
  selectedNumber: number | null;
  isLocked: boolean;
  onSelectNumber: (num: number) => void;
  onLockNumber: () => void;
  disabled?: boolean;
}

export const NumberGrid: React.FC<NumberGridProps> = ({
  playerRole,
  playerName,
  selectedNumber,
  isLocked,
  onSelectNumber,
  onLockNumber,
  disabled = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isPrimary = playerRole === 'ali';
  const roleColor = isPrimary ? 'text-cyan-400' : 'text-pink-400';
  const roleGlow = isPrimary 
    ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
    : 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]';
  const roleBadgeBg = isPrimary 
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' 
    : 'bg-pink-950/80 text-pink-300 border-pink-800';
  const roleButtonGradient = isPrimary
    ? 'from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
    : 'from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]';

  // 100 individual cards (1 through 100)
  const numbers = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  const handleCardClick = (num: number) => {
    if (isLocked || disabled) return;
    sound.playCardSelect(num);
    onSelectNumber(num);
  };

  const handleRandomSelect = () => {
    if (isLocked || disabled) return;
    const random = Math.floor(Math.random() * 100) + 1;
    sound.playCardSelect(random);
    onSelectNumber(random);
  };

  const handleLock = () => {
    if (isLocked || disabled || selectedNumber === null) return;
    sound.playLock();
    onLockNumber();
  };

  return (
    <div className="flex flex-col flex-1 max-w-xl mx-auto w-full px-2 sm:px-4 pb-24 select-none" dir="rtl">
      {/* Player Header Banner */}
      <div className="flex items-center justify-between mb-3 bg-slate-900/90 px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${isPrimary ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-pink-500 shadow-[0_0_10px_#ec4899]'}`} />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">اختيار الرقم</span>
            <span className={`font-heading font-black text-base sm:text-lg ${roleColor}`}>
              دور: {playerName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Random Button */}
          {!isLocked && !disabled && (
            <button
              onClick={handleRandomSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
              title="اختيار رقم عشوائي"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>اختيار عشوائي</span>
            </button>
          )}

          <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${isLocked ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : roleBadgeBg}`}>
            {isLocked ? 'تم التأكيد ✓' : 'جاري الاختيار...'}
          </div>
        </div>
      </div>

      {/* The 100 Individual Number Cards Grid (Full Height Reclaimed) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-[50vh] max-h-[64vh] sm:max-h-[68vh] p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner custom-scrollbar"
      >
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          {numbers.map((num) => {
            const isSelected = selectedNumber === num;
            return (
              <button
                key={num}
                type="button"
                disabled={isLocked || disabled}
                onClick={() => handleCardClick(num)}
                className={`relative flex flex-col items-center justify-center h-12 sm:h-13 rounded-xl font-heading font-bold text-base sm:text-lg transition-all select-none ${
                  isSelected
                    ? `${roleGlow} bg-slate-800 scale-[1.04] z-10 font-black ${isPrimary ? 'text-cyan-300' : 'text-pink-300'}`
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 active:scale-95'
                } ${isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-pointer active:scale-90'}`}
              >
                <span>{toArabicDigits(num)}</span>
                {isSelected && (
                  <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow ${
                    isPrimary ? 'bg-cyan-400 text-slate-950' : 'bg-pink-500 text-white'
                  }`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#070b14]/95 border-t border-slate-800/90 p-3 backdrop-blur-md shadow-[0_-10px_25px_rgba(0,0,0,0.6)]" dir="rtl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Selected Number Display */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              الرقم المختار:
            </span>
            <div className={`font-heading font-black text-xl sm:text-2xl min-w-[55px] text-center px-2.5 py-1 rounded-xl bg-slate-900 border ${
              selectedNumber !== null 
                ? (isPrimary ? 'border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.4)]') 
                : 'border-slate-800 text-slate-600'
            }`}>
              {selectedNumber !== null ? toArabicDigits(selectedNumber) : '--'}
            </div>
          </div>

          {/* Confirm & Lock Button */}
          <button
            type="button"
            disabled={isLocked || disabled || selectedNumber === null}
            onClick={handleLock}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-slate-950 transition active:scale-95 ${
              isLocked
                ? 'bg-emerald-600 text-white cursor-not-allowed opacity-90'
                : selectedNumber !== null
                ? `bg-gradient-to-r ${roleButtonGradient} cursor-pointer`
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isLocked ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>تم تأكيد الرقم</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>تأكيد الرقم {selectedNumber !== null ? `(${toArabicDigits(selectedNumber)})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

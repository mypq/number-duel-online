import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, Award } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';
import type { RoundHistory } from '../types/game';

interface FinalResultsProps {
  playerOneScore: number;
  playerTwoScore: number;
  playerOneName: string;
  playerTwoName: string;
  history: RoundHistory[];
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const FinalResults: React.FC<FinalResultsProps> = ({
  playerOneScore,
  playerTwoScore,
  playerOneName,
  playerTwoName,
  history,
  onPlayAgain,
  onMainMenu,
}) => {
  const isTie = playerOneScore === playerTwoScore;
  const winner = playerOneScore > playerTwoScore ? 'one' : playerTwoScore > playerOneScore ? 'two' : 'tie';
  const winnerName = winner === 'one' ? playerOneName : winner === 'two' ? playerTwoName : 'تعادل';

  useEffect(() => {
    if (!isTie) {
      sound.playVictory();
    } else {
      sound.playReveal();
    }
  }, [isTie]);

  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4 py-8 select-none animate-in fade-in zoom-in duration-300" dir="rtl">
      {/* Victory Header Lockup */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className={`p-4 rounded-3xl border mb-3 shadow-2xl ${
          isTie
            ? 'bg-slate-900 border-amber-500/60 text-amber-400 shadow-amber-500/20'
            : winner === 'one'
            ? 'bg-gradient-to-b from-cyan-900 to-slate-900 border-cyan-400 text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.5)]'
            : 'bg-gradient-to-b from-pink-900 to-slate-900 border-pink-500 text-pink-300 shadow-[0_0_35px_rgba(236,72,153,0.5)]'
        }`}>
          {isTie ? <Award className="w-12 h-12" /> : <Trophy className="w-12 h-12" />}
        </div>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          النتيجة النهائية
        </div>

        <h1 className={`font-heading font-black text-3xl sm:text-4xl tracking-wide ${
          isTie
            ? 'text-amber-400'
            : winner === 'one'
            ? 'text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]'
            : 'text-pink-300 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]'
        }`}>
          {isTie ? 'انتهت المباراة بالتعادل!' : `فاز ${winnerName} بالمباراة!`}
        </h1>

        <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
          {isTie
            ? `حقق الطرفان مجموعاً متساوياً برصيد ${toArabicDigits(playerOneScore)} نقطة!`
            : `حقق ${winnerName} الفوز بجدارة وتفوق في سرعة الحساب والبديهة.`}
        </p>
      </div>

      {/* Final Score Board */}
      <div className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl mb-6">
        <div className="text-xs font-bold text-slate-400 text-center mb-3">
          لوحة النتائج الإجمالية
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Player One */}
          <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
            winner === 'one'
              ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-cyan-400 uppercase">{playerOneName}</span>
            <span className="font-heading font-black text-4xl sm:text-5xl text-cyan-300 my-1 tabular-nums">
              {toArabicDigits(playerOneScore)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {toArabicDigits(playerOneScore)} {playerOneScore === 1 ? 'نقطة' : 'نقاط'}
            </span>
          </div>

          {/* Player Two */}
          <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
            winner === 'two'
              ? 'bg-pink-950/70 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-pink-400 uppercase">{playerTwoName}</span>
            <span className="font-heading font-black text-4xl sm:text-5xl text-pink-300 my-1 tabular-nums">
              {toArabicDigits(playerTwoScore)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {toArabicDigits(playerTwoScore)} {playerTwoScore === 1 ? 'نقطة' : 'نقاط'}
            </span>
          </div>
        </div>
      </div>

      {/* Round-by-Round History Breakdown */}
      {history.length > 0 && (
        <div className="w-full bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 mb-6">
          <div className="text-xs font-bold text-slate-400 mb-2">
            مراجعة جولات المباراة
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pl-1">
            {history.map((r) => (
              <div
                key={r.roundNumber}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/70 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">جولة {toArabicDigits(r.roundNumber)}</span>
                  <span className="font-heading font-semibold text-slate-300 flex items-center gap-1" dir="ltr">
                    <span className="text-cyan-400">{toArabicDigits(r.aliNumber)}</span>
                    <span>+</span>
                    <span className="text-pink-400">{toArabicDigits(r.walaaNumber)}</span>
                    <span>=</span>
                    <strong className="text-white">{toArabicDigits(r.sum)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {r.winner === 'ali' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                      {playerOneName} (+٣)
                    </span>
                  )}
                  {r.winner === 'walaa' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-700">
                      {playerTwoName} (+٣)
                    </span>
                  )}
                  {r.winner === 'draw' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      تعادل (٠)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Working Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="flex-1 py-3.5 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>العب مجدداً</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onMainMenu();
          }}
          className="flex-1 py-3.5 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <Home className="w-4 h-4 text-cyan-400" />
          <span>القائمة الرئيسية</span>
        </button>
      </div>
    </div>
  );
};

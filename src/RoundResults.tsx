import React from 'react';
import { Trophy, ArrowLeft, ShieldAlert, Clock } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits, formatArabicSeconds } from '../utils/arabic';
import type { Role } from '../types/game';

interface RoundResultsProps {
  roundNumber: number;
  totalRounds: number;
  playerOneNumber: number;
  playerTwoNumber: number;
  targetSum: number;
  winner: Role | 'draw';
  playerOneScoreGained: number;
  playerTwoScoreGained: number;
  playerOneTotalScore: number;
  playerTwoTotalScore: number;
  playerOneName: string;
  playerTwoName: string;
  reason: string;
  reactionTimeMs?: number | null;
  onNextRound: () => void;
  isLastRound: boolean;
}

export const RoundResults: React.FC<RoundResultsProps> = ({
  roundNumber,
  totalRounds,
  playerOneNumber,
  playerTwoNumber,
  targetSum,
  winner,
  playerOneScoreGained,
  playerTwoScoreGained,
  playerOneTotalScore,
  playerTwoTotalScore,
  playerOneName,
  playerTwoName,
  reason,
  reactionTimeMs,
  onNextRound,
  isLastRound,
}) => {
  const isDraw = winner === 'draw';
  const winnerName = winner === 'ali' ? playerOneName : winner === 'walaa' ? playerTwoName : 'الطرفان';

  const handleNext = () => {
    sound.playClick();
    onNextRound();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4 py-6 select-none animate-in fade-in zoom-in duration-300" dir="rtl">
      {/* Round Header */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 mb-4 uppercase tracking-wider">
        <span>نتيجة الجولة: اكتملت الجولة {toArabicDigits(roundNumber)} من {toArabicDigits(totalRounds)}</span>
      </div>

      {/* Winner Announcement Card */}
      <div className={`w-full p-6 rounded-3xl border text-center shadow-xl mb-5 ${
        isDraw
          ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 shadow-slate-900/40'
          : winner === 'ali'
          ? 'bg-gradient-to-b from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-500/70 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
          : 'bg-gradient-to-b from-pink-950/70 via-slate-900 to-slate-950 border-pink-500/70 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
      }`}>
        <div className="flex justify-center mb-3">
          {isDraw ? (
            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400">
              <ShieldAlert className="w-9 h-9" />
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border shadow-lg ${
              winner === 'ali' ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-pink-950 border-pink-400 text-pink-300'
            }`}>
              <Trophy className="w-9 h-9" />
            </div>
          )}
        </div>

        <h2 className={`font-heading font-black text-2xl sm:text-3xl tracking-wide mb-1.5 ${
          isDraw ? 'text-amber-300' : winner === 'ali' ? 'text-cyan-300' : 'text-pink-300'
        }`}>
          {isDraw ? 'تعادل في هذه الجولة (٠ نقطة)' : `فاز ${winnerName} بالجولة! (+٣ نقاط)`}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed">
          {reason}
        </p>

        {reactionTimeMs && (
          <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-heading font-bold text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-800/40">
            <Clock className="w-3.5 h-3.5" />
            <span>تمت الإجابة في {formatArabicSeconds(reactionTimeMs / 1000)} ثانية!</span>
          </div>
        )}
      </div>

      {/* Arithmetic Equation Breakdown */}
      <div className="w-full bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-5">
        <div className="text-xs font-bold text-slate-400 text-center mb-2">
          مراجعة المسألة الحسابية
        </div>
        <div className="flex items-center justify-center gap-3 font-heading font-black text-xl sm:text-2xl" dir="ltr">
          <span className="text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-800/50">
            {toArabicDigits(playerOneNumber)}
          </span>
          <span className="text-slate-500 font-bold">+</span>
          <span className="text-pink-400 bg-pink-950/60 px-3 py-1 rounded-xl border border-pink-800/50">
            {toArabicDigits(playerTwoNumber)}
          </span>
          <span className="text-slate-500 font-bold">=</span>
          <span className="text-emerald-400 bg-emerald-950/60 px-3.5 py-1 rounded-xl border border-emerald-800/50">
            {toArabicDigits(targetSum)}
          </span>
        </div>
      </div>

      {/* Current Match Leaderboard */}
      <div className="w-full grid grid-cols-2 gap-3 mb-6">
        {/* Player One Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-300">{playerOneName}</span>
              <span className="text-[10px] text-slate-400">
                {playerOneScoreGained > 0 ? `+${toArabicDigits(playerOneScoreGained)} نقاط` : '٠ نقطة'}
              </span>
            </div>
          </div>
          <span className="font-heading font-black text-2xl text-cyan-400 tabular-nums">
            {toArabicDigits(playerOneTotalScore)}
          </span>
        </div>

        {/* Player Two Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-pink-300">{playerTwoName}</span>
              <span className="text-[10px] text-slate-400">
                {playerTwoScoreGained > 0 ? `+${toArabicDigits(playerTwoScoreGained)} نقاط` : '٠ نقطة'}
              </span>
            </div>
          </div>
          <span className="font-heading font-black text-2xl text-pink-400 tabular-nums">
            {toArabicDigits(playerTwoTotalScore)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleNext}
        className="w-full py-4 px-6 rounded-2xl font-heading font-black text-base uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
      >
        <span>{isLastRound ? 'عرض النتيجة النهائية للمباراة' : `المتابعة إلى الجولة ${toArabicDigits(roundNumber + 1)}`}</span>
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};

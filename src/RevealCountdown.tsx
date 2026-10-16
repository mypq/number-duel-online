import React, { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';

interface RevealCountdownProps {
  playerOneNumber: number;
  playerTwoNumber: number;
  playerOneName: string;
  playerTwoName: string;
  onFinished: () => void;
}

export const RevealCountdown: React.FC<RevealCountdownProps> = ({
  playerOneNumber,
  playerTwoNumber,
  playerOneName,
  playerTwoName,
  onFinished,
}) => {
  const [step, setStep] = useState<number>(3);

  useEffect(() => {
    sound.playReveal();

    const t1 = setTimeout(() => {
      setStep(2);
      sound.playTick();
    }, 800);

    const t2 = setTimeout(() => {
      setStep(1);
      sound.playTick();
    }, 1600);

    const t3 = setTimeout(() => {
      setStep(0);
      sound.playReveal();
    }, 2400);

    const t4 = setTimeout(() => {
      onFinished();
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinished]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto px-4 py-8 text-center select-none" dir="rtl">
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-6 uppercase tracking-wider animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>تم تأكيد الاختيارات! جاري الكشف عن الأرقام</span>
      </div>

      {step > 0 ? (
        <div className="flex flex-col items-center justify-center my-6">
          <div className="text-8xl sm:text-9xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-bounce">
            {toArabicDigits(step)}
          </div>
          <div className="text-slate-400 text-sm font-bold tracking-wider mt-3">
            استعد لحساب المجموع فوراً...
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-center gap-4 sm:gap-6 my-4 w-full">
            {/* Player One Card */}
            <div className="flex flex-col items-center flex-1 max-w-[150px]">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-1.5">{playerOneName}</span>
              <div className="w-full aspect-[4/5] rounded-3xl bg-gradient-to-b from-cyan-950 to-slate-900 border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-cyan-500/80 mb-0.5">الرقم المختار</span>
                <span className="font-heading font-black text-4xl sm:text-5xl text-cyan-300 my-1">
                  {toArabicDigits(playerOneNumber)}
                </span>
                <span className="w-8 h-1 bg-cyan-400 rounded-full mt-1" />
              </div>
            </div>

            {/* PLUS SIGN */}
            <div className="flex flex-col items-center justify-center">
              <span className="font-heading font-black text-4xl sm:text-5xl text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                +
              </span>
            </div>

            {/* Player Two Card */}
            <div className="flex flex-col items-center flex-1 max-w-[150px]">
              <span className="text-xs font-black text-pink-400 uppercase tracking-wider mb-1.5">{playerTwoName}</span>
              <div className="w-full aspect-[4/5] rounded-3xl bg-gradient-to-b from-pink-950 to-slate-900 border-2 border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.5)] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-pink-500/80 mb-0.5">الرقم المختار</span>
                <span className="font-heading font-black text-4xl sm:text-5xl text-pink-300 my-1">
                  {toArabicDigits(playerTwoNumber)}
                </span>
                <span className="w-8 h-1 bg-pink-500 rounded-full mt-1" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-slate-300 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs sm:text-sm font-semibold">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="flex items-center gap-1.5">
              <span>مسألة الجمع:</span>
              <bdi className="font-heading font-black text-white text-base">
                {toArabicDigits(playerOneNumber)} + {toArabicDigits(playerTwoNumber)}
              </bdi>
            </span>
          </div>

          <div className="mt-3 text-xs text-amber-400 font-bold uppercase tracking-wider animate-pulse">
            يبدأ سباق الإجابة الآن!
          </div>
        </div>
      )}
    </div>
  );
};

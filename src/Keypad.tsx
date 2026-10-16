import React, { useEffect, useCallback } from 'react';
import { Delete, ArrowLeft, XCircle } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';

interface KeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
  isPrimaryTurn?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  submitLabel = 'إرسال الإجابة',
  isPrimaryTurn = true,
}) => {
  const handleDigit = useCallback((d: string) => {
    if (disabled) return;
    if (value.length >= 4) return;
    sound.playClick();
    onChange(value + d);
  }, [value, onChange, disabled]);

  const handleBackspace = useCallback(() => {
    if (disabled || value.length === 0) return;
    sound.playClick();
    onChange(value.slice(0, -1));
  }, [value, onChange, disabled]);

  const handleClear = useCallback(() => {
    if (disabled || value.length === 0) return;
    sound.playClick();
    onChange('');
  }, [value, onChange, disabled]);

  const handleSubmit = useCallback(() => {
    if (disabled || value.trim().length === 0) return;
    sound.playClick();
    onSubmit();
  }, [disabled, value, onSubmit]);

  // Support physical hardware keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleDigit, handleBackspace, handleSubmit, handleClear]);

  const btnTheme = isPrimaryTurn
    ? 'hover:border-cyan-500/50 active:bg-cyan-950/60 active:border-cyan-400'
    : 'hover:border-pink-500/50 active:bg-pink-950/60 active:border-pink-400';

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 select-none" dir="rtl">
      {/* 3x4 Keypad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className={`h-14 sm:h-16 rounded-2xl font-heading font-black text-2xl sm:text-3xl bg-slate-900/90 text-slate-100 border border-slate-800 transition active:scale-95 shadow-md flex items-center justify-center ${btnTheme} ${
              disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span>{toArabicDigits(digit)}</span>
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleClear}
          className={`h-14 sm:h-16 rounded-2xl font-heading font-bold text-xs uppercase bg-slate-900/90 text-rose-400 border border-slate-800 transition active:scale-95 shadow-md flex flex-col items-center justify-center gap-0.5 hover:border-rose-500/50 ${
            disabled || value.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title="مسح"
        >
          <XCircle className="w-5 h-5" />
          <span>مسح</span>
        </button>

        {/* Zero */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className={`h-14 sm:h-16 rounded-2xl font-heading font-black text-2xl sm:text-3xl bg-slate-900/90 text-slate-100 border border-slate-800 transition active:scale-95 shadow-md flex items-center justify-center ${btnTheme} ${
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span>{toArabicDigits(0)}</span>
        </button>

        {/* Backspace */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleBackspace}
          className={`h-14 sm:h-16 rounded-2xl font-heading font-bold text-xs uppercase bg-slate-900/90 text-amber-400 border border-slate-800 transition active:scale-95 shadow-md flex flex-col items-center justify-center gap-0.5 hover:border-amber-500/50 ${
            disabled || value.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title="حذف رقم"
        >
          <Delete className="w-5 h-5" />
          <span>تراجع</span>
        </button>
      </div>

      {/* Big Submit Button */}
      <button
        type="button"
        disabled={disabled || value.trim().length === 0}
        onClick={handleSubmit}
        className={`w-full py-3.5 px-4 rounded-2xl font-heading font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-lg ${
          disabled || value.trim().length === 0
            ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            : isPrimaryTurn
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer hover:from-cyan-400 hover:to-blue-500'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer hover:from-pink-400 hover:to-purple-500'
        }`}
      >
        <span>{submitLabel}</span>
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};

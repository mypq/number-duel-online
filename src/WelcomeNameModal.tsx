import React, { useState } from 'react';
import { User, ArrowLeft, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface WelcomeNameModalProps {
  isOpen: boolean;
  onSaveName: (name: string) => void;
  initialName?: string;
  isChangingName?: boolean;
  onClose?: () => void;
}

export const WelcomeNameModal: React.FC<WelcomeNameModalProps> = ({
  isOpen,
  onSaveName,
  initialName = '',
  isChangingName = false,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState<string>(initialName);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setError('يرجى كتابة اسمك للمتابعة');
      return;
    }
    sound.playClick();
    onSaveName(cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-sm bg-[#0c1222] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-right">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-3">
            <User className="w-8 h-8" />
          </div>

          <h2 className="font-heading font-black text-2xl text-white tracking-wide">
            {isChangingName ? 'تغيير الاسم' : 'مرحباً بك في تحدي الأرقام'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {isChangingName
              ? 'اختر اسماً جديداً يظهر للاعبين في لوحة النتائج'
              : 'أدخل اسمك المفضل للمنافسة في جولات التحدي الحماسية'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-2">
              اكتب اسمك
            </label>
            <input
              type="text"
              autoFocus
              maxLength={15}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: البطل"
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-right font-bold transition shadow-inner"
            />
            {error && (
              <p className="text-rose-400 text-xs mt-1.5 font-bold">
                {error}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>متابعة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            {isChangingName && onClose && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

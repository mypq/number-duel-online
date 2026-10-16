import React from 'react';
import { X, Volume2, VolumeX, Shield, User, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';
import type { MatchSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MatchSettings;
  onUpdateSettings: (newSettings: MatchSettings) => void;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  playerName,
  onUpdatePlayerName,
}) => {
  const [rounds, setRounds] = React.useState<3 | 5 | 10>(settings.totalRounds);
  const [timer, setTimer] = React.useState<5 | 10 | 15>(settings.timerSeconds);
  const [name, setName] = React.useState<string>(playerName);
  const [isMuted, setIsMuted] = React.useState<boolean>(sound.getMuted());
  const [error, setError] = React.useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('يرجى كتابة اسم صحيح');
      return;
    }
    sound.playClick();
    onUpdateSettings({
      totalRounds: rounds,
      timerSeconds: timer,
    });
    onUpdatePlayerName(cleanName);
    onClose();
  };

  const handleToggleAudio = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="font-heading font-black text-lg text-white uppercase tracking-wider">
              الإعدادات
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pl-1">
          {/* Change Display Name */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <label className="block text-xs font-bold text-cyan-300 mb-1.5">
              تغيير الاسم
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
              <input
                type="text"
                maxLength={15}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="اكتب اسمك"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400 font-bold"
              />
            </div>
            {error && (
              <p className="text-rose-400 text-xs mt-1 font-bold">
                {error}
              </p>
            )}
          </div>

          {/* Rounds */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              عدد جولات المباراة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([3, 5, 10] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setRounds(r);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-heading font-bold border transition ${
                    rounds === r
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {toArabicDigits(r)} جولات
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              مؤقت سرعة الحساب
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTimer(s);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-heading font-bold border transition ${
                    timer === s
                      ? 'bg-pink-950/90 border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {toArabicDigits(s)} ثوانٍ
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span className="text-xs font-bold text-slate-200">المؤثرات الصوتية</span>
            </div>
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
              }`}
            >
              {isMuted ? 'مكتوم' : 'مفعل'}
            </button>
          </div>

          {/* Architecture Note in Arabic */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-[11px] text-slate-400 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>نظام اللعبة والاتصال</span>
            </div>
            <p>
              • <strong>وضع التدريب:</strong> يعمل بدون اتصال محلياً على هاتفك لاختبار كافة قواعد اللعبة وجولات التحدي.
            </p>
            <p>
              • <strong>اللعب عبر الإنترنت:</strong> يتصل بخادم فوري آمن لإخفاء الأرقام ومزامنة التوقيت بدقة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-95"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};

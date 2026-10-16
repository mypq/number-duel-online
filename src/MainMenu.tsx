import React, { useState } from 'react';
import { Play, Users, Settings, HelpCircle, Sparkles, Zap, ChevronLeft, User } from 'lucide-react';
import { sound } from '../utils/sound';

interface MainMenuProps {
  onStartPractice: () => void;
  onStartOnline: () => void;
  onOpenSettings: () => void;
  playerName: string;
  onChangeName: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartPractice,
  onStartOnline,
  onOpenSettings,
  playerName,
  onChangeName,
}) => {
  const [showRules, setShowRules] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] max-w-lg mx-auto w-full px-4 py-8 select-none animate-in fade-in duration-300" dir="rtl">
      {/* Hero Title & Arabic Lockup */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 mb-3 tracking-wide shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>لعبة تنافسية في الحساب والبديهة</span>
        </div>

        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-wide leading-tight bg-gradient-to-l from-cyan-400 via-sky-300 to-pink-500 bg-clip-text text-transparent">
          تحدي الأرقام
        </h1>

        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => {
              sound.playClick();
              onChangeName();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
            title="تغيير الاسم"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>مرحباً، <strong className="text-cyan-300 font-bold">{playerName}</strong></span>
            <span className="text-[10px] text-slate-500 mr-1">(تغيير)</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-3 leading-relaxed">
          اختر رقمك السري من ١ إلى ١٠٠، اكشف الأرقام بالتزامن وسابق لحساب المجموع الصحيح قبل انتهاء الوقت!
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="w-full space-y-3.5 max-w-sm">
        {/* Practice Mode */}
        <button
          onClick={() => {
            sound.playClick();
            onStartPractice();
          }}
          className="w-full group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer text-right border border-amber-300/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950/20 text-slate-950">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-base tracking-wide">
                    وضع التدريب
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-950 text-amber-300">
                    محلي
                  </span>
                </div>
                <span className="text-xs text-slate-900 font-semibold">
                  اختبر الاختيار والكشف والحساب وحدك على هاتفك
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-950/70 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Play Online Mode */}
        <button
          onClick={() => {
            sound.playClick();
            onStartOnline();
          }}
          className="w-full group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all active:scale-95 cursor-pointer text-right border border-cyan-400/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 text-cyan-200">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-base tracking-wide">
                    اللعب عبر الإنترنت
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950">
                    مباشر
                  </span>
                </div>
                <span className="text-xs text-cyan-100 font-semibold">
                  غرف خاصة، روابط دعوة وتنافس فوري بين جهازين
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-cyan-200 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Secondary Buttons: Rules & Settings */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              sound.playClick();
              setShowRules(true);
            }}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95 text-xs font-bold"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>كيفية اللعب</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95 text-xs font-bold"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-3xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-right">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading font-black text-base text-white tracking-wide">
                  قواعد لعبة تحدي الأرقام
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-cyan-400 block mb-1">١. اختيار الرقم (١ إلى ١٠٠)</strong>
                يختار كل لاعب رقماً من شبكة تضم ١٠٠ بطاقة، ويبقى الرقم سرياً حتى يؤكد كلا اللاعبين اختيارهما.
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-amber-400 block mb-1">٢. الكشف وسباق الحساب</strong>
                يتم الكشف عن رقمي اللاعبين في نفس اللحظة وتظهر مسألة جمع الرقمين، ويبدأ العداد التنازلي فوراً (٥ أو ١٠ أو ١٥ ثانية).
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-emerald-400 block mb-1">٣. احتساب النقاط (+٣ نقاط)</strong>
                أول لاعب يرسل الإجابة الصحيحة المعتمدة يفوز بالجولة ويحصل على <strong className="text-emerald-300">٣ نقاط</strong>، بينما يحصل الآخر على ٠ نقطة.
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-rose-400 block mb-1">٤. الإجابة الخاطئة تخسر الجولة</strong>
                الإجابة الخاطئة تُفقد اللاعب حقه في الجولة فوراً، وتتيح للمنافس فرصة الإجابة الصحيحة قبل انتهاء الوقت.
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block mb-1">٥. التعادل (٠ نقطة)</strong>
                إذا أخطأ كلا اللاعبين في الإجابة، أو انتهى الوقت دون إجابة صحيحة، تنتهي الجولة بالتعادل برصيد ٠ نقطة للطرفين.
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <strong className="text-pink-400 block mb-1">٦. الفائز بالمباراة</strong>
                تستمر المباراة لعدد الجولات المحدد (٣ أو ٥ أو ١٠)، واللاعب الحاصل على أعلى مجموع نقاط يتوج بطلاً للمباراة. وفي حال تساوي النقاط تنتهي المباراة بالتعادل.
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-4 w-full py-3 rounded-xl font-heading font-black text-xs uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition"
            >
              فهمت، لنبدأ اللعب!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

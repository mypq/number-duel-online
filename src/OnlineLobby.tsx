import React, { useState } from 'react';
import { Users, Plus, LogIn, ArrowRight, Shield, Wifi } from 'lucide-react';
import { sound } from '../utils/sound';
import { toArabicDigits } from '../utils/arabic';
import type { MatchSettings } from '../types/game';

interface OnlineLobbyProps {
  onCreateRoom: (playerName: string, settings: MatchSettings) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onBack: () => void;
  initialRoomCode?: string;
  isConnected: boolean;
  defaultPlayerName: string;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBack,
  initialRoomCode = '',
  isConnected,
  defaultPlayerName,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState<string>(defaultPlayerName);
  const [joinCode, setJoinCode] = useState<string>(initialRoomCode);
  const [totalRounds, setTotalRounds] = useState<3 | 5 | 10>(5);
  const [timerSeconds, setTimerSeconds] = useState<5 | 10 | 15>(10);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setErrorMsg('يرجى كتابة اسمك للمتابعة');
      return;
    }
    sound.playClick();
    onCreateRoom(cleanName, { totalRounds, timerSeconds });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setErrorMsg('يرجى كتابة اسمك للمتابعة');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length < 4) {
      setErrorMsg('يرجى إدخال رمز غرفة صحيح');
      return;
    }
    sound.playClick();
    onJoinRoom(joinCode.trim().toUpperCase(), cleanName);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full px-4 py-6 select-none animate-in fade-in duration-200" dir="rtl">
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>

        {/* Server Connection Status */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
          isConnected
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
            : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
        }`}>
          <Wifi className="w-3 h-3" />
          <span>{isConnected ? 'متصل بالخادم' : 'جاري الاتصال بالخادم...'}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 mb-2 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-wide text-white">
          اللعب عبر الإنترنت
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          أنشئ غرفة خاصة وشارك الرابط أو الرمز مع منافسك لتحدي الحساب المباشر.
        </p>
      </div>

      {/* Player Name Input */}
      <div className="w-full bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-4 text-right">
        <label className="block text-xs font-bold text-cyan-300 mb-1.5">
          اسمك في اللعبة
        </label>
        <input
          type="text"
          maxLength={15}
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            setErrorMsg('');
          }}
          placeholder="اكتب اسمك"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-bold text-right"
        />
      </div>

      {/* Tab Switcher: Create vs Join */}
      <div className="w-full flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 mb-4">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('create');
            setErrorMsg('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إنشاء غرفة</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('join');
            setErrorMsg('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-1.5 ${
            activeTab === 'join'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>الانضمام إلى غرفة</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="w-full mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: CREATE ROOM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              عدد جولات المباراة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([3, 5, 10] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTotalRounds(r);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-heading font-bold border transition ${
                    totalRounds === r
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {toArabicDigits(r)} جولات
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              مؤقت الحساب لكل جولة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTimerSeconds(s);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-heading font-bold border transition ${
                    timerSeconds === s
                      ? 'bg-pink-950 border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {toArabicDigits(s)} ثوانٍ
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-4 rounded-2xl font-heading font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer mt-3"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء غرفة</span>
          </button>
        </form>
      )}

      {/* TAB 2: JOIN ROOM */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoin} className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              رمز الغرفة (٦ خانات)
            </label>
            <input
              type="text"
              maxLength={8}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder="مثال: 7X9K2M"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-lg text-center font-mono-num font-black text-cyan-300 uppercase tracking-widest placeholder-slate-600 focus:outline-none focus:border-pink-500"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-4 rounded-2xl font-heading font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>الانضمام إلى غرفة</span>
          </button>
        </form>
      )}

      {/* Security Note in Arabic */}
      <div className="w-full mt-6 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-300">نظام حماية النزاهة:</strong> تبقى أرقام كلا اللاعبين سرية بالكامل على الخادم حتى يؤكد الطرفان اختيارهما، مما يمنع معرفة رقم المنافس مسبقاً.
        </div>
      </div>
    </div>
  );
};

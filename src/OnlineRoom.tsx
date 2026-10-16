import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { NumberGrid } from './NumberGrid';
import { Keypad } from './Keypad';
import { RevealCountdown } from './RevealCountdown';
import { RoundResults } from './RoundResults';
import { FinalResults } from './FinalResults';
import { sound } from '../utils/sound';
import { toArabicDigits, formatArabicSeconds } from '../utils/arabic';
import type { OnlineRoomState } from '../types/game';

interface OnlineRoomProps {
  roomState: OnlineRoomState | null;
  myPlayerId: string;
  onSendAction: (type: string, payload: any) => void;
  onLeaveRoom: () => void;
  isConnected: boolean;
}

export const OnlineRoom: React.FC<OnlineRoomProps> = ({
  roomState,
  myPlayerId,
  onSendAction,
  onLeaveRoom,
  isConnected,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  const me = roomState ? roomState.players[myPlayerId] : null;
  const playersList = roomState ? Object.values(roomState.players) : [];
  const opponent = roomState ? playersList.find(p => p.id !== myPlayerId) : null;

  const playerOne = roomState ? playersList.find(p => p.role === 'ali') : null;
  const playerTwo = roomState ? playersList.find(p => p.role === 'walaa') : null;

  // Track race countdown locally synced with server deadline
  useEffect(() => {
    if (!roomState || roomState.phase !== 'race' || !roomState.raceDeadline) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, roomState.raceDeadline! - now);
      setTimeLeftMs(remaining);

      if (remaining <= 3000 && remaining > 0 && Math.floor(remaining / 1000) !== Math.floor((remaining + 50) / 1000)) {
        sound.playTick(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [roomState?.phase, roomState?.raceDeadline]);

  // Reset input when race starts
  useEffect(() => {
    if (roomState?.phase === 'race') {
      setInputAnswer('');
    }
  }, [roomState?.phase]);

  // Copy invitation link
  const handleCopyLink = () => {
    if (!roomState) return;
    sound.playClick();
    const url = `${window.location.origin}${window.location.pathname}?room=${roomState.roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Lock selected number
  const handleLockNumber = () => {
    if (!selectedNum || me?.locked) return;
    sound.playLock();
    onSendAction('LOCK_NUMBER', { number: selectedNum });
  };

  // Submit sum answer
  const handleSubmitAnswer = () => {
    if (!inputAnswer.trim() || me?.hasAnswered) return;
    const answer = Number(inputAnswer.trim());
    if (isNaN(answer)) return;
    sound.playClick();
    onSendAction('SUBMIT_ANSWER', { answer });
  };

  // Next round
  const handleNextRound = () => {
    sound.playClick();
    onSendAction('NEXT_ROUND', {});
  };

  // Rematch
  const handleRematch = () => {
    sound.playClick();
    onSendAction('REMATCH', {});
  };

  if (!roomState || !me) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4" dir="rtl">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-slate-300 font-bold">جاري مزامنة بيانات الغرفة...</p>
      </div>
    );
  }

  const isFull = playersList.length === 2;

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] pb-12 w-full max-w-4xl mx-auto px-2 select-none" dir="rtl">
      {/* WAITING ROOM (if not yet 2 players) */}
      {!isFull && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full px-4 py-8 select-none animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 mb-2 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="font-heading font-black text-2xl uppercase tracking-wide text-white">
              غرفة الانتظار
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              شارك رمز الغرفة أو رابط الدعوة مع منافسك لبدء المباراة فوراً.
            </p>
          </div>

          {/* Room Code Card */}
          <div className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-center shadow-xl mb-4">
            <div className="text-xs font-bold text-slate-400 mb-1">
              رمز الغرفة
            </div>
            <div className="font-mono-num font-black text-4xl text-cyan-300 tracking-widest my-1.5" dir="ltr">
              {roomState.roomId}
            </div>

            <button
              onClick={handleCopyLink}
              className="mt-3 w-full py-3 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">تم نسخ رابط الدعوة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>دعوة لاعب (نسخ الرابط)</span>
                </>
              )}
            </button>
          </div>

          {/* Players Presence List */}
          <div className="w-full bg-slate-900/70 rounded-2xl p-4 border border-slate-800 space-y-2.5 mb-6 text-right">
            <div className="text-xs font-bold text-slate-400 mb-1">
              اللاعبون المتصلون (١ / ٢)
            </div>

            {/* Host */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <span className="text-xs font-bold text-cyan-300">{me.name} (أنت)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                جاهز
              </span>
            </div>

            {/* Waiting for Player 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>بانتظار اللاعب الآخر...</span>
              </div>
            </div>
          </div>

          {/* Leave Button */}
          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>مغادرة الغرفة</span>
          </button>
        </div>
      )}

      {/* ACTIVE GAMEPLAY (2 players connected) */}
      {isFull && (
        <>
          {/* 1. SELECTION PHASE */}
          {roomState.phase === 'selecting' && (
            <div className="flex flex-col flex-1 pt-2">
              {/* Opponent Lock Status Banner */}
              <div className="max-w-xl mx-auto w-full mb-3 px-2 flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${me.role === 'ali' ? 'bg-cyan-400' : 'bg-pink-500'}`} />
                  <span className="font-bold text-slate-300">أنت ({me.name}):</span>
                  <span className={`font-semibold ${me.locked ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {me.locked ? 'تم التأكيد ✓' : (selectedNum ? `رقم ${toArabicDigits(selectedNum)}` : 'جاري الاختيار...')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${opponent?.role === 'ali' ? 'bg-cyan-400' : 'bg-pink-500'}`} />
                  <span className="font-bold text-slate-300">{opponent?.name}:</span>
                  <span className={`font-semibold ${opponent?.locked ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {opponent?.locked ? 'تم التأكيد ✓' : 'بانتظار تأكيد الرقم...'}
                  </span>
                </div>
              </div>

              <NumberGrid
                playerRole={me.role}
                playerName={me.name}
                selectedNumber={selectedNum}
                isLocked={me.locked}
                onSelectNumber={(num) => setSelectedNum(num)}
                onLockNumber={handleLockNumber}
              />
            </div>
          )}

          {/* 2. REVEAL PHASE */}
          {roomState.phase === 'reveal' && roomState.revealedNumbers && (
            <RevealCountdown
              playerOneNumber={roomState.revealedNumbers.ali}
              playerTwoNumber={roomState.revealedNumbers.walaa}
              playerOneName={playerOne?.name || 'اللاعب ١'}
              playerTwoName={playerTwo?.name || 'اللاعب ٢'}
              onFinished={() => {}}
            />
          )}

          {/* 3. ANSWER RACE PHASE */}
          {roomState.phase === 'race' && roomState.revealedNumbers && (
            <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full px-3 py-3 select-none animate-in fade-in duration-200">
              <div className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-center shadow-xl mb-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1 flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>سباق مباشر! أول إجابة صحيحة تفوز بـ ٣ نقاط</span>
                </div>

                {/* Addition Problem Display */}
                <div className="flex items-center justify-center gap-3 font-heading font-black text-3xl sm:text-4xl my-2.5" dir="ltr">
                  <span className="text-cyan-400">{toArabicDigits(roomState.revealedNumbers.ali)}</span>
                  <span className="text-amber-400">+</span>
                  <span className="text-pink-400">{toArabicDigits(roomState.revealedNumbers.walaa)}</span>
                  <span className="text-slate-400">=</span>
                  <span className="text-white bg-slate-800/80 px-4 py-1 rounded-2xl border border-slate-700 min-w-[75px] text-center">
                    {inputAnswer ? toArabicDigits(inputAnswer) : '؟'}
                  </span>
                </div>

                {/* Timer Bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-xs font-heading font-bold mb-1.5">
                    <span className="text-slate-400">الوقت المتبقي:</span>
                    <span className={`text-sm ${timeLeftMs < 3000 ? 'text-rose-400 animate-pulse font-black' : 'text-amber-400'}`}>
                      {formatArabicSeconds(timeLeftMs / 1000)} ثانية
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-75 ${
                        timeLeftMs < 3000 ? 'bg-rose-500' : 'bg-gradient-to-l from-amber-400 to-yellow-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (timeLeftMs / (roomState.settings.timerSeconds * 1000)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Banner for Wrong / Forfeit */}
              {me.hasAnswered && !me.isCorrect && (
                <div className="w-full p-3 mb-3 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-300 text-xs font-bold text-center">
                  ✕ إجابتك غير صحيحة! لقد خسرت فرصة هذه الجولة.
                </div>
              )}

              {opponent?.hasAnswered && !opponent.isCorrect && (
                <div className="w-full p-2.5 mb-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold text-center">
                  أجاب {opponent.name} إجابة خاطئة! ما زالت لديك فرصة للفوز بالإجابة الصحيحة قبل انتهاء الوقت.
                </div>
              )}

              {/* Mobile Keypad */}
              <Keypad
                value={inputAnswer}
                onChange={(val) => setInputAnswer(val)}
                onSubmit={handleSubmitAnswer}
                disabled={me.hasAnswered}
                submitLabel={me.hasAnswered ? 'تم إرسال الإجابة' : 'إرسال الإجابة'}
                isPrimaryTurn={me.role === 'ali'}
              />
            </div>
          )}

          {/* 4. ROUND RESULTS SCREEN */}
          {roomState.phase === 'round_result' && (
            <RoundResults
              roundNumber={roomState.currentRound}
              totalRounds={roomState.settings.totalRounds}
              playerOneNumber={roomState.revealedNumbers?.ali ?? 0}
              playerTwoNumber={roomState.revealedNumbers?.walaa ?? 0}
              targetSum={roomState.targetSum ?? 0}
              winner={roomState.roundWinner ?? 'draw'}
              playerOneScoreGained={roomState.roundWinner === 'ali' ? 3 : 0}
              playerTwoScoreGained={roomState.roundWinner === 'walaa' ? 3 : 0}
              playerOneTotalScore={playerOne?.score ?? 0}
              playerTwoTotalScore={playerTwo?.score ?? 0}
              playerOneName={playerOne?.name || 'اللاعب ١'}
              playerTwoName={playerTwo?.name || 'اللاعب ٢'}
              reason={roomState.roundWinnerReason}
              onNextRound={handleNextRound}
              isLastRound={roomState.currentRound >= roomState.settings.totalRounds}
            />
          )}

          {/* 5. FINAL MATCH RESULTS SCREEN */}
          {roomState.phase === 'match_over' && (
            <FinalResults
              playerOneScore={playerOne?.score ?? 0}
              playerTwoScore={playerTwo?.score ?? 0}
              playerOneName={playerOne?.name || 'اللاعب ١'}
              playerTwoName={playerTwo?.name || 'اللاعب ٢'}
              history={roomState.history}
              onPlayAgain={handleRematch}
              onMainMenu={onLeaveRoom}
            />
          )}
        </>
      )}
    </div>
  );
};

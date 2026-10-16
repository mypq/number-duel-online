import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { NumberGrid } from './NumberGrid';
import { Keypad } from './Keypad';
import { RevealCountdown } from './RevealCountdown';
import { RoundResults } from './RoundResults';
import { FinalResults } from './FinalResults';
import { sound } from '../utils/sound';
import { toArabicDigits, formatArabicSeconds } from '../utils/arabic';
import type { MatchSettings, GamePhase, Role, RoundHistory } from '../types/game';

interface PracticeGameProps {
  settings: MatchSettings;
  playerName: string;
  simulatedOpponentName?: string;
  onMainMenu: () => void;
  onOpenSettings?: () => void;
}

export const PracticeGame: React.FC<PracticeGameProps> = ({
  settings,
  playerName,
  simulatedOpponentName = 'اللاعب التجريبي',
  onMainMenu,
}) => {
  // Practice Match State
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>('selecting');
  
  // Players state: role 'ali' = local player (playerName), 'walaa' = simulatedOpponentName
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [opponentNumber, setOpponentNumber] = useState<number | null>(null);
  const [playerLocked, setPlayerLocked] = useState<boolean>(false);
  const [opponentLocked, setOpponentLocked] = useState<boolean>(false);

  // Active simulator selection turn
  const [activeSimulatorPlayer, setActiveSimulatorPlayer] = useState<Role>('ali');

  // Race Phase State
  const [raceActivePlayer, setRaceActivePlayer] = useState<Role>('ali');
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [playerAnswered, setPlayerAnswered] = useState<boolean>(false);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [playerForfeited, setPlayerForfeited] = useState<boolean>(false);
  const [opponentForfeited, setOpponentForfeited] = useState<boolean>(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(settings.timerSeconds * 1000);

  // Round Results State
  const [roundWinner, setRoundWinner] = useState<Role | 'draw'>('draw');
  const [roundWinnerReason, setRoundWinnerReason] = useState<string>('');
  const [roundReactionTimeMs, setRoundReactionTimeMs] = useState<number | null>(null);
  const [matchHistory, setMatchHistory] = useState<RoundHistory[]>([]);

  // Refs for race timer loop
  const raceStartTimeRef = useRef<number>(0);
  const raceTimerRef = useRef<number | null>(null);
  const targetSum = (playerNumber ?? 0) + (opponentNumber ?? 0);

  // Locking choice
  const handleLockNumber = useCallback(() => {
    if (activeSimulatorPlayer === 'ali') {
      if (playerNumber === null) return;
      setPlayerLocked(true);
      if (!opponentLocked) {
        setActiveSimulatorPlayer('walaa');
      } else {
        setPhase('reveal');
      }
    } else {
      if (opponentNumber === null) return;
      setOpponentLocked(true);
      if (!playerLocked) {
        setActiveSimulatorPlayer('ali');
      } else {
        setPhase('reveal');
      }
    }
  }, [activeSimulatorPlayer, playerNumber, opponentNumber, playerLocked, opponentLocked]);

  useEffect(() => {
    if (playerLocked && opponentLocked && phase === 'selecting') {
      setPhase('reveal');
    }
  }, [playerLocked, opponentLocked, phase]);

  // Reveal countdown finishes -> start Race
  const handleRevealFinished = useCallback(() => {
    setPhase('race');
    setInputAnswer('');
    setPlayerAnswered(false);
    setOpponentAnswered(false);
    setPlayerForfeited(false);
    setOpponentForfeited(false);
    setRaceActivePlayer('ali');
    setTimeLeftMs(settings.timerSeconds * 1000);
    raceStartTimeRef.current = Date.now();
  }, [settings.timerSeconds]);

  // Race Countdown Timer loop
  useEffect(() => {
    if (phase !== 'race') return;

    const interval = 50;
    const totalMs = settings.timerSeconds * 1000;

    raceTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - raceStartTimeRef.current;
      const remaining = Math.max(0, totalMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 3000 && remaining > 0 && Math.floor(remaining / 1000) !== Math.floor((remaining + 50) / 1000)) {
        sound.playTick(true);
      }

      if (remaining <= 0) {
        if (raceTimerRef.current) clearInterval(raceTimerRef.current);
        handleTimeoutDraw();
      }
    }, interval);

    return () => {
      if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    };
  }, [phase, settings.timerSeconds]);

  // Handle Race Timeout (Draw)
  const handleTimeoutDraw = () => {
    if (phase !== 'race') return;
    sound.playWrong();
    const reason = `انتهى الوقت المحدد (${toArabicDigits(settings.timerSeconds)} ثوانٍ) دون تقديم إجابة صحيحة.`;
    setRoundWinner('draw');
    setRoundWinnerReason(reason);
    setRoundReactionTimeMs(null);

    setMatchHistory(prev => [
      ...prev,
      {
        roundNumber: currentRound,
        aliNumber: playerNumber!,
        walaaNumber: opponentNumber!,
        sum: targetSum,
        winner: 'draw',
        aliScoreGained: 0,
        walaaScoreGained: 0,
        timeTakenMs: null,
        reason,
      }
    ]);

    setPhase('round_result');
  };

  // Submit Answer in Race
  const handleSubmitAnswer = (actingRole: Role, forcedAnswer?: number) => {
    if (phase !== 'race') return;
    const answer = forcedAnswer ?? Number(inputAnswer.trim());
    if (isNaN(answer)) return;

    const reactionTime = Date.now() - raceStartTimeRef.current;

    if (actingRole === 'ali') {
      if (playerAnswered || playerForfeited) return;
      setPlayerAnswered(true);

      if (answer === targetSum) {
        // Player wins the round!
        if (raceTimerRef.current) clearInterval(raceTimerRef.current);
        sound.playCorrect();
        setPlayerScore(s => s + 3);
        setRoundWinner('ali');
        const reason = `أجاب ${playerName} بالرقم الصحيح (${toArabicDigits(answer)}) خلال ${formatArabicSeconds(reactionTime / 1000)} ثانية! (+٣ نقاط)`;
        setRoundWinnerReason(reason);
        setRoundReactionTimeMs(reactionTime);

        setMatchHistory(prev => [
          ...prev,
          {
            roundNumber: currentRound,
            aliNumber: playerNumber!,
            walaaNumber: opponentNumber!,
            sum: targetSum,
            winner: 'ali',
            aliScoreGained: 3,
            walaaScoreGained: 0,
            timeTakenMs: reactionTime,
            reason,
          }
        ]);
        setPhase('round_result');
      } else {
        // Wrong answer -> forfeit round!
        sound.playWrong();
        setPlayerForfeited(true);
        if (opponentForfeited) {
          if (raceTimerRef.current) clearInterval(raceTimerRef.current);
          const reason = `أخطأ كل من ${playerName} و${simulatedOpponentName} في الحساب!`;
          setRoundWinner('draw');
          setRoundWinnerReason(reason);
          setRoundReactionTimeMs(null);
          setMatchHistory(prev => [
            ...prev,
            {
              roundNumber: currentRound,
              aliNumber: playerNumber!,
              walaaNumber: opponentNumber!,
              sum: targetSum,
              winner: 'draw',
              aliScoreGained: 0,
              walaaScoreGained: 0,
              timeTakenMs: null,
              reason,
            }
          ]);
          setPhase('round_result');
        } else {
          setActiveSimulatorPlayer('walaa');
          setRaceActivePlayer('walaa');
          setInputAnswer('');
        }
      }
    } else {
      // Opponent's answer
      if (opponentAnswered || opponentForfeited) return;
      setOpponentAnswered(true);

      if (answer === targetSum) {
        // Opponent wins the round!
        if (raceTimerRef.current) clearInterval(raceTimerRef.current);
        sound.playCorrect();
        setOpponentScore(s => s + 3);
        setRoundWinner('walaa');
        const reason = `أجاب ${simulatedOpponentName} بالرقم الصحيح (${toArabicDigits(answer)}) خلال ${formatArabicSeconds(reactionTime / 1000)} ثانية! (+٣ نقاط)`;
        setRoundWinnerReason(reason);
        setRoundReactionTimeMs(reactionTime);

        setMatchHistory(prev => [
          ...prev,
          {
            roundNumber: currentRound,
            aliNumber: playerNumber!,
            walaaNumber: opponentNumber!,
            sum: targetSum,
            winner: 'walaa',
            aliScoreGained: 0,
            walaaScoreGained: 3,
            timeTakenMs: reactionTime,
            reason,
          }
        ]);
        setPhase('round_result');
      } else {
        // Opponent wrong answer
        sound.playWrong();
        setOpponentForfeited(true);
        if (playerForfeited) {
          if (raceTimerRef.current) clearInterval(raceTimerRef.current);
          const reason = `أخطأ كل من ${playerName} و${simulatedOpponentName} في الحساب!`;
          setRoundWinner('draw');
          setRoundWinnerReason(reason);
          setRoundReactionTimeMs(null);
          setMatchHistory(prev => [
            ...prev,
            {
              roundNumber: currentRound,
              aliNumber: playerNumber!,
              walaaNumber: opponentNumber!,
              sum: targetSum,
              winner: 'draw',
              aliScoreGained: 0,
              walaaScoreGained: 0,
              timeTakenMs: null,
              reason,
            }
          ]);
          setPhase('round_result');
        } else {
          setActiveSimulatorPlayer('ali');
          setRaceActivePlayer('ali');
          setInputAnswer('');
        }
      }
    }
  };

  // Next Round
  const handleNextRound = () => {
    if (currentRound >= settings.totalRounds) {
      setPhase('match_over');
    } else {
      setCurrentRound(r => r + 1);
      setPhase('selecting');
      setPlayerNumber(null);
      setOpponentNumber(null);
      setPlayerLocked(false);
      setOpponentLocked(false);
      setActiveSimulatorPlayer('ali');
      setInputAnswer('');
    }
  };

  // Restart match
  const handleRestartMatch = () => {
    if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerNumber(null);
    setOpponentNumber(null);
    setPlayerLocked(false);
    setOpponentLocked(false);
    setActiveSimulatorPlayer('ali');
    setInputAnswer('');
    setMatchHistory([]);
    setPhase('selecting');
  };

  const timerPercentage = Math.max(0, Math.min(100, (timeLeftMs / (settings.timerSeconds * 1000)) * 100));

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] pb-12 w-full max-w-4xl mx-auto px-2 select-none" dir="rtl">
      {/* PRACTICE MODE NOTICE BANNER */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-center text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>وضع التدريب: محاكاة تجريبية لاختبار اختيار الأرقام وسباق الحساب محلياً دون الحاجة لاتصال.</span>
      </div>

      {/* 1. NUMBER SELECTION PHASE */}
      {phase === 'selecting' && (
        <div className="flex flex-col flex-1 pt-2">
          {/* Simulation Switcher Tabs */}
          <div className="max-w-xl mx-auto w-full mb-3 px-2 flex items-center justify-between gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setActiveSimulatorPlayer('ali');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-2 ${
                activeSimulatorPlayer === 'ali'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${playerLocked ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <span>دورك: {playerName} {playerLocked ? '(تم التأكيد ✓)' : `(${playerNumber !== null ? toArabicDigits(playerNumber) : '؟'})`}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveSimulatorPlayer('walaa');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-2 ${
                activeSimulatorPlayer === 'walaa'
                  ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${opponentLocked ? 'bg-emerald-400' : 'bg-pink-400'}`} />
              <span>{simulatedOpponentName} {opponentLocked ? '(تم التأكيد ✓)' : `(${opponentNumber !== null ? toArabicDigits(opponentNumber) : '؟'})`}</span>
            </button>
          </div>

          {/* Render Active Player's Number Grid (Red-marked section is completely gone) */}
          {activeSimulatorPlayer === 'ali' ? (
            <NumberGrid
              playerRole="ali"
              playerName={playerName}
              selectedNumber={playerNumber}
              isLocked={playerLocked}
              onSelectNumber={(num) => setPlayerNumber(num)}
              onLockNumber={handleLockNumber}
            />
          ) : (
            <NumberGrid
              playerRole="walaa"
              playerName={simulatedOpponentName}
              selectedNumber={opponentNumber}
              isLocked={opponentLocked}
              onSelectNumber={(num) => setOpponentNumber(num)}
              onLockNumber={handleLockNumber}
            />
          )}
        </div>
      )}

      {/* 2. DRAMATIC REVEAL PHASE */}
      {phase === 'reveal' && playerNumber !== null && opponentNumber !== null && (
        <RevealCountdown
          playerOneNumber={playerNumber}
          playerTwoNumber={opponentNumber}
          playerOneName={playerName}
          playerTwoName={simulatedOpponentName}
          onFinished={handleRevealFinished}
        />
      )}

      {/* 3. ANSWER RACE PHASE */}
      {phase === 'race' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full px-3 py-3 select-none animate-in fade-in duration-200">
          {/* Target Addition Problem Display */}
          <div className="w-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-center shadow-xl mb-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>احسب المجموع فوراً! أول إجابة صحيحة تفوز بـ ٣ نقاط</span>
            </div>

            {/* Arithmetic Formula Display */}
            <div className="flex items-center justify-center gap-3 font-heading font-black text-3xl sm:text-4xl my-2.5" dir="ltr">
              <span className="text-cyan-400">{toArabicDigits(playerNumber)}</span>
              <span className="text-amber-400">+</span>
              <span className="text-pink-400">{toArabicDigits(opponentNumber)}</span>
              <span className="text-slate-400">=</span>
              <span className="text-white bg-slate-800/80 px-4 py-1 rounded-2xl border border-slate-700 min-w-[75px] text-center">
                {inputAnswer ? toArabicDigits(inputAnswer) : '؟'}
              </span>
            </div>

            {/* Progress Countdown Bar */}
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
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Player Switcher Tabs in Race Mode */}
          <div className="w-full flex items-center gap-2 mb-3">
            <button
              onClick={() => {
                sound.playClick();
                setRaceActivePlayer('ali');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-1.5 ${
                raceActivePlayer === 'ali'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>الإجابة كـ {playerName}</span>
              {playerForfeited && <span className="text-[10px] text-rose-500 font-bold">(خسر الجولة)</span>}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setRaceActivePlayer('walaa');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black tracking-wide transition flex items-center justify-center gap-1.5 ${
                raceActivePlayer === 'walaa'
                  ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>الإجابة كـ {simulatedOpponentName}</span>
              {opponentForfeited && <span className="text-[10px] text-rose-500 font-bold">(خسر الجولة)</span>}
            </button>
          </div>

          {/* Quick Simulation Testing Buttons */}
          <div className="w-full bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80 mb-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-bold">اختبار سريع:</span>
            <button
              onClick={() => handleSubmitAnswer(raceActivePlayer, targetSum)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold active:scale-95"
              title="اختبار إرسال إجابة صحيحة فورية"
            >
              ✓ إجابة صحيحة
            </button>
            <button
              onClick={() => handleSubmitAnswer(raceActivePlayer, targetSum + 5)}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold active:scale-95"
              title="اختبار خسارة الجولة عند الإجابة الخاطئة"
            >
              ✕ إجابة خاطئة
            </button>
          </div>

          {/* Numeric Keypad with Arabic-Indic numerals */}
          <Keypad
            value={inputAnswer}
            onChange={(val) => setInputAnswer(val)}
            onSubmit={() => handleSubmitAnswer(raceActivePlayer)}
            disabled={raceActivePlayer === 'ali' ? playerForfeited : opponentForfeited}
            submitLabel={
              (raceActivePlayer === 'ali' ? playerForfeited : opponentForfeited)
                ? 'خسرت فرصة هذه الجولة!'
                : `إرسال الإجابة كـ ${raceActivePlayer === 'ali' ? playerName : simulatedOpponentName}`
            }
            isPrimaryTurn={raceActivePlayer === 'ali'}
          />
        </div>
      )}

      {/* 4. ROUND RESULTS SCREEN */}
      {phase === 'round_result' && (
        <RoundResults
          roundNumber={currentRound}
          totalRounds={settings.totalRounds}
          playerOneNumber={playerNumber ?? 0}
          playerTwoNumber={opponentNumber ?? 0}
          targetSum={targetSum}
          winner={roundWinner}
          playerOneScoreGained={roundWinner === 'ali' ? 3 : 0}
          playerTwoScoreGained={roundWinner === 'walaa' ? 3 : 0}
          playerOneTotalScore={playerScore}
          playerTwoTotalScore={opponentScore}
          playerOneName={playerName}
          playerTwoName={simulatedOpponentName}
          reason={roundWinnerReason}
          reactionTimeMs={roundReactionTimeMs}
          onNextRound={handleNextRound}
          isLastRound={currentRound >= settings.totalRounds}
        />
      )}

      {/* 5. FINAL MATCH RESULTS SCREEN */}
      {phase === 'match_over' && (
        <FinalResults
          playerOneScore={playerScore}
          playerTwoScore={opponentScore}
          playerOneName={playerName}
          playerTwoName={simulatedOpponentName}
          history={matchHistory}
          onPlayAgain={handleRestartMatch}
          onMainMenu={onMainMenu}
        />
      )}
    </div>
  );
};

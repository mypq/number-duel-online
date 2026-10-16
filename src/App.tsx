
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { PracticeGame } from './components/PracticeGame';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineRoom } from './components/OnlineRoom';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeNameModal } from './components/WelcomeNameModal';
import type { GameMode, MatchSettings, OnlineRoomState } from './types/game';

function generatePlayerId(): string {
  const existing = sessionStorage.getItem('duel_player_id');
  if (existing) return existing;

  const newId = 'p_' + Math.random().toString(36).substring(2, 9);
  sessionStorage.setItem('duel_player_id', newId);
  return newId;
}

export default function App() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isChangingNameModalOpen, setIsChangingNameModalOpen] = useState(false);

  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('duel_player_name') || ''
  );

  const [showFirstLaunchWelcome, setShowFirstLaunchWelcome] = useState(
    () => !localStorage.getItem('duel_player_name')
  );

  const [matchSettings, setMatchSettings] = useState<MatchSettings>(() => {
    const saved = localStorage.getItem('duel_match_settings');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Use default settings if saved settings are invalid.
      }
    }

    return { totalRounds: 5, timerSeconds: 10 };
  });

  const [myPlayerId] = useState<string>(generatePlayerId);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [onlineRoomState, setOnlineRoomState] =
    useState<OnlineRoomState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const modeRef = useRef<GameMode>(mode);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Keep the latest mode available to WebSocket callbacks without
  // recreating the connection whenever the screen changes.
  modeRef.current = mode;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setToastMessage(null);
      }
    }, 3500);
  }, []);

  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('duel_player_name', name);
    setShowFirstLaunchWelcome(false);
    setIsChangingNameModalOpen(false);
  };

  // Read an invitation code from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    if (roomParam) {
      setInitialRoomCode(roomParam.trim().toUpperCase());
      setMode('online_lobby');
    }
  }, []);

  // Stable WebSocket connection: changing screens must not close it.
  const connectWebSocket = useCallback(() => {
    const current = wsRef.current;

    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const socket = new WebSocket(
        'wss://yogurt-paltry-tiger.abasthan.app'
      );

      wsRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) return;

        setIsWsConnected(true);
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          console.log('WebSocket message:', type, payload);

          if (type === 'ROOM_CREATED' || type === 'ROOM_JOINED') {
            setMode('online_room');
          } else if (type === 'ROOM_STATE') {
            setOnlineRoomState(payload);

            if (
              payload?.players &&
              Object.keys(payload.players).length === 2 &&
              (modeRef.current === 'online_lobby' ||
                modeRef.current === 'menu')
            ) {
              setMode('online_room');
            }
          } else if (type === 'ERROR') {
            showToast(payload?.message || 'حدث خطأ في الاتصال');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          showToast('تعذرت قراءة رد الخادم');
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);

        if (mountedRef.current) {
          setIsWsConnected(false);
        }
      };

      socket.onclose = (event) => {
        console.warn('WebSocket closed:', event.code, event.reason);

        if (wsRef.current === socket) {
          wsRef.current = null;
        }

        if (!mountedRef.current) return;

        setIsWsConnected(false);

        const currentMode = modeRef.current;
        const shouldReconnect =
          currentMode === 'online_room' ||
          currentMode === 'online_lobby';

        if (shouldReconnect && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;

            if (mountedRef.current) {
              connectWebSocket();
            }
          }, 2000);
        }
      };
    } catch (err) {
      console.error('Could not create WebSocket:', err);
      setIsWsConnected(false);
      showToast('تعذر الاتصال بالخادم');
    }
  }, [showToast]);

  // Connect once on mount. Do not reconnect the effect whenever mode changes.
  useEffect(() => {
    mountedRef.current = true;
    connectWebSocket();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }

      const socket = wsRef.current;
      wsRef.current = null;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [connectWebSocket]);

  // Send an action only when the socket is ready.
  const sendWsAction = useCallback(
    (type: string, payload: any) => {
      const socket = wsRef.current;

      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          console.log('Sending WebSocket action:', type, payload);
          socket.send(JSON.stringify({ type, payload }));
        } catch (err) {
          console.error('Failed to send WebSocket action:', err);
          showToast('تعذر إرسال الأمر. حاول مرة أخرى.');
        }
      } else {
        showToast('الاتصال بالخادم غير جاهز. انتظر قليلاً ثم حاول مجدداً.');
        connectWebSocket();
      }
    },
    [connectWebSocket, showToast]
  );

  const handleCreateRoom = (name: string, settings: MatchSettings) => {
    sendWsAction('CREATE_ROOM', {
      playerId: myPlayerId,
      playerName: name,
      settings,
    });
  };

  const handleJoinRoom = (roomId: string, name: string) => {
    sendWsAction('JOIN_ROOM', {
      roomId,
      playerId: myPlayerId,
      playerName: name,
    });
  };

  const handleLeaveRoom = () => {
    setOnlineRoomState(null);
    setInitialRoomCode('');
    setMode('online_lobby');

    const cleanUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname;

    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  const handleUpdateSettings = (newSettings: MatchSettings) => {
    setMatchSettings(newSettings);
    localStorage.setItem('duel_match_settings', JSON.stringify(newSettings));
  };

  const getHeaderScores = () => {
    if (mode === 'online_room' && onlineRoomState) {
      const players = Object.values(onlineRoomState.players);
      const p1 = players[0];
      const p2 = players[1];

      return {
        one: p1?.score ?? 0,
        two: p2?.score ?? 0,
        currentRound: onlineRoomState.currentRound,
        totalRounds: onlineRoomState.settings.totalRounds,
        playerOneName: p1?.name || playerName || 'أنت',
        playerTwoName: p2?.name || 'المنافس',
      };
    }

    return {
      one: 0,
      two: 0,
      currentRound: 1,
      totalRounds: matchSettings.totalRounds,
      playerOneName: playerName || 'أنت',
      playerTwoName: 'اللاعب التجريبي',
    };
  };

  const headerScores = getHeaderScores();

  return (
    <div
      className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black"
      dir="rtl"
    >
      <Header
        mode={mode}
        currentRound={headerScores.currentRound}
        totalRounds={headerScores.totalRounds}
        playerOneScore={headerScores.one}
        playerTwoScore={headerScores.two}
        playerOneName={headerScores.playerOneName}
        playerTwoName={headerScores.playerTwoName}
        onHomeClick={() => setMode('menu')}
        onRestartClick={() => {
          if (mode === 'practice') {
            setMode('menu');
            setTimeout(() => setMode('practice'), 50);
          } else if (mode === 'online_room') {
            sendWsAction('REMATCH', {});
          }
        }}
        isOnlineConnected={isWsConnected}
      />

      <main className="flex-1 flex flex-col">
        {mode === 'menu' && (
          <MainMenu
            onStartPractice={() => {
              if (!playerName) {
                setShowFirstLaunchWelcome(true);
              } else {
                setMode('practice');
              }
            }}
            onStartOnline={() => {
              if (!playerName) {
                setShowFirstLaunchWelcome(true);
              } else {
                connectWebSocket();
                setMode('online_lobby');
              }
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            playerName={playerName || 'لاعب جديد'}
            onChangeName={() => setIsChangingNameModalOpen(true)}
          />
        )}

        {mode === 'practice' && (
          <PracticeGame
            settings={matchSettings}
            playerName={playerName || 'اللاعب'}
            simulatedOpponentName="اللاعب التجريبي"
            onMainMenu={() => setMode('menu')}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {mode === 'online_lobby' && (
          <OnlineLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={() => setMode('menu')}
            initialRoomCode={initialRoomCode}
            isConnected={isWsConnected}
            defaultPlayerName={playerName}
          />
        )}

        {mode === 'online_room' && (
          <OnlineRoom
            roomState={onlineRoomState}
            myPlayerId={myPlayerId}
            onSendAction={sendWsAction}
            onLeaveRoom={handleLeaveRoom}
            isConnected={isWsConnected}
          />
        )}
      </main>

      <WelcomeNameModal
        isOpen={showFirstLaunchWelcome}
        onSaveName={handleSavePlayerName}
        initialName={playerName}
      />

      <WelcomeNameModal
        isOpen={isChangingNameModalOpen}
        onSaveName={handleSavePlayerName}
        initialName={playerName}
        isChangingName={true}
        onClose={() => setIsChangingNameModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={matchSettings}
        onUpdateSettings={handleUpdateSettings}
        playerName={playerName}
        onUpdatePlayerName={handleSavePlayerName}
      />

      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-400 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

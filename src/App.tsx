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
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isChangingNameModalOpen, setIsChangingNameModalOpen] = useState<boolean>(false);

  // Player Name Setup
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('duel_player_name') || '';
  });
  const [showFirstLaunchWelcome, setShowFirstLaunchWelcome] = useState<boolean>(() => {
    return !localStorage.getItem('duel_player_name');
  });

  const [matchSettings, setMatchSettings] = useState<MatchSettings>(() => {
    const saved = localStorage.getItem('duel_match_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return { totalRounds: 5, timerSeconds: 10 };
  });

  // Online Multiplayer State
  const [myPlayerId] = useState<string>(generatePlayerId);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [onlineRoomState, setOnlineRoomState] = useState<OnlineRoomState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('duel_player_name', name);
    setShowFirstLaunchWelcome(false);
    setIsChangingNameModalOpen(false);
  };

  // Check URL query parameters for room code invite link (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const clean = roomParam.trim().toUpperCase();
      setInitialRoomCode(clean);
      setMode('online_lobby');
    }
  }, []);

  // Initialize WebSocket connection to authoritative server
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type === 'ROOM_CREATED' || type === 'ROOM_JOINED') {
            setMode('online_room');
          } else if (type === 'ROOM_STATE') {
            setOnlineRoomState(payload);
          } else if (type === 'ERROR') {
            showToast(payload.message || 'حدث خطأ في الاتصال');
          }
        } catch (err) {
          console.error('Failed to parse WS payload', err);
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        setTimeout(() => {
          if (mode === 'online_room' || mode === 'online_lobby') {
            connectWebSocket();
          }
        }, 3000);
      };

      socket.onerror = () => {
        setIsWsConnected(false);
      };

      wsRef.current = socket;
    } catch (err) {
      setIsWsConnected(false);
    }
  }, [mode]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Send action to server
  const sendWsAction = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      showToast('جاري الاتصال بالخادم... يرجى المحاولة بعد لحظة.');
      connectWebSocket();
    }
  };

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
    setMode('online_lobby');
    if (window.history.pushState) {
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleUpdateSettings = (newSettings: MatchSettings) => {
    setMatchSettings(newSettings);
    localStorage.setItem('duel_match_settings', JSON.stringify(newSettings));
  };

  // Derive scores for header
  const getHeaderScores = () => {
    if (mode === 'online_room' && onlineRoomState) {
      const players = Object.values(onlineRoomState.players);
      const p1 = players.find(p => p.role === 'ali');
      const p2 = players.find(p => p.role === 'walaa');
      return {
        one: p1?.score ?? 0,
        two: p2?.score ?? 0,
        currentRound: onlineRoomState.currentRound,
        totalRounds: onlineRoomState.settings.totalRounds,
        playerOneName: p1?.name || (playerName || 'أنت'),
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
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black" dir="rtl">
      {/* Universal Header */}
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

      {/* Main Content Area */}
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

      {/* First Launch Welcome Name Setup Modal */}
      <WelcomeNameModal
        isOpen={showFirstLaunchWelcome}
        onSaveName={handleSavePlayerName}
        initialName={playerName}
      />

      {/* Change Name Modal */}
      <WelcomeNameModal
        isOpen={isChangingNameModalOpen}
        onSaveName={handleSavePlayerName}
        initialName={playerName}
        isChangingName={true}
        onClose={() => setIsChangingNameModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={matchSettings}
        onUpdateSettings={handleUpdateSettings}
        playerName={playerName}
        onUpdatePlayerName={handleSavePlayerName}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-400 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MatchSettings, Role, GamePhase, RoundHistory } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerPlayer {
  id: string;
  name: string;
  role: Role;
  ws: WebSocket;
  isReady: boolean;
  score: number;
  selectedNumber: number | null;
  locked: boolean;
  hasAnswered: boolean;
  answeredValue: number | null;
  isCorrect: boolean | null;
  reactionTimeMs: number | null;
}

interface ServerRoom {
  id: string;
  hostId: string;
  createdAt: number;
  settings: MatchSettings;
  currentRound: number;
  phase: GamePhase;
  players: Record<string, ServerPlayer>;
  revealedNumbers: { ali: number; walaa: number } | null;
  targetSum: number | null;
  raceStartTime: number | null;
  raceDeadline: number | null;
  roundWinner: Role | 'draw' | null;
  roundWinnerReason: string;
  history: RoundHistory[];
  timeoutHandle?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sanitizeClientRoomState(room: ServerRoom, forPlayerId: string) {
  const playersSanitized: Record<string, any> = {};
  
  for (const [pId, p] of Object.entries(room.players)) {
    // SECURITY: Do not expose other player's chosen number until revealed!
    const showChosenNumber = room.phase !== 'selecting' && room.phase !== 'waiting_opponent' 
      ? p.selectedNumber 
      : (pId === forPlayerId ? p.selectedNumber : null);

    playersSanitized[pId] = {
      id: p.id,
      name: p.name,
      role: p.role,
      score: p.score,
      isReady: p.isReady,
      connected: p.ws.readyState === WebSocket.OPEN,
      locked: p.locked,
      selectedNumber: showChosenNumber,
      hasAnswered: p.hasAnswered,
      answeredValue: room.phase === 'round_result' || room.phase === 'match_over' ? p.answeredValue : null,
      isCorrect: p.isCorrect,
      reactionTimeMs: p.reactionTimeMs,
    };
  }

  return {
    roomId: room.id,
    hostId: room.hostId,
    settings: room.settings,
    currentRound: room.currentRound,
    phase: room.phase,
    players: playersSanitized,
    revealedNumbers: room.revealedNumbers,
    targetSum: room.targetSum,
    raceStartTime: room.raceStartTime,
    raceDeadline: room.raceDeadline,
    roundWinner: room.roundWinner,
    roundWinnerReason: room.roundWinnerReason,
    history: room.history,
  };
}

function broadcastRoomState(room: ServerRoom) {
  for (const [pId, p] of Object.entries(room.players)) {
    if (p.ws.readyState === WebSocket.OPEN) {
      const sanitized = sanitizeClientRoomState(room, pId);
      p.ws.send(JSON.stringify({
        type: 'ROOM_STATE',
        payload: sanitized,
      }));
    }
  }
}

function endRoundWithDraw(room: ServerRoom, reason: string) {
  if (room.timeoutHandle) {
    clearTimeout(room.timeoutHandle);
    room.timeoutHandle = undefined;
  }

  room.phase = 'round_result';
  room.roundWinner = 'draw';
  room.roundWinnerReason = reason;

  const aliP = Object.values(room.players).find(p => p.role === 'ali');
  const walaaP = Object.values(room.players).find(p => p.role === 'walaa');

  room.history.push({
    roundNumber: room.currentRound,
    aliNumber: room.revealedNumbers?.ali ?? 0,
    walaaNumber: room.revealedNumbers?.walaa ?? 0,
    sum: room.targetSum ?? 0,
    winner: 'draw',
    aliScoreGained: 0,
    walaaScoreGained: 0,
    timeTakenMs: null,
    reason,
  });

  broadcastRoomState(room);
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const server = createServer(app);

  app.use(express.json());

  // Health and info check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      totalPlayers: Array.from(rooms.values()).reduce((acc, r) => acc + Object.keys(r.players).length, 0),
      timestamp: Date.now(),
    });
  });

  // Room lookup
  app.get('/api/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const playerCount = Object.keys(room.players).length;
    res.json({
      roomId: room.id,
      playerCount,
      isOpen: playerCount < 2 && room.phase === 'selecting',
      settings: room.settings,
    });
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (messageRaw: string) => {
      try {
        const msg = JSON.parse(messageRaw);
        const { type, payload } = msg;

        // 1. CREATE_ROOM
        if (type === 'CREATE_ROOM') {
          const { playerId, playerName, settings } = payload;
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          const defaultSettings: MatchSettings = {
            totalRounds: settings?.totalRounds || 5,
            timerSeconds: settings?.timerSeconds || 10,
          };

          const newRoom: ServerRoom = {
            id: code,
            hostId: playerId,
            createdAt: Date.now(),
            settings: defaultSettings,
            currentRound: 1,
            phase: 'selecting',
            players: {
              [playerId]: {
                id: playerId,
                name: playerName || 'اللاعب ١',
                role: 'ali',
                ws,
                isReady: true,
                score: 0,
                selectedNumber: null,
                locked: false,
                hasAnswered: false,
                answeredValue: null,
                isCorrect: null,
                reactionTimeMs: null,
              },
            },
            revealedNumbers: null,
            targetSum: null,
            raceStartTime: null,
            raceDeadline: null,
            roundWinner: null,
            roundWinnerReason: '',
            history: [],
          };

          rooms.set(code, newRoom);
          currentRoomId = code;
          currentPlayerId = playerId;

          // ضمان ربط الـ WebSocket الحالي بدقة لصانع الغرفة
          newRoom.players[playerId].ws = ws;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            payload: { roomId: code, role: 'ali' },
          }));
          broadcastRoomState(newRoom);
          return;
        }

        // 2. JOIN_ROOM
        if (type === 'JOIN_ROOM') {
          const { roomId, playerId, playerName } = payload;
          const cleanCode = (roomId || '').trim().toUpperCase();
          const room = rooms.get(cleanCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: `Room ${cleanCode} not found` } }));
            return;
          }

          // Check if reconnecting
          if (room.players[playerId]) {
            room.players[playerId].ws = ws;
            currentRoomId = cleanCode;
            currentPlayerId = playerId;
            broadcastRoomState(room);
            return;
          }

          // Exactly 2 players allowed
          const playerIds = Object.keys(room.players);
          if (playerIds.length >= 2) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'الغرفة ممتلئة بالكامل (لاعبان)' } }));
            return;
          }

          const existingRole = room.players[playerIds[0]].role;
          const newRole: Role = existingRole === 'ali' ? 'walaa' : 'ali';

          room.players[playerId] = {
            id: playerId,
            name: playerName || 'اللاعب ٢',
            role: newRole,
            ws,
            isReady: true,
            score: 0,
            selectedNumber: null,
            locked: false,
            hasAnswered: false,
            answeredValue: null,
            isCorrect: null,
            reactionTimeMs: null,
          };

          currentRoomId = cleanCode;
          currentPlayerId = playerId;

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            payload: { roomId: cleanCode, role: newRole },
          }));

          broadcastRoomState(room);
          return;
        }

        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const player = room.players[currentPlayerId];
        if (!player) return;

        // 3. UPDATE_SETTINGS (Host only)
        if (type === 'UPDATE_SETTINGS') {
          if (room.hostId === currentPlayerId && room.currentRound === 1 && !player.locked) {
            if (payload.totalRounds) room.settings.totalRounds = payload.totalRounds;
            if (payload.timerSeconds) room.settings.timerSeconds = payload.timerSeconds;
            broadcastRoomState(room);
          }
          return;
        }

        // 4. LOCK_NUMBER (1..100)
        if (type === 'LOCK_NUMBER') {
          const num = Number(payload.number);
          if (isNaN(num) || num < 1 || num > 100) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'يجب أن يكون الرقم بين ١ و١٠٠' } }));
            return;
          }

          if (player.locked) {
            return; // Prevent changes after locking
          }

          player.selectedNumber = num;
          player.locked = true;

          const playerList = Object.values(room.players);
          const allLocked = playerList.length === 2 && playerList.every(p => p.locked && p.selectedNumber !== null);

          if (allLocked) {
            // Both locked! Trigger Reveal Phase
            const aliP = playerList.find(p => p.role === 'ali')!;
            const walaaP = playerList.find(p => p.role === 'walaa')!;

            room.revealedNumbers = {
              ali: aliP.selectedNumber!,
              walaa: walaaP.selectedNumber!,
            };
            room.targetSum = aliP.selectedNumber! + walaaP.selectedNumber!;
            room.phase = 'reveal';
            broadcastRoomState(room);

            // After 3-second dramatic reveal countdown, start Race
            setTimeout(() => {
              const currentR = rooms.get(room.id);
              if (!currentR || currentR.phase !== 'reveal') return;

              currentR.phase = 'race';
              currentR.raceStartTime = Date.now();
              currentR.raceDeadline = Date.now() + (currentR.settings.timerSeconds * 1000);

              // Schedule authoritative timer expiration
              if (currentR.timeoutHandle) clearTimeout(currentR.timeoutHandle);
              currentR.timeoutHandle = setTimeout(() => {
                const r = rooms.get(currentR.id);
                if (r && r.phase === 'race') {
                  endRoundWithDraw(r, 'انتهى الوقت المحدد دون تقديم إجابة صحيحة');
                }
              }, (currentR.settings.timerSeconds * 1000) + 300);

              broadcastRoomState(currentR);
            }, 3000);
          } else {
            broadcastRoomState(room);
          }
          return;
        }

        // 5. SUBMIT_ANSWER
        if (type === 'SUBMIT_ANSWER') {
          if (room.phase !== 'race') return;
          if (player.hasAnswered) return; // Disallow resubmission

          const answerNum = Number(payload.answer);
          if (isNaN(answerNum)) return;

          const now = Date.now();
          player.hasAnswered = true;
          player.answeredValue = answerNum;
          player.reactionTimeMs = room.raceStartTime ? now - room.raceStartTime : null;

          const isCorrect = answerNum === room.targetSum;
          player.isCorrect = isCorrect;

          if (isCorrect) {
            // First correct answer wins the round!
            if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
            
            player.score += 3;
            room.phase = 'round_result';
            room.roundWinner = player.role;
            room.roundWinnerReason = `أجاب ${player.name} بالرقم الصحيح (${answerNum}) في ${((player.reactionTimeMs || 0) / 1000).toFixed(2)} ثانية (+٣ نقاط)`;

            room.history.push({
              roundNumber: room.currentRound,
              aliNumber: room.revealedNumbers?.ali ?? 0,
              walaaNumber: room.revealedNumbers?.walaa ?? 0,
              sum: room.targetSum ?? 0,
              winner: player.role,
              aliScoreGained: player.role === 'ali' ? 3 : 0,
              walaaScoreGained: player.role === 'walaa' ? 3 : 0,
              timeTakenMs: player.reactionTimeMs,
              reason: room.roundWinnerReason,
            });

            broadcastRoomState(room);
            return;
          } else {
            // Wrong answer forfeits this player's chance
            const otherPlayer = Object.values(room.players).find(p => p.id !== player.id);
            if (otherPlayer && otherPlayer.hasAnswered && !otherPlayer.isCorrect) {
              // Both answered wrong! Draw immediately
              endRoundWithDraw(room, 'أخطأ كلا اللاعبين في الحساب');
            } else {
              // Other player still has time to answer
              broadcastRoomState(room);
            }
          }
          return;
        }

        // 6. NEXT_ROUND
        if (type === 'NEXT_ROUND') {
          if (room.phase !== 'round_result') return;

          if (room.currentRound >= room.settings.totalRounds) {
            room.phase = 'match_over';
            broadcastRoomState(room);
            return;
          }

          // Advance round
          room.currentRound += 1;
          room.phase = 'selecting';
          room.revealedNumbers = null;
          room.targetSum = null;
          room.raceStartTime = null;
          room.raceDeadline = null;
          room.roundWinner = null;
          room.roundWinnerReason = '';

          for (const p of Object.values(room.players)) {
            p.selectedNumber = null;
            p.locked = false;
            p.hasAnswered = false;
            p.answeredValue = null;
            p.isCorrect = null;
            p.reactionTimeMs = null;
          }

          broadcastRoomState(room);
          return;
        }

        // 7. REMATCH / PLAY_AGAIN
        if (type === 'REMATCH') {
          room.currentRound = 1;
          room.phase = 'selecting';
          room.revealedNumbers = null;
          room.targetSum = null;
          room.raceStartTime = null;
          room.raceDeadline = null;
          room.roundWinner = null;
          room.roundWinnerReason = '';
          room.history = [];

          for (const p of Object.values(room.players)) {
            p.score = 0;
            p.selectedNumber = null;
            p.locked = false;
            p.hasAnswered = false;
            p.answeredValue = null;
            p.isCorrect = null;
            p.reactionTimeMs = null;
          }

          broadcastRoomState(room);
          return;
        }

      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          broadcastRoomState(room);
          // If all disconnected, schedule room cleanup
          const anyConnected = Object.values(room.players).some(p => p.ws.readyState === WebSocket.OPEN);
          if (!anyConnected) {
            setTimeout(() => {
              const r = rooms.get(currentRoomId!);
              if (r && !Object.values(r.players).some(p => p.ws.readyState === WebSocket.OPEN)) {
                rooms.delete(currentRoomId!);
              }
            }, 60000);
          }
        }
      }
    });
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Ali & Walaa: Number Duel server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

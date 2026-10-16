export type GameMode = 'menu' | 'practice' | 'online_lobby' | 'online_room' | 'settings';

export type Role = 'ali' | 'walaa' | 'player1' | 'player2';

export type GamePhase = 
  | 'selecting'         
  | 'waiting_opponent'  
  | 'reveal'            
  | 'race'              
  | 'round_result'      
  | 'match_over';       

export interface MatchSettings {
  totalRounds: 3 | 5 | 10;
  timerSeconds: 5 | 10 | 15;
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: Role;
  score: number;
  isReady: boolean;
  connected: boolean;
  locked: boolean;
  selectedNumber: number | null;
  hasAnswered: boolean;
  answeredValue: number | null;
  isCorrect: boolean | null;
  reactionTimeMs: number | null;
}

export interface RoundHistory {
  roundNumber: number;
  aliNumber: number;
  walaaNumber: number;
  sum: number;
  winner: Role | 'draw';
  aliScoreGained: number;
  walaaScoreGained: number;
  timeTakenMs: number | null;
  reason: string;
}

export interface OnlineRoomState {
  roomId: string;
  hostId: string;
  players: Record<string, PlayerInfo>;
  settings: MatchSettings;
  currentRound: number;
  phase: GamePhase;
  revealedNumbers: {
    ali: number;
    walaa: number;
  } | null;
  targetSum: number | null;
  raceStartTime: number | null;
  raceDeadline: number | null;
  roundWinner: Role | 'draw' | null;
  roundWinnerReason: string;
  history: RoundHistory[];
}

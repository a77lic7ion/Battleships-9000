
export type ShipType = 'Carrier' | 'Battleship' | 'Destroyer' | 'Submarine' | 'Patrol Boat';

export interface ShipConfig {
  type: ShipType;
  size: number;
  icon: string;
}

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export interface CellState {
  status: CellStatus;
  shipType: ShipType | null;
}

export interface PlacedShip {
  type: ShipType;
  x: number;
  y: number;
  size: number;
  horizontal: boolean;
  hits: number;
  shielded?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'single' | 'multi';

export type Screen = 'menu' | 'placement' | 'playing' | 'gameover' | 'settings';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'player' | 'enemy' | 'system' | 'success';
}

export interface GameState {
  screen: Screen;
  mode: GameMode;
  difficulty: Difficulty;
  player1Name: string;
  player2Name: string;
  playerGrid: CellState[][];
  aiGrid: CellState[][]; // Used as Player 2 grid in Multiplayer
  playerShips: PlacedShip[];
  aiShips: PlacedShip[]; // Used as Player 2 ships in Multiplayer
  turn: 'player' | 'ai'; // 'player' is P1, 'ai' is AI or P2
  winner: 'player' | 'ai' | null;
  logs: LogEntry[];
  geminiEnabled: boolean;
  isTransitioning: boolean;
  placementPhase: 1 | 2; // Tracks which player is placing ships
  player1CP: number;
  player2CP: number;
}


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
  aiGrid: CellState[][]; 
  playerShips: PlacedShip[];
  aiShips: PlacedShip[]; 
  turn: 'player' | 'ai'; 
  winner: 'player' | 'ai' | null;
  logs: LogEntry[];
  geminiEnabled: boolean;
  isTransitioning: boolean;
  placementPhase: 1 | 2;
  shotCounter: number; // New: triggers AI effect even if turn remains 'ai'
}

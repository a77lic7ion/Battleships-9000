
export type PowerUpType = 'Aegis Shield' | 'Sonar Scan' | 'Trident Missile';

export interface PowerUp {
  type: PowerUpType;
  cost: number;
  description: string;
}

export const POWERUPS: Record<PowerUpType, PowerUp> = {
  'Aegis Shield': {
    type: 'Aegis Shield',
    cost: 50,
    description: 'Deploys a one-time shield on a friendly vessel, absorbing the next incoming strike.',
  },
  'Sonar Scan': {
    type: 'Sonar Scan',
    cost: 75,
    description: 'Reveals a 3x3 grid area for one turn. Does not consume your attack phase.',
  },
  'Trident Missile': {
    type: 'Trident Missile',
    cost: 120,
    description: 'Launches a strike hitting three adjacent cells in a line (1x3 or 3x1). Replaces your standard attack.',
  },
};

export const CP_EARNINGS = {
  HIT: 5,
  SINK: {
    'Patrol Boat': 15,
    'Submarine': 20,
    'Destroyer': 20,
    'Battleship': 30,
    'Carrier': 40,
  }
};

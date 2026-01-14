
import { ShipConfig, ShipType } from './types';

export const GRID_SIZE = 10;

export const SHIPS: Record<ShipType, ShipConfig> = {
  'Carrier': { type: 'Carrier', size: 5, icon: 'directions_boat' },
  'Battleship': { type: 'Battleship', size: 4, icon: 'anchor' },
  'Destroyer': { type: 'Destroyer', size: 3, icon: 'rocket' },
  'Submarine': { type: 'Submarine', size: 3, icon: 'waves' },
  'Patrol Boat': { type: 'Patrol Boat', size: 2, icon: 'speed' },
};

export const SHIP_ORDER: ShipType[] = ['Carrier', 'Battleship', 'Destroyer', 'Submarine', 'Patrol Boat'];

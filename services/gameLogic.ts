
import { GRID_SIZE, SHIPS } from '../constants';
import { CellState, CellStatus, PlacedShip, ShipType } from '../types';

export function createEmptyGrid(): CellState[][] {
  return Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({ status: 'empty', shipType: null }))
  );
}

export function canPlaceShip(grid: CellState[][], x: number, y: number, size: number, horizontal: boolean): boolean {
  for (let i = 0; i < size; i++) {
    const curX = horizontal ? x + i : x;
    const curY = horizontal ? y : y + i;

    if (curX < 0 || curX >= GRID_SIZE || curY < 0 || curY >= GRID_SIZE) return false;
    if (grid[curY][curX].status === 'ship') return false;
  }
  return true;
}

export function placeAIShips(): { grid: CellState[][], ships: PlacedShip[] } {
  let grid = createEmptyGrid();
  const ships: PlacedShip[] = [];
  const shipTypes = Object.keys(SHIPS) as ShipType[];

  for (const type of shipTypes) {
    const size = SHIPS[type].size;
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (horizontal ? GRID_SIZE - size : GRID_SIZE));
      const y = Math.floor(Math.random() * (horizontal ? GRID_SIZE : GRID_SIZE - size));

      if (canPlaceShip(grid, x, y, size, horizontal)) {
        for (let i = 0; i < size; i++) {
          const curX = horizontal ? x + i : x;
          const curY = horizontal ? y : y + i;
          grid[curY][curX] = { status: 'ship', shipType: type };
        }
        ships.push({ type, x, y, size, horizontal, hits: 0 });
        placed = true;
      }
    }
  }
  return { grid, ships };
}

export function isShipSunk(ship: PlacedShip): boolean {
  return ship.hits >= ship.size;
}

/**
 * Refactored AI Shot Logic:
 * Now uses a multi-stage hunting strategy applied to all difficulty levels.
 * 1. Identify "Active Hits": Successful hits on ships that are not yet fully sunk.
 * 2. If active hits exist, prioritize targeting the ends of the line (if 2+ hits) or neighbors.
 * 3. If no active hits, use difficulty-based search patterns (e.g., checkerboard).
 */
export function getAIShot(playerGrid: CellState[][], difficulty: string): {x: number, y: number} {
  const isAvailable = (x: number, y: number) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const cell = playerGrid[y][x];
    return cell.status !== 'hit' && cell.status !== 'miss';
  };

  const getActiveHits = () => {
    const hits: {x: number, y: number, type: ShipType}[] = [];
    const typeHits: Record<string, number> = {};
    
    // Pass 1: Count hits per ship type on the board
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = playerGrid[y][x];
        if (cell.status === 'hit' && cell.shipType) {
          typeHits[cell.shipType] = (typeHits[cell.shipType] || 0) + 1;
        }
      }
    }

    // Pass 2: Collect hits belonging to ships that are not yet sunk
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = playerGrid[y][x];
        if (cell.status === 'hit' && cell.shipType) {
          const shipConfig = SHIPS[cell.shipType];
          if (typeHits[cell.shipType] < shipConfig.size) {
            hits.push({ x, y, type: cell.shipType });
          }
        }
      }
    }
    return hits;
  };

  const huntTarget = () => {
    const activeHits = getActiveHits();
    if (activeHits.length === 0) return null;

    // Group active hits by ship type
    const hitsByType: Record<string, typeof activeHits> = {};
    activeHits.forEach(h => {
      if (!hitsByType[h.type]) hitsByType[h.type] = [];
      hitsByType[h.type].push(h);
    });

    // Try to finish ships one by one
    for (const type of Object.keys(hitsByType)) {
      const shipHits = hitsByType[type];
      
      // If we have 2 or more hits on the same ship, we can guess the orientation
      if (shipHits.length >= 2) {
        const h0 = shipHits[0];
        const h1 = shipHits[1];
        const isHorizontal = h0.y === h1.y;

        const xs = shipHits.map(h => h.x);
        const ys = shipHits.map(h => h.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        if (isHorizontal) {
          // Check ends of horizontal line
          if (isAvailable(maxX + 1, minY)) return { x: maxX + 1, y: minY };
          if (isAvailable(minX - 1, minY)) return { x: minX - 1, y: minY };
        } else {
          // Check ends of vertical line
          if (isAvailable(minX, maxY + 1)) return { x: minX, y: maxY + 1 };
          if (isAvailable(minX, minY - 1)) return { x: minX, y: minY - 1 };
        }
      }

      // Fallback: search neighbors of any hit of this ship
      // Shuffling neighbors to avoid predictable patterns
      const allNeighbors: {x: number, y: number}[] = [];
      shipHits.forEach(hit => {
        allNeighbors.push({ x: hit.x + 1, y: hit.y });
        allNeighbors.push({ x: hit.x - 1, y: hit.y });
        allNeighbors.push({ x: hit.x, y: hit.y + 1 });
        allNeighbors.push({ x: hit.x, y: hit.y - 1 });
      });

      allNeighbors.sort(() => Math.random() - 0.5);
      for (const n of allNeighbors) {
        if (isAvailable(n.x, n.y)) return n;
      }
    }

    return null;
  };

  // Execution:
  // 1. Always check for a hunt target (partially hit ships)
  const target = huntTarget();
  if (target) return target;

  // 2. If no hunt target, use search strategy based on difficulty
  if (difficulty === 'hard') {
    // Parity/Checkerboard search: Target only (x+y)%2 cells for maximum efficiency
    let attempts = 0;
    while (attempts < 200) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if ((x + y) % 2 === 0 && isAvailable(x, y)) return { x, y };
      attempts++;
    }
  }

  if (difficulty === 'medium') {
    // Medium has a small bias towards patterns but mostly random search
    let attempts = 0;
    while (attempts < 50) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if ((x + y) % 2 === 0 && isAvailable(x, y)) return { x, y };
      attempts++;
    }
  }

  // 3. Absolute fallback: Random selection
  while (true) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (isAvailable(x, y)) return { x, y };
  }
}

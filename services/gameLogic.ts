
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

export function getAIShot(playerGrid: CellState[][], difficulty: string): {x: number, y: number} {
  const isAvailable = (x: number, y: number) => {
    const status = playerGrid[y][x].status;
    return status !== 'hit' && status !== 'miss';
  };

  const getHitsWithoutSunk = () => {
    const hits: {x: number, y: number}[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (playerGrid[y][x].status === 'hit') {
          // Verify if this hit belongs to a ship that isn't fully sunk yet
          // In this implementation, we can just check if any neighbor is available
          // or if it's a standalone hit.
          hits.push({ x, y });
        }
      }
    }
    return hits;
  };

  const huntTarget = () => {
    const hits = getHitsWithoutSunk();
    for (const hit of hits) {
      const neighbors = [
        { x: hit.x + 1, y: hit.y },
        { x: hit.x - 1, y: hit.y },
        { x: hit.x, y: hit.y + 1 },
        { x: hit.x, y: hit.y - 1 },
      ];
      for (const n of neighbors) {
        if (n.x >= 0 && n.x < GRID_SIZE && n.y >= 0 && n.y < GRID_SIZE && isAvailable(n.x, n.y)) {
          return n;
        }
      }
    }
    return null;
  };

  // 1. Easy: Pure Random
  if (difficulty === 'easy') {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (isAvailable(x, y)) return { x, y };
    }
  }

  // 2. Medium: Random + Adjacent Hunt
  if (difficulty === 'medium') {
    const target = huntTarget();
    if (target) return target;

    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (isAvailable(x, y)) return { x, y };
    }
  }

  // 3. Hard: Checkerboard Strategy + Aggressive Hunt
  if (difficulty === 'hard') {
    const target = huntTarget();
    if (target) return target;

    // Preference for checkerboard pattern to find ships faster
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if ((x + y) % 2 === 0 && isAvailable(x, y)) return { x, y };
      attempts++;
    }

    // Fallback to any available cell
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (isAvailable(x, y)) return { x, y };
    }
  }

  return { x: 0, y: 0 };
}

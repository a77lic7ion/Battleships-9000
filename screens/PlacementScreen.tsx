
import React, { useState, useCallback, useEffect } from 'react';
import { PlacedShip, ShipType, CellState, GameState } from '../types';
import { SHIPS, SHIP_ORDER, GRID_SIZE } from '../constants';
import { canPlaceShip, createEmptyGrid } from '../services/gameLogic';
import { sound } from '../services/audioService';

interface PlacementScreenProps {
  gameState: GameState;
  onReady: (ships: PlacedShip[], grid: CellState[][]) => void;
  onCancel: () => void;
  onAcknowledge: () => void;
}

const PlacementScreen: React.FC<PlacementScreenProps> = ({ gameState, onReady, onCancel, onAcknowledge }) => {
  const [grid, setGrid] = useState<CellState[][]>(createEmptyGrid());
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(SHIP_ORDER[0]);
  const [horizontal, setHorizontal] = useState(true);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);

  // Reset local state when placement phase changes
  useEffect(() => {
    setGrid(createEmptyGrid());
    setPlacedShips([]);
    setSelectedShip(SHIP_ORDER[0]);
  }, [gameState.placementPhase]);

  const handleCellClick = (x: number, y: number) => {
    if (!selectedShip) return;

    const size = SHIPS[selectedShip].size;
    if (canPlaceShip(grid, x, y, size, horizontal)) {
      sound.playUI();
      const newGrid = [...grid.map(row => [...row])];
      for (let i = 0; i < size; i++) {
        const curX = horizontal ? x + i : x;
        const curY = horizontal ? y : y + i;
        newGrid[curY][curX] = { status: 'ship', shipType: selectedShip };
      }
      
      const newShip: PlacedShip = { type: selectedShip, x, y, size, horizontal, hits: 0 };
      const newPlaced = [...placedShips, newShip];
      setPlacedShips(newPlaced);
      setGrid(newGrid);

      const nextShip = SHIP_ORDER.find(type => !newPlaced.some(s => s.type === type));
      setSelectedShip(nextShip || null);
    }
  };

  const handleReset = () => {
    sound.playUI();
    setGrid(createEmptyGrid());
    setPlacedShips([]);
    setSelectedShip(SHIP_ORDER[0]);
  };

  const activeName = gameState.placementPhase === 1 ? gameState.player1Name : gameState.player2Name;

  return (
    <div className="flex-1 flex flex-col p-8 max-w-[1400px] mx-auto w-full relative z-10 overflow-hidden">
      {/* Privacy Transition Overlay */}
      {gameState.isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-terminal-accent/60 border border-primary/40 p-12 rounded-2xl flex flex-col items-center gap-8 shadow-2xl max-w-sm text-center">
            <span className="material-symbols-outlined text-7xl text-primary animate-pulse">security</span>
            <div>
              <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-2">Security Handover</h2>
              <p className="text-primary/60 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Clear the terminal zone.<br/>Hand device to:
              </p>
              <h3 className="text-primary text-3xl font-black italic mt-4 uppercase drop-shadow-[0_0_10px_rgba(31,97,239,0.5)]">
                {activeName}
              </h3>
            </div>
            <button 
              onClick={onAcknowledge}
              className="px-12 h-14 bg-primary text-white font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Confirm Access
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between gap-6 border-l-4 border-primary pl-6 mb-8">
        <div>
          <h1 className="text-white text-5xl font-black tracking-tighter uppercase leading-none">Fleet Deployment</h1>
          <p className="text-primary/60 text-lg font-light tracking-wide italic mt-1">
            COMMANDER: <span className="text-primary font-black uppercase">{activeName}</span> — Assign fleet coordinates.
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="px-6 h-12 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          Reset
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-terminal-accent/40 border border-white/5 p-6 rounded-xl flex flex-col h-full shadow-inner">
            <div className="mb-6">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Fleet Armory</h3>
              <h2 className="text-white text-lg font-bold uppercase tracking-widest">Unplaced Units</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {SHIP_ORDER.map(type => {
                const config = SHIPS[type];
                const placed = placedShips.some(s => s.type === type);
                const selected = selectedShip === type;

                return (
                  <div
                    key={type}
                    onClick={() => !placed && setSelectedShip(type)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selected ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.2)]' : 
                      placed ? 'bg-black/40 border-green-500/20 opacity-40' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-base ${selected ? 'text-primary' : placed ? 'text-green-500' : 'text-white/40'}`}>
                          {config.icon}
                        </span>
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${placed ? 'line-through' : 'text-white'}`}>{type}</p>
                      </div>
                      {placed && <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>}
                    </div>
                    <div className="flex gap-1">
                      {Array(config.size).fill(0).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${selected ? 'bg-primary' : placed ? 'bg-green-500/40' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-6">
              <button 
                onClick={() => { setHorizontal(!horizontal); sound.playUI(); }}
                className="w-full flex items-center justify-between rounded-xl h-14 px-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Flip Axis</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">sync</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{horizontal ? 'Horizontal' : 'Vertical'}</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col gap-4">
          <div className="relative bg-[#0d1c2b] border-2 border-primary/20 p-8 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col justify-center">
            <div className="flex justify-center">
              <div className="grid grid-cols-11 gap-1">
                <div className="w-8 h-8"></div>
                {['A','B','C','D','E','F','G','H','I','J'].map(l => (
                  <div key={l} className="w-8 h-8 flex items-center justify-center text-[10px] font-mono text-primary font-bold opacity-40">{l}</div>
                ))}
                
                {grid.map((row, y) => (
                  <React.Fragment key={y}>
                    <div className="w-8 h-8 flex items-center justify-center text-[10px] font-mono text-primary font-bold opacity-40">{y+1}</div>
                    {row.map((cell, x) => {
                      const isHovering = hoverPos && (
                        horizontal 
                          ? (y === hoverPos.y && x >= hoverPos.x && x < hoverPos.x + (selectedShip ? SHIPS[selectedShip].size : 0))
                          : (x === hoverPos.x && y >= hoverPos.y && y < hoverPos.y + (selectedShip ? SHIPS[selectedShip].size : 0))
                      );
                      const canPlace = isHovering && selectedShip && canPlaceShip(grid, hoverPos.x, hoverPos.y, SHIPS[selectedShip].size, horizontal);
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          onMouseEnter={() => setHoverPos({x, y})}
                          onMouseLeave={() => setHoverPos(null)}
                          onClick={() => handleCellClick(x, y)}
                          className={`w-8 h-8 rounded-sm border transition-all ${
                            cell.status === 'ship' ? 'bg-primary/40 border-primary/60 shadow-[inset_0_0_8px_rgba(31,97,239,0.3)]' :
                            canPlace ? 'bg-primary/20 border-primary animate-pulse' :
                            isHovering ? 'bg-red-500/20 border-red-500' :
                            'bg-white/[0.02] border-white/5'
                          }`}
                        ></div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-terminal-accent/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Tactical Status</span>
                <p className="text-white text-sm">
                  {placedShips.length === 5 ? 'Vessels Ready for Assignment.' : 'Positioning Fleet Assets...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onCancel}
                className="px-6 h-12 rounded-lg text-white/50 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Abort
              </button>
              <button 
                disabled={placedShips.length < 5}
                onClick={() => onReady(placedShips, grid)}
                className={`h-14 px-10 rounded-lg text-xs font-black uppercase tracking-[0.3em] transition-all ${
                  placedShips.length === 5 ? 'bg-primary text-white shadow-[0_0_20px_rgba(31,97,239,0.4)] hover:scale-105 active:scale-95' : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Seal Command
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlacementScreen;

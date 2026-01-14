import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlacedShip, ShipType, CellState, GameState } from '../types';
import { SHIPS, SHIP_ORDER, GRID_SIZE } from '../constants';
import { canPlaceShip, createEmptyGrid, placeAIShips } from '../services/gameLogic';
import { sound } from '../services/audioService';

interface PlacementScreenProps {
  gameState: GameState;
  onReady: (ships: PlacedShip[], grid: CellState[][]) => void;
  onCancel: () => void;
  onAcknowledge: () => void;
}

interface DragState {
  type: ShipType;
  startX: number;
  startY: number;
}

const PlacementScreen: React.FC<PlacementScreenProps> = ({ gameState, onReady, onCancel, onAcknowledge }) => {
  const [grid, setGrid] = useState<CellState[][]>(createEmptyGrid());
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(SHIP_ORDER[0]);
  const [activeShip, setActiveShip] = useState<ShipType | null>(null); // Ship currently being edited on grid
  const [horizontal, setHorizontal] = useState(true);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  
  // Drag State for on-grid moving
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({ x: 0, y: 0 });

  useEffect(() => {
    setGrid(createEmptyGrid());
    setPlacedShips([]);
    setSelectedShip(SHIP_ORDER[0]);
    setActiveShip(null);
  }, [gameState.placementPhase]);

  const removeShipFromGrid = (type: ShipType) => {
    const newPlaced = placedShips.filter(s => s.type !== type);
    const newGrid = [...grid.map(row => [...row])];
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        if (newGrid[gy][gx].shipType === type) {
          newGrid[gy][gx] = { status: 'empty', shipType: null };
        }
      }
    }
    setPlacedShips(newPlaced);
    setGrid(newGrid);
  };

  const placeShipOnGrid = (type: ShipType, x: number, y: number, isHorizontal: boolean) => {
    const size = SHIPS[type].size;
    if (canPlaceShip(grid, x, y, size, isHorizontal)) {
      const newGrid = [...grid.map(row => [...row])];
      for (let i = 0; i < size; i++) {
        const curX = isHorizontal ? x + i : x;
        const curY = isHorizontal ? y : y + i;
        newGrid[curY][curX] = { status: 'ship', shipType: type };
      }
      const newShip: PlacedShip = { type, x, y, size, horizontal: isHorizontal, hits: 0 };
      setPlacedShips(prev => [...prev, newShip]);
      setGrid(newGrid);
      
      const remaining = SHIP_ORDER.find(t => ![...placedShips, newShip].some(s => s.type === t));
      setSelectedShip(remaining || null);
      setActiveShip(type); // Select the newly placed ship for command
      return true;
    }
    return false;
  };

  const handleCellClick = (x: number, y: number) => {
    if (dragState) return; // Prevent interference with drag-end

    const cell = grid[y][x];

    // Select existing ship on grid
    if (cell.status === 'ship' && cell.shipType) {
      if (activeShip === cell.shipType) {
        // Toggle rotation if clicked again? Or just select. 
        // Instructions say "select any ship... to show rotation handles"
        // Let's keep it selected.
      } else {
        setActiveShip(cell.shipType);
        sound.playUI();
        const ship = placedShips.find(s => s.type === cell.shipType);
        if (ship) setHorizontal(ship.horizontal);
      }
      return;
    }

    // Place new ship from sidebar if one is selected and not yet placed
    if (selectedShip && !placedShips.some(s => s.type === selectedShip)) {
      if (placeShipOnGrid(selectedShip, x, y, horizontal)) {
        sound.playUI();
      }
    } else {
      setActiveShip(null);
    }
  };

  const handlePointerDownGrid = (e: React.PointerEvent, x: number, y: number) => {
    const cell = grid[y][x];
    if (cell.status === 'ship' && cell.shipType && activeShip === cell.shipType) {
      // Initiate repositioning drag
      removeShipFromGrid(cell.shipType);
      setDragState({ type: cell.shipType, startX: x, startY: y });
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      const type = dragState.type;
      const shipSize = SHIPS[type].size;
      // Resolve drop
      if (hoverPos && canPlaceShip(grid, hoverPos.x, hoverPos.y, shipSize, horizontal)) {
        placeShipOnGrid(type, hoverPos.x, hoverPos.y, horizontal);
        sound.playUI();
      } else {
        // Snap back to origin if invalid
        placeShipOnGrid(type, dragState.startX, dragState.startY, horizontal);
      }
      setDragState(null);
    }
  };

  const handleRotateActive = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (!activeShip || dragState) return;
    const ship = placedShips.find(s => s.type === activeShip);
    if (!ship) return;

    const newHorizontal = !ship.horizontal;
    removeShipFromGrid(activeShip);
    if (canPlaceShip(grid, ship.x, ship.y, ship.size, newHorizontal)) {
      placeShipOnGrid(activeShip, ship.x, ship.y, newHorizontal);
      setHorizontal(newHorizontal);
      sound.playUI();
    } else {
      // Revert if blocked
      placeShipOnGrid(activeShip, ship.x, ship.y, ship.horizontal);
    }
  };

  const handleRandomize = () => {
    sound.playUI();
    const { grid: randomGrid, ships: randomShips } = placeAIShips();
    setGrid(randomGrid);
    setPlacedShips(randomShips);
    setSelectedShip(null);
    setActiveShip(null);
  };

  const handleReset = () => {
    sound.playUI();
    setGrid(createEmptyGrid());
    setPlacedShips([]);
    setSelectedShip(SHIP_ORDER[0]);
    setActiveShip(null);
  };

  const activeName = gameState.placementPhase === 1 ? gameState.player1Name : gameState.player2Name;

  return (
    <div 
      onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      onPointerUp={handlePointerUp}
      className="flex-1 flex flex-col p-8 max-w-[1400px] mx-auto w-full relative z-10 overflow-hidden select-none"
    >
      {/* Handover Overlay */}
      {gameState.isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-terminal-accent/60 border border-primary/40 p-12 rounded-2xl flex flex-col items-center gap-8 shadow-2xl max-w-sm text-center">
            <span className="material-symbols-outlined text-7xl text-primary animate-pulse">security</span>
            <div>
              <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-2">Security Handover</h2>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-widest">Hand terminal to {activeName}.</p>
            </div>
            <button onClick={onAcknowledge} className="px-12 h-14 bg-primary text-white font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110">Confirm Access</button>
          </div>
        </div>
      )}

      {/* Movement Ghost Preview (Overlaying Grid) */}
      {dragState && (
        <div 
          className="fixed pointer-events-none z-[100] flex gap-1 opacity-50"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: 'translate(-16px, -16px)',
            flexDirection: horizontal ? 'row' : 'column'
          }}
        >
          {Array(SHIPS[dragState.type].size).fill(0).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-primary/40 border border-white/50 rounded-sm shadow-[0_0_15px_rgba(31,97,239,0.6)]"></div>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between gap-6 border-l-4 border-primary pl-6 mb-8">
        <div>
          <h1 className="text-white text-5xl font-black tracking-tighter uppercase leading-none">Fleet Deployment</h1>
          <p className="text-primary/60 text-lg font-light tracking-wide italic mt-1">COMMANDER: <span className="text-primary font-black uppercase">{activeName}</span></p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleRandomize} className="px-6 h-12 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">shuffle</span> Randomize
          </button>
          <button onClick={handleReset} className="px-6 h-12 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Reset</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-terminal-accent/40 border border-white/5 p-6 rounded-xl flex flex-col h-full shadow-inner">
            <div className="mb-6">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Fleet Armory</h3>
              <h2 className="text-white text-lg font-bold uppercase tracking-widest">Unit Selection</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {SHIP_ORDER.map(type => {
                const config = SHIPS[type];
                const isPlaced = placedShips.some(s => s.type === type);
                const isSelected = selectedShip === type || activeShip === type;

                return (
                  <div
                    key={type}
                    onClick={() => {
                      sound.playUI();
                      if (isPlaced) {
                        setActiveShip(type);
                        setSelectedShip(null);
                        const ship = placedShips.find(s => s.type === type);
                        if (ship) setHorizontal(ship.horizontal);
                      } else {
                        setSelectedShip(type);
                        setActiveShip(null);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.2)]' : 
                      isPlaced ? 'bg-black/40 border-green-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-base ${isSelected ? 'text-primary' : isPlaced ? 'text-green-500' : 'text-white/40'}`}>{config.icon}</span>
                        <p className={`text-[11px] font-bold uppercase tracking-widest text-white`}>{type}</p>
                      </div>
                      {isPlaced && <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>}
                    </div>
                    <div className="flex gap-1">
                      {Array(config.size).fill(0).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${isSelected ? 'bg-primary' : isPlaced ? 'bg-green-500/40' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-6">
              <button 
                onClick={() => { setHorizontal(!horizontal); sound.playUI(); }}
                className="w-full flex items-center justify-between rounded-xl h-14 px-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Global Axis</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm group-hover:rotate-180 transition-transform">sync</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{horizontal ? 'Horiz' : 'Vert'}</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col gap-4">
          <div className="relative bg-[#0d1c2b] border-2 border-primary/20 p-8 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col justify-center">
            <div className="flex justify-center relative">
              <div className="grid grid-cols-11 gap-1 relative">
                <div className="w-8 h-8"></div>
                {['A','B','C','D','E','F','G','H','I','J'].map(l => (
                  <div key={l} className="w-8 h-8 flex items-center justify-center text-[10px] font-mono text-primary font-bold opacity-40">{l}</div>
                ))}
                
                {grid.map((row, y) => (
                  <React.Fragment key={y}>
                    <div className="w-8 h-8 flex items-center justify-center text-[10px] font-mono text-primary font-bold opacity-40">{y+1}</div>
                    {row.map((cell, x) => {
                      const currentActionShipType = selectedShip || dragState?.type;
                      const isHovering = hoverPos && currentActionShipType && (
                        horizontal 
                          ? (y === hoverPos.y && x >= hoverPos.x && x < hoverPos.x + SHIPS[currentActionShipType].size)
                          : (x === hoverPos.x && y >= hoverPos.y && y < hoverPos.y + SHIPS[currentActionShipType].size)
                      );
                      const isGhostValid = isHovering && currentActionShipType && canPlaceShip(grid, hoverPos!.x, hoverPos!.y, SHIPS[currentActionShipType].size, horizontal);
                      const isPartofActive = activeShip && cell.shipType === activeShip && !dragState;
                      const activeShipData = activeShip ? placedShips.find(s => s.type === activeShip) : null;
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          onMouseEnter={() => setHoverPos({x, y})}
                          onMouseLeave={() => setHoverPos(null)}
                          onClick={() => handleCellClick(x, y)}
                          onPointerDown={(e) => handlePointerDownGrid(e, x, y)}
                          className={`w-8 h-8 rounded-sm border transition-all relative ${
                            cell.status === 'ship' ? 'bg-primary/20 border-primary/30' :
                            isGhostValid ? 'bg-green-500/20 border-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                            isHovering ? 'bg-red-500/30 border-red-500 animate-pulse' :
                            'bg-white/[0.02] border-white/5'
                          } ${isPartofActive ? 'ring-2 ring-primary bg-primary/40 border-primary shadow-[0_0_15px_rgba(31,97,239,0.4)] z-10 cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          {/* Command Phase UI: Symmetrical Rotation Handles */}
                          {isPartofActive && activeShipData && (
                            <>
                              {/* Start Handle */}
                              {x === activeShipData.x && y === activeShipData.y && (
                                <div 
                                  onPointerDown={handleRotateActive}
                                  className="absolute -top-3 -left-3 size-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_10px_rgba(31,97,239,0.8)] cursor-pointer hover:scale-125 hover:bg-accent transition-all z-20"
                                  title="Rotate Vessel"
                                >
                                  <span className="material-symbols-outlined text-[14px] text-white font-black">sync</span>
                                </div>
                              )}
                              {/* End Handle */}
                              {((horizontal && x === activeShipData.x + activeShipData.size - 1 && y === activeShipData.y) ||
                                (!horizontal && x === activeShipData.x && y === activeShipData.y + activeShipData.size - 1)) && (
                                <div 
                                  onPointerDown={handleRotateActive}
                                  className="absolute -bottom-3 -right-3 size-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_10px_rgba(31,97,239,0.8)] cursor-pointer hover:scale-125 hover:bg-accent transition-all z-20"
                                  title="Rotate Vessel"
                                >
                                  <span className="material-symbols-outlined text-[14px] text-white font-black">sync</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-terminal-accent/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Combat Subsystem: Deployment</span>
              <p className="text-white text-sm font-bold tracking-wide italic">
                {dragState ? `Relocating ${dragState.type.toUpperCase()}...` :
                 activeShip ? `Calibrating ${activeShip.toUpperCase()}. [DRAG] to Reposition // [SYNC_ICON] to Rotate` : 
                 placedShips.length === 5 ? 'Fleet configuration confirmed. Ready for engage.' : `Assigning ${selectedShip || 'Fleet assets'}... Click coordinates to deploy.`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onCancel} className="px-6 h-12 text-white/50 text-[10px] font-black uppercase tracking-widest hover:text-white">Abort</button>
              <button 
                disabled={placedShips.length < 5}
                onClick={() => onReady(placedShips, grid)}
                className={`h-14 px-10 rounded-lg text-xs font-black uppercase tracking-[0.3em] transition-all ${
                  placedShips.length === 5 ? 'bg-primary text-white shadow-[0_0_20px_rgba(31,97,239,0.4)] hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20 border border-white/10'
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

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
  const [activeShip, setActiveShip] = useState<ShipType | null>(null);
  const [horizontal, setHorizontal] = useState(true);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  
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
      setActiveShip(type); 
      return true;
    }
    return false;
  };

  const handleCellClick = (x: number, y: number) => {
    if (dragState) return;

    const cell = grid[y][x];

    if (cell.status === 'ship' && cell.shipType) {
      if (activeShip !== cell.shipType) {
        setActiveShip(cell.shipType);
        sound.playUI();
        const ship = placedShips.find(s => s.type === cell.shipType);
        if (ship) setHorizontal(ship.horizontal);
      }
      return;
    }

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
      removeShipFromGrid(cell.shipType);
      setDragState({ type: cell.shipType, startX: x, startY: y });
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      const type = dragState.type;
      const shipSize = SHIPS[type].size;
      if (hoverPos && canPlaceShip(grid, hoverPos.x, hoverPos.y, shipSize, horizontal)) {
        placeShipOnGrid(type, hoverPos.x, hoverPos.y, horizontal);
        sound.playUI();
      } else {
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

  const activeName = gameState.placementPhase === 1 ? gameState.player1Name : gameState.player2Name;

  return (
    <div 
      onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      onPointerUp={handlePointerUp}
      className="flex-1 flex flex-col p-4 sm:p-8 max-w-[1400px] mx-auto w-full relative z-10 overflow-y-auto overflow-x-hidden select-none"
    >
      {gameState.isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-terminal-accent/60 border border-primary/40 p-10 rounded-2xl flex flex-col items-center gap-6 shadow-2xl max-w-sm text-center">
            <span className="material-symbols-outlined text-7xl text-primary animate-pulse">security</span>
            <div>
              <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-2">Secure Handover</h2>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-widest">Commander access: {activeName}</p>
            </div>
            <button onClick={onAcknowledge} className="px-10 h-12 bg-primary text-white font-black uppercase tracking-widest rounded-lg shadow-lg">Confirm</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-l-4 border-primary pl-4 sm:pl-6 mb-6 sm:mb-8 relative">
        <div className="flex items-center gap-6">
          <div className="hidden sm:block size-20 bg-primary/10 rounded-2xl border border-primary/20 p-3 shadow-[0_0_30px_rgba(31,97,239,0.2)]">
            <img src="/logo.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-none">Deployment</h1>
            <p className="text-primary/60 text-sm sm:text-lg font-light tracking-wide italic mt-1 uppercase">Commander: <span className="text-primary font-black">{activeName}</span></p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={handleRandomize} className="flex-1 sm:flex-none px-4 sm:px-6 h-10 sm:h-12 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">shuffle</span> Auto
          </button>
          <button onClick={() => { setGrid(createEmptyGrid()); setPlacedShips([]); sound.playUI(); }} className="flex-1 sm:flex-none px-4 sm:px-6 h-10 sm:h-12 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-white/10">Reset</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 flex-1">
        <aside className="w-full lg:w-80 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
          <div className="bg-terminal-accent/40 border border-white/5 p-4 sm:p-6 rounded-xl flex flex-col h-full shadow-inner">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Fleet Armory</h3>
              <h2 className="text-white text-sm sm:text-lg font-bold uppercase tracking-widest">Unit Status</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
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
                    className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? 'bg-primary/20 border-primary ring-1 ring-primary/40' : 
                      isPlaced ? 'bg-black/40 border-green-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-primary' : isPlaced ? 'text-green-500' : 'text-white/40'}`}>{config.icon}</span>
                        <p className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-white`}>{type}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array(config.size).fill(0).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${isSelected ? 'bg-primary shadow-[0_0_5px_#1f61ef]' : isPlaced ? 'bg-green-500/40' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 sm:mt-auto">
              <button 
                onClick={() => { setHorizontal(!horizontal); sound.playUI(); }}
                className="w-full flex items-center justify-between rounded-xl h-12 sm:h-14 px-5 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Axis</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">sync</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{horizontal ? 'Horizontal' : 'Vertical'}</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col gap-4 order-1 lg:order-2">
          <div className="relative bg-[#0d1c2b] border-2 border-primary/20 p-4 sm:p-8 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col justify-center min-h-[400px]">
            <div className="flex justify-center relative touch-none w-full max-w-[min(80vw,65vh)] mx-auto aspect-square">
              <div className="grid grid-cols-11 gap-0.5 sm:gap-1 relative w-full h-full">
                <div className="aspect-square"></div>
                {['A','B','C','D','E','F','G','H','I','J'].map(l => (
                  <div key={l} className="aspect-square flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-500 opacity-30">{l}</div>
                ))}
                
                {grid.map((row, y) => (
                  <React.Fragment key={y}>
                    <div className="aspect-square flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-500 opacity-30">{y+1}</div>
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
                          className={`aspect-square rounded-sm border relative transition-all overflow-hidden ${
                            cell.status === 'ship' ? 'bg-primary/20 border-primary/30' :
                            isGhostValid ? 'bg-green-500/20 border-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                            isHovering ? 'bg-red-500/30 border-red-500 animate-pulse' :
                            'bg-white/[0.02] border-white/5'
                          } ${isPartofActive ? 'ring-2 ring-primary bg-primary/40 border-primary shadow-[0_0_15px_rgba(31,97,239,0.4)] z-10 cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          {isPartofActive && activeShipData && (
                            <>
                              {/* Enlarged handles for mobile */}
                              {x === activeShipData.x && y === activeShipData.y && (
                                <div 
                                  onPointerDown={handleRotateActive}
                                  className="absolute -top-4 -left-4 size-8 sm:size-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_10px_rgba(31,97,239,0.8)] cursor-pointer hover:scale-125 z-20"
                                >
                                  <span className="material-symbols-outlined text-[16px] sm:text-[14px] text-white font-black">sync</span>
                                </div>
                              )}
                              {((horizontal && x === activeShipData.x + activeShipData.size - 1 && y === activeShipData.y) ||
                                (!horizontal && x === activeShipData.x && y === activeShipData.y + activeShipData.size - 1)) && (
                                <div 
                                  onPointerDown={handleRotateActive}
                                  className="absolute -bottom-4 -right-4 size-8 sm:size-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_10px_rgba(31,97,239,0.8)] cursor-pointer hover:scale-125 z-20"
                                >
                                  <span className="material-symbols-outlined text-[16px] sm:text-[14px] text-white font-black">sync</span>
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

          <div className="flex flex-col sm:flex-row items-center justify-between bg-terminal-accent/60 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 gap-4">
            <div className="text-center sm:text-left">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Subsystem: Deployment</span>
              <p className="text-white text-xs sm:text-sm font-bold italic opacity-80">
                {activeShip ? `Calibrating ${activeShip}. Drag to move or tap handles.` : 
                 placedShips.length === 5 ? 'Fleet ready. Seal command.' : `Deploy ${selectedShip || 'assets'}.`}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button onClick={onCancel} className="flex-1 sm:flex-none px-4 text-white/50 text-[10px] font-black uppercase tracking-widest hover:text-white">Abort</button>
              <button 
                disabled={placedShips.length < 5}
                onClick={() => onReady(placedShips, grid)}
                className={`flex-1 sm:flex-none h-12 sm:h-14 px-8 sm:px-10 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] transition-all ${
                  placedShips.length === 5 ? 'bg-primary text-white shadow-[0_0_20px_rgba(31,97,239,0.4)]' : 'bg-white/5 text-white/20 border border-white/10'
                }`}
              >
                Engage
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlacementScreen;

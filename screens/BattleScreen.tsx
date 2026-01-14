
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { GameState, LogEntry, PlacedShip, CellState, ShipType } from '../types';
import { SHIPS, SHIP_ORDER, GRID_SIZE } from '../constants';
import { getAIShot, isShipSunk } from '../services/gameLogic';
import { sound } from '../services/audioService';

interface BattleScreenProps {
  gameState: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (m: string, t?: LogEntry['type']) => void;
  onGameOver: (winner: 'player' | 'ai') => void;
}

const BattleScreen: React.FC<BattleScreenProps> = ({ gameState, setState, addLog, onGameOver }) => {
  const [lastHitPos, setLastHitPos] = useState<{x: number, y: number, side: 'player' | 'ai'} | null>(null);
  const aiFiringRef = useRef(false);

  const checkGameOver = useCallback((ships: PlacedShip[]) => {
    return ships.every(s => isShipSunk(s));
  }, []);

  const triggerHitEffect = (x: number, y: number, side: 'player' | 'ai') => {
    setLastHitPos({ x, y, side });
    setTimeout(() => setLastHitPos(null), 1000);
  };

  const isPlayerTurn = gameState.turn === 'player';
  const activeName = isPlayerTurn ? gameState.player1Name : gameState.player2Name;

  const processAIShot = useCallback(() => {
    if (gameState.turn !== 'ai' || gameState.winner || gameState.mode === 'multi') return;

    const { x, y } = getAIShot(gameState.playerGrid, gameState.difficulty);
    const playerGrid = [...gameState.playerGrid.map(row => [...row])];
    const playerShips = [...gameState.playerShips.map(s => ({ ...s }))];
    const cell = playerGrid[y][x];

    let msg = `Enemy fires at ${String.fromCharCode(65 + x)}-${y + 1}... `;
    let type: LogEntry['type'] = 'enemy';
    let continueTurn = false;

    if (cell.status === 'ship') {
      playerGrid[y][x].status = 'hit';
      sound.playHit();
      triggerHitEffect(x, y, 'player');
      const ship = playerShips.find(s => s.type === cell.shipType);
      if (ship) {
        ship.hits++;
        if (isShipSunk(ship)) {
          sound.playSunk();
          msg += `SUNK YOUR ${ship.type.toUpperCase()}!`;
        } else {
          msg += 'DIRECT HIT!';
        }
      }
      continueTurn = true;
    } else {
      playerGrid[y][x].status = 'miss';
      sound.playMiss();
      msg += 'MISS';
      continueTurn = false;
    }

    addLog(msg, type);

    if (checkGameOver(playerShips)) {
      onGameOver('ai');
    } else {
      setState(prev => ({ 
        ...prev, 
        playerGrid, 
        playerShips, 
        turn: continueTurn ? 'ai' : 'player' 
      }));
    }
    aiFiringRef.current = false;
  }, [gameState.turn, gameState.winner, gameState.mode, gameState.playerGrid, gameState.playerShips, gameState.difficulty, setState, addLog, onGameOver, checkGameOver]);

  useEffect(() => {
    if (gameState.turn === 'ai' && !gameState.winner && !aiFiringRef.current && gameState.mode === 'single') {
      aiFiringRef.current = true;
      const timer = setTimeout(processAIShot, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.winner, gameState.mode, processAIShot]);

  const handleStrike = (x: number, y: number) => {
    if (gameState.isTransitioning || gameState.winner) return;

    const targetGridKey = isPlayerTurn ? 'aiGrid' : 'playerGrid';
    const targetShipsKey = isPlayerTurn ? 'aiShips' : 'playerShips';
    
    const targetGrid = [...gameState[targetGridKey].map(row => [...row])];
    const targetShips = [...gameState[targetShipsKey].map(s => ({ ...s }))];
    const cell = targetGrid[y][x];

    if (cell.status === 'hit' || cell.status === 'miss') return;

    let msg = `${activeName} strikes ${String.fromCharCode(65 + x)}-${y + 1}... `;
    let type: LogEntry['type'] = 'player';
    let continueTurn = false;

    if (cell.status === 'ship') {
      targetGrid[y][x].status = 'hit';
      sound.playHit();
      triggerHitEffect(x, y, isPlayerTurn ? 'ai' : 'player');
      const ship = targetShips.find(s => s.type === cell.shipType);
      if (ship) {
        ship.hits++;
        if (isShipSunk(ship)) {
          sound.playSunk();
          msg += `CONFIRMED! ${ship.type.toUpperCase()} neutralised.`;
          type = 'success';
        } else {
          msg += 'DIRECT HIT!';
        }
      }
      continueTurn = true;
    } else {
      targetGrid[y][x].status = 'miss';
      sound.playMiss();
      msg += 'MISS. Strike failed.';
      continueTurn = false;
    }

    addLog(msg, type);

    if (checkGameOver(targetShips)) {
      onGameOver(isPlayerTurn ? 'player' : 'ai');
    } else {
      setState(prev => ({ 
        ...prev, 
        [targetGridKey]: targetGrid, 
        [targetShipsKey]: targetShips, 
        turn: continueTurn ? prev.turn : (isPlayerTurn ? 'ai' : 'player'),
        isTransitioning: !continueTurn && gameState.mode === 'multi'
      }));
    }
  };

  const calculateAccuracy = (grid: CellState[][]) => {
    let hits = 0;
    let total = 0;
    grid.forEach(r => r.forEach(c => {
      if (c.status === 'hit') { hits++; total++; }
      else if (c.status === 'miss') { total++; }
    }));
    return total === 0 ? 0 : Math.round((hits / total) * 100);
  };

  // Determine what each grid represents for the active player
  const defensiveGrid = isPlayerTurn ? gameState.playerGrid : gameState.aiGrid;
  const offensiveGrid = isPlayerTurn ? gameState.aiGrid : gameState.playerGrid;
  const defensiveShips = isPlayerTurn ? gameState.playerShips : gameState.aiShips;
  const offensiveShips = isPlayerTurn ? gameState.aiShips : gameState.playerShips;

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 relative z-10 overflow-hidden">
      {/* Turn Transition Overlay */}
      {gameState.isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/90 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-terminal-accent/60 border border-primary/40 p-12 rounded-2xl flex flex-col items-center gap-8 shadow-2xl max-w-sm text-center">
            <span className="material-symbols-outlined text-7xl text-primary animate-pulse">sync_alt</span>
            <div>
              <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-2">Turn Switch</h2>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Clear all displays.<br/>Commander access required:
              </p>
              <h3 className="text-primary text-3xl font-black italic mt-4 uppercase drop-shadow-[0_0_10px_rgba(31,97,239,0.5)]">
                {activeName}
              </h3>
            </div>
            <button 
              onClick={() => { sound.playUI(); setState(p => ({ ...p, isTransitioning: false })); }}
              className="px-12 h-14 bg-primary text-white font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Take Command
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50">
            <span className="material-symbols-outlined text-primary text-2xl">sailing</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase italic">BATTLESHIPS 9K</h1>
            <p className="text-[9px] text-primary/60 tracking-[0.3em] font-black uppercase">Active Operation: {gameState.mode === 'multi' ? 'PVP_LOCAL' : 'SOLO_INTEL'}</p>
          </div>
        </div>
        
        <div className={`relative flex items-center gap-4 px-8 py-2 rounded-full border transition-all duration-700 ${
          isPlayerTurn ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(31,97,239,0.2)]' : 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          <span className={`h-2 w-2 rounded-full animate-ping ${isPlayerTurn ? 'bg-primary' : 'bg-red-500'}`}></span>
          <span className={`text-xs font-black uppercase tracking-[0.2em] ${isPlayerTurn ? 'text-primary' : 'text-red-500'}`}>
            Command: {activeName}
          </span>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Grids Stacked Vertically */}
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar">
            {/* Defensive Grid */}
            <div className="flex flex-col gap-3 animate-fadeIn">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-primary/60">Defensive Array // Integrity: {defensiveShips.filter(s=>!isShipSunk(s)).length}/5</h2>
                    <span className="text-[8px] font-mono text-white/20">UPLINK_SECURE</span>
                </div>
                <div className="p-4 rounded-2xl border border-primary/20 bg-white/5 backdrop-blur-sm flex justify-center">
                    <GridDisplay grid={defensiveGrid} showShips={true} hitEffect={lastHitPos?.side === (isPlayerTurn ? 'player' : 'ai') ? lastHitPos : null} />
                </div>
            </div>

            {/* Offensive Grid */}
            <div className="flex flex-col gap-3 animate-fadeIn pb-8">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500/60">Offensive HUD // Targets: {offensiveShips.filter(s=>!isShipSunk(s)).length}/5</h2>
                    <span className="text-[8px] font-mono text-white/20">TARGET_LOCKED</span>
                </div>
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm flex justify-center">
                    <GridDisplay grid={offensiveGrid} showShips={false} onClick={handleStrike} hitEffect={lastHitPos?.side === (isPlayerTurn ? 'ai' : 'player') ? lastHitPos : null} />
                </div>
            </div>
        </div>

        {/* Sidebar: All stats on right */}
        <div className="w-80 shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Accuracy" value={`${calculateAccuracy(offensiveGrid)}%`} color="text-primary" />
                <StatCard label="Ops Progress" value={`${SHIP_ORDER.length - offensiveShips.filter(s=>!isShipSunk(s)).length}/5`} color="text-red-500" />
            </div>

            {/* Target Status Board */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-[10px] text-red-500/70 uppercase font-black tracking-widest border-b border-red-500/10 pb-2">Hostile Fleet Intelligence</h3>
                <div className="flex flex-col gap-2">
                    {SHIP_ORDER.map(type => {
                        const ship = offensiveShips.find(s => s.type === type);
                        const isSunk = ship && isShipSunk(ship);
                        return (
                            <div key={type} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-500 ${
                                isSunk ? 'bg-red-500/20 border-red-500/50 shadow-inner' : 'bg-white/5 border-white/5 opacity-40 grayscale'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-sm ${isSunk ? 'text-red-500' : 'text-white/20'}`}>
                                        {SHIPS[type].icon}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{type}</span>
                                </div>
                                {isSunk ? <span className="text-[8px] font-black text-red-500 animate-pulse">SUNK</span> : <span className="text-[8px] opacity-20 italic">ACTIVE</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Combat Log */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 shadow-inner min-h-[150px]">
                {gameState.logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.type === 'enemy' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-primary/70'}`}>
                        <span className="opacity-30">[{log.timestamp}]</span>
                        <span className="flex-1 leading-tight">{log.message}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => setState(p => ({ ...p, screen: 'menu' }))}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
            >
                Abort Mission
            </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(31, 97, 239, 0.2); border-radius: 10px; }
        @keyframes explosion {
          0% { transform: scale(0.5); opacity: 1; border-radius: 50%; }
          100% { transform: scale(3); opacity: 0; border-radius: 50%; }
        }
        .hit-animation {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, #EF4444 0%, transparent 80%);
          animation: explosion 0.8s ease-out forwards;
          z-index: 20;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

const GridDisplay: React.FC<{ grid: CellState[][], showShips: boolean, onClick?: (x: number, y: number) => void, hitEffect: {x: number, y: number} | null }> = ({ grid, showShips, onClick, hitEffect }) => (
  <div className="grid grid-cols-11 gap-1">
    <div className="w-8 h-8"></div>
    {['A','B','C','D','E','F','G','H','I','J'].map(l => (
      <div key={l} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 opacity-30">{l}</div>
    ))}
    {grid.map((row, y) => (
      <React.Fragment key={y}>
        <div className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 opacity-30">{y + 1}</div>
        {row.map((cell, x) => {
          const isHitCell = hitEffect?.x === x && hitEffect?.y === y;
          return (
            <div 
              key={`${x}-${y}`}
              onClick={() => onClick && onClick(x, y)}
              className={`w-8 h-8 rounded-sm border relative transition-all duration-300 ${
                onClick && cell.status !== 'hit' && cell.status !== 'miss' ? 'cursor-crosshair hover:bg-red-500/20 hover:border-red-500/50' : ''
              } ${
                cell.status === 'hit' ? 'bg-red-500/20 border-red-500/50' : 
                cell.status === 'miss' ? 'bg-white/5 border-white/10' :
                (cell.status === 'ship' && showShips) ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'
              }`}
            >
              {isHitCell && <div className="hit-animation"></div>}
              {cell.status === 'hit' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-hit text-xs">close</span>
                </div>
              )}
              {cell.status === 'miss' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-1 bg-white/20 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </div>
);

const StatCard: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 flex flex-col items-center shadow-inner">
    <div className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">{label}</div>
    <div className={`text-xl font-black ${color}`}>{value}</div>
  </div>
);

export default BattleScreen;

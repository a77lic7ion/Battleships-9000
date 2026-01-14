
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { GameState, LogEntry, PlacedShip, CellState, ShipType } from '../types';
import { SHIPS, SHIP_ORDER, GRID_SIZE } from '../constants';
import { getAIShot, isShipSunk } from '../services/gameLogic';
import { sound } from '../services/audioService';
import { CP_EARNINGS, POWERUPS, PowerUpType } from '../powerups';

interface BattleScreenProps {
  gameState: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (m: string, t?: LogEntry['type']) => void;
  onGameOver: (winner: 'player' | 'ai') => void;
}

const BattleScreen: React.FC<BattleScreenProps> = ({ gameState, setState, addLog, onGameOver }) => {
  const [lastHitPos, setLastHitPos] = useState<{x: number, y: number, side: 'player' | 'ai'} | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [sonarScanArea, setSonarScanArea] = useState<{x: number, y: number}[] | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'hit' | 'sunk'} | null>(null);
  const aiFiringRef = useRef(false);

  const showToast = (message: string, type: 'hit' | 'sunk') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkGameOver = useCallback((ships: PlacedShip[]) => {
    return ships.every(s => isShipSunk(s));
  }, []);

  const triggerHitEffect = (x: number, y: number, side: 'player' | 'ai') => {
    setLastHitPos({ x, y, side });
    setTimeout(() => setLastHitPos(null), 1000);
  };

  const isPlayerTurn = gameState.turn === 'player';
  const isMulti = gameState.mode === 'multi';
  
  const showP1Perspective = !isMulti || isPlayerTurn;
  const activeName = isPlayerTurn ? gameState.player1Name : gameState.player2Name;
  const headerName = !isMulti ? gameState.player1Name : activeName;

  const processAIShot = useCallback(() => {
    if (gameState.turn !== 'ai' || gameState.winner || isMulti) {
      aiFiringRef.current = false;
      return;
    }

    const { x, y } = getAIShot(gameState.playerGrid, gameState.difficulty);
    const playerGrid = [...gameState.playerGrid.map(row => [...row])];
    const playerShips = [...gameState.playerShips.map(s => ({ ...s }))];
    const cell = playerGrid[y][x];

    let msg = `Enemy fires at ${String.fromCharCode(65 + x)}-${y + 1}... `;
    let type: LogEntry['type'] = 'enemy';
    let continueTurn = false;

    if (cell.status === 'ship') {
      const ship = playerShips.find(s => s.type === cell.shipType);
      if (ship && ship.shielded) {
        ship.shielded = false;
        sound.playMiss();
        msg += 'SHIELD ABSORBED HIT!';
        continueTurn = false;
      } else {
        playerGrid[y][x].status = 'hit';
        sound.playHit();
        triggerHitEffect(x, y, 'player');
        if (ship) {
          ship.hits++;
          if (isShipSunk(ship)) {
            sound.playSunk();
            msg += `SUNK YOUR ${ship.type.toUpperCase()}!`;
            showToast(`YOUR ${ship.type.toUpperCase()} WAS DESTROYED!`, 'sunk');
          } else {
            msg += 'DIRECT HIT!';
          }
        }
        continueTurn = true;
      }
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
        turn: continueTurn ? 'ai' : 'player',
        shotCounter: prev.shotCounter + 1 // New: force effect re-trigger
      }));
    }
    aiFiringRef.current = false;
  }, [gameState.turn, gameState.winner, isMulti, gameState.playerGrid, gameState.playerShips, gameState.difficulty, setState, addLog, onGameOver, checkGameOver]);

  const handlePowerUp = (type: PowerUpType) => {
    if (gameState.isTransitioning || gameState.winner || activePowerUp) return;
    const playerCP = isPlayerTurn ? gameState.player1CP : gameState.player2CP;
    if (playerCP >= POWERUPS[type].cost) {
      sound.playUI();
      setActivePowerUp(type);
      addLog(`Power-up engaged: ${type}. Select target.`, 'system');
    } else {
      addLog(`Insufficient CP for ${type}. Cost: ${POWERUPS[type].cost}`, 'enemy');
    }
  };

  const handleDefensiveClick = (x: number, y: number) => {
    if (activePowerUp !== 'Aegis Shield') return;

    const gridKey = isPlayerTurn ? 'playerGrid' : 'aiGrid';
    const shipsKey = isPlayerTurn ? 'playerShips' : 'aiShips';
    const cell = gameState[gridKey][y][x];

    if (cell.status === 'ship' && cell.shipType) {
      const ships = [...gameState[shipsKey]];
      const shipIndex = ships.findIndex(s => s.type === cell.shipType);
      if (shipIndex > -1 && !ships[shipIndex].shielded) {
        ships[shipIndex] = { ...ships[shipIndex], shielded: true };
        const cpToUpdate = isPlayerTurn ? 'player1CP' : 'player2CP';
        setState(prev => ({
          ...prev,
          [shipsKey]: ships,
          [cpToUpdate]: prev[cpToUpdate] - POWERUPS['Aegis Shield'].cost
        }));
        addLog(`Aegis Shield deployed on your ${cell.shipType}. The entire vessel is protected!`, 'success');
        setActivePowerUp(null);
      }
    } else {
      addLog('Shield must be placed on an operational vessel.', 'enemy');
    }
  };

  useEffect(() => {
    if (gameState.turn === 'ai' && !gameState.winner && !aiFiringRef.current && !isMulti) {
      aiFiringRef.current = true;
      const timer = setTimeout(processAIShot, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.winner, isMulti, processAIShot, gameState.shotCounter]); // Added shotCounter

  const handleStrike = (x: number, y: number) => {
    if (gameState.isTransitioning || gameState.winner || (gameState.turn === 'ai' && !isMulti)) return;

    if (activePowerUp) {
      if (activePowerUp === 'Aegis Shield') {
        addLog('Aegis Shield must be deployed on your own fleet.', 'enemy');
        return;
      }
      const playerCP = isPlayerTurn ? gameState.player1CP : gameState.player2CP;
      const cost = POWERUPS[activePowerUp].cost;
      if (playerCP < cost) {
        addLog(`Insufficient CP for ${activePowerUp}.`, 'enemy');
        setActivePowerUp(null);
        return;
      }

      const cpToUpdate = isPlayerTurn ? 'player1CP' : 'player2CP';
      setState(prev => ({ ...prev, [cpToUpdate]: prev[cpToUpdate] - cost }));

      if (activePowerUp === 'Sonar Scan') {
        const area = [];
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const scanX = x + i;
            const scanY = y + j;
            if (scanX >= 0 && scanX < GRID_SIZE && scanY >= 0 && scanY < GRID_SIZE) {
              area.push({ x: scanX, y: scanY });
            }
          }
        }
        setSonarScanArea(area);
        setTimeout(() => setSonarScanArea(null), 5000);
        addLog(`Sonar scan at ${String.fromCharCode(65 + x)}-${y + 1} revealed enemy positions. Fade-out in 5s.`, 'success');
        setActivePowerUp(null);
        return; // Sonar scan does not end the turn
      }

      if (activePowerUp === 'Trident Missile') {
        executeTridentMissile3x3(x, y);
        setActivePowerUp(null);
        return;
      }
    }

    const targetGridKey = isPlayerTurn ? 'aiGrid' : 'playerGrid';
    const targetShipsKey = isPlayerTurn ? 'aiShips' : 'playerShips';
    
    const targetGrid = [...gameState[targetGridKey].map(row => [...row])];
    const targetShips = [...gameState[targetShipsKey].map(s => ({ ...s }))];
    const cell = targetGrid[y][x];

    if (cell.status === 'hit' || cell.status === 'miss') return;

    let msg = `${activeName} strikes ${String.fromCharCode(65 + x)}-${y + 1}... `;
    let type: LogEntry['type'] = 'player';
    let continueTurn = false;
    let cpGained = 0;

    if (cell.status === 'ship') {
      const shipIndex = targetShips.findIndex(s => s.type === cell.shipType);
      if (shipIndex > -1 && targetShips[shipIndex].shielded) {
        targetShips[shipIndex] = { ...targetShips[shipIndex], shielded: false };
        sound.playMiss();
        msg += 'SHIELD HIT! The strike was absorbed.';
        type = 'enemy';
        continueTurn = false;
        showToast('SHIELD ABSORBED HIT!', 'hit');
      } else {
        targetGrid[y][x].status = 'hit';
        sound.playHit();
        triggerHitEffect(x, y, isPlayerTurn ? 'ai' : 'player');
        cpGained = CP_EARNINGS.HIT;
        const ship = targetShips.find(s => s.type === cell.shipType);
        if (ship) {
          ship.hits++;
          if (isShipSunk(ship)) {
            sound.playSunk();
            cpGained += CP_EARNINGS.SINK[ship.type];
            msg += `CONFIRMED! ${ship.type.toUpperCase()} neutralised. (+${cpGained} CP)`;
            type = 'success';
            showToast(`${ship.type.toUpperCase()} DESTROYED!`, 'sunk');
          } else {
            msg += `DIRECT HIT! (+${cpGained} CP)`;
            showToast('DIRECT HIT!', 'hit');
          }
        }
        continueTurn = true;
      }
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
      const cpToUpdate = isPlayerTurn ? 'player1CP' : 'player2CP';
      setState(prev => ({
        ...prev,
        [targetGridKey]: targetGrid,
        [targetShipsKey]: targetShips,
        [cpToUpdate]: prev[cpToUpdate] + cpGained,
        turn: continueTurn ? prev.turn : (isPlayerTurn ? 'ai' : 'player'),
        isTransitioning: !continueTurn && isMulti,
        shotCounter: prev.shotCounter + 1
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

  const defensiveGrid = showP1Perspective ? gameState.playerGrid : gameState.aiGrid;
  const offensiveGrid = showP1Perspective ? gameState.aiGrid : gameState.playerGrid;
  const defensiveShips = showP1Perspective ? gameState.playerShips : gameState.aiShips;
  const offensiveShips = showP1Perspective ? gameState.aiShips : gameState.playerShips;
  const defensiveLabel = showP1Perspective ? gameState.player1Name : gameState.player2Name;
  const offensiveLabel = showP1Perspective ? (isMulti ? gameState.player2Name : "ENEMY") : gameState.player1Name;

  const executeTridentMissile3x3 = (x: number, y: number) => {
    addLog(`Trident Missile bombardment at ${String.fromCharCode(65 + x)}-${y + 1}!`, 'success');
    
    const targetGridKey = isPlayerTurn ? 'aiGrid' : 'playerGrid';
    const targetShipsKey = isPlayerTurn ? 'aiShips' : 'playerShips';
    const grid = [...gameState[targetGridKey].map(row => [...row])];
    const ships = [...gameState[targetShipsKey].map(s => ({ ...s }))];
    let totalCpGained = 0;
    let anyHit = false;

    // Calculate 3x3 area
    const area = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cx = x + i;
        const cy = y + j;
        if (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
          area.push({ x: cx, y: cy });
        }
      }
    }

    area.forEach(({ x: cx, y: cy }) => {
      const cell = grid[cy][cx];
      if (cell.status === 'hit' || cell.status === 'miss') return;

      let msg = `${activeName} strikes ${String.fromCharCode(65 + cx)}-${cy + 1}... `;

      if (cell.status === 'ship') {
        const shipIndex = ships.findIndex(s => s.type === cell.shipType);
        if (shipIndex > -1 && ships[shipIndex].shielded) {
          ships[shipIndex] = { ...ships[shipIndex], shielded: false };
          sound.playMiss();
          msg += 'SHIELD ABSORBED HIT!';
        } else {
          grid[cy][cx].status = 'hit';
          anyHit = true;
          sound.playHit();
          triggerHitEffect(cx, cy, isPlayerTurn ? 'ai' : 'player');
          totalCpGained += CP_EARNINGS.HIT;
          const ship = ships.find(s => s.type === cell.shipType);
          if (ship) {
            ship.hits++;
            if (isShipSunk(ship)) {
              sound.playSunk();
              totalCpGained += CP_EARNINGS.SINK[ship.type];
              msg += `SUNK ${ship.type.toUpperCase()}! (+${CP_EARNINGS.SINK[ship.type]} CP)`;
              showToast(`${ship.type.toUpperCase()} DESTROYED!`, 'sunk');
            } else {
              msg += 'DIRECT HIT!';
            }
          }
        }
      } else {
        grid[cy][cx].status = 'miss';
        sound.playMiss();
        msg += 'MISS.';
      }
      addLog(msg, 'player');
    });

    if (checkGameOver(ships)) {
      onGameOver(isPlayerTurn ? 'player' : 'ai');
    } else {
      const cpToUpdate = isPlayerTurn ? 'player1CP' : 'player2CP';
      setState(prev => ({
        ...prev,
        [targetGridKey]: grid,
        [targetShipsKey]: ships,
        [cpToUpdate]: prev[cpToUpdate] + totalCpGained,
        turn: anyHit ? prev.turn : (isPlayerTurn ? 'ai' : 'player'),
        isTransitioning: !anyHit && isMulti,
        shotCounter: prev.shotCounter + 1
      }));
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 relative z-10 overflow-hidden h-full">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-xl border-2 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2 animate-fadeIn pointer-events-none ${
          toast.type === 'sunk' 
            ? 'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
            : 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(31,97,239,0.4)]'
        }`}>
          <div className={`text-[10px] font-black uppercase tracking-[0.4em] ${toast.type === 'sunk' ? 'text-red-500' : 'text-primary'}`}>
            {toast.type === 'sunk' ? 'Critical Impact' : 'Tactical Hit'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-white uppercase tracking-[0.2em] italic drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {toast.message}
          </div>
          <div className={`h-1 w-full bg-white/10 rounded-full overflow-hidden`}>
            <div className={`h-full animate-progress ${toast.type === 'sunk' ? 'bg-red-500' : 'bg-primary'}`}></div>
          </div>
        </div>
      )}

      {gameState.isTransitioning && isMulti && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/95 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-terminal-accent/60 border border-primary/40 p-8 sm:p-12 rounded-2xl flex flex-col items-center gap-6 sm:gap-8 shadow-2xl max-w-xl w-[90%] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40"></div>
            <span className="material-symbols-outlined text-7xl sm:text-8xl text-primary animate-pulse">sync_alt</span>
            <div>
              <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-widest mb-2">Turn Switch</h2>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Commander access required:
              </p>
              <h3 className="text-primary text-2xl sm:text-3xl font-black italic mt-4 uppercase drop-shadow-[0_0_10px_rgba(31,97,239,0.5)]">
                {activeName}
              </h3>
            </div>
            <button 
              onClick={() => { sound.playUI(); setState(p => ({ ...p, isTransitioning: false })); }}
              className="px-10 sm:px-12 h-12 sm:h-14 bg-primary text-white font-black uppercase tracking-widest rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Take Command
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="size-8 sm:size-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50 overflow-hidden">
            <img src="/logo.png" alt="BS9K" className="size-6 sm:size-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-widest uppercase italic">BATTLESHIPS 9K</h1>
            <p className="text-[8px] sm:text-[9px] text-primary/60 tracking-[0.3em] font-black uppercase hidden sm:block">Active Ops: {isMulti ? 'PVP' : 'SOLO'}</p>
          </div>
        </div>
        
        <div className={`relative flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-2 rounded-full border transition-all duration-700 ${
          isPlayerTurn || !isMulti ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(31,97,239,0.2)]' : 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          <span className={`h-2 w-2 rounded-full animate-ping ${isPlayerTurn || !isMulti ? 'bg-primary' : 'bg-red-500'}`}></span>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] ${isPlayerTurn || !isMulti ? 'text-primary' : 'text-red-500'}`}>
            {headerName}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* LEFT SIDEBAR: Mini Fleet */}
        <div className="hidden lg:flex w-80 shrink-0 flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 border-r border-white/5">
            <div className="flex flex-col gap-3 animate-fadeIn">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-primary/60">Fleet Command</h2>
                </div>
                <div className="p-3 rounded-xl border border-primary/20 bg-white/5 backdrop-blur-sm flex justify-center shadow-inner">
                    <GridDisplay 
                   grid={defensiveGrid} 
                   showShips={true} 
                   onClick={activePowerUp === 'Aegis Shield' ? handleDefensiveClick : undefined}
                   hitEffect={lastHitPos?.side === (showP1Perspective ? 'player' : 'ai') ? lastHitPos : null} 
                   isMini={true}
                   ships={defensiveShips}
                 />
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-[9px] text-primary/70 uppercase font-black tracking-widest border-b border-primary/10 pb-1">Vessel Status</h3>
                <div className="flex flex-col gap-1.5">
                    {SHIP_ORDER.map(type => {
                        const ship = defensiveShips.find(s => s.type === type);
                        const isSunk = ship && isShipSunk(ship);
                        const size = SHIPS[type].size;
                        return (
                            <div key={type} className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-500 ${
                                isSunk ? 'bg-black/40 border-red-500/30 opacity-60' : 'bg-primary/10 border-primary/20'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[14px] ${isSunk ? 'text-red-500/60' : 'text-primary'}`}>
                                        {SHIPS[type].icon}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isSunk ? 'text-white/30 line-through' : 'text-white/80'}`}>{type}</span>
                                        <span className="text-[7px] text-primary/40 font-black">BLOCKS: {size}</span>
                                    </div>
                                </div>
                                {isSunk ? <span className="text-[7px] font-black text-red-500/60">SUNK</span> : <span className="text-[7px] text-primary/60 font-black">OK</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* CENTER: Zoomed Strike Zone */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center overflow-hidden bg-black/20 rounded-3xl border border-white/5 relative p-2 sm:p-4">
            <div className="absolute top-4 left-6 flex items-center gap-3">
              <div className="size-2 bg-red-500 rounded-full animate-ping"></div>
              <h2 className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase text-red-500/80">Strike Zone: {offensiveLabel}</h2>
            </div>
            
            <div className="w-full h-full flex items-center justify-center animate-fadeIn">
                <GridDisplay 
                  grid={offensiveGrid} 
                  showShips={false} 
                  onClick={handleStrike} 
                  hitEffect={lastHitPos?.side === (showP1Perspective ? 'ai' : 'player') ? lastHitPos : null} 
                  scannedCells={sonarScanArea}
                  ships={offensiveShips}
                />
            </div>

            <div className="absolute bottom-6 right-8 opacity-20 pointer-events-none hidden sm:block">
              <img src="/logo.png" alt="" className="size-32 object-contain" />
            </div>
        </div>

        {/* RIGHT SIDEBAR: Powerups, Stats, Logs */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 sm:gap-5 overflow-y-auto lg:pl-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Accuracy" value={`${calculateAccuracy(offensiveGrid)}%`} color="text-primary" />
                <StatCard label="Ships Sunk" value={`${SHIP_ORDER.length - offensiveShips.filter(s=>!isShipSunk(s)).length}/5`} color="text-red-500" />
            </div>

            <PowerUpControls 
              onActivate={handlePowerUp}
              activePowerUp={activePowerUp}
              playerCP={isPlayerTurn ? gameState.player1CP : gameState.player2CP}
            />

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[9px] sm:text-[10px] h-32 sm:h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 shadow-inner">
                {gameState.logs.map((log, i) => (
                    <div key={i} className={`flex gap-2 sm:gap-3 ${log.type === 'enemy' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-primary/70'}`}>
                        <span className="opacity-30">[{log.timestamp}]</span>
                        <span className="flex-1 leading-tight">{log.message}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => setState(p => ({ ...p, screen: 'menu' }))}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all mt-auto"
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
          100% { transform: scale(2.5); opacity: 0; border-radius: 50%; }
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

const GridDisplay: React.FC<{ 
  grid: CellState[][], 
  showShips: boolean, 
  onClick?: (x: number, y: number) => void, 
  hitEffect: {x: number, y: number} | null,
  scannedCells?: {x: number, y: number}[] | null,
  isMini?: boolean,
  ships?: PlacedShip[]
}> = ({ grid, showShips, onClick, hitEffect, scannedCells, isMini, ships }) => (
  <div className={`grid grid-cols-11 gap-0.5 sm:gap-1 w-full mx-auto aspect-square ${isMini ? 'max-w-[200px]' : 'max-w-[min(90vw,80vh)]'}`}>
    <div className="aspect-square flex items-center justify-center"></div>
    {['A','B','C','D','E','F','G','H','I','J'].map(l => (
      <div key={l} className={`aspect-square flex items-center justify-center font-bold text-gray-500 opacity-30 uppercase ${isMini ? 'text-[6px]' : 'text-[8px] sm:text-[10px] md:text-xs'}`}>{l}</div>
    ))}
    {grid.map((row, y) => (
      <React.Fragment key={y}>
        <div className={`aspect-square flex items-center justify-center font-bold text-gray-500 opacity-30 ${isMini ? 'text-[6px]' : 'text-[8px] sm:text-[10px] md:text-xs'}`}>{y + 1}</div>
        {row.map((cell, x) => {
          const isHitCell = hitEffect?.x === x && hitEffect?.y === y;
          const isInteractive = onClick && cell.status !== 'hit' && cell.status !== 'miss';
          const isScanned = scannedCells?.some(c => c.x === x && c.y === y);
          const ship = ships?.find(s => {
            if (s.horizontal) {
              return y === s.y && x >= s.x && x < s.x + s.size;
            } else {
              return x === s.x && y >= s.y && y < s.y + s.size;
            }
          });
          const isSunk = ship && isShipSunk(ship);
          const isShielded = ship && ship.shielded;
          
          return (
            <div
              key={`${x}-${y}`}
              onClick={() => isInteractive && onClick(x, y)}
              className={`aspect-square rounded-sm border relative transition-all duration-300 overflow-hidden ${
                isInteractive ? 'cursor-crosshair hover:bg-red-500/20 hover:border-red-500/50 touch-manipulation' : ''
              } ${
                isScanned ? 'bg-blue-500/20 border-blue-500/50' :
                cell.status === 'hit' ? 'bg-red-500/10 border-red-500/30' :
                cell.status === 'miss' ? 'bg-white/5 border-white/10' :
                (cell.status === 'ship' && (showShips || isScanned)) ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'
              } ${isHitCell ? 'animate-shake' : ''}`}
            >
              {/* Ship Visuals and Outlines */}
              {ship && (showShips || isSunk || cell.status === 'hit' || isScanned) && (
                <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-[2000ms] ${
                  isSunk ? 'opacity-100' : (cell.status === 'hit' || showShips || isScanned) ? 'opacity-60' : 'opacity-0'
                }`}>
                  <div className={`w-full h-full border-2 ${
                    isSunk 
                      ? 'bg-red-500/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
                      : isScanned
                        ? 'bg-blue-500/30 border-blue-500/50 shadow-[0_0_10px_rgba(31,97,239,0.4)]'
                        : 'bg-primary/20 border-primary/40'
                  }`}>
                    {isSunk && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/40">
                        <span className="material-symbols-outlined text-red-500 text-[12px] sm:text-2xl animate-bounce">explosion</span>
                        <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hit Indicator */}
              {cell.status === 'hit' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="size-2 sm:size-3 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] animate-ping"></div>
                </div>
              )}

              {/* Miss Indicator */}
              {cell.status === 'miss' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="size-1 bg-white/30 rounded-full"></div>
                </div>
              )}

              {/* Aegis Shield Effect */}
              {isShielded && (
                <div className="absolute inset-0 border-2 border-accent animate-pulse shadow-[inset_0_0_10px_#06d0f9] z-20 pointer-events-none">
                  <div className="absolute inset-0 bg-accent/10"></div>
                </div>
              )}

              {/* Hit Flash Effect */}
              {isHitCell && (
                <div className="absolute inset-0 bg-white animate-expand z-30"></div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </div>
);

const StatCard: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl flex-1 flex flex-col items-center shadow-inner">
    <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">{label}</div>
    <div className={`text-lg sm:text-xl font-black ${color}`}>{value}</div>
  </div>
);

const PowerUpControls: React.FC<{ onActivate: (type: PowerUpType) => void, activePowerUp: PowerUpType | null, playerCP: number }> = ({ onActivate, activePowerUp, playerCP }) => (
  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
    <div className="flex justify-between items-center border-b border-white/10 pb-2">
      <h3 className="text-[10px] text-primary/70 uppercase font-black tracking-widest">Power-Ups</h3>
      <div className="flex items-center gap-2">
        <img src="/coin.png" alt="CP" className="size-5 object-contain" />
        <span className="text-primary font-black">{playerCP} CP</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(POWERUPS) as PowerUpType[]).map(type => {
        const powerUp = POWERUPS[type];
        const isActive = activePowerUp === type;
        const canAfford = playerCP >= powerUp.cost;
        const iconSrc = type === 'Aegis Shield' ? '/shield.png' : type === 'Sonar Scan' ? '/radar.png' : '/Missile.png';
        
        return (
          <button
            key={type}
            onClick={() => onActivate(type)}
            disabled={!canAfford || !!activePowerUp}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 text-center border transition-all ${
              isActive ? 'bg-primary/30 border-primary shadow-lg' : 'bg-white/5 border-white/10'
            } ${
              !canAfford || (activePowerUp && !isActive) ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-primary/10'
            }`}
          >
            <img src={iconSrc} alt={type} className="size-8 object-contain" />
            <span className="text-[9px] font-bold uppercase">{type}</span>
            <span className="text-[8px] font-mono text-primary/60">{powerUp.cost} CP</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default BattleScreen;

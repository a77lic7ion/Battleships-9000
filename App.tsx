
import React, { useState, useCallback } from 'react';
import { GameState, Screen, Difficulty, CellState, LogEntry, PlacedShip, GameMode } from './types';
import { createEmptyGrid, placeAIShips } from './services/gameLogic';
import MenuScreen from './screens/MenuScreen';
import PlacementScreen from './screens/PlacementScreen';
import BattleScreen from './screens/BattleScreen';
import GameOverScreen from './screens/GameOverScreen';
import SettingsScreen from './screens/SettingsScreen';
import { sound } from './services/audioService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    screen: 'menu',
    mode: 'single',
    difficulty: 'medium',
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    playerGrid: createEmptyGrid(),
    aiGrid: createEmptyGrid(),
    playerShips: [],
    aiShips: [],
    turn: 'player',
    winner: null,
    logs: [],
    geminiEnabled: true,
    isTransitioning: false,
    placementPhase: 1,
    player1CP: 0,
    player2CP: 0,
  });

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'system') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setState(prev => ({
      ...prev,
      logs: [{ timestamp, message, type }, ...prev.logs].slice(0, 50)
    }));
  }, []);

  const startGame = (difficulty: Difficulty, mode: GameMode, p1Name: string, p2Name: string) => {
    sound.playUI();
    const { grid: aiGrid, ships: aiShips } = mode === 'single' ? placeAIShips() : { grid: createEmptyGrid(), ships: [] };
    
    setState(prev => ({
      ...prev,
      screen: 'placement',
      mode,
      difficulty,
      player1Name: p1Name || 'Player 1',
      player2Name: p2Name || (mode === 'single' ? 'AI OVERLORD' : 'Player 2'),
      aiGrid,
      aiShips,
      playerGrid: createEmptyGrid(),
      playerShips: [],
      winner: null,
      logs: [],
      turn: 'player',
      placementPhase: 1,
      isTransitioning: false,
      shotCounter: 0
    }));
    addLog(`INITIALIZING ${mode === 'single' ? 'SOLO' : 'DUAL'} OPS PROTOCOL...`, "system");
  };

  const onShipsPlaced = (ships: PlacedShip[], grid: CellState[][]) => {
    sound.playUI();
    if (state.mode === 'multi' && state.placementPhase === 1) {
      setState(prev => ({
        ...prev,
        playerShips: ships,
        playerGrid: grid,
        placementPhase: 2,
        isTransitioning: true
      }));
    } else {
      setState(prev => ({
        ...prev,
        screen: 'playing',
        [state.placementPhase === 1 ? 'playerShips' : 'aiShips']: ships,
        [state.placementPhase === 1 ? 'playerGrid' : 'aiGrid']: grid,
        isTransitioning: state.mode === 'multi',
        shotCounter: 0
      }));
      addLog("ALL VESSELS DEPLOYED. READY FOR ENGAGEMENT.", "system");
    }
  };

  const handleGameOver = (winner: 'player' | 'ai') => {
    setState(prev => ({ ...prev, winner, screen: 'gameover' }));
  };

  const resetToMenu = () => {
    sound.playUI();
    setState(prev => ({ ...prev, screen: 'menu', winner: null, isTransitioning: false, shotCounter: 0 }));
  };

  return (
    <div className="relative min-h-screen w-full bg-background-dark overflow-hidden flex flex-col">
      <div className="scanline"></div>
      
      {state.screen === 'menu' && (
        <MenuScreen 
          onStart={startGame} 
          onOpenSettings={() => setState(p => ({ ...p, screen: 'settings' }))} 
        />
      )}
      
      {state.screen === 'placement' && (
        <PlacementScreen 
          gameState={state}
          onReady={onShipsPlaced} 
          onCancel={resetToMenu}
          onAcknowledge={() => setState(p => ({ ...p, isTransitioning: false }))}
        />
      )}
      
      {state.screen === 'playing' && (
        <BattleScreen 
          gameState={state} 
          setState={setState}
          addLog={addLog}
          onGameOver={handleGameOver}
        />
      )}

      {state.screen === 'gameover' && (
        <GameOverScreen 
          gameState={state} 
          onReEngage={() => startGame(state.difficulty, state.mode, state.player1Name, state.player2Name)} 
          onReturn={resetToMenu}
        />
      )}

      {state.screen === 'settings' && (
        <SettingsScreen 
          gameState={state}
          onSave={(updates) => setState(p => ({ ...p, ...updates, screen: 'menu' }))}
          onCancel={() => setState(p => ({ ...p, screen: 'menu' }))}
        />
      )}
    </div>
  );
};

export default App;

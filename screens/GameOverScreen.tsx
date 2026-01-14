
import React from 'react';
import { GameState } from '../types';

interface GameOverScreenProps {
  gameState: GameState;
  onReEngage: () => void;
  onReturn: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState, onReEngage, onReturn }) => {
  const isVictory = gameState.winner === 'player';
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-12">
      <div className="flex flex-col items-center mb-10 text-center">
        <span className="text-primary text-xs font-bold tracking-[0.4em] uppercase mb-2">Secure Channel Established</span>
        <h2 className="text-white tracking-wide text-sm font-semibold leading-tight px-4 uppercase opacity-80 mb-2">
          MISSION COMPLETE: {isVictory ? 'ENEMY FLEET NEUTRALIZED' : 'FLEET DESTROYED'}
        </h2>
        <h1 className={`tracking-tighter text-7xl md:text-8xl font-black leading-none py-2 italic drop-shadow-lg ${isVictory ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]'}`}>
          {isVictory ? 'VICTORY!' : 'DEFEAT!'}
        </h1>
      </div>

      <div className="relative w-full max-w-[800px] bg-[#111c30]/90 backdrop-blur-xl border border-primary/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(31,97,239,0.15)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <h3 className="text-white text-lg font-bold uppercase tracking-widest">Tactical Report 09-X</h3>
            </div>
            <span className="text-white/40 text-xs font-mono uppercase">Sector: {gameState.difficulty.toUpperCase()}-DELTA-9</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryStat label="Ships Remaining" value={`${gameState.playerShips.filter(s => s.hits < s.size).length}/5`} subValue="Fleet Integrity" progress={gameState.playerShips.filter(s => s.hits < s.size).length * 20} />
            <SummaryStat label="Tactical Precision" value={`${calculateAccuracy(gameState.aiGrid)}%`} subValue={isVictory ? "A+ Grade" : "Failing Grade"} progress={calculateAccuracy(gameState.aiGrid)} color={isVictory ? 'bg-green-500' : 'bg-red-500'} />
            <SummaryStat label="Enemy Status" value={gameState.aiShips.filter(s => s.hits < s.size).length === 0 ? "Sunk" : "Active"} subValue="Combat Outcome" progress={0} />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-white text-base font-bold leading-none">Rank Advancement</p>
                <p className="text-primary text-xs font-medium mt-1">XP EARNED: {isVictory ? '+2,450' : '+150'}</p>
              </div>
              <p className="text-white text-sm font-bold">Level 14 <span className="text-white/40 ml-2">82%</span></p>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-primary to-blue-400" style={{ width: '82%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-[480px]">
        <button 
          onClick={onReEngage}
          className="flex-1 flex h-14 items-center justify-center rounded-lg bg-primary text-white font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(31,97,239,0.4)]"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">restart_alt</span>
            Re-Engage
          </span>
        </button>
        <button 
          onClick={onReturn}
          className="flex-1 flex h-14 items-center justify-center rounded-lg border-2 border-primary/40 bg-transparent text-white font-bold uppercase tracking-widest transition-all hover:bg-primary/10 hover:border-primary active:scale-95"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">hub</span>
            Return to HQ
          </span>
        </button>
      </div>
    </div>
  );
};

const SummaryStat: React.FC<{ label: string, value: string, subValue: string, progress: number, color?: string }> = ({ label, value, subValue, progress, color = 'bg-primary' }) => (
  <div className="flex flex-col gap-2 rounded-lg p-5 bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
    <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{label}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-white text-3xl font-bold">{value}</p>
      <span className="text-primary text-[10px] font-bold uppercase">{subValue}</span>
    </div>
    {progress > 0 && (
      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${progress}%` }}></div>
      </div>
    )}
  </div>
);

function calculateAccuracy(grid: any[][]) {
  let hits = 0;
  let total = 0;
  grid.forEach(r => r.forEach(c => {
    if (c.status === 'hit') { hits++; total++; }
    else if (c.status === 'miss') { total++; }
  }));
  return total === 0 ? 0 : Math.round((hits / total) * 100);
}

export default GameOverScreen;

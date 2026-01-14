
import React, { useState } from 'react';
import { Difficulty, GameMode } from '../types';
import { sound } from '../services/audioService';

interface MenuScreenProps {
  onStart: (d: Difficulty, m: GameMode, p1: string, p2: string) => void;
  onOpenSettings: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onStart, onOpenSettings }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [mode, setMode] = useState<GameMode>('single');
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');

  return (
    <div className="flex-1 flex flex-col items-center justify-start md:justify-center relative z-10 px-4 py-4 md:py-8 overflow-y-auto min-h-0">
      {/* Background Logo Decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
        <img src="/logo.png" alt="" className="w-[120%] max-w-none animate-pulse-slow rotate-12" />
      </div>

      <div className="absolute top-2 right-4 flex gap-2">
        <button 
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }
            sound.playUI();
          }}
          className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
          title="Toggle Fullscreen"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xs md:text-sm">fullscreen</span>
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
          title="Settings"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xs md:text-sm">settings</span>
        </button>
      </div>

      <div className="mb-2 md:mb-6 text-center relative">
        <div className="flex justify-center mb-1 md:mb-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/40 transition-all duration-700"></div>
            <img src="/logo.png" alt="Battleships 9000" className="relative size-16 md:size-32 object-contain drop-shadow-[0_0_20px_rgba(31,97,239,0.5)] group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
        <p className="text-primary text-[7px] md:text-[9px] font-bold tracking-[0.4em] uppercase mb-1">Tactical Naval Command Interface</p>
        <h1 className="text-white tracking-[0.2em] text-xl md:text-[48px] font-black leading-tight text-center uppercase drop-shadow-[0_0_15px_rgba(31,97,239,0.8)]">
          BATTLESHIPS 9000
        </h1>
        <div className="flex justify-center mt-1 md:mt-2">
          <div className="h-[2px] w-16 md:w-32 bg-primary shadow-[0_0_15px_#1f61ef]"></div>
        </div>
      </div>

      <div className="w-full max-w-lg md:max-w-xl bg-terminal-accent/40 border border-primary/30 rounded-xl p-3 md:p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary"></div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-8">
          <button 
            onClick={() => { setMode('single'); sound.playUI(); }}
            className={`p-3 md:p-4 rounded-lg border transition-all flex flex-col items-center gap-1 md:gap-2 ${
              mode === 'single' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.3)]' : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-2xl md:text-3xl">person</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Single Player</span>
          </button>
          <button 
            onClick={() => { setMode('multi'); sound.playUI(); }}
            className={`p-3 md:p-4 rounded-lg border transition-all flex flex-col items-center gap-1 md:gap-2 ${
              mode === 'multi' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.3)]' : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-2xl md:text-3xl">group</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Local Multi</span>
          </button>
        </div>

        <div className="space-y-3 md:space-y-4 mb-4 md:mb-8">
          <div className="flex flex-col gap-1 md:gap-2">
            <label className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-widest px-1">Commander 1 ID</label>
            <input 
              value={p1Name} 
              onChange={e => setP1Name(e.target.value)}
              className="bg-black/40 border border-primary/20 rounded-lg p-2 md:p-3 text-white text-xs md:text-sm font-bold uppercase tracking-widest outline-none focus:border-primary transition-colors"
              placeholder="PLAYER 1"
            />
          </div>
          {mode === 'multi' && (
            <div className="flex flex-col gap-1 md:gap-2">
              <label className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-widest px-1">Commander 2 ID</label>
              <input 
                value={p2Name} 
                onChange={e => setP2Name(e.target.value)}
                className="bg-black/40 border border-primary/20 rounded-lg p-2 md:p-3 text-white text-xs md:text-sm font-bold uppercase tracking-widest outline-none focus:border-primary transition-colors"
                placeholder="PLAYER 2"
              />
            </div>
          )}
        </div>

        {mode === 'single' && (
          <div className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-8">
            <h4 className="text-primary text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-center uppercase">AI Core Difficulty</h4>
            <div className="grid grid-cols-3 gap-1 md:gap-2 p-1 bg-black/40 rounded-lg border border-primary/20">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); sound.playUI(); }}
                  className={`py-1.5 md:py-2 rounded text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-all ${
                    difficulty === d ? 'bg-primary text-white shadow-[0_0_10px_rgba(31,97,239,0.4)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => onStart(difficulty, mode, p1Name, p2Name)}
          className="w-full h-12 md:h-14 bg-primary text-white font-black uppercase tracking-[0.3em] md:tracking-[0.4em] rounded-lg shadow-[0_0_20px_rgba(31,97,239,0.4)] hover:brightness-110 active:scale-[0.98] transition-all text-xs md:text-base"
        >
          Initiate Battle
        </button>
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          onClick={onOpenSettings}
          className="flex size-12 items-center justify-center rounded-xl bg-terminal-accent/60 border border-primary/20 text-white hover:bg-primary/20 transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <footer className="absolute bottom-4 w-full px-12 flex justify-between text-[9px] text-primary/40 font-bold tracking-[0.3em] uppercase">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
          UPLINK STABLE
        </div>
        <div>BS9K-XT // BUILD v4.5.0</div>
      </footer>
    </div>
  );
};

export default MenuScreen;

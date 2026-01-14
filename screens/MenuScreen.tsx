
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
  const [p1Name, setP1Name] = useState('ALPHA');
  const [p2Name, setP2Name] = useState('BRAVO');

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8 overflow-y-auto">
      <div className="mb-8 text-center">
        <p className="text-primary text-xs font-bold tracking-[0.4em] uppercase mb-2">Tactical Naval Command Interface</p>
        <h1 className="text-white tracking-[0.2em] text-[48px] md:text-[64px] font-black leading-tight text-center uppercase drop-shadow-[0_0_15px_rgba(31,97,239,0.8)]">
          BATTLESHIPS 9000
        </h1>
        <div className="flex justify-center mt-4">
          <div className="h-[2px] w-48 bg-primary shadow-[0_0_15px_#1f61ef]"></div>
        </div>
      </div>

      <div className="w-full max-w-lg bg-terminal-accent/40 border border-primary/30 rounded-xl p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary"></div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => { setMode('single'); sound.playUI(); }}
            className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
              mode === 'single' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.3)]' : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">person</span>
            <span className="text-xs font-black uppercase tracking-widest">Single Player</span>
          </button>
          <button 
            onClick={() => { setMode('multi'); sound.playUI(); }}
            className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
              mode === 'multi' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(31,97,239,0.3)]' : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">group</span>
            <span className="text-xs font-black uppercase tracking-widest">Local Multi</span>
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-primary font-black uppercase tracking-widest px-1">Commander 1 ID</label>
            <input 
              value={p1Name} 
              onChange={e => setP1Name(e.target.value.toUpperCase())}
              className="bg-black/40 border border-primary/20 rounded-lg p-3 text-white text-sm font-bold uppercase tracking-widest outline-none focus:border-primary transition-colors"
              placeholder="PLAYER 1"
            />
          </div>
          {mode === 'multi' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-primary font-black uppercase tracking-widest px-1">Commander 2 ID</label>
              <input 
                value={p2Name} 
                onChange={e => setP2Name(e.target.value.toUpperCase())}
                className="bg-black/40 border border-primary/20 rounded-lg p-3 text-white text-sm font-bold uppercase tracking-widest outline-none focus:border-primary transition-colors"
                placeholder="PLAYER 2"
              />
            </div>
          )}
        </div>

        {mode === 'single' && (
          <div className="flex flex-col gap-4 mb-8">
            <h4 className="text-primary text-[10px] font-bold tracking-[0.2em] text-center uppercase">AI Core Difficulty</h4>
            <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-lg border border-primary/20">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); sound.playUI(); }}
                  className={`py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${
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
          className="w-full h-14 bg-primary text-white font-black uppercase tracking-[0.4em] rounded-lg shadow-[0_0_20px_rgba(31,97,239,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
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

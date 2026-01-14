
import React, { useState } from 'react';
import { GameState } from '../types';
import { sound } from '../services/audioService';

interface SettingsScreenProps {
  gameState: GameState;
  onSave: (updates: Partial<GameState>) => void;
  onCancel: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ gameState, onSave, onCancel }) => {
  const [geminiEnabled, setGeminiEnabled] = useState(gameState.geminiEnabled);

  const handleSave = () => {
    sound.playUI();
    onSave({ geminiEnabled });
  };

  const handleCancel = () => {
    sound.playUI();
    onCancel();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto">
      <div className="bg-background-dark/95 backdrop-blur-xl w-full max-w-[700px] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(31,97,239,0.2)] border border-primary/30 relative">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50"></div>

        <div className="flex flex-wrap justify-between items-center gap-4 p-8 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-6 bg-primary shadow-[0_0_10px_#1f61ef]"></span>
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Subsystem Config</span>
            </div>
            <h1 className="text-white text-4xl font-black leading-tight tracking-tighter uppercase italic">Terminal Settings</h1>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse-slow">settings_suggest</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-xl">memory</span>
              <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">Cognitive AI Protocols</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-primary/40">
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-white text-sm font-bold uppercase tracking-wider">Gemini Tactical Feedback</p>
                <p className="text-gray-500 text-[10px] font-medium leading-relaxed uppercase tracking-widest">
                  Enable neural-net based tactical analysis and command log commentary during combat operations.
                </p>
              </div>
              <label className="relative flex h-[30px] w-[54px] cursor-pointer items-center rounded-full bg-white/10 p-1 transition-colors">
                <input 
                  type="checkbox" 
                  checked={geminiEnabled}
                  onChange={(e) => {
                    setGeminiEnabled(e.target.checked);
                    sound.playUI();
                  }}
                  className="hidden peer"
                />
                <div className={`h-[22px] w-[22px] rounded-full bg-white shadow-lg transition-transform duration-300 ${geminiEnabled ? 'translate-x-[24px]' : 'translate-x-0'}`}></div>
                <div className={`absolute inset-0 rounded-full transition-colors duration-300 -z-10 ${geminiEnabled ? 'bg-primary shadow-[0_0_15px_rgba(31,97,239,0.5)]' : 'bg-gray-700'}`}></div>
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] px-1">Authorization Status</p>
              <div className="flex w-full items-stretch rounded-lg overflow-hidden border border-white/10 bg-white/5 h-12">
                <div className="flex-1 flex items-center px-4 text-white/40 text-[10px] font-mono tracking-tighter italic">
                  ENCRYPTED_KEY_VERIFIED
                </div>
                <div className="w-12 flex items-center justify-center border-l border-white/10 bg-primary/10">
                  <span className="material-symbols-outlined text-primary text-sm">lock</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] px-1">Active Core</p>
              <div className="relative">
                <select className="appearance-none block w-full rounded-lg border border-white/10 bg-white/5 text-white h-12 px-4 focus:border-primary outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors">
                  <option>Gemini 3 Flash (STABLE)</option>
                  <option>Gemini 3 Pro (PRECISION)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary">
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 flex gap-4 items-start shadow-inner">
            <span className="material-symbols-outlined text-primary mt-0.5">info</span>
            <div className="text-[10px] text-primary/80 font-medium leading-relaxed uppercase tracking-widest">
              <strong className="text-white font-black">System Advisory:</strong> Advanced AI functions require an established satellite uplink. 
              Flash series cores are optimized for high-velocity tactical response times.
            </div>
          </div>
        </div>

        <div className="bg-black/40 p-8 flex flex-wrap items-center justify-between gap-6 border-t border-white/5">
          <button 
            onClick={() => sound.playUI()}
            className="text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group"
          >
            <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform duration-500">restart_alt</span>
            Purge Config
          </button>
          <div className="flex gap-4">
            <button 
              onClick={handleCancel}
              className="px-8 h-12 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              Abort
            </button>
            <button 
              onClick={handleSave}
              className="px-10 h-12 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-white shadow-[0_0_20px_rgba(31,97,239,0.4)] hover:brightness-110 active:scale-95 transition-all"
            >
              Commit Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;

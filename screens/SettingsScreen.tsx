
import React, { useState } from 'react';
import { GameState } from '../types';

interface SettingsScreenProps {
  gameState: GameState;
  onSave: (updates: Partial<GameState>) => void;
  onCancel: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ gameState, onSave, onCancel }) => {
  const [geminiEnabled, setGeminiEnabled] = useState(gameState.geminiEnabled);

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative z-10">
      <div className="bg-background-dark/95 backdrop-blur-xl w-full max-w-[700px] rounded-xl overflow-hidden shadow-2xl border border-accent/30">
        <div className="flex flex-wrap justify-between items-end gap-3 p-8 border-b border-accent/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 bg-accent"></span>
              <span className="text-accent text-xs font-bold uppercase tracking-widest">Advanced Tactical Systems</span>
            </div>
            <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em] uppercase">System Settings</p>
            <p className="text-accent/60 text-sm font-normal leading-normal max-w-md">Configure tactical AI reasoning and Gemini API integrations for enhanced naval combat simulations.</p>
          </div>
          <div className="text-accent/40">
            <span className="material-symbols-outlined text-6xl">settings_suggest</span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-accent text-sm">memory</span>
              <h2 className="text-white text-lg font-bold uppercase tracking-wider">AI Configuration</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-accent/20 bg-accent/5 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-white text-base font-bold leading-tight">Enable Gemini AI Thinking</p>
                <p className="text-accent/60 text-sm font-normal leading-normal">Utilizes long-context reasoning for complex fleet maneuvers and tactical commentary.</p>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#21434a] p-0.5 transition-colors">
                <input 
                  type="checkbox" 
                  checked={geminiEnabled}
                  onChange={(e) => setGeminiEnabled(e.target.checked)}
                  className="hidden peer"
                />
                <div className={`h-[27px] w-[27px] rounded-full bg-white shadow-lg transition-transform ${geminiEnabled ? 'translate-x-[20px]' : ''}`}></div>
                <div className={`absolute inset-0 rounded-full transition-colors -z-10 ${geminiEnabled ? 'bg-accent' : 'bg-gray-600'}`}></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 opacity-50">
              <label className="flex flex-col w-full">
                <p className="text-accent/60 text-xs font-bold uppercase tracking-widest pb-2">Gemini API Key</p>
                <div className="flex w-full items-stretch rounded-lg">
                  <input 
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-white border border-accent/30 bg-accent/5 h-12 p-[15px] border-r-0 text-sm font-mono cursor-not-allowed" 
                    placeholder="KEY DETECTED IN ENVIRONMENT..." 
                    type="password" 
                    disabled
                  />
                  <div className="text-accent flex border border-accent/30 bg-accent/5 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col w-full">
                <p className="text-accent/60 text-xs font-bold uppercase tracking-widest pb-2">Model Version</p>
                <div className="relative">
                  <select className="appearance-none block w-full rounded-lg border border-accent/30 bg-accent/5 text-white h-12 px-4 focus:ring-1 focus:ring-accent outline-none text-sm font-bold uppercase tracking-wider">
                    <option>Gemini 1.5 Flash (Performance)</option>
                    <option>Gemini 1.5 Pro (Precision)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-accent">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 flex gap-4">
            <span className="material-symbols-outlined text-accent">info</span>
            <div className="text-xs text-accent/80 leading-relaxed">
              <strong className="text-white">Note:</strong> Advanced AI functions require a stable uplink. Gemini 1.5 Flash is the recommended configuration for low-latency naval operations.
            </div>
          </div>
        </div>

        <div className="bg-black/20 p-6 flex flex-wrap items-center justify-between gap-4">
          <button 
            className="text-accent/60 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset Defaults
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="px-6 py-2 rounded-lg text-sm font-bold border border-accent/30 hover:bg-accent/10 transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={() => onSave({ geminiEnabled })}
              className="px-8 py-2 rounded-lg text-sm font-bold bg-accent text-background-dark shadow-[0_0_15px_rgba(6,208,249,0.3)] hover:brightness-110 transition-all"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;

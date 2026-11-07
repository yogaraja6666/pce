import React from 'react';
import { ShieldCheck, AlertCircle, Database, Lock } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, onOpenSos }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight hidden sm:inline">
              PCE Intelligence
            </span>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
            <button
              onClick={() => setActiveView('v1_radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'v1_radar'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Breach Radar (v1)</span>
            </button>

            <button
              onClick={() => setActiveView('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'vault'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Password Vault</span>
            </button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium transition-all"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emergency SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
}

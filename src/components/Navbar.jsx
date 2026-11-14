import React from 'react';
import { ShieldCheck, AlertCircle, Database, Lock } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, onOpenSos }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/80 shadow-2xs">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-zinc-900 text-sm tracking-tight hidden sm:inline">
              PCE Intelligence
            </span>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center p-1 bg-zinc-100 border border-zinc-200/80 rounded-xl">
            <button
              onClick={() => setActiveView('v1_radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeView === 'v1_radar'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 font-medium'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Breach Radar (v1)</span>
            </button>

            <button
              onClick={() => setActiveView('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeView === 'vault'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 font-medium'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password Vault</span>
            </button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-all shadow-2xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Emergency SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
}

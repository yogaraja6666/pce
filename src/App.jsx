import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BreachScanner from './components/BreachScanner';
import EmergencySOSModal from './components/EmergencySOSModal';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const [isSosOpen, setIsSosOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onOpenSos={() => setIsSosOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Real-time Cyber Breach Radar</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">
            Personal Cyber Exposure & Account Defense
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
            Check if your email or passwords exist in public hacker databases and stealer logs. Powered by open intelligence and zero-knowledge privacy.
          </p>
        </div>

        {/* Breach Scanner (Core Module) */}
        <BreachScanner />

        {/* Minimal Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-zinc-900">
          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Zero-Knowledge Verification</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Passwords are mathematically evaluated locally using k-Anonymity SHA-1. Plaintext data never leaves your client.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open Threat Intelligence</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Queries aggregated public breach indexes, stealer archives, and credential repository feeds.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Incident Response Protocol</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Actionable deep-links and broadcast warning templates to immediately mitigate active account takeovers.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900/80 py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <span>BreachRadar — 100% Free & Open-source Security</span>
          </div>
          <span className="text-zinc-600 text-[11px]">
            National Cyber Crime Helpline (India): 1930
          </span>
        </div>
      </footer>

      {/* Emergency Modal */}
      <EmergencySOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
      />
    </div>
  );
}

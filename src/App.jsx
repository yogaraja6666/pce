import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BreachScanner from './components/BreachScanner';
import PasswordManager from './components/PasswordManager';
import EmergencySOSModal from './components/EmergencySOSModal';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  AlertCircle,
  KeyRound,
  Mail
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('v1_radar'); // 'v1_radar' | 'vault'
  const [isSosOpen, setIsSosOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenSos={() => setIsSosOpen(true)} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 md:py-14 space-y-10">
        
        {/* VIEW 1: BREACH RADAR (VERSION 1 - NO LOGIN REQUIRED) */}
        <div className={activeView === 'v1_radar' ? 'space-y-10 animate-fadeIn' : 'hidden'}>
          {/* Hero Section */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PCE Intelligence • Personal Cyber Exposure Defense</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">
              Personal Cyber Exposure & Account Defense
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
              Check if your email or passwords exist in public hacker databases and stealer logs without creating an account.
            </p>
          </div>

          {/* Breach Scanner (v1 Core Module) */}
          <BreachScanner />

          {/* Prompt to Vault */}
          <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Need to store and protect your credentials?</h4>
                <p className="text-xs text-zinc-400">Manage Gmail, Microsoft, Instagram, X with rotation countdowns and 2FA backup codes in your encrypted vault.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('vault')}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-xl transition-all shadow-sm shrink-0"
            >
              Open Password Vault →
            </button>
          </div>
        </div>

        {/* VIEW 2: PASSWORD MANAGER (LIVE GOOGLE DRIVE SYNC - AUTO-LOCKS ON REFRESH) */}
        <div className={activeView === 'vault' ? 'space-y-8 animate-fadeIn' : 'hidden'}>
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Knowledge AES-GCM-256 Vault</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100">
              Encrypted Credentials & 2FA Manager
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Store multi-platform credentials, monitor password rotation countdowns, and export backups with document password encryption.
            </p>
          </div>

          {/* Password Manager Component */}
          <PasswordManager />
        </div>

        {/* Minimal Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-zinc-900">
          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Zero-Knowledge Vault</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Master keys are derived via PBKDF2 (100,000 rounds). Decryption runs only in browser RAM.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>Breach Intelligence</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Live queries against 900+ public breach archives to flag compromised credentials.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Incident Response</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Official platform recovery deep-links and broadcast templates to instantly stop attacks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer & Disclaimer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-10 px-6 text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Creator Attribution */}
          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold text-zinc-200 text-sm">
                This tool is created by Yogaraja R.
              </span>
              <a 
                href="mailto:yogaraja2026@outlook.com" 
                className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 flex items-center gap-1.5 font-mono text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>yogaraja2026@outlook.com</span>
              </a>
            </div>
          </div>

          {/* Legal & Government Compliance Disclaimer */}
          <div className="space-y-1.5 text-[11px] text-zinc-500 leading-relaxed text-center sm:text-left">
            <p className="font-medium text-zinc-400">
              Disclaimer & Lawful Compliance:
            </p>
            <p>
              This tool does not conduct any unauthorized penetration, network intrusion, hacking, or activities against government laws or regulations. All data breach checks rely strictly on open-source, publicly reported cybersecurity breach repositories, and all password evaluations and vault encryptions run 100% locally inside your browser via the Web Cryptography API.
            </p>
            <p className="text-zinc-600">
              For financial fraud or active cyber crimes, immediately report to the National Cyber Crime Reporting Portal at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">cybercrime.gov.in</a> or dial helpline <strong>1930</strong> (India).
            </p>
          </div>

          {/* Bottom Branding Bar */}
          <div className="pt-4 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-600">
            <div className="flex items-center gap-2 text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PCE Intelligence • 100% Free & Open Cyber Defense</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-500">
              <a href="https://pce-seven.vercel.app" className="hover:text-zinc-300 underline underline-offset-2">Privacy Policy</a>
              <a href="https://pce-seven.vercel.app" className="hover:text-zinc-300 underline underline-offset-2">Terms of Service</a>
              <span>Dedicated to online safety</span>
            </div>
          </div>
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

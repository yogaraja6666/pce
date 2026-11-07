import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';
import { generateStrongPassword, calculatePasswordScore } from '../services/cryptoVault';

export default function PasswordGenerator({ onSelectPassword }) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pw = generateStrongPassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous
    });
    setPassword(pw);
  };

  useEffect(() => {
    generate();
  }, [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreInfo = calculatePasswordScore(password);

  return (
    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Military-Grade Password Generator
          </span>
        </div>
        <span className={`text-xs font-medium ${scoreInfo.color}`}>
          {scoreInfo.label} ({scoreInfo.score}/100)
        </span>
      </div>

      {/* Generated Password Display */}
      <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <input
          type="text"
          readOnly
          value={password}
          className="w-full bg-transparent font-mono text-sm sm:text-base text-zinc-100 pr-20 select-all focus:outline-none tracking-wider"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={generate}
            title="Generate new password"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-lg transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Strength Bar */}
      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className={`h-full ${scoreInfo.barColor} transition-all duration-300`}
          style={{ width: `${scoreInfo.score}%` }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3 pt-2 text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Password Length: <strong className="text-zinc-100 font-mono text-sm">{length}</strong></span>
          <div className="flex gap-1.5">
            {[16, 24, 32].map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setLength(len)}
                className={`px-2 py-0.5 rounded border ${
                  length === len ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-emerald-500 bg-zinc-900 rounded-lg h-1.5 cursor-pointer"
        />

        {/* Checkbox Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-zinc-400">
          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>A-Z (Upper)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>a-z (Lower)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>0-9 (Numbers)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>!@#$ (Symbols)</span>
          </label>
        </div>
      </div>

      {onSelectPassword && (
        <button
          type="button"
          onClick={() => onSelectPassword(password)}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          Use This Password in Account
        </button>
      )}
    </div>
  );
}

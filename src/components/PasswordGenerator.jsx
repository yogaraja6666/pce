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
    <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Military-Grade Password Generator
          </span>
        </div>
        <span className={`text-xs font-semibold ${scoreInfo.color}`}>
          {scoreInfo.label} ({scoreInfo.score}/100)
        </span>
      </div>

      {/* Generated Password Display */}
      <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 shadow-2xs">
        <input
          type="text"
          readOnly
          value={password}
          className="w-full bg-transparent font-mono text-sm sm:text-base text-zinc-900 pr-20 select-all focus:outline-none tracking-wider font-medium"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={generate}
            title="Generate new password"
            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Strength Bar */}
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${scoreInfo.barColor} transition-all duration-300`}
          style={{ width: `${scoreInfo.score}%` }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3 pt-2 text-xs">
        <div className="flex items-center justify-between text-zinc-600">
          <span>Password Length: <strong className="text-zinc-900 font-mono text-sm">{length}</strong></span>
          <div className="flex gap-1.5">
            {[16, 24, 32].map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setLength(len)}
                className={`px-2.5 py-0.5 rounded-lg border text-xs transition-all ${
                  length === len ? 'bg-zinc-900 border-zinc-900 text-white font-semibold shadow-2xs' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200/60 font-medium'
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
          className="w-full accent-emerald-600 bg-zinc-200 rounded-lg h-1.5 cursor-pointer"
        />

        {/* Checkbox Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-zinc-700">
          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900 font-medium">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span>A-Z (Upper)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900 font-medium">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span>a-z (Lower)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900 font-medium">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span>0-9 (Numbers)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-900 font-medium">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span>!@#$ (Symbols)</span>
          </label>
        </div>
      </div>

      {onSelectPassword && (
        <button
          type="button"
          onClick={() => onSelectPassword(password)}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
        >
          Use This Password in Account
        </button>
      )}
    </div>
  );
}

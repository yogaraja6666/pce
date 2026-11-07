import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  Database,
  Smartphone,
  RefreshCw,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { checkEmailBreach, checkPasswordLeak } from '../services/breachApi';

export default function BreachScanner() {
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'password'

  // Email state
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [emailError, setEmailError] = useState('');

  // Password state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState(null);
  const [pwError, setPwError] = useState('');

  // Email scan
  const handleEmailScan = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setEmailLoading(true);
    setEmailResult(null);

    try {
      const res = await checkEmailBreach(email);
      setEmailResult(res);
      if (!res.found) {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setEmailError(err.message || 'Error querying breach intelligence database');
    } finally {
      setEmailLoading(false);
    }
  };

  // Password test
  const handlePasswordTest = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setPwError('Please enter a password');
      return;
    }

    setPwError('');
    setPwLoading(true);
    setPwResult(null);

    try {
      const res = await checkPasswordLeak(password);
      setPwResult(res);
      if (!res.leaked) {
        confetti({
          particleCount: 40,
          spread: 40,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setPwError(err.message || 'Error verifying password against breach records');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Tab Selector */}
      <div className="flex p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'email'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Email Breach Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'password'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Password Leak Checker</span>
        </button>
      </div>

      {/* TAB 1: EMAIL BREACH SCANNER */}
      {activeTab === 'email' && (
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Scan Email Across Data Breaches
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Check if your email or associated credentials have been exposed in public hacker databases and stealer logs.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleEmailScan} className="space-y-3">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pl-11 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 text-sm transition-all"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={emailLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {emailLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Try sample:</span>
              <button
                type="button"
                onClick={() => setEmail('test@gmail.com')}
                className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
              >
                test@gmail.com
              </button>
            </div>

            {emailError && (
              <p className="text-rose-400 text-xs flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {emailError}
              </p>
            )}
          </form>

          {/* RESULTS */}
          {emailResult && (
            <div className="pt-4 border-t border-zinc-800/60 space-y-5">
              {emailResult.found ? (
                /* BREACH FOUND */
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                          {emailResult.riskLabel} Exposure
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        Risk Score: {emailResult.riskScore}/100
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-100">
                      Identified in {emailResult.count} Security {emailResult.count === 1 ? 'Incident' : 'Incidents'}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Credentials associated with this email address exist in public breach repositories. Hackers frequently use these lists for automated account takeover attacks.
                    </p>
                  </div>

                  {/* Exposed Data Types */}
                  {emailResult.exposedDataTypes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-zinc-400">
                        Compromised Data Categories
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {emailResult.exposedDataTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                              type.toLowerCase().includes('password')
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Action Checklist */}
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                    <span className="font-semibold text-zinc-200 block">
                      Recommended Remediation
                    </span>
                    <ul className="space-y-1.5 list-disc pl-4 text-zinc-400 leading-relaxed">
                      <li>Update passwords on all accounts sharing this email address.</li>
                      <li>Enable application-based Two-Factor Authentication (Authenticator App).</li>
                      <li>Terminate any unfamiliar sessions in your Google and Meta account settings.</li>
                    </ul>
                  </div>

                  {/* Incident List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">Incident Details</span>
                      <span className="text-zinc-500">{emailResult.breaches.length} records</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {emailResult.breaches.map((b, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-zinc-200">{b.name}</span>
                            <span className="text-[11px] text-zinc-500">{b.year}</span>
                          </div>
                          <p className="text-zinc-400 line-clamp-2 leading-relaxed">
                            {b.details}
                          </p>
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {b.exposedData.slice(0, 3).map((item, dIdx) => (
                              <span key={dIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CLEAN */
                <div className="p-6 rounded-xl bg-zinc-950 border border-emerald-500/20 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      No Records Found
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This email address was not identified in known public breach archives. Continue using unique passwords and two-factor authentication to maintain security.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ZERO-KNOWLEDGE PASSWORD CHECKER */}
      {activeTab === 'password' && (
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Zero-Knowledge Password Verification
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Verify if a password appears in compiled hacker credential dictionaries without exposing your plain text.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-zinc-300">k-Anonymity Model:</strong> Your password never leaves your browser. Only the first 5 characters of its local SHA-1 hash are queried anonymously.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordTest} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to evaluate"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pl-11 pr-24 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 text-sm transition-all"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={pwLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {pwLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </button>
            </div>

            {pwError && (
              <p className="text-rose-400 text-xs flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {pwError}
              </p>
            )}
          </form>

          {/* RESULTS */}
          {pwResult && (
            <div className="pt-4 border-t border-zinc-800/60 space-y-4">
              {pwResult.leaked ? (
                <div className="p-5 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Compromised Password</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Identified {pwResult.count.toLocaleString()} times in recorded data breaches.
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This password is known and indexed in public cybercrime databases. Do not use this password on any account, as it is susceptible to automated dictionary attacks.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Clean Record
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Zero occurrences found in over 1 billion breached credentials. Ensure this password is unique to a single service.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

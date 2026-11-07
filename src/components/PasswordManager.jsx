import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Search, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  LogOut, 
  RefreshCw,
  ExternalLink,
  Cloud,
  CheckCheck
} from 'lucide-react';
import { calculatePasswordScore } from '../services/cryptoVault';
import { 
  requestGoogleDriveToken, 
  syncVaultToGoogleDriveSheet, 
  SHEET_NAME 
} from '../services/googleDriveService';
import PasswordGenerator from './PasswordGenerator';

// Permanent Google OAuth 2.0 Client ID
const GOOGLE_CLIENT_ID = '1062545025907-balc2lf7mgol3cibb1mdqckfcggpb5ef.apps.googleusercontent.com';

// Supported preset providers
const PROVIDER_PRESETS = [
  { id: 'google', name: 'Google / Gmail', color: 'text-red-400' },
  { id: 'microsoft', name: 'Microsoft / Outlook', color: 'text-blue-400' },
  { id: 'reddit', name: 'Reddit', color: 'text-orange-500' },
  { id: 'x', name: 'X (Twitter)', color: 'text-zinc-200' },
  { id: 'instagram', name: 'Instagram', color: 'text-pink-400' },
  { id: 'facebook', name: 'Facebook', color: 'text-blue-500' },
  { id: 'github', name: 'GitHub', color: 'text-purple-400' },
  { id: 'amazon', name: 'Amazon', color: 'text-amber-400' },
  { id: 'custom', name: 'Other Service', color: 'text-zinc-400' }
];

export default function PasswordManager() {
  // Verified Google User state
  const [googleUser, setGoogleUser] = useState(() => {
    const saved = localStorage.getItem('pce_verified_google_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Google Drive Token & Live Sheet State
  const [driveAccessToken, setDriveAccessToken] = useState(() => {
    return sessionStorage.getItem('pce_drive_token') || null;
  });
  const [liveSheetLink, setLiveSheetLink] = useState(() => {
    return localStorage.getItem('pce_live_sheet_link') || '';
  });
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveError, setDriveError] = useState('');

  const [authError, setAuthError] = useState('');
  const [isGisReady, setIsGisReady] = useState(false);
  const googleBtnRef = useRef(null);

  // Vault data state
  const [vaultItems, setVaultItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalError, setModalError] = useState('');

  // Credential Visibility & Copy tracking
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    provider: 'google',
    customName: '',
    username: '',
    password: '',
    backupCodes: '',
    rotationDays: 60,
    createdDate: new Date().toISOString(),
    lastChangedDate: new Date().toISOString(),
    notes: '',
    url: ''
  });

  // Storage key for the authenticated user
  const getUserStorageKey = (user) => {
    const id = user.sub || user.email;
    return `pce_vault_data_${id.toLowerCase()}`;
  };

  // Load user items whenever active user changes
  useEffect(() => {
    if (googleUser) {
      const key = getUserStorageKey(googleUser);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setVaultItems(JSON.parse(saved));
        } catch {
          setVaultItems([]);
        }
      } else {
        setVaultItems([]);
      }
    }
  }, [googleUser]);

  // Handle Google Credential Response (Sign-In)
  const handleCredentialResponse = (response) => {
    try {
      if (!response.credential) throw new Error('No credential returned from Google');
      
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      const userObj = {
        name: payload.name || 'Google User',
        email: payload.email,
        picture: payload.picture || '',
        sub: payload.sub
      };

      setGoogleUser(userObj);
      localStorage.setItem('pce_verified_google_user', JSON.stringify(userObj));
      setAuthError('');
    } catch (err) {
      console.error('Google Auth decode error:', err);
      setAuthError('Failed to verify Google identity. Please try again.');
    }
  };

  // Initialize and Render Official Google Sign-In Button
  useEffect(() => {
    if (!googleUser) {
      const checkAndRender = () => {
        if (window.google?.accounts?.id && googleBtnRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true
            });

            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 280
            });
            setIsGisReady(true);
          } catch (err) {
            console.error('GIS render error:', err);
          }
        }
      };

      if (window.google?.accounts?.id) {
        checkAndRender();
      } else {
        const interval = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(interval);
            checkAndRender();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, [googleUser]);

  // Request Drive Authorization & Create/Sync Google Sheet in user's Drive
  const handleConnectDriveAndSync = (currentItems = vaultItems) => {
    setDriveError('');
    setIsDriveSyncing(true);

    requestGoogleDriveToken({
      clientId: GOOGLE_CLIENT_ID,
      onTokenReceived: async (token) => {
        try {
          setDriveAccessToken(token);
          sessionStorage.setItem('pce_drive_token', token);

          // Sync directly to Google Drive Sheet
          const result = await syncVaultToGoogleDriveSheet(token, currentItems);
          if (result.link) {
            setLiveSheetLink(result.link);
            localStorage.setItem('pce_live_sheet_link', result.link);
          }
          triggerToast(`✅ Successfully created & saved Google Sheet in your Google Drive!`);
        } catch (err) {
          console.error('Drive sync error:', err);
          setDriveError(err.message || 'Failed to sync to Google Drive');
        } finally {
          setIsDriveSyncing(false);
        }
      },
      onError: (err) => {
        setIsDriveSyncing(false);
        setDriveError(err.message || 'Drive permission was not granted.');
      }
    });
  };

  // Sign out
  const handleSignOut = () => {
    setGoogleUser(null);
    setDriveAccessToken(null);
    setLiveSheetLink('');
    sessionStorage.removeItem('pce_drive_token');
    localStorage.removeItem('pce_verified_google_user');
    localStorage.removeItem('pce_live_sheet_link');
    setVaultItems([]);
    setVisiblePasswords({});
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // Compute countdown & status for an item
  const getRotationStatus = (item) => {
    const lastChanged = new Date(item.lastChangedDate || item.createdDate || Date.now());
    const rotationDays = item.rotationDays || 60;
    const expiryDate = new Date(lastChanged.getTime() + rotationDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    const diffMs = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        daysLeft: 0,
        text: `Expired ${Math.abs(daysLeft)}d ago`,
        status: 'expired',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      };
    } else if (daysLeft <= 14) {
      return {
        daysLeft,
        text: `${daysLeft} days to change`,
        status: 'warning',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      };
    } else {
      return {
        daysLeft,
        text: `${daysLeft} days to change`,
        status: 'good',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    }
  };

  // Save changes to current user's personal storage AND live Drive Sheet if connected
  const handleSaveItems = async (updatedItems) => {
    setVaultItems(updatedItems);
    if (googleUser) {
      const key = getUserStorageKey(googleUser);
      localStorage.setItem(key, JSON.stringify(updatedItems));
    }

    // If already has active Drive token, update Google Sheet in real time
    if (driveAccessToken) {
      setIsDriveSyncing(true);
      try {
        const result = await syncVaultToGoogleDriveSheet(driveAccessToken, updatedItems);
        if (result.link) {
          setLiveSheetLink(result.link);
          localStorage.setItem('pce_live_sheet_link', result.link);
        }
        triggerToast('Saved to your Google Drive Sheet!');
      } catch (err) {
        console.error('Silent drive sync failed, retry next time', err);
        triggerToast('Saved locally (Google Drive update queued)');
      } finally {
        setIsDriveSyncing(false);
      }
    } else {
      triggerToast('Saved locally! Click "Save to Google Drive" to sync with your Drive.');
    }
  };

  const triggerToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3500);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setModalError('User ID and Password are required');
      return;
    }

    const providerName = formData.provider === 'custom' 
      ? (formData.customName || 'Custom Service')
      : (PROVIDER_PRESETS.find(p => p.id === formData.provider)?.name || formData.provider);

    const nowIso = new Date().toISOString();

    let updatedList;
    if (editingItem) {
      updatedList = vaultItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            ...formData,
            providerName,
            lastChangedDate: formData.password !== item.password ? nowIso : item.lastChangedDate || nowIso
          };
        }
        return item;
      });
    } else {
      const newItem = {
        id: 'acc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        ...formData,
        providerName,
        createdDate: nowIso,
        lastChangedDate: nowIso
      };
      updatedList = [newItem, ...vaultItems];
    }

    handleSaveItems(updatedList);
    setShowAddModal(false);
    setEditingItem(null);
    setModalError('');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      provider: 'google',
      customName: '',
      username: '',
      password: '',
      backupCodes: '',
      rotationDays: 60,
      createdDate: new Date().toISOString(),
      lastChangedDate: new Date().toISOString(),
      notes: '',
      url: ''
    });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Delete this account credential?')) {
      const filtered = vaultItems.filter(item => item.id !== id);
      handleSaveItems(filtered);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items
  const filteredItems = vaultItems.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.providerName && item.providerName.toLowerCase().includes(q)) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // -------------------------------------------------------------
  // VIEW 1: OFFICIAL GOOGLE SIGN IN
  // -------------------------------------------------------------
  if (!googleUser) {
    return (
      <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-2xl text-center">
        
        {/* Google Security Icon */}
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 flex items-center justify-center mx-auto shadow-md">
          <svg className="w-7 h-7" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Authenticated Session • Zero Database</span>
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Sign In with Google
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Click below to sign in with your official Google Account. Your vault syncs directly with a Google Sheet in your personal Google Drive.
          </p>
        </div>

        {/* Official Google Sign-In Button */}
        <div className="flex flex-col items-center justify-center pt-2 space-y-3 min-h-[50px]">
          <div ref={googleBtnRef} className="flex items-center justify-center" />
          {!isGisReady && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading Google Sign-In...</span>
            </div>
          )}
          <p className="text-[11px] text-zinc-500">
            Protected by Google Identity Services & client-side encryption.
          </p>
        </div>

        {authError && (
          <p className="text-rose-400 text-xs flex items-center justify-center gap-1.5 pt-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {authError}
          </p>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: LOGGED-IN CREDENTIAL VAULT (With Live Google Drive Sync)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs shadow-2xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center gap-3">
          {googleUser.picture ? (
            <img src={googleUser.picture} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold text-sm">
              {googleUser.name.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-semibold text-zinc-100">
                {googleUser.name}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Google Verified
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {googleUser.email} • Managing {vaultItems.length} accounts
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Account Button */}
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Google Drive Live Sheet Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-zinc-900/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <span>Google Drive Sheet Storage:</span>
              <span className="text-emerald-400 font-mono font-normal">"{SHEET_NAME}"</span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {liveSheetLink ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  Synced to your personal Google Drive spreadsheet.
                </span>
              ) : (
                'Grant one-time Drive permission to automatically save this as a real Google Sheet in your Google Drive.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {liveSheetLink ? (
            <a
              href={liveSheetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => handleConnectDriveAndSync()}
              disabled={isDriveSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              {isDriveSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting Drive...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Save to My Google Drive</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {driveError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{driveError}</p>
            {driveError.includes('disabled') && (
              <p className="text-[11px] text-rose-200">
                👉 Click here to enable Google Drive API in your Google Cloud project: {' '}
                <a 
                  href="https://console.cloud.google.com/apis/library/drive.googleapis.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline font-bold text-white hover:text-rose-100"
                >
                  Enable Google Drive API
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Gmail, Microsoft, Reddit, X..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Account Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/20 border border-zinc-800/80 space-y-3">
          <KeyRound className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">
            {vaultItems.length === 0 ? 'No accounts stored in your verified vault' : 'No matching accounts found'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Click <strong>"Add Account"</strong> above to store your Gmail, Microsoft, Reddit, X, Instagram, or any other credentials with custom rotation countdowns and 2FA backup codes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const rot = getRotationStatus(item);
            const scoreInfo = calculatePasswordScore(item.password);
            const isPwVisible = visiblePasswords[item.id] || false;

            return (
              <div
                key={item.id}
                className="p-4 md:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 transition-all space-y-3"
              >
                {/* Header Row: Provider + Username + Countdown */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200">
                      {item.providerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{item.providerName}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{item.username}</p>
                    </div>
                  </div>

                  {/* Badges: Rotation Countdown & Security Score */}
                  <div className="flex items-center gap-2">
                    {/* Countdown Badge */}
                    <div className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 ${rot.badgeColor}`}>
                      <Clock className="w-3 h-3" />
                      <span>{rot.text}</span>
                    </div>

                    {/* Security Score Badge */}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${scoreInfo.color}`}>
                      {scoreInfo.label} ({scoreInfo.score}%)
                    </span>

                    {/* Edit & Delete */}
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          provider: item.provider || 'custom',
                          customName: item.customName || item.providerName,
                          username: item.username || '',
                          password: item.password || '',
                          backupCodes: item.backupCodes || '',
                          rotationDays: item.rotationDays || 60,
                          createdDate: item.createdDate || new Date().toISOString(),
                          lastChangedDate: item.lastChangedDate || new Date().toISOString(),
                          notes: item.notes || '',
                          url: item.url || ''
                        });
                        setShowAddModal(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-all"
                      title="Edit Account"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-all"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Password & Credential Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-900 text-xs">
                  <div className="flex items-center gap-2 font-mono bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-850">
                    <span className="text-zinc-500">Password:</span>
                    <span className="text-zinc-200 select-all tracking-wider">
                      {isPwVisible ? item.password : '••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords(prev => ({ ...prev, [item.id]: !isPwVisible }))}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 ml-1"
                    >
                      {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.password, `pw_${item.id}`)}
                      className="text-zinc-400 hover:text-zinc-100 p-0.5 ml-1"
                      title="Copy password"
                    >
                      {copiedId === `pw_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* 2FA Backup codes indicator */}
                  <div className="flex items-center gap-2">
                    {item.backupCodes && (
                      <button
                        onClick={() => handleCopy(item.backupCodes, `codes_${item.id}`)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[11px] transition-all"
                        title="Copy 2FA Backup Codes"
                      >
                        {copiedId === `codes_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                        <span>2FA Backup Codes ({item.backupCodes.split('\n').filter(Boolean).length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dates & Metadata Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span>Created: {new Date(item.createdDate || Date.now()).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Last Changed: {new Date(item.lastChangedDate || Date.now()).toLocaleDateString()}</span>
                  </div>
                  {item.notes && <span className="italic">{item.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: ADD / EDIT CREDENTIAL
      -------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-100">
                {editingItem ? 'Edit Credential' : 'Add Account Credential'}
              </h3>
              <p className="text-xs text-zinc-400">
                Saved directly to your Google Drive Sheet. Zero database on our servers.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Provider Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Provider / Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PROVIDER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, provider: p.id })}
                      className={`p-2 rounded-xl border text-left font-medium transition-all ${
                        formData.provider === p.id
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {formData.provider === 'custom' && (
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Custom Provider Name</label>
                  <input
                    type="text"
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    placeholder="e.g. Netflix, Bank, Discord, Slack"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              )}

              {/* User ID / Email */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">User ID / Username / Email</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. yourname@gmail.com or @handle"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-medium">Account Password</label>
                  {formData.password && (
                    <span className={`text-[10px] ${calculatePasswordScore(formData.password).color}`}>
                      Strength: {calculatePasswordScore(formData.password).label} ({calculatePasswordScore(formData.password).score}%)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter or generate password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Embedded Password Generator */}
              <PasswordGenerator
                onSelectPassword={(generated) => setFormData({ ...formData, password: generated })}
              />

              {/* 2FA Backup Codes */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2-Factor Authentication (2FA) Backup Codes</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">Optional</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.backupCodes}
                  onChange={(e) => setFormData({ ...formData, backupCodes: e.target.value })}
                  placeholder="Paste 8-digit emergency backup recovery codes (one per line)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Rotation Countdown Days */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password Rotation Interval</span>
                  </label>
                  <span className="text-zinc-400 font-mono">{formData.rotationDays} Days Cycle</span>
                </div>
                <div className="flex gap-2">
                  {[30, 60, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, rotationDays: d })}
                      className={`flex-1 py-1.5 rounded-lg border text-center font-medium ${
                        formData.rotationDays === d
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">Notes / Security Hints</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {modalError && (
                <p className="text-rose-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {modalError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-xl transition-all shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

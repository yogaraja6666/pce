import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
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
  Download, 
  Upload, 
  Mail, 
  Bell, 
  Calendar, 
  ExternalLink,
  Search,
  Sparkles,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  deriveKeyFromPassword, 
  encryptObject, 
  decryptObject, 
  calculatePasswordScore, 
  exportVaultEncrypted, 
  importVaultEncrypted 
} from '../services/cryptoVault';
import PasswordGenerator from './PasswordGenerator';

const STORAGE_VAULT_KEY = 'shield_vault_data';
const STORAGE_META_KEY = 'shield_vault_meta';

// Presets for quick icon & naming
const PLATFORM_PRESETS = [
  { id: 'google', name: 'Google / Gmail', color: 'text-red-400' },
  { id: 'microsoft', name: 'Microsoft / Outlook', color: 'text-blue-400' },
  { id: 'instagram', name: 'Instagram', color: 'text-pink-400' },
  { id: 'facebook', name: 'Facebook', color: 'text-blue-500' },
  { id: 'x', name: 'X (Twitter)', color: 'text-zinc-200' },
  { id: 'whatsapp', name: 'WhatsApp', color: 'text-emerald-400' },
  { id: 'github', name: 'GitHub', color: 'text-purple-400' },
  { id: 'amazon', name: 'Amazon', color: 'text-amber-400' },
  { id: 'custom', name: 'Other Service', color: 'text-zinc-400' }
];

export default function PasswordManager() {
  // Vault state
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeCryptoKey, setActiveCryptoKey] = useState(null);
  const [vaultItems, setVaultItems] = useState([]);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  // Notification email settings
  const [alertEmail, setAlertEmail] = useState('');
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Password visibility map { [id]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    platform: 'google',
    customName: '',
    username: '',
    password: '',
    backupCodes: '',
    rotationDays: 60,
    notes: '',
    url: ''
  });

  // Check initial vault existence on mount
  useEffect(() => {
    const meta = localStorage.getItem(STORAGE_META_KEY);
    if (meta) {
      setIsSetup(true);
      try {
        const parsed = JSON.parse(meta);
        if (parsed.alertEmail) setAlertEmail(parsed.alertEmail);
      } catch {}
    }
  }, []);

  // Compute countdown & status for an item
  const getRotationStatus = (item) => {
    const created = new Date(item.updatedAt || item.createdAt || Date.now());
    const rotationDays = item.rotationDays || 60;
    const expiryDate = new Date(created.getTime() + rotationDays * 24 * 60 * 60 * 1000);
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

  // Master setup or unlock handler
  const handleVaultAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!masterPasswordInput || masterPasswordInput.length < 8) {
      setAuthError('Master password must be at least 8 characters');
      return;
    }

    try {
      if (!isSetup) {
        // First-time setup
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKeyFromPassword(masterPasswordInput, salt);
        
        // Save initial empty encrypted vault
        const encrypted = await encryptObject([], key);
        localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(encrypted));
        
        // Save salt and meta verification
        const meta = {
          salt: Array.from(salt),
          createdAt: new Date().toISOString(),
          alertEmail: alertEmail || ''
        };
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));

        setActiveCryptoKey(key);
        setVaultItems([]);
        setIsSetup(true);
        setIsUnlocked(true);
        setMasterPasswordInput('');
      } else {
        // Unlock existing vault
        const metaRaw = localStorage.getItem(STORAGE_META_KEY);
        const vaultRaw = localStorage.getItem(STORAGE_VAULT_KEY);
        if (!metaRaw || !vaultRaw) {
          throw new Error('Vault storage corrupted');
        }

        const meta = JSON.parse(metaRaw);
        const saltBuffer = new Uint8Array(meta.salt).buffer;
        const key = await deriveKeyFromPassword(masterPasswordInput, saltBuffer);

        const encrypted = JSON.parse(vaultRaw);
        const decryptedItems = await decryptObject(encrypted, key);

        setActiveCryptoKey(key);
        setVaultItems(decryptedItems || []);
        setIsUnlocked(true);
        setMasterPasswordInput('');
      }
    } catch (err) {
      setAuthError('Incorrect master password. Decryption failed.');
    }
  };

  // Save vault state back to encrypted localStorage
  const saveEncryptedVault = async (updatedItems, customAlertEmail = alertEmail) => {
    if (!activeCryptoKey) return;
    try {
      const encrypted = await encryptObject(updatedItems, activeCryptoKey);
      localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(encrypted));
      setVaultItems(updatedItems);

      // update meta if alert email changed
      const metaRaw = localStorage.getItem(STORAGE_META_KEY);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        meta.alertEmail = customAlertEmail;
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
      }
    } catch (err) {
      console.error('Failed to encrypt vault', err);
    }
  };

  // Lock vault and wipe key from memory
  const handleLockVault = () => {
    setIsUnlocked(false);
    setActiveCryptoKey(null);
    setVaultItems([]);
    setMasterPasswordInput('');
    setVisiblePasswords({});
  };

  // Add or Edit item submission
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setModalError('User ID and Password are required');
      return;
    }

    const platformName = formData.platform === 'custom' 
      ? (formData.customName || 'Custom Account')
      : (PLATFORM_PRESETS.find(p => p.id === formData.platform)?.name || formData.platform);

    const nowIso = new Date().toISOString();

    let updatedList;
    if (editingItem) {
      updatedList = vaultItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            ...formData,
            platformName,
            updatedAt: nowIso
          };
        }
        return item;
      });
    } else {
      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        ...formData,
        platformName,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      updatedList = [newItem, ...vaultItems];
    }

    await saveEncryptedVault(updatedList);
    setShowAddModal(false);
    setEditingItem(null);
    setModalError('');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      platform: 'google',
      customName: '',
      username: '',
      password: '',
      backupCodes: '',
      rotationDays: 60,
      notes: '',
      url: ''
    });
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      const filtered = vaultItems.filter(item => item.id !== id);
      await saveEncryptedVault(filtered);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export encrypted vault
  const handleExport = async (e) => {
    e.preventDefault();
    if (!exportPassword || exportPassword.length < 6) {
      setModalError('Export document password must be at least 6 characters');
      return;
    }

    try {
      await exportVaultEncrypted(vaultItems, exportPassword);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setShowExportModal(false);
        setExportPassword('');
        setModalError('');
      }, 1500);
    } catch (err) {
      setModalError(err.message || 'Export failed');
    }
  };

  // Import encrypted vault
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFileContent || !importPassword) {
      setModalError('Please upload a backup file and enter its document password');
      return;
    }

    try {
      const decrypted = await importVaultEncrypted(importFileContent, importPassword);
      if (!Array.isArray(decrypted)) throw new Error('Invalid vault structure');

      // Merge or replace
      const merged = [...decrypted, ...vaultItems.filter(existing => !decrypted.some(d => d.id === existing.id))];
      await saveEncryptedVault(merged);
      setShowImportModal(false);
      setImportFileContent('');
      setImportPassword('');
      setModalError('');
      showToast('Vault backup imported and merged successfully!');
    } catch (err) {
      setModalError('Decryption failed. Incorrect document password or invalid file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportFileContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Trigger notification / email reminder
  const handleTriggerAlert = (item) => {
    const status = getRotationStatus(item);
    const targetEmail = alertEmail || 'configured notification email';

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Password Rotation Due: ${item.platformName}`, {
        body: `It is time to update your password for ${item.username}. (${status.text})`,
        icon: '/favicon.svg'
      });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    showToast(`Notification alert prepared for ${targetEmail}: "${item.platformName} rotation reminder"`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3500);
  };

  // Filtered items
  const filteredItems = vaultItems.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.platformName && item.platformName.toLowerCase().includes(q)) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Calculate Overall Vault Health Score
  const calculateVaultHealth = () => {
    if (vaultItems.length === 0) return 100;
    let totalScore = 0;
    vaultItems.forEach(item => {
      const pwScore = calculatePasswordScore(item.password).score;
      totalScore += pwScore;
    });
    return Math.round(totalScore / vaultItems.length);
  };

  // -------------------------------------------------------------
  // RENDER: NOT UNLOCKED (Setup or Unlock View)
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">
            {isSetup ? 'Unlock Password Vault' : 'Initialize Zero-Knowledge Vault'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isSetup
              ? 'Enter your master password. Decryption occurs purely in-memory using AES-256-GCM.'
              : 'Create a master password. Your credentials will be encrypted with PBKDF2 (100,000 rounds) before reaching storage.'}
          </p>
        </div>

        <form onSubmit={handleVaultAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              {isSetup ? 'Master Password' : 'Create Master Password (min 8 chars)'}
            </label>
            <input
              type="password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          {!isSetup && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Alert Email (Optional for rotation reminders)
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          )}

          {authError && (
            <p className="text-rose-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-xl transition-all shadow-sm"
          >
            {isSetup ? 'Unlock Vault' : 'Create Secure Vault'}
          </button>
        </form>

        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-500 leading-relaxed text-center">
          Zero-Knowledge guarantee: Your master password is never stored or transmitted anywhere. If forgotten, vault data cannot be recovered.
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: UNLOCKED VAULT DASHBOARD
  // -------------------------------------------------------------
  const overallHealth = calculateVaultHealth();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {showNotificationToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs shadow-2xl flex items-center gap-2.5 animate-fadeIn">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Vault Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Encrypted Password Vault</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              AES-256 Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Managing {vaultItems.length} accounts • Average Health Score: <strong className="text-emerald-400">{overallHealth}/100</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Account */}
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>

          {/* Export Encrypted */}
          <button
            onClick={() => {
              setModalError('');
              setShowExportModal(true);
            }}
            title="Export with Document Password"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Encrypted</span>
          </button>

          {/* Import */}
          <button
            onClick={() => {
              setModalError('');
              setShowImportModal(true);
            }}
            title="Import Encrypted Backup"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Lock Vault */}
          <button
            onClick={handleLockVault}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts or usernames..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {alertEmail && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span>Alerts to: <strong className="text-zinc-300">{alertEmail}</strong></span>
          </div>
        )}
      </div>

      {/* Account Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/20 border border-zinc-800/80 space-y-3">
          <KeyRound className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">
            {vaultItems.length === 0 ? 'No accounts in your vault yet' : 'No matching accounts found'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {vaultItems.length === 0 
              ? 'Click "Add Account" to store your Gmail, Microsoft, Instagram, X, or other credentials with automatic rotation countdowns.'
              : 'Try a different search term.'}
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
                className="p-4 md:p-5 rounded-xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 transition-all space-y-3"
              >
                {/* Header row: Platform Name + Badges + Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200">
                      {item.platformName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{item.platformName}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{item.username}</p>
                    </div>
                  </div>

                  {/* Badges: Rotation Countdown & Security Score */}
                  <div className="flex items-center gap-2">
                    {/* Countdown Badge */}
                    <div className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 ${rot.badgeColor}`}>
                      <Clock className="w-3 h-3" />
                      <span>{rot.text}</span>
                    </div>

                    {/* Security Score Badge */}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${scoreInfo.color}`}>
                      {scoreInfo.label} ({scoreInfo.score}%)
                    </span>

                    {/* Actions: Edit & Delete */}
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          platform: item.platform || 'custom',
                          customName: item.customName || item.platformName,
                          username: item.username || '',
                          password: item.password || '',
                          backupCodes: item.backupCodes || '',
                          rotationDays: item.rotationDays || 60,
                          notes: item.notes || '',
                          url: item.url || ''
                        });
                        setShowAddModal(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-all"
                      title="Edit Account"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-md transition-all"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Password & Credential Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-900 text-xs">
                  <div className="flex items-center gap-2 font-mono bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-850">
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
                      onClick={() => handleCopyText(item.password, `pw_${item.id}`)}
                      className="text-zinc-400 hover:text-zinc-100 p-0.5 ml-1"
                      title="Copy password"
                    >
                      {copiedId === `pw_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* 2FA Backup codes indicator & Notification Trigger */}
                  <div className="flex items-center gap-2">
                    {item.backupCodes && (
                      <button
                        onClick={() => handleCopyText(item.backupCodes, `codes_${item.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-md text-[11px] transition-all"
                        title="Copy 2FA Backup Codes"
                      >
                        {copiedId === `codes_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                        <span>2FA Codes ({item.backupCodes.split('\n').filter(Boolean).length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTriggerAlert(item)}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md text-[11px] transition-all"
                      title="Test Notification Alert"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Alert</span>
                    </button>
                  </div>
                </div>

                {/* Notes or URL if present */}
                {(item.notes || item.url) && (
                  <p className="text-[11px] text-zinc-500 italic">
                    {item.notes} {item.url && `• ${item.url}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: ADD / EDIT ACCOUNT
      -------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                {editingItem ? 'Edit Credential' : 'Add Account Credential'}
              </h3>
              <p className="text-xs text-zinc-400">
                Data is encrypted in-memory with AES-256 before saving to local storage.
              </p>
            </div>

            <form onSubmit={handleSubmitItem} className="space-y-4 text-xs">
              {/* Platform Preset Picker */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Platform / Service</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PLATFORM_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: p.id })}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${
                        formData.platform === p.id
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {formData.platform === 'custom' && (
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Custom Service Name</label>
                  <input
                    type="text"
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    placeholder="e.g. Netflix, Bank, Discord"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              )}

              {/* Username / User ID */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">User ID / Username / Email</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. user@gmail.com or @handle"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
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
                  placeholder="Enter or generate a strong password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Integrated Generator Widget */}
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
                  placeholder="Paste emergency 8-digit backup recovery codes (one per line)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Rotation Countdown Days */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password Rotation Cycle</span>
                  </label>
                  <span className="text-zinc-400 font-mono">{formData.rotationDays} Days</span>
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
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
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-lg transition-all shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Save Account to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: EXPORT WITH DOCUMENT PASSWORD
      -------------------------------------------------------------- */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                Export Encrypted Vault
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Protect your exported file with a dedicated <strong>Document Password</strong>. Anyone who intercepts the file cannot view your passwords without this password.
              </p>
            </div>

            <form onSubmit={handleExport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">Set Document Password</label>
                <input
                  type="password"
                  required
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter strong document password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {modalError && (
                <p className="text-rose-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {modalError}
                </p>
              )}

              {exportSuccess ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center font-medium">
                  Encrypted backup downloaded successfully!
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-xl transition-all shadow-sm"
                >
                  Download Encrypted File (.json)
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: IMPORT & DECRYPT BACKUP
      -------------------------------------------------------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                Import Encrypted Vault Backup
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upload a <code>.encrypted.json</code> backup and enter its Document Password to decrypt and merge credentials.
              </p>
            </div>

            <form onSubmit={handleImport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">Select Backup File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">Document Password</label>
                <input
                  type="password"
                  required
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Enter file document password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {modalError && (
                <p className="text-rose-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {modalError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-xl transition-all shadow-sm"
              >
                Decrypt & Import Credentials
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

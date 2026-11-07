import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  PhoneCall, 
  Mail, 
  MessageSquare
} from 'lucide-react';

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

export default function EmergencySOSModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [copied, setCopied] = useState(false);

  const warningMessage = 'EMERGENCY ALERT: My social media account has been compromised. Please ignore any messages, stories, or requests for funds/links sent from my account recently.';

  const handleCopy = () => {
    navigator.clipboard.writeText(warningMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incident Response Protocol</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">
            Account Compromise First-Aid
          </h2>
          <p className="text-xs text-zinc-400">
            Take immediate steps to revoke attacker access and notify your contacts.
          </p>
        </div>

        {/* Warning Template */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">
              Broadcast Message for Contacts / Status
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800/60 select-all font-mono leading-relaxed">
            "{warningMessage}"
          </p>
        </div>

        {/* Platform Selector */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-400">Select Platform</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'instagram', name: 'Instagram', icon: InstagramIcon },
              { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
              { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
              { id: 'gmail', name: 'Google', icon: Mail },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                    selectedPlatform === p.id
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Remediation Guide */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          {selectedPlatform === 'instagram' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">Instagram Recovery Guide</span>
                <a
                  href="https://instagram.com/hacked"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white underline underline-offset-2"
                >
                  <span>instagram.com/hacked</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>If locked out, visit <strong>instagram.com/hacked</strong> and select "My account was hacked" to verify via phone/video selfie.</li>
                <li>If you retain access, navigate to <strong>Settings → Accounts Center → Password and Security → Where you're logged in</strong> to terminate unfamiliar sessions.</li>
                <li>Enable Two-Factor Authentication using an Authenticator app (avoid SMS if SIM-swap is suspected).</li>
              </ul>
            </div>
          )}

          {selectedPlatform === 'whatsapp' && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-zinc-200">WhatsApp Session Termination</span>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Re-register WhatsApp on your primary phone by entering your phone number and verifying the 6-digit SMS code.</li>
                <li>Verifying via SMS automatically logs out and terminates the intruder's active session.</li>
                <li>Navigate to <strong>Settings → Linked Devices</strong> to revoke any active WhatsApp Web sessions.</li>
                <li>Enable <strong>Two-Step Verification PIN</strong> in Settings → Account.</li>
              </ul>
            </div>
          )}

          {selectedPlatform === 'facebook' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">Facebook Account Recovery</span>
                <a
                  href="https://facebook.com/hacked"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white underline underline-offset-2"
                >
                  <span>facebook.com/hacked</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Visit <strong>facebook.com/hacked</strong> to report account compromise.</li>
                <li>Go to <strong>Settings & Privacy → Password and Security</strong> and select "Log out of all sessions".</li>
                <li>Review third-party app permissions under "Apps and Websites".</li>
              </ul>
            </div>
          )}

          {selectedPlatform === 'gmail' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">Google Account Audit</span>
                <a
                  href="https://myaccount.google.com/device-activity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white underline underline-offset-2"
                >
                  <span>Device Activity</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Change your Google password immediately.</li>
                <li>Visit <strong>myaccount.google.com/device-activity</strong> and sign out of unrecognized devices.</li>
                <li>Check Gmail forwarding filters in Gmail Settings to ensure incoming mail is not being secretly redirected.</li>
              </ul>
            </div>
          )}
        </div>

        {/* National Helpline */}
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-xs font-medium text-zinc-200">National Cyber Crime Reporting Helpline</p>
              <p className="text-[11px] text-zinc-500">For financial fraud or extortion, dial 1930 (India) or visit cybercrime.gov.in</p>
            </div>
          </div>
          <a
            href="tel:1930"
            className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all"
          >
            Call 1930
          </a>
        </div>

      </div>
    </div>
  );
}

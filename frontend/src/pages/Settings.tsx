import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { GetSettings, UpdateSettings, ValidateHashcatBinary } from '../../wailsjs/go/main/App';

interface SettingsData {
  hashcatBinaryPath: string;
  hashcatInstallDir: string;
  setupComplete: boolean;
  hashesDir: string;
  dictionariesDir: string;
  rulesDir: string;
  masksDir: string;
  outputDir: string;
  defaultStatusTimer: number;
  defaultWorkloadProfile: number;
}

interface ValidationInfo {
  valid: boolean;
  version: string;
  algorithms: Record<number, string>;
  error: string;
}

const DIR_FIELDS: { key: keyof SettingsData; label: string }[] = [
  { key: 'hashesDir', label: 'Hashes Directory' },
  { key: 'dictionariesDir', label: 'Dictionaries Directory' },
  { key: 'rulesDir', label: 'Rules Directory' },
  { key: 'masksDir', label: 'Masks Directory' },
  { key: 'outputDir', label: 'Output Directory' },
];

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (window.go?.main?.App) {
          setSettings(await GetSettings());
        } else {
          setSettings({
            hashcatBinaryPath: '/usr/local/bin/hashcat',
            hashcatInstallDir: '~/.config/HashcatStudio/hashcat',
            setupComplete: true,
            hashesDir: '~/.config/HashcatGUI/hashes',
            dictionariesDir: '~/.config/HashcatGUI/dictionaries',
            rulesDir: '~/.config/HashcatGUI/rules',
            masksDir: '~/.config/HashcatGUI/masks',
            outputDir: '~/.config/HashcatGUI/output',
            defaultStatusTimer: 10,
            defaultWorkloadProfile: 2,
          });
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      if (window.go?.main?.App) {
        await UpdateSettings(settings);
      }
      setMessage({ text: 'Settings saved', type: 'success' });
    } catch {
      setMessage({ text: 'Failed to save', type: 'error' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const validate = async () => {
    if (!settings?.hashcatBinaryPath) return;
    setValidating(true);
    setValidation(null);
    try {
      if (window.go?.main?.App) {
        setValidation(await ValidateHashcatBinary(settings.hashcatBinaryPath));
      } else {
        await new Promise(r => setTimeout(r, 600));
        setValidation({ valid: true, version: 'v6.2.6 (Mock)', algorithms: { 0: 'MD5', 100: 'SHA1' }, error: '' });
      }
    } catch (err) { console.error(err); }
    setValidating(false);
  };

  const set = <K extends keyof SettingsData>(field: K, value: SettingsData[K]) => {
    if (settings) setSettings({ ...settings, [field]: value });
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem' }}><span className="spinner" /> Loading settings…</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Configure Hashcat binary and asset directories.</p>

      {settings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>

          {/* Binary Path */}
          <div className="glass-card">
            <div className="section-title">Hashcat Binary</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" type="text" value={settings.hashcatBinaryPath} onChange={e => set('hashcatBinaryPath', e.target.value)} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} />
              <button className="btn btn-ghost" onClick={validate} disabled={validating}>
                {validating ? <Loader2 size={14} className="spinning" /> : <ShieldCheck size={14} />}
                Validate
              </button>
            </div>

            <AnimatePresence>
              {validation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ marginTop: '0.625rem' }}
                >
                  {validation.valid ? (
                    <div className="validation-success">
                      <ShieldCheck size={15} />
                      <span>{validation.version} — {Object.keys(validation.algorithms || {}).length} algorithms</span>
                    </div>
                  ) : (
                    <div className="validation-error">
                      <ShieldX size={15} />
                      <span>{validation.error}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Directories */}
          <div className="glass-card">
            <div className="section-title">Asset Directories</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {DIR_FIELDS.map(({ key, label }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="text" value={settings[key] as string} onChange={e => set(key, e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            <AnimatePresence>
              {message && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className={`toast ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}
                >
                  {message.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

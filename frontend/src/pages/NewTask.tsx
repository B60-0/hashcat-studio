import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { CreateTask, GetSettings, PreviewTask, ScanAssets, StartTask, ValidateHashcatBinary } from '../../wailsjs/go/main/App';
import { hashcat } from '../../wailsjs/go/models';

interface ScannedAssets {
  hashes: string[];
  dictionaries: string[];
  rules: string[];
  masks: string[];
}

type TaskConfig = Required<Pick<hashcat.HashcatArgs,
  'Hash' |
  'HashMode' |
  'AttackMode' |
  'Dictionaries' |
  'Rules' |
  'Mask' |
  'MaskFile' |
  'OutputFile' |
  'OutputFormat' |
  'Quiet' |
  'StatusTimer' |
  'EnableMaskIncrementMode' |
  'MaskIncrementMin' |
  'MaskIncrementMax'
>>;

const DEFAULT_CONFIG: TaskConfig = {
  Hash: '',
  HashMode: 0,
  AttackMode: 0,
  Dictionaries: [],
  Rules: [],
  Mask: '',
  MaskFile: '',
  OutputFile: '',
  OutputFormat: [1],
  Quiet: false,
  StatusTimer: 10,
  EnableMaskIncrementMode: false,
  MaskIncrementMin: 1,
  MaskIncrementMax: 8,
};

export const NewTask = () => {
  const [config, setConfig] = useState<TaskConfig>({ ...DEFAULT_CONFIG });
  const [preview, setPreview] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string>('');
  const [assets, setAssets] = useState<ScannedAssets | null>(null);
  const [algorithms, setAlgorithms] = useState<Record<string, string>>({});
  const [algoSearch, setAlgoSearch] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (window.go?.main?.App) {
          const [loadedAssets, settings] = await Promise.all([
            ScanAssets(),
            GetSettings(),
          ]);
          setAssets(loadedAssets);
          const info = await ValidateHashcatBinary(settings.hashcatBinaryPath);
          if (info?.valid && info.algorithms) setAlgorithms(info.algorithms);
          setConfig(c => ({ ...c, OutputFile: settings.outputDir ? `${settings.outputDir}/found.txt` : '' }));
        } else {
          setAssets({
            hashes: ['/mock/hash.txt'],
            dictionaries: ['/mock/rockyou.txt', '/mock/wordlist.txt'],
            rules: ['/mock/best64.rule'],
            masks: ['/mock/mask.hcmask'],
          });
          setAlgorithms({ '0': 'MD5', '100': 'SHA1', '1000': 'NTLM', '1400': 'SHA2-256', '1700': 'SHA2-512' });
          setConfig(c => ({ ...c, OutputFile: '/mock/output.txt' }));
        }
      } catch (err) {
        console.error('Init error', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updatePreview = async () => {
      try {
        if (window.go?.main?.App) {
          const args = await PreviewTask(config);
          setPreview(args);
          setPreviewError('');
        } else {
          if (!config.Hash) { setPreviewError('Hash input is required'); setPreview([]); return; }
          if (!config.OutputFile) { setPreviewError('Output file is required'); setPreview([]); return; }
          if (config.AttackMode === 0 && config.Dictionaries.length === 0) { setPreviewError('Select at least one dictionary'); setPreview([]); return; }
          if (config.AttackMode === 3 && !config.Mask) { setPreviewError('Mask pattern is required'); setPreview([]); return; }
          const args = ['-m', String(config.HashMode), '-a', String(config.AttackMode), config.Hash, '-o', config.OutputFile];
          if (config.AttackMode === 0) { config.Dictionaries.forEach(d => args.push(d)); config.Rules.forEach(r => args.push('-r', r)); }
          if (config.AttackMode === 3) args.push(config.Mask);
          setPreview(args);
          setPreviewError('');
        }
      } catch (err: unknown) {
        setPreviewError(err instanceof Error ? err.message : String(err));
        setPreview([]);
      }
    };
    updatePreview();
  }, [config]);

  const filteredAlgorithms = useMemo(() => {
    const entries = Object.entries(algorithms);
    if (!algoSearch) return entries;
    const q = algoSearch.toLowerCase();
    const matches = entries.filter(([id, name]) => id.includes(q) || (name as string).toLowerCase().includes(q));
    // Keep the currently-selected algorithm in the list so the <select> value stays in sync.
    const currentId = String(config.HashMode);
    if (!matches.some(([id]) => id === currentId)) {
      const current = entries.find(([id]) => id === currentId);
      if (current) matches.unshift(current);
    }
    return matches;
  }, [algorithms, algoSearch, config.HashMode]);

  const handleChange = <K extends keyof TaskConfig>(field: K, value: TaskConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'Dictionaries' | 'Rules', value: string) => {
    setConfig(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value] };
    });
  };

  const handleCreate = async (start: boolean) => {
    setCreating(true);
    try {
      if (window.go?.main?.App) {
        const taskId = await CreateTask(config);
        if (start) await StartTask(taskId);
      }
      setConfig({ ...DEFAULT_CONFIG, OutputFile: config.OutputFile });
    } catch (err: unknown) {
      console.error('Create failed', err);
    } finally {
      setCreating(false);
    }
  };

  const isValid = !previewError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <h1 className="page-title">New Task</h1>
      <p className="page-subtitle">Configure and launch a Hashcat session.</p>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', paddingBottom: '1rem' }}>

          {/* Target */}
          <div className="glass-card">
            <div className="section-title">Target</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Hash Input / File</label>
                <input className="form-input" type="text" value={config.Hash} onChange={e => handleChange('Hash', e.target.value)} placeholder="/path/to/hashes.txt" />
              </div>
              <div className="form-group">
                <label className="form-label">Hash Mode (-m)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', marginBottom: '0.375rem' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: '2rem' }} type="text" placeholder="Search algorithms..." value={algoSearch} onChange={e => setAlgoSearch(e.target.value)} />
                  </div>
                  <select className="form-select" value={config.HashMode} onChange={e => handleChange('HashMode', parseInt(e.target.value, 10))}>
                    {filteredAlgorithms.map(([id, name]) => (
                      <option key={id} value={id}>{id} – {name as string}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Attack Mode (-a)</label>
              <select className="form-select" value={config.AttackMode} onChange={e => handleChange('AttackMode', parseInt(e.target.value, 10))}>
                <option value={0}>0 – Dictionary</option>
                <option value={3}>3 – Mask (Brute-force)</option>
              </select>
            </div>
          </div>

          {/* Attack Config */}
          <div className="glass-card">
            <div className="section-title">Attack Configuration</div>

            <AnimatePresence mode="wait">
              {config.AttackMode === 0 ? (
                <motion.div key="dict" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Dictionaries {config.Dictionaries.length > 0 && <span style={{ color: 'var(--accent)' }}>({config.Dictionaries.length})</span>}</label>
                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '140px', overflowY: 'auto', padding: '0.25rem' }}>
                        {assets?.dictionaries?.length ? assets.dictionaries.map(d => (
                          <label key={d} className="checkbox-item">
                            <input type="checkbox" checked={config.Dictionaries.includes(d)} onChange={() => handleArrayToggle('Dictionaries', d)} />
                            {d.split('/').pop()}
                          </label>
                        )) : <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No dictionaries found. Add files in Settings.</div>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rules {config.Rules.length > 0 && <span style={{ color: 'var(--accent)' }}>({config.Rules.length})</span>}</label>
                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '140px', overflowY: 'auto', padding: '0.25rem' }}>
                        {assets?.rules?.length ? assets.rules.map(r => (
                          <label key={r} className="checkbox-item">
                            <input type="checkbox" checked={config.Rules.includes(r)} onChange={() => handleArrayToggle('Rules', r)} />
                            {r.split('/').pop()}
                          </label>
                        )) : <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No rules found.</div>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="mask" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <div className="form-group">
                    <label className="form-label">Mask Pattern</label>
                    <input className="form-input" style={{ fontFamily: 'var(--font-mono)' }} type="text" value={config.Mask} onChange={e => handleChange('Mask', e.target.value)} placeholder="?a?a?a?a?a?a" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <label className="checkbox-item">
                      <input type="checkbox" checked={config.EnableMaskIncrementMode} onChange={e => handleChange('EnableMaskIncrementMode', e.target.checked)} />
                      Increment mode (-i)
                    </label>
                    {config.EnableMaskIncrementMode && (
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input className="form-input" type="number" value={config.MaskIncrementMin} onChange={e => handleChange('MaskIncrementMin', parseInt(e.target.value, 10) || 1)} style={{ width: '60px', textAlign: 'center' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>to</span>
                        <input className="form-input" type="number" value={config.MaskIncrementMax} onChange={e => handleChange('MaskIncrementMax', parseInt(e.target.value, 10) || 8)} style={{ width: '60px', textAlign: 'center' }} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Output */}
          <div className="glass-card">
            <div className="section-title">Output</div>
            <div className="form-group">
              <label className="form-label">Output File Path</label>
              <input className="form-input" type="text" value={config.OutputFile} onChange={e => handleChange('OutputFile', e.target.value)} placeholder="/path/to/output.txt" />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="glass-card" style={{ width: '320px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div className="section-title">Command Preview</div>

          <div className="terminal" style={{ flex: 1, minHeight: '120px' }}>
            {previewError ? (
              <span style={{ color: 'var(--red)' }}>{previewError}</span>
            ) : (
              <>
                <span style={{ color: 'var(--accent)' }}>$</span>{' '}
                <span style={{ color: 'var(--green)' }}>hashcat</span>{' '}
                {preview.map((arg, i) => (
                  <span key={i}>
                    <span style={{ color: arg.startsWith('-') ? 'var(--cyan)' : 'var(--text-primary)' }}>{arg}</span>{' '}
                  </span>
                ))}
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => handleCreate(false)} disabled={!isValid || creating}>
              {creating ? <span className="spinner" /> : null}
              Create Task Only
            </button>
            <button className="btn-primary" onClick={() => handleCreate(true)} disabled={!isValid || creating} style={{ width: '100%' }}>
              {creating ? <span className="spinner" /> : null}
              Create & Start
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

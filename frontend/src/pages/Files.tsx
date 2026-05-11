import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, File, FolderOpen } from 'lucide-react';
import { ScanAssets } from '../../wailsjs/go/main/App';

interface ScannedAssets {
  hashes: string[];
  dictionaries: string[];
  rules: string[];
  masks: string[];
}

const CATEGORY_META: Record<string, { label: string; ext: string; color: string }> = {
  hashes: { label: 'Hashes', ext: '.hash / .txt', color: 'var(--cyan)' },
  dictionaries: { label: 'Dictionaries', ext: '.txt / .dict', color: 'var(--green)' },
  rules: { label: 'Rules', ext: '.rule', color: 'var(--yellow)' },
  masks: { label: 'Masks', ext: '.hcmask', color: 'var(--accent)' },
};

export const Files = () => {
  const [assets, setAssets] = useState<ScannedAssets | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      if (window.go?.main?.App) {
        setAssets(await ScanAssets());
      } else {
        await new Promise(r => setTimeout(r, 600));
        setAssets({
          hashes: ['/path/to/hashes/example.hash'],
          dictionaries: ['/path/to/dictionaries/rockyou.txt'],
          rules: ['/path/to/rules/best64.rule', '/path/to/rules/dive.rule'],
          masks: ['/path/to/masks/custom.hcmask'],
        });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { scan(); }, []);

  const AssetSection = ({ category, items }: { category: string; items: string[] }) => {
    const meta = CATEGORY_META[category];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{meta.label}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{items.length} files</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{meta.ext}</span>
        </div>
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '160px', overflowY: 'auto' }}>
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
              fontSize: '0.8125rem', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              <File size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
            </div>
          )) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <FolderOpen size={18} />
              No files found
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <div>
          <h1 className="page-title">Files & Wordlists</h1>
          <p className="page-subtitle">Assets discovered from your configured directories.</p>
        </div>
        <button className="btn-primary" onClick={scan} disabled={loading}>
          {loading ? <span className="spinner" /> : <RefreshCw size={14} />}
          {loading ? 'Scanning…' : 'Rescan'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '900px' }}>
        {assets ? Object.keys(CATEGORY_META).map((key) => (
          <AssetSection key={key} category={key} items={assets[key as keyof ScannedAssets] || []} />
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ margin: '0 auto 1rem' }} />
            <div>Scanning directories…</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

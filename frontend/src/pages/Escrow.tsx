import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Handshake, Play, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { CreateTask, DownloadHashesComEscrowJobHashes, GetSettings, ListHashesComEscrowJobs, ScanAssets, StartTask } from '../../wailsjs/go/main/App';

interface EscrowJob {
  id: number;
  state?: string;
  createdAt: string;
  lastUpdate: string;
  algorithmName: string;
  algorithmId: number;
  totalHashes: number;
  foundHashes: number;
  leftHashes: number;
  currency: string;
  pricePerHash: string;
  pricePerHashUsd: string;
  maxCracksNeeded: number;
  leftList: string;
  foundList?: string;
}

interface EscrowJobsResult {
  enabled: boolean;
  authenticated: boolean;
  jobs: EscrowJob[];
}

const mockJobs: EscrowJob[] = [
  {
    id: 5,
    createdAt: '2026-05-12 09:20:00',
    lastUpdate: '2026-05-12 10:03:00',
    algorithmName: 'MD5',
    algorithmId: 0,
    totalHashes: 1000,
    foundHashes: 225,
    leftHashes: 775,
    currency: 'XMR',
    pricePerHash: '0.00001500',
    pricePerHashUsd: '0.25',
    maxCracksNeeded: 100,
    leftList: '/unfound/5-demo-unfound.txt',
  },
];

export const Escrow = () => {
  const [jobs, setJobs] = useState<EscrowJob[]>([]);
  const [dictionaries, setDictionaries] = useState<string[]>([]);
  const [selectedDictionary, setSelectedDictionary] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pullingJob, setPullingJob] = useState<number | null>(null);
  const [startingJob, setStartingJob] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [minUsd, setMinUsd] = useState('');
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let result: EscrowJobsResult;
      if (window.go?.main?.App) {
        result = await ListHashesComEscrowJobs();
      } else {
        await new Promise(r => setTimeout(r, 500));
        result = { enabled: true, authenticated: false, jobs: mockJobs };
      }

      setAuthenticated(result.authenticated);
      setJobs(result.jobs || []);
      if (window.go?.main?.App) {
        const assets = await ScanAssets();
        setDictionaries(assets.dictionaries || []);
        setSelectedDictionary(current => current || assets.dictionaries?.[0] || '');
      } else {
        setDictionaries(['/mock/rockyou.txt', '/mock/wordlist.txt']);
        setSelectedDictionary(current => current || '/mock/rockyou.txt');
      }
    } catch (err: unknown) {
      setJobs([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = parseFloat(minUsd);

    return jobs
      .filter(job => {
        if (hideUnavailable && (!job.leftList || job.leftHashes <= 0)) return false;
        if (!Number.isNaN(min) && minUsd.trim() !== '' && rewardUsd(job) < min) return false;
        if (!q) return true;
        return [
          String(job.id),
          job.state || '',
          job.algorithmName,
          String(job.algorithmId),
          job.currency,
        ].some(value => value.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'reward') return rewardUsd(b) - rewardUsd(a);
        if (sortBy === 'left') return b.leftHashes - a.leftHashes;
        if (sortBy === 'algorithm') return a.algorithmName.localeCompare(b.algorithmName);
        if (sortBy === 'oldest') return dateValue(a.createdAt || a.lastUpdate) - dateValue(b.createdAt || b.lastUpdate);
        return dateValue(b.lastUpdate || b.createdAt) - dateValue(a.lastUpdate || a.createdAt);
      });
  }, [hideUnavailable, jobs, minUsd, query, sortBy]);

  const pullHashes = async (job: EscrowJob) => {
    if (!job.leftList) return;

    setPullingJob(job.id);
    setError(null);
    setMessage(null);
    try {
      let savedPath: string;
      if (window.go?.main?.App) {
        savedPath = await DownloadHashesComEscrowJobHashes(job.id, job.leftList);
      } else {
        await new Promise(r => setTimeout(r, 500));
        savedPath = `~/.config/HashcatStudio/hashes/hashes-com-job-${job.id}-unfound.txt`;
      }
      setMessage(`Saved ${savedPath}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPullingJob(null);
    }
  };

  const startEscrowTask = async (job: EscrowJob) => {
    if (!job.leftList) return;

    const dictionary = selectedDictionary || dictionaries[0];
    if (!dictionary) {
      setError('Select or add a dictionary before starting an escrow task.');
      return;
    }

    setStartingJob(job.id);
    setError(null);
    setMessage(null);
    try {
      let savedPath: string;
      if (window.go?.main?.App) {
        savedPath = await DownloadHashesComEscrowJobHashes(job.id, job.leftList);
        const settings = await GetSettings();
        const taskId = await CreateTask({
          Hash: savedPath,
          HashMode: job.algorithmId,
          AttackMode: 0,
          Dictionaries: [dictionary],
          Rules: [],
          OutputFile: settings.outputDir ? `${settings.outputDir}/escrow-${job.id}-found.txt` : `${savedPath}.found`,
          OutputFormat: [1, 2],
          Quiet: false,
          StatusTimer: settings.defaultStatusTimer || 10,
          DevicesTypes: [2],
          DevicesIDs: [],
          WorkloadProfile: 4,
          ExtraArguments: [],
        });
        await StartTask(taskId);
      } else {
        await new Promise(r => setTimeout(r, 500));
        savedPath = `~/.config/HashcatStudio/hashes/hashes-com-job-${job.id}-unfound.txt`;
      }
      setMessage(`Started job #${job.id} as a new task using mode -m ${job.algorithmId}. Hashes saved to ${savedPath}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStartingJob(null);
    }
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
          <h1 className="page-title">Hashes.com Escrow</h1>
          <p className="page-subtitle">Pull escrow hash lists into your configured hashes directory.</p>
        </div>
        <button className="btn-primary" onClick={loadJobs} disabled={loading}>
          {loading ? <span className="spinner" /> : <RefreshCw size={14} />}
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {(message || error) && (
        <div className={error ? 'validation-error' : 'validation-success'} style={{ maxWidth: '900px', marginBottom: '1rem' }}>
          {error ? <ShieldAlert size={15} /> : <Download size={15} />}
          <span>{error || message}</span>
        </div>
      )}

      <div className="glass-card" style={{ maxWidth: '1040px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Handshake size={16} style={{ color: 'var(--cyan)' }} />
            <span className="section-title" style={{ margin: 0 }}>Available Jobs</span>
          </div>
          <span className="badge badge-idle">{authenticated ? 'Account jobs' : 'Public jobs'}</span>
        </div>

        <div className="escrow-controls">
          <div className="escrow-search">
            <Search size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search jobs, algorithms, states..." />
          </div>
          <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="recent">Most recently updated</option>
            <option value="oldest">Oldest posted</option>
            <option value="reward">Highest estimated reward</option>
            <option value="left">Most hashes left</option>
            <option value="algorithm">Algorithm A-Z</option>
          </select>
          <input className="form-input" type="number" min="0" step="0.01" value={minUsd} onChange={e => setMinUsd(e.target.value)} placeholder="Min total USD" />
          <label className="checkbox-item escrow-checkbox">
            <input type="checkbox" checked={hideUnavailable} onChange={e => setHideUnavailable(e.target.checked)} />
            Hide empty
          </label>
        </div>

        <div className="escrow-taskbar">
          <label className="form-label" style={{ margin: 0 }}>Dictionary for Start Task</label>
          <select className="form-select" value={selectedDictionary} onChange={e => setSelectedDictionary(e.target.value)}>
            <option value="">No dictionary selected</option>
            {dictionaries.map(dictionary => (
              <option key={dictionary} value={dictionary}>{dictionary.split('/').pop()}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', minHeight: '220px', color: 'var(--text-muted)' }}>
            <span className="spinner" />
            Loading hashes.com jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Handshake size={22} />
            <div>No escrow jobs loaded</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div className="escrow-table">
              <div className="escrow-row escrow-header">
                <span>Job</span>
                <span>Algorithm</span>
                <span>Left</span>
                <span>Found</span>
                <span>Reward</span>
                <span>Updated</span>
                <span />
              </div>

              {visibleJobs.map(job => (
                <div className="escrow-row" key={job.id}>
                  <span>
                    <strong>#{job.id}</strong>
                    {job.state && <small>{job.state}</small>}
                  </span>
                  <span>
                    <strong>{job.algorithmName}</strong>
                    <small>-m {job.algorithmId}</small>
                  </span>
                  <span>{formatNumber(job.leftHashes)} / {formatNumber(job.totalHashes)}</span>
                  <span>{formatNumber(job.foundHashes)}</span>
                  <span>
                    <strong>{job.pricePerHash} {job.currency}</strong>
                    <small>${job.pricePerHashUsd} each / ${rewardUsd(job).toFixed(2)} est.</small>
                  </span>
                  <span>{job.lastUpdate || job.createdAt}</span>
                  <span style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => pullHashes(job)}
                      disabled={!job.leftList || pullingJob === job.id}
                      title="Save unfound hash list"
                    >
                      {pullingJob === job.id ? <span className="spinner" /> : <Download size={14} />}
                      {pullingJob === job.id ? 'Pulling…' : 'Pull Hashes'}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => startEscrowTask(job)}
                      disabled={!job.leftList || startingJob === job.id}
                      title="Pull hashes and immediately start a task with this hash mode"
                    >
                      {startingJob === job.id ? <span className="spinner" /> : <Play size={14} />}
                      {startingJob === job.id ? 'Starting…' : 'Start Task'}
                    </button>
                  </span>
                </div>
              ))}
              {visibleJobs.length === 0 && (
                <div className="escrow-empty-filter">No jobs match the current filters.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? value.toLocaleString() : '0';
}

function rewardUsd(job: EscrowJob) {
  const perHash = parseFloat(job.pricePerHashUsd || '0');
  const cracksNeeded = job.maxCracksNeeded || job.leftHashes || 0;
  return Number.isFinite(perHash) ? perHash * cracksNeeded : 0;
}

function dateValue(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

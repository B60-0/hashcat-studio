import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gauge, RefreshCw } from 'lucide-react';
import { GetDevices, RunBenchmark } from '../../wailsjs/go/main/App';

export const Devices = () => {
  const [deviceOutput, setDeviceOutput] = useState('');
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [benchmarkMode, setBenchmarkMode] = useState('0');
  const [benchmarkOutput, setBenchmarkOutput] = useState('');
  const [running, setRunning] = useState(false);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      if (window.go?.main?.App) {
        setDeviceOutput(await GetDevices());
      } else {
        await new Promise(r => setTimeout(r, 600));
        setDeviceOutput(
          "hashcat (v6.2.6) starting in backend info mode...\n\n" +
          "CUDA API (CUDA 12.1)\n====================\n" +
          "* Device #1: NVIDIA GeForce RTX 3080, 10000/10240 MB, 68MCU\n\n" +
          "OpenCL API (OpenCL 3.0 CUDA 12.1.105)\n======================================\n" +
          "* Device #2: NVIDIA GeForce RTX 3080, skipped"
        );
      }
    } catch (err: unknown) {
      setDeviceOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoadingDevices(false);
  };

  useEffect(() => { fetchDevices(); }, []);

  const runBenchmark = async () => {
    const mode = parseInt(benchmarkMode, 10);
    if (isNaN(mode)) return;
    setRunning(true);
    setBenchmarkOutput('');
    try {
      if (window.go?.main?.App) {
        setBenchmarkOutput(await RunBenchmark(mode));
      } else {
        await new Promise(r => setTimeout(r, 1200));
        setBenchmarkOutput(
          "hashcat (v6.2.6) starting in benchmark mode...\n\n" +
          "* Device #1: NVIDIA GeForce RTX 3080\n" +
          "Hashmode: 0 - MD5\n" +
          "Speed.#1.........:  62157.1 MH/s (51.88ms) @ Accel:256 Loops:1024 Thr:256 Vec:8"
        );
      }
    } catch (err: unknown) {
      setBenchmarkOutput(`Benchmark failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    setRunning(false);
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
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">OpenCL and CUDA hardware backends.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDevices} disabled={loadingDevices}>
          {loadingDevices ? <span className="spinner" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Detected Devices */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={16} style={{ color: 'var(--accent)' }} />
            <span className="section-title" style={{ margin: 0 }}>Detected Devices</span>
          </div>
          {loadingDevices ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" /> Querying hashcat…
            </div>
          ) : (
            <pre className="terminal" style={{ minHeight: '200px' }}>
              {deviceOutput || "No devices detected."}
            </pre>
          )}
        </div>

        {/* Benchmark */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Gauge size={16} style={{ color: 'var(--yellow)' }} />
            <span className="section-title" style={{ margin: 0 }}>Benchmark</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.875rem', fontSize: '0.8125rem' }}>
            Test hashing speed for a specific algorithm mode.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Hash Mode (-m)</label>
              <input className="form-input" type="text" value={benchmarkMode} onChange={e => setBenchmarkMode(e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-primary" onClick={runBenchmark} disabled={running}>
                {running ? <span className="spinner" /> : <Gauge size={14} />}
                {running ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          {benchmarkOutput && (
            <motion.pre
              className="terminal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {benchmarkOutput}
            </motion.pre>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gauge, RefreshCw } from 'lucide-react';
import { GetDevices, RunBenchmarkWithOptions } from '../../wailsjs/go/main/App';
import { formatDeviceLabel, OPENCL_DEVICE_TYPES, parseHashcatDevices } from '../lib/hashcatDevices';
import type { HashcatDevice } from '../lib/hashcatDevices';

export const Devices = () => {
  const [deviceOutput, setDeviceOutput] = useState('');
  const [devices, setDevices] = useState<HashcatDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [benchmarkMode, setBenchmarkMode] = useState('0');
  const [benchmarkOutput, setBenchmarkOutput] = useState('');
  const [selectedDeviceIDs, setSelectedDeviceIDs] = useState<number[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState(0);
  const [runningKey, setRunningKey] = useState('');

  const selectedDeviceLabel = useMemo(() => {
    if (selectedDeviceIDs.length === 0) return 'All detected devices';
    return selectedDeviceIDs.map(id => `#${id}`).join(', ');
  }, [selectedDeviceIDs]);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      let output = '';
      if (window.go?.main?.App) {
        output = await GetDevices();
      } else {
        await new Promise(r => setTimeout(r, 600));
        output =
          "CUDA API (CUDA 12.1)\n====================\n" +
          "* Device #1: NVIDIA GeForce RTX 3080, 10000/10240 MB, 68MCU\n\n" +
          "OpenCL API (OpenCL 3.0 CUDA 12.1.105)\n======================================\n" +
          "* Device #2: Intel Core i9 CPU, 16000/32000 MB";
      }
      setDeviceOutput(output);
      setDevices(parseHashcatDevices(output));
    } catch (err: unknown) {
      setDeviceOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setDevices([]);
    }
    setLoadingDevices(false);
  };

  useEffect(() => { fetchDevices(); }, []);

  const toggleDevice = (id: number) => {
    setSelectedDeviceIDs(prev => prev.includes(id) ? prev.filter(deviceId => deviceId !== id) : [...prev, id]);
  };

  const runBenchmark = async (deviceIDs = selectedDeviceIDs, key = 'selected') => {
    const mode = parseInt(benchmarkMode, 10);
    if (isNaN(mode)) return;

    const deviceTypes = selectedDeviceType === 0 ? [] : [selectedDeviceType];
    setRunningKey(key);
    setBenchmarkOutput('');
    try {
      if (window.go?.main?.App) {
        setBenchmarkOutput(await RunBenchmarkWithOptions(mode, { deviceIDs, deviceTypes }));
      } else {
        await new Promise(r => setTimeout(r, 900));
        const flags = [
          deviceIDs.length > 0 ? `-d ${deviceIDs.join(',')}` : '',
          deviceTypes.length > 0 ? `-D ${deviceTypes.join(',')}` : '',
        ].filter(Boolean).join(' ');
        setBenchmarkOutput(
          "hashcat (v7.1.2) starting in benchmark mode...\n\n" +
          `Hashmode: ${mode}\n` +
          `Hardware: ${flags || 'all detected devices'}\n` +
          "Speed.#1.........:  62157.1 MH/s (51.88ms) @ Accel:256 Loops:1024 Thr:256 Vec:8"
        );
      }
    } catch (err: unknown) {
      setBenchmarkOutput(`Benchmark failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    setRunningKey('');
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
          <p className="page-subtitle">OpenCL, CUDA, HIP, and Metal hardware backends.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDevices} disabled={loadingDevices}>
          {loadingDevices ? <span className="spinner" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div className="devices-layout">
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={16} style={{ color: 'var(--accent)' }} />
            <span className="section-title" style={{ margin: 0 }}>Detected Devices</span>
          </div>
          {loadingDevices ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" /> Querying hashcat...
            </div>
          ) : (
            <>
              <div className="hardware-device-list" style={{ marginBottom: '0.875rem' }}>
                {devices.length > 0 ? devices.map(device => (
                  <label key={device.id} className="hardware-device-option">
                    <input
                      type="checkbox"
                      checked={selectedDeviceIDs.includes(device.id)}
                      onChange={() => toggleDevice(device.id)}
                    />
                    <span className="hardware-device-main">
                      <span>{formatDeviceLabel(device)}</span>
                      <span className="hardware-device-meta">
                        {device.backend} / {device.type}{device.memory ? ` / ${device.memory}` : ''}
                      </span>
                    </span>
                  </label>
                )) : (
                  <div className="hardware-device-empty">No parsed devices.</div>
                )}
              </div>
              <pre className="terminal" style={{ minHeight: '200px' }}>
                {deviceOutput || "No devices detected."}
              </pre>
            </>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Gauge size={16} style={{ color: 'var(--yellow)' }} />
            <span className="section-title" style={{ margin: 0 }}>Benchmark</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Hash Mode (-m)</label>
              <input className="form-input" type="text" value={benchmarkMode} onChange={e => setBenchmarkMode(e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Device Type (-D)</label>
              <select className="form-select" value={selectedDeviceType} onChange={e => setSelectedDeviceType(parseInt(e.target.value, 10))}>
                {OPENCL_DEVICE_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="benchmark-actions">
            <button className="btn-primary" onClick={() => runBenchmark()} disabled={!!runningKey}>
              {runningKey === 'selected' ? <span className="spinner" /> : <Gauge size={14} />}
              Run Selected
            </button>
            <button className="btn btn-ghost" onClick={() => runBenchmark([], 'all')} disabled={!!runningKey}>
              {runningKey === 'all' ? <span className="spinner" /> : <Cpu size={14} />}
              Run All
            </button>
          </div>

          <div className="hardware-selection-summary">
            <span>Device IDs</span>
            <strong>{selectedDeviceLabel}</strong>
          </div>

          {devices.length > 0 && (
            <div className="per-device-benchmarks">
              {devices.map(device => (
                <button
                  key={device.id}
                  className="btn btn-ghost"
                  onClick={() => runBenchmark([device.id], `device-${device.id}`)}
                  disabled={!!runningKey}
                >
                  {runningKey === `device-${device.id}` ? <span className="spinner" /> : <Gauge size={14} />}
                  #{device.id}
                </button>
              ))}
            </div>
          )}

          {benchmarkOutput && (
            <motion.pre
              className="terminal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginTop: '0.875rem' }}
            >
              {benchmarkOutput}
            </motion.pre>
          )}
        </div>
      </div>
    </motion.div>
  );
};

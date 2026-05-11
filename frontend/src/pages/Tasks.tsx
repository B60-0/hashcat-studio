import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, Save, Square, Trash2, Terminal, Inbox } from 'lucide-react';
import { DeleteTask, ListTasks, PauseTask, QuitTask, ResumeTask, SkipTask, StartTask, CheckpointTask } from '../../wailsjs/go/main/App';
import { EventsOff, EventsOn } from '../../wailsjs/runtime/runtime';

interface TaskInfo {
  id: string;
  arguments: string[];
  state: string;
  created_at: number;
}

interface UpdateEvent {
  task_id: string;
  status: {
    progress?: number[];
    recovered_hashes?: number[];
    time_start_absolute?: number;
  };
  state: string;
  timestamp: number;
}

interface LogEvent {
  task_id: string;
  source: string;
  message: string;
}

const STATE_BADGE: Record<string, string> = {
  'Running': 'badge-running',
  'Paused': 'badge-paused',
  'Finished': 'badge-finished',
  'Failed': 'badge-failed',
  'Quit': 'badge-quit',
  'Not Started': 'badge-idle',
};

export const Tasks = () => {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [updates, setUpdates] = useState<Record<string, UpdateEvent>>({});
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchTasks = useCallback(async () => {
    try {
      if (window.go?.main?.App) {
        const t = await ListTasks();
        setTasks(t || []);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, selectedId]);

  useEffect(() => {
    fetchTasks();
    if (window.runtime?.EventsOn) {
      EventsOn('task:log', (e: LogEvent) => {
        setLogs(prev => ({
          ...prev,
          [e.task_id]: [...(prev[e.task_id] || []), `[${e.source}] ${e.message}`],
        }));
      });
      EventsOn('task:updated', (e: UpdateEvent) => {
        setUpdates(prev => ({ ...prev, [e.task_id]: e }));
        fetchTasks();
      });
      EventsOn('task:info', fetchTasks);
      EventsOn('task:created', fetchTasks);
      EventsOn('task:deleted', fetchTasks);
    }
    return () => {
      if (window.runtime?.EventsOff) {
        ['task:log', 'task:updated', 'task:info', 'task:created', 'task:deleted'].forEach(e => EventsOff(e));
      }
    };
  }, [fetchTasks]);

  const activeTask = tasks.find(t => t.id === selectedId);
  const activeUpdate = selectedId ? updates[selectedId] : null;
  const activeLogs = selectedId ? (logs[selectedId] || []) : [];

  const act = async (action: string) => {
    if (!selectedId) return;
    if (!window.go?.main?.App) return;
    try {
      const fn: Record<string, () => Promise<void>> = {
        start: () => StartTask(selectedId),
        pause: () => PauseTask(selectedId),
        resume: () => ResumeTask(selectedId),
        skip: () => SkipTask(selectedId),
        checkpoint: () => CheckpointTask(selectedId),
        quit: () => QuitTask(selectedId),
        delete: async () => { await DeleteTask(selectedId); setSelectedId(null); },
      };
      await fn[action]?.();
    } catch (err) { console.error(err); }
  };

  const progress = (() => {
    const p = activeUpdate?.status?.progress;
    if (!p || p.length < 2 || p[1] === 0) return 0;
    return Math.min(100, Math.round((p[0] / p[1]) * 10000) / 100);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <h1 className="page-title">Tasks</h1>
      <p className="page-subtitle">Monitor and control active Hashcat sessions.</p>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Task List */}
        <div className="glass-card" style={{ width: '220px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="section-title">Queue</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon"><Inbox size={22} /></div>
                <div className="empty-state-desc">No tasks yet. Create one from New Task.</div>
              </div>
            ) : tasks.map(t => (
              <motion.div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: selectedId === t.id ? 'var(--accent-muted)' : 'transparent',
                  border: `1px solid ${selectedId === t.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}`,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: selectedId === t.id ? 'var(--accent-hover)' : 'var(--text-primary)' }}>{t.id}</div>
                <span className={`badge ${STATE_BADGE[t.state] || 'badge-idle'}`} style={{ marginTop: '0.25rem' }}>{t.state}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTask ? (
            <>
              {/* Header */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem', marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{activeTask.id}</h2>
                  <span className={`badge ${STATE_BADGE[activeTask.state] || 'badge-idle'}`}>{activeTask.state}</span>
                </div>

                {/* Progress Bar */}
                {(activeTask.state === 'Running' || activeTask.state === 'Paused') && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Stats */}
                {activeUpdate?.status && (
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div className="stat">
                      <span className="stat-label">Recovered</span>
                      <span className="stat-value">{activeUpdate.status.recovered_hashes?.[0] ?? 0}/{activeUpdate.status.recovered_hashes?.[1] ?? 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Started</span>
                      <span className="stat-value">{activeUpdate.status.time_start_absolute ? new Date(activeUpdate.status.time_start_absolute * 1000).toLocaleTimeString() : '—'}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Progress</span>
                      <span className="stat-value">{progress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {activeTask.state === 'Not Started' && <button className="btn btn-success" onClick={() => act('start')}><Play size={14} /> Start</button>}
                {activeTask.state === 'Running' && <button className="btn btn-warning" onClick={() => act('pause')}><Pause size={14} /> Pause</button>}
                {activeTask.state === 'Paused' && <button className="btn btn-success" onClick={() => act('resume')}><Play size={14} /> Resume</button>}
                {activeTask.state === 'Running' && <button className="btn btn-ghost" onClick={() => act('skip')}><SkipForward size={14} /> Skip</button>}
                {activeTask.state === 'Running' && <button className="btn btn-ghost" onClick={() => act('checkpoint')}><Save size={14} /> Checkpoint</button>}
                {(activeTask.state === 'Running' || activeTask.state === 'Paused') && <button className="btn btn-danger" onClick={() => act('quit')}><Square size={14} /> Stop</button>}
                {['Finished', 'Quit', 'Failed', 'Not Started'].includes(activeTask.state) && <button className="btn btn-danger" onClick={() => act('delete')}><Trash2 size={14} /> Delete</button>}
              </div>

              {/* Log Terminal */}
              <div className="terminal" style={{ flex: 1 }}>
                {activeLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Terminal size={14} /> Waiting for output…
                  </div>
                ) : activeLogs.map((log, i) => (
                  <div key={i} className={`log-line ${log.includes('[stderr]') ? 'log-stderr' : 'log-stdout'}`}>{log}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon"><Terminal size={22} /></div>
              <div className="empty-state-title">No task selected</div>
              <div className="empty-state-desc">Select a task from the queue to view its details and logs.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

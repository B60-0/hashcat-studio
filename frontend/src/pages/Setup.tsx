import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { Check, Download, Loader2, Terminal } from 'lucide-react';
import logo from '../assets/hashcat-logo.png';
import {
  SelectHashcatDirectory,
  StartHashcatDownload,
} from '../../wailsjs/go/main/App';
import { EventsOff, EventsOn } from '../../wailsjs/runtime/runtime';

interface SetupState {
  required: boolean;
  running: boolean;
  hashcatBinaryPath: string;
  hashcatInstallDir: string;
  valid: boolean;
  version: string;
  error: string;
}

interface SetupProgress {
  percent: number;
  step: string;
  message: string;
  log: string;
  finished: boolean;
  error: string;
  hashcatBinaryPath: string;
}

type SetupStage = 'welcome' | 'choose' | 'installing' | 'done';

interface SetupProps {
  initialState: SetupState | null;
  onComplete: () => void;
}

const MOCK_LOGS = [
  'Windows PowerShell',
  'Copyright (C) Microsoft Corporation. All rights reserved.',
  'PS C:\\Users\\Admin> hashcat-studio setup',
  '[start] Preparing Hashcat Studio',
  '[download] Waiting for installer...',
];

const setupMorphTransition: Transition = {
  layout: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  opacity: { duration: 0.18, ease: 'easeOut' },
};

export const Setup = ({ initialState, onComplete }: SetupProps) => {
  const [stage, setStage] = useState<SetupStage>(initialState?.running ? 'installing' : 'welcome');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [progress, setProgress] = useState<SetupProgress>({
    percent: initialState?.running ? 8 : 0,
    step: 'Ready',
    message: 'Choose how you want to connect Hashcat.',
    log: '',
    finished: false,
    error: '',
    hashcatBinaryPath: initialState?.hashcatBinaryPath || '',
  });
  const [logs, setLogs] = useState<string[]>(MOCK_LOGS);
  const [error, setError] = useState<string | null>(initialState?.error || null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const terminalLines = useMemo(() => logs.slice(-80), [logs]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    if (!window.runtime?.EventsOn || !window.runtime?.EventsOff) return;

    EventsOn('setup:progress', (event: SetupProgress) => {
      setStage(event.finished ? 'done' : 'installing');
      setProgress(event);
      if (event.log) {
        setLogs(prev => [...prev, event.log]);
      }
      if (event.error) {
        setError(event.error);
      }
      if (event.finished) {
        setTimeout(onComplete, 900);
      }
    });

    return () => {
      EventsOff('setup:progress');
    };
  }, [onComplete]);

  const finishWithExisting = async () => {
    setError(null);
    setBusyAction('directory');
    try {
      const state = await SelectHashcatDirectory();

      if (state.valid) {
        setProgress({
          percent: 100,
          step: 'Ready',
          message: `Using ${state.version}`,
          log: `[done] ${state.hashcatBinaryPath}`,
          finished: true,
          error: '',
          hashcatBinaryPath: state.hashcatBinaryPath,
        });
        setStage('done');
        setTimeout(onComplete, 650);
      } else if (state.error) {
        setError(state.error);
      }
      // No error and not valid → user cancelled the folder picker. Stay on the choice screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  };

  const startDownload = async () => {
    setError(null);
    setLogs([
      platformPrompt(),
      '$ hashcat-studio setup --download-hashcat',
      '[start] Preparing installer workspace',
    ]);
    setProgress({
      percent: 2,
      step: 'Starting setup',
      message: 'Preparing to download Hashcat.',
      log: '[start] Preparing installer workspace',
      finished: false,
      error: '',
      hashcatBinaryPath: '',
    });
    setStage('installing');
    setBusyAction('download');
    try {
      await StartHashcatDownload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusyAction(null);
    }
  };

  return (
    <div className="setup-shell">
      <div className="setup-terminal-layer" ref={terminalRef}>
        {terminalLines.map((line, index) => (
          <div key={`${line}-${index}`}>{line}</div>
        ))}
      </div>
      <div className="setup-vignette" />

      <div className="setup-language">ENGLISH</div>

      <AnimatePresence mode="wait">
        {(stage === 'welcome' || stage === 'choose') && (
          <motion.div
            key="onboarding"
            layout
            className={`setup-center setup-onboarding ${stage === 'choose' ? 'setup-choice-panel' : ''}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={setupMorphTransition}
          >
            <motion.img
              layout
              className={`setup-logo ${stage === 'welcome' ? 'setup-logo-large' : ''}`}
              src={logo}
              alt="Hashcat Studio"
              transition={setupMorphTransition}
            />

            <div className="setup-onboarding-content">
              <AnimatePresence initial={false} mode="popLayout">
                {stage === 'welcome' ? (
                  <motion.button
                    key="get-started"
                    layoutId="setup-primary-action"
                    className="setup-primary"
                    onClick={() => setStage('choose')}
                    transition={setupMorphTransition}
                  >
                    Get Started
                  </motion.button>
                ) : (
                  <motion.div
                    key="choose-content"
                    layout
                    className="setup-choice-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={setupMorphTransition}
                  >
                    <motion.h1 layout>Set up Hashcat</motion.h1>
                    <motion.p layout>
                      Download the latest official Hashcat release and let Hashcat Studio configure it for you.
                    </motion.p>

                    <motion.div layout className="setup-actions">
                      <motion.button
                        layoutId="setup-primary-action"
                        className="setup-action setup-action-main"
                        onClick={startDownload}
                        disabled={!!busyAction}
                        transition={setupMorphTransition}
                      >
                        {busyAction === 'download' ? <Loader2 className="spinning" size={18} /> : <Download size={18} />}
                        Download Hashcat
                      </motion.button>
                      <motion.button
                        layout
                        className="setup-link-button"
                        onClick={finishWithExisting}
                        disabled={!!busyAction}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.18 }}
                      >
                        {busyAction === 'directory' ? 'Opening folder picker...' : 'Point to an already installed Hashcat folder'}
                      </motion.button>
                    </motion.div>

                    {error && <div className="setup-error">{error}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {(stage === 'installing' || stage === 'done') && (
          <motion.div
            key="installing"
            className="setup-center setup-installing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <img className="setup-logo setup-logo-large" src={logo} alt="Hashcat Studio" />
            <div className="setup-progress-track">
              <div className="setup-progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <h1>{stage === 'done' ? 'Hashcat Ready' : progress.step}</h1>
            <p>{progress.message}</p>
            {stage === 'done' && <div className="setup-ready"><Check size={15} /> Opening Hashcat Studio</div>}
            {error && <div className="setup-error">{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="setup-terminal-pill">
        <Terminal size={14} />
        Live setup output
      </div>
    </div>
  );
};

function platformPrompt() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('win')) return 'Windows PowerShell';
  if (platform.includes('mac')) return 'zsh';
  return 'bash';
}

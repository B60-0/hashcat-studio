import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { NewTask } from "./pages/NewTask";
import { Tasks } from "./pages/Tasks";
import { Files } from "./pages/Files";
import { Devices } from "./pages/Devices";
import { Settings } from "./pages/Settings";
import { Setup } from "./pages/Setup";
import { Escrow } from "./pages/Escrow";
import { AnimatePresence } from "framer-motion";
import { GetSettings, GetSetupState } from "../wailsjs/go/main/App";
import { useTheme, type Theme } from "./theme";

interface SetupState {
  required: boolean;
  running: boolean;
  hashcatBinaryPath: string;
  hashcatInstallDir: string;
  valid: boolean;
  version: string;
  error: string;
}

const PAGE_TITLES: Record<string, string> = {
  "new-task": "Hashcat Studio",
  tasks: "Tasks",
  files: "Files",
  escrow: "Escrow",
  devices: "Devices",
  settings: "Settings",
};

const PAGE_SUBTITLES: Record<string, string> = {
  "new-task": "A simple desktop GUI for authorized Hashcat sessions",
  tasks: "Monitor and control active Hashcat sessions",
  files: "Browse hashes, wordlists, rules, and masks",
  escrow: "Pull jobs from hashes.com escrow",
  devices: "OpenCL and CUDA backends",
  settings: "Configure Hashcat binary, asset folders, and appearance",
};

function App() {
  const [activePage, setActivePage] = useState("new-task");
  const [setupState, setSetupState] = useState<SetupState | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const { setTheme } = useTheme();

  const refreshSetupState = useCallback(async () => {
    try {
      if (window.go?.main?.App) {
        const [state, settings] = await Promise.all([GetSetupState(), GetSettings()]);
        setSetupState(state);
        if (settings?.theme === "light" || settings?.theme === "dark") {
          setTheme(settings.theme as Theme);
        }
      } else {
        const mockApp = new URLSearchParams(window.location.search).has("mockApp");
        setSetupState({ required: !mockApp, running: false, hashcatBinaryPath: "mock/hashcat", hashcatInstallDir: "", valid: mockApp, version: mockApp ? "hashcat v7.1.2 (mock)" : "", error: "" });
      }
    } catch (err) {
      console.error(err);
      setSetupState({ required: true, running: false, hashcatBinaryPath: "", hashcatInstallDir: "", valid: false, version: "", error: "Setup state could not be loaded" });
    } finally {
      setSetupLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    refreshSetupState();
  }, [refreshSetupState]);

  const renderContent = () => {
    switch (activePage) {
      case "new-task":
        return <NewTask key="new-task" />;
      case "tasks":
        return <Tasks key="tasks" />;
      case "files":
        return <Files key="files" />;
      case "escrow":
        return <Escrow key="escrow" />;
      case "devices":
        return <Devices key="devices" />;
      case "settings":
        return <Settings key="settings" />;
      default:
        return <NewTask key="default" />;
    }
  };

  if (setupLoading) {
    return (
      <div className="app-loading">
        <span className="spinner" />
        Loading Hashcat Studio...
      </div>
    );
  }

  if (setupState?.required) {
    return <Setup initialState={setupState} onComplete={refreshSetupState} />;
  }

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <span className="topbar-title">{PAGE_TITLES[activePage] ?? "Hashcat Studio"}</span>
            <span className="topbar-subtitle">{PAGE_SUBTITLES[activePage] ?? ""}</span>
          </div>
          <div className="topbar-actions">
            {setupState?.version && (
              <span className="topbar-version" title={setupState.hashcatBinaryPath}>
                {setupState.version.split("\n")[0]}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

export default App;

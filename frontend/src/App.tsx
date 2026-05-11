import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { NewTask } from "./pages/NewTask";
import { Tasks } from "./pages/Tasks";
import { Files } from "./pages/Files";
import { Devices } from "./pages/Devices";
import { Settings } from "./pages/Settings";
import { Setup } from "./pages/Setup";
import { AnimatePresence } from "framer-motion";
import { GetSetupState } from "../wailsjs/go/main/App";

interface SetupState {
  required: boolean;
  running: boolean;
  hashcatBinaryPath: string;
  hashcatInstallDir: string;
  valid: boolean;
  version: string;
  error: string;
}

function App() {
  const [activePage, setActivePage] = useState("new-task");
  const [setupState, setSetupState] = useState<SetupState | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);

  const refreshSetupState = useCallback(async () => {
    try {
      if (window.go?.main?.App) {
        setSetupState(await GetSetupState());
      } else {
        setSetupState({ required: true, running: false, hashcatBinaryPath: "", hashcatInstallDir: "", valid: false, version: "", error: "" });
      }
    } catch (err) {
      console.error(err);
      setSetupState({ required: true, running: false, hashcatBinaryPath: "", hashcatInstallDir: "", valid: false, version: "", error: "Setup state could not be loaded" });
    } finally {
      setSetupLoading(false);
    }
  }, []);

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
            <span className="topbar-title">Hashcat Studio</span>
            <span className="topbar-subtitle">A simple desktop GUI for authorized Hashcat sessions</span>
          </div>
        </div>
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

export default App;

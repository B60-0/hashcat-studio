import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { NewTask } from "./pages/NewTask";
import { Tasks } from "./pages/Tasks";
import { Files } from "./pages/Files";
import { Devices } from "./pages/Devices";
import { Settings } from "./pages/Settings";
import { AnimatePresence } from "framer-motion";

function App() {
  const [activePage, setActivePage] = useState("new-task");

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

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

export default App;

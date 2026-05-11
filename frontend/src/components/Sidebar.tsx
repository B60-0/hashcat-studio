import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Cpu,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const navItems = [
  { id: "new-task", label: "New Task", icon: PlusCircle },
  { id: "tasks", label: "Tasks", icon: LayoutDashboard },
  { id: "files", label: "Files", icon: FileText },
  { id: "devices", label: "Devices", icon: Cpu },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
}) => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">#</div>
        <span>Hashcat GUI</span>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <motion.div
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
              whileTap={{ scale: 0.97 }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
};

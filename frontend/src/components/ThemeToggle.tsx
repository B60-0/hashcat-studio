import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { UpdateSettings, GetSettings } from "../../wailsjs/go/main/App";
import { useTheme, type Theme } from "../theme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [changing, setChanging] = useState(false);

  const choose = async (next: Theme) => {
    if (next === theme) return;
    setChanging(true);
    setTheme(next);
    window.setTimeout(() => setChanging(false), 650);
    if (window.go?.main?.App) {
      try {
        const current = await GetSettings();
        await UpdateSettings({ ...current, theme: next });
      } catch (err) {
        console.error("Failed to persist theme", err);
      }
    }
  };

  return (
    <>
      {changing && <div className="theme-switch-progress" />}
      <div className={changing ? "theme-toggle changing" : "theme-toggle"} role="group" aria-label="Theme">
        <button
          type="button"
          className={theme === "dark" ? "active" : ""}
          onClick={() => choose("dark")}
          aria-label="Dark theme"
          title="Dark theme"
        >
          <Moon size={14} />
        </button>
        <button
          type="button"
          className={theme === "light" ? "active" : ""}
          onClick={() => choose("light")}
          aria-label="Light theme"
          title="Light theme"
        >
          <Sun size={14} />
        </button>
      </div>
    </>
  );
};

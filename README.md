# Hashcat GUI

A modern, high-performance, cross-platform desktop application for managing Hashcat cracking sessions. Built with **Go**, **React**, and **Wails**, this application provides a secure, interactive interface to configure attacks, manage wordlists, and monitor live cracking progress.

![Hashcat GUI](frontend/src/assets/images/app-preview.png) *(Preview placeholder)*

## ✨ Features

- **Dynamic Task Dashboard:** Real-time monitoring of active tasks with live progress bars, recovered hash counts, and streamed terminal logs.
- **Visual Hardware Management:** Automatically detects OpenCL/CUDA devices and runs visual benchmarks straight from the interface.
- **Secure Subprocess Execution:** Built with security in mind. Uses exact string slices via `os/exec`—eliminating command injection vulnerabilities.
- **Modern UI/UX:** A stunning, responsive dark mode interface powered by React, Framer Motion, and Lucide React.
- **Asset Auto-Discovery:** Configure your paths once, and the app will automatically scan for new `.txt`, `.rule`, `.hash`, and `.hcmask` files.

---

## 🛠 Prerequisites

Before running or building the project, ensure you have the following installed on your system:

1. **[Go](https://go.dev/dl/)** (1.20+)
2. **[Node.js](https://nodejs.org/)** (18+)
3. **[Wails CLI](https://wails.io/docs/gettingstarted/installation)** 
   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```
4. **[Hashcat](https://hashcat.net/hashcat/)** (Must be installed and accessible, e.g., via `brew install hashcat` on macOS, or in your system PATH).

---

## 🚀 Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd hashcat-gui
   ```

2. **Run in Development Mode**
   Start the application with live-reloading enabled. The backend will recompile on Go changes, and the React frontend will hot-reload on UI changes.
   ```bash
   wails dev
   ```

3. **Configure the App**
   On the first launch, go to the **Settings** page:
   - Point the Hashcat Binary Path to your installation (e.g., `/usr/local/bin/hashcat` or `/opt/homebrew/bin/hashcat`).
   - Define the directories where you store your hashes, wordlists, rules, and masks.

---

## 📦 Building for Production

To compile a standalone, native executable for your operating system:

```bash
wails build
```

The compiled binary will be placed in the `build/bin/` directory.

- *Optional:* To build a cleaner, compressed binary without the console attached (on Windows/macOS):
  ```bash
  wails build -upx -trimpath -ldflags "-s -w"
  ```

---

## 🏗 Architecture Overview

- **Backend (`/internal`)**: Written in Go. Manages persistent configurations, securely spawns and tracks Hashcat processes, and scans the local filesystem for dictionaries/masks.
- **Frontend (`/frontend`)**: Written in React + TypeScript, bundled with Vite. Communicates seamlessly with the Go backend via Wails' auto-generated bindings.
- **Security**: The UI never constructs raw shell commands. All parameters are validated and passed as discrete slices to the backend runner.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

*(Note: Hashcat itself is licensed under the MIT License and must be installed separately by the user. This GUI is a third-party wrapper and is not officially affiliated with the Hashcat project.)*

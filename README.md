# Hashcat Studio

Hashcat Studio is a simple desktop interface for running authorized Hashcat sessions. It gives you a clean way to choose a Hashcat binary, organize hashes and wordlists, build dictionary or mask attacks, preview the command, and monitor task output without living in a terminal.

It does not bundle Hashcat. You install Hashcat separately, then point the app to your local binary.

> Use this only for systems, hashes, and audits you are allowed to test.

## Features

- Dictionary and mask attack setup
- Hashcat command preview before launch
- Task list with live stdout/stderr logs
- Pause, resume, checkpoint, skip, and quit controls
- Asset folders for hashes, dictionaries, rules, masks, and outputs
- Hashcat binary validation and algorithm loading
- Device info via `hashcat -I`
- Benchmarks by hash mode
- Cross-platform desktop build with Wails

## Install

Download the latest release for your OS from the GitHub Releases page.

### macOS

1. Install Hashcat:
   ```bash
   brew install hashcat
   ```
2. Download the macOS release archive.
3. Open Hashcat Studio.
4. In Settings, set the Hashcat binary path. Apple Silicon Homebrew usually installs it at:
   ```text
   /opt/homebrew/bin/hashcat
   ```

### Windows

1. Install Hashcat from [hashcat.net](https://hashcat.net/hashcat/).
2. Download the Windows release archive.
3. Run `hashcat-studio.exe`.
4. In Settings, set the path to `hashcat.exe`.

### Linux

1. Install Hashcat with your package manager or from [hashcat.net](https://hashcat.net/hashcat/).
2. Download the Linux release archive.
3. Make the binary executable if needed:
   ```bash
   chmod +x hashcat-studio
   ```
4. Run it and set the Hashcat binary path in Settings.

## Build From Source

Requirements:

- Go 1.22+
- Node.js 20+
- Wails CLI
- Hashcat

Install Wails:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
```

Build:

```bash
npm --prefix frontend install
npm --prefix frontend run build
go test ./internal/...
wails build
```

The desktop binary is written to `build/bin/`.

## Development

```bash
npm --prefix frontend install
wails dev
```

Useful checks:

```bash
go test ./internal/...
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Project Layout

```text
internal/hashcat   Hashcat argument building and binary helpers
internal/tasks     task manager and subprocess streaming
internal/assets    asset folder scanner
internal/settings  app settings and folders
frontend/src       React UI
docs/wiki          GitHub wiki source pages
```

## License

MIT. See [LICENSE](LICENSE).

Hashcat Studio is not affiliated with the Hashcat project. Hashcat is installed separately by the user.

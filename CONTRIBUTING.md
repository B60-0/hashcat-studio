# Contributing

Thanks for helping improve Hashcat Studio.

## Local Setup

```bash
npm --prefix frontend install
go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
wails dev
```

## Before Opening A PR

Run:

```bash
go test ./internal/...
npm --prefix frontend run lint
npm --prefix frontend run build
```

Keep changes focused. If you are adding a new Hashcat option, include a backend argument-builder test and a small UI validation path.

## Responsible Use

This project is for authorized password recovery and security testing. Do not add features intended to hide misuse, bypass authorization, or run without clear user intent.

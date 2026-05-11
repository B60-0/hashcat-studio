# Changelog

## 0.2.0

First-run setup and README refresh.

- Added a first-run setup flow with a centered logo, progress bar, status text, and live terminal-style output.
- Added one-click Hashcat download from the latest official Hashcat release.
- Added existing Hashcat folder selection for users who already have Hashcat installed.
- Added setup validation so the app opens only after Hashcat is configured.
- Simplified the setup choice screen to one primary Download Hashcat button and one subtle existing-install link.
- Refreshed README presentation with logo, badges, preview graphic, spacing, and easier install instructions.
- Updated wiki install and first-run docs for the new setup flow.

## 0.1.0

Initial public release.

- Added a Wails desktop shell with a React and TypeScript frontend.
- Added Hashcat binary validation, algorithm loading, device info, and benchmark helpers.
- Added dictionary and mask task setup with command preview.
- Added task creation, live log streaming, status parsing, and task controls.
- Added settings and asset folder scanning.
- Added a simple black and white interface with Hashcat-style branding.
- Added GitHub Actions for CI and release builds.

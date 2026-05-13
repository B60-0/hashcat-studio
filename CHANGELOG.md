# Changelog

## 0.4.2

Hardware selection and targeted benchmarks.

- Added parsed hardware cards on the Devices page from `hashcat -I` output.
- Added CPU/GPU type filtering and exact device ID selection for benchmarks.
- Added per-device benchmark buttons for quickly comparing hardware performance.
- Added a Hardware section to guided task creation so tasks can target selected devices without raw flags.
- Added benchmark argument tests and regenerated Wails bindings for the new benchmark options.

## 0.4.1

Hashcat argument coverage and QA fixes.

- Added Raw Arguments mode so pasted `hashcat ...` commands and direct flags run through the app without a shell.
- Added shell-style parsing for quoted paths, escaped spaces, and full `hashcat` command prefixes.
- Added an Advanced Hashcat Flags field to guided tasks for extra options.
- Added tests for raw argument parsing and task lifecycle controls.
- Added a browser-only mock-app mode for QA of every page outside Wails.

## 0.4.0

Hashes.com escrow integration.

- Added an Escrow option in Settings with a hashes.com API key field.
- Added a Hashes.com Escrow page that loads public jobs, or account jobs when an API key is saved.
- Added a Pull Hashes action that saves a job's unfound list into the configured hashes directory.
- Added backend parsing and tests for hashes.com's escrow jobs API.
- Fixed the setup screen so it still renders when opened in browser-based development mode.

## 0.3.1

First-run setup motion polish.

- Changed the Get Started transition so the logo smoothly resizes and moves into its setup position instead of the whole welcome screen fading upward.
- Morphed the Get Started button into the Download Hashcat button while the secondary existing-install option appears smoothly beneath it.

## 0.3.0

Dark theme by default, a polished macOS installer, and a few bug fixes.

- Added a full dark theme and made it the default; light theme is still available via a topbar toggle or the Appearance card in Settings.
- Persisted the theme choice in both `localStorage` and the app settings file so it survives restarts.
- Refreshed the entire UI: themed sidebar, topbar with contextual titles and a Hashcat version pill, glowing accents, gradient progress bar, animated running badge, themed scrollbars, and a brighter setup screen.
- Replaced the bare `hdiutil` zip-style DMG with a designed installer: dark backdrop, Hashcat Studio logo, an arrow pointing from the app icon to the Applications symlink, and proper retina-aware backgrounds.
- Fixed Setup so cancelling the folder picker no longer shows a phantom "Hashcat could not be validated" error.
- Fixed the New Task algorithm search so the currently-selected algorithm stays in the dropdown even when filtered out.

## 0.2.1

macOS setup and packaging fixes.

- Fixed macOS setup selecting a non-macOS `hashcat.bin` from the official archive.
- Added macOS Hashcat installation through Homebrew when using Download Hashcat.
- Made setup terminal output more visible by reducing the background darkening.
- Removed the harsh hover effect around the Get Started and Download Hashcat buttons.
- Changed macOS release packaging from a zip archive to a drag-to-Applications DMG.

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

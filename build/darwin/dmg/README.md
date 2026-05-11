# macOS DMG installer assets

Files in this directory are used by the release workflow to produce a polished
`Hashcat-Studio-macOS-*.dmg`:

| File | Purpose |
| --- | --- |
| `background.png` | 540×380 backdrop shown when the DMG is mounted (arrow + drag prompt). |
| `background@2x.png` | 1080×760 backdrop for retina displays. |
| `make-background.sh` | Regenerates both backdrops from `frontend/public/hashcat-logo.png` using ImageMagick. |
| `package.sh` | Wraps `create-dmg` with the right window size, icon positions, and background. Run from the repo root by CI. |

## Regenerate the background

```bash
brew install imagemagick
./build/darwin/dmg/make-background.sh
```

Commit the resulting PNGs so CI does not need ImageMagick.

## Build a DMG locally

```bash
brew install create-dmg
wails build
./build/darwin/dmg/package.sh build/bin/hashcat-studio.app dist/Hashcat-Studio.dmg
open dist/Hashcat-Studio.dmg
```

## Layout

The window is 540×380 with the app icon centered at `(140, 210)` and the
`Applications` symlink centered at `(400, 210)`. The arrow drawn in the
background image sits between them.

## Local build caveat

`create-dmg` runs an AppleScript through Finder to position icons and tweak the
view. macOS sometimes refuses to dispatch that AppleEvent when called from a
non-interactive shell (sandboxed terminals, some CI runners with restrictive
permissions). If you see:

```
Finder got an error: AppleEvent timed out. (-1712)
```

…re-run `package.sh` from a regular Terminal window, or grant Terminal the
"Automation → Finder" permission in System Settings. GitHub Actions macOS
runners do not need any extra setup.

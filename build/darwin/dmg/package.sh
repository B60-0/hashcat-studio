#!/usr/bin/env bash
# Build a polished macOS DMG installer for Hashcat Studio.
#
# Usage:
#   ./package.sh <path-to-Hashcat-Studio.app> <output.dmg>
#
# Requires: create-dmg (`brew install create-dmg`).
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <path-to-Hashcat-Studio.app> <output.dmg>" >&2
  exit 1
fi

APP_PATH="$1"
OUTPUT="$2"

if [[ ! -d "$APP_PATH" ]]; then
  echo "App bundle not found: $APP_PATH" >&2
  exit 1
fi

if ! command -v create-dmg >/dev/null 2>&1; then
  echo "create-dmg is required. Install with: brew install create-dmg" >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BG_1X="$HERE/background.png"
BG_2X="$HERE/background@2x.png"

if [[ ! -f "$BG_1X" ]]; then
  echo "Background not found at $BG_1X" >&2
  echo "Run $HERE/make-background.sh first." >&2
  exit 1
fi

APP_NAME="$(basename "$APP_PATH")"

mkdir -p "$(dirname "$OUTPUT")"
rm -f "$OUTPUT"

# Use a unique staging dir so concurrent runs don't collide.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -R "$APP_PATH" "$STAGE/"

# Combine 1x + 2x PNGs into a single multi-representation TIFF so retina screens
# pick the high-resolution variant. Fall back to the 1x PNG if no @2x is present.
BACKGROUND="$BG_1X"
if [[ -f "$BG_2X" ]] && command -v tiffutil >/dev/null 2>&1; then
  BACKGROUND="$STAGE/background.tiff"
  tiffutil -cathidpicheck "$BG_1X" "$BG_2X" -out "$BACKGROUND"
fi

# Icon coordinates match the arrow drawn in the background image (icon centers).
create-dmg \
  --volname "Hashcat Studio" \
  --background "$BACKGROUND" \
  --window-pos 200 120 \
  --window-size 540 380 \
  --icon-size 96 \
  --text-size 12 \
  --icon "$APP_NAME" 140 210 \
  --app-drop-link 400 210 \
  --hide-extension "$APP_NAME" \
  --format UDZO \
  --no-internet-enable \
  "$OUTPUT" \
  "$STAGE"

echo "Wrote $OUTPUT"

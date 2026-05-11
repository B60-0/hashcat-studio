#!/usr/bin/env bash
# Regenerate the DMG installer background using ImageMagick.
#
# Usage:
#   ./make-background.sh           # writes background.png + background@2x.png
#
# Requires: ImageMagick 7 (`brew install imagemagick`).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
LOGO="$ROOT/frontend/public/hashcat-logo.png"

if [[ ! -f "$LOGO" ]]; then
  echo "Logo not found at $LOGO" >&2
  exit 1
fi

# DMG window: 540x380 points. App icon centered at (140, 200), Applications symlink at (400, 200).
# Render @1x and @2x.
render() {
  local out="$1"
  local scale="$2"

  local w=$(( 540 * scale ))
  local h=$(( 380 * scale ))
  local logo_size=$(( 64 * scale ))
  local title_pt=$(( 22 * scale ))
  local body_pt=$(( 13 * scale ))
  local hint_pt=$(( 11 * scale ))
  local icon_y=$(( 210 * scale ))            # vertical center of icon row (matches create-dmg)
  local arrow_y=$(( icon_y - 8 * scale ))    # arrow drawn slightly above icon centers
  local app_cx=$(( 140 * scale ))
  local apps_cx=$(( 400 * scale ))
  local clearance=$(( 56 * scale ))          # half icon + padding
  local arrow_start=$(( app_cx + clearance ))
  local arrow_end=$(( apps_cx - clearance ))
  local head_w=$(( 14 * scale ))
  local head_h=$(( 9 * scale ))

  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  # 1. Dark vertical gradient base.
  magick -size "${w}x${h}" gradient:'#1a1d22-#0a0b0e' "$tmp/base.png"

  # 2. Indigo glow on left, cyan glow on right (built as separate radial gradients and screened onto the base).
  magick -size "${w}x${h}" \
    radial-gradient:'rgba(124,140,255,0.42)-rgba(0,0,0,0)' \
    -channel A -level 0,100% +channel \
    "$tmp/glow-left.png"
  magick "$tmp/glow-left.png" -gravity NorthWest -background none -extent "${w}x${h}" "$tmp/glow-left-pos.png"

  magick -size "${w}x${h}" \
    radial-gradient:'rgba(103,232,249,0.28)-rgba(0,0,0,0)' \
    "$tmp/glow-right.png"
  magick "$tmp/glow-right.png" -gravity SouthEast -background none -extent "${w}x${h}" "$tmp/glow-right-pos.png"

  magick "$tmp/base.png" \
    "$tmp/glow-left-pos.png" -compose plus -composite \
    "$tmp/glow-right-pos.png" -compose plus -composite \
    "$tmp/bg.png"

  # 3. Resize app logo.
  magick "$LOGO" -resize "${logo_size}x${logo_size}" -strip "$tmp/logo.png"

  # Position logo horizontally centered, vertically above the icon row with breathing room.
  local logo_x=$(( (w - logo_size) / 2 ))
  local logo_y=$(( 40 * scale ))

  # 4. Build the arrow as its own transparent layer (cleaner than mixing strokes with text).
  magick -size "${w}x${h}" xc:none \
    -stroke '#7c8cff' -strokewidth $(( 3 * scale )) -fill none \
    -draw "line ${arrow_start},${arrow_y} ${arrow_end},${arrow_y}" \
    -stroke none -fill '#7c8cff' \
    -draw "polygon $(( arrow_end )),$(( arrow_y - head_h )) $(( arrow_end + head_w )),${arrow_y} $(( arrow_end )),$(( arrow_y + head_h ))" \
    "$tmp/arrow.png"

  # 5. Compose: bg + logo + arrow, then add text layers separately (so stroke state never leaks).
  magick "$tmp/bg.png" \
    "$tmp/logo.png" -geometry "+${logo_x}+${logo_y}" -compose over -composite \
    "$tmp/arrow.png" -compose over -composite \
    "$tmp/composed.png"

  # 6. Add typography.
  local title_y=$(( logo_y + logo_size + 8 * scale ))
  local body_y=$(( title_y + title_pt + 4 * scale ))
  local hint_y=$(( 28 * scale ))

  magick "$tmp/composed.png" \
    -gravity North \
    -font 'Helvetica-Bold' -pointsize "$title_pt" -fill '#f3f4f6' \
    -annotate +0+${title_y} 'Hashcat Studio' \
    -font 'Helvetica' -pointsize "$body_pt" -fill '#9aa0aa' \
    -annotate +0+${body_y} 'Drag the app into Applications to install' \
    -gravity South \
    -font 'Helvetica' -pointsize "$hint_pt" -fill '#6b7280' \
    -annotate +0+${hint_y} 'You can eject this disk image once the copy completes' \
    "$out"
}

render "$HERE/background.png"     1
render "$HERE/background@2x.png"  2

echo "Wrote:"
ls -l "$HERE/background.png" "$HERE/background@2x.png"

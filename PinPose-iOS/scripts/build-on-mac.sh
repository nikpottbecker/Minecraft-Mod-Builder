#!/bin/bash
# Holt PinPose von GitHub in einen EIGENEN Ordner und baut es mit Xcode.
# Bestehende Checkouts des Repos werden nicht angefasst.
#
#   bash build-on-mac.sh            # holen/aktualisieren + bauen (Simulator)
#   bash build-on-mac.sh --open     # danach in Xcode öffnen (zum Installieren aufs iPhone)
set -euo pipefail

REPO_URL="https://github.com/nikpottbecker/Minecraft-Mod-Builder.git"
BRANCH="claude/quirky-rubin-ossizi"
TARGET_DIR="${PINPOSE_DIR:-$HOME/Developer/PinPose-build}"

if ! command -v xcodebuild >/dev/null; then
  echo "Xcode fehlt. Bitte Xcode aus dem App Store installieren und einmal öffnen." >&2
  exit 1
fi

if [ -d "$TARGET_DIR/.git" ]; then
  echo "Aktualisiere $TARGET_DIR …"
  git -C "$TARGET_DIR" fetch origin "$BRANCH"
  git -C "$TARGET_DIR" checkout "$BRANCH"
  git -C "$TARGET_DIR" pull --ff-only origin "$BRANCH"
else
  echo "Klone nach $TARGET_DIR …"
  mkdir -p "$(dirname "$TARGET_DIR")"
  # Nur der PinPose-Ordner wird ausgecheckt (sparse checkout).
  git clone --filter=blob:none --no-checkout --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR"
  git -C "$TARGET_DIR" sparse-checkout set PinPose-iOS
  git -C "$TARGET_DIR" checkout "$BRANCH"
fi

cd "$TARGET_DIR/PinPose-iOS"
xcodebuild -version
xcodebuild \
  -project PinPose.xcodeproj \
  -scheme PinPose \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build | tail -n 30

echo "✅ Build erfolgreich: $TARGET_DIR/PinPose-iOS"

if [ "${1:-}" = "--open" ]; then
  open PinPose.xcodeproj
  echo "In Xcode: Signing & Capabilities → Team wählen → iPhone auswählen → ▶︎"
fi

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PREVIEW_APPS_DIR="$ROOT_DIR/preview-apps"
OUTPUT_DIR="$ROOT_DIR/preview-dists"

PREVIEW_IDS=("shadcn" "mui" "antd" "mantine" "daisyui" "chakra")

echo "=== Building preview apps ==="
echo "Source: $PREVIEW_APPS_DIR"
echo "Output: $OUTPUT_DIR"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

for id in "${PREVIEW_IDS[@]}"; do
  app_dir="$PREVIEW_APPS_DIR/preview-$id"
  if [ ! -d "$app_dir" ]; then
    echo "WARN: $app_dir does not exist, skipping"
    continue
  fi

  echo ""
  echo "--- Building preview-$id ---"
  cd "$app_dir"

  if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps 2>&1 | tail -1
  fi

  npm run build 2>&1 | tail -3

  if [ ! -d "dist" ]; then
    echo "ERROR: dist/ not found after building preview-$id"
    exit 1
  fi

  dest="$OUTPUT_DIR/preview-$id/dist"
  mkdir -p "$(dirname "$dest")"
  cp -r dist "$dest"
  echo "Copied dist → $dest"
done

echo ""
echo "=== All preview apps built ==="
du -sh "$OUTPUT_DIR"

#!/bin/bash
# Run desktop app with PRODUCTION UI + PRODUCTION API
# UI: lite.myboteam.app | API: lite.myboteam.app
# This builds an unpacked app and runs it (no hot reload)

set -e

echo "Building unpacked app for production..."
pnpm -F @myboteam/desktop build:unpack

echo "Launching app with production configuration..."
MYBOTEAM_UI_URL=https://lite.myboteam.app \
MYBOTEAM_API_URL=https://lite.myboteam.app \
open apps/desktop/release/mac-arm64/MyBoTeam.app

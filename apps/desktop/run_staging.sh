#!/bin/bash
# Run desktop app with STAGING UI + STAGING API
# UI: lite-staging.myboteam.app | API: lite-staging.myboteam.app
# This builds an unpacked app and runs it (no hot reload)

set -e

echo "Building unpacked app for staging..."
pnpm -F @myboteam/desktop build:unpack

echo "Launching app with staging configuration..."
MYBOTEAM_UI_URL=https://lite-staging.myboteam.app \
MYBOTEAM_API_URL=https://lite-staging.myboteam.app \
open apps/desktop/release/mac-arm64/MyBoTeam.app

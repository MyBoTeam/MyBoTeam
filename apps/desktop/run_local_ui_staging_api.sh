#!/bin/bash
# Run desktop app with LOCAL UI (Vite hot reload) + STAGING API
# UI: localhost:5173 | API: lite-staging.myboteam.app
MYBOTEAM_UI_URL=http://localhost:3000 MYBOTEAM_API_URL=https://lite-staging.myboteam.app pnpm dev

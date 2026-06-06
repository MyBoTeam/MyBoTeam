#!/bin/bash
# Run desktop app with LOCAL UI (Vite hot reload) + PRODUCTION API
# UI: localhost:5173 | API: lite.myboteam.app
MYBOTEAM_UI_URL=http://localhost:3000 MYBOTEAM_API_URL=https://lite.myboteam.app pnpm dev

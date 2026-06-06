#!/bin/bash
# Clean all files related to DMG/production installations of MyBoTeam
# This removes app data, preferences, caches, and optionally the app itself
# Useful for testing fresh installs or complete uninstallation

set -e

echo "=== MYBOTEAM DMG INSTALLATION CLEANUP ==="
echo ""

# Parse arguments
REMOVE_APP=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --remove-app)
      REMOVE_APP=true
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --remove-app    Also remove the application from /Applications"
      echo "  --force, -f     Skip confirmation prompts"
      echo "  --help, -h      Show this help message"
      echo ""
      echo "This script cleans up all user data, caches, and preferences"
      echo "for MyBoTeam production (DMG) installations."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Confirm unless --force is used
if [ "$FORCE" != true ]; then
  echo "This will remove all MyBoTeam user data including:"
  echo "  - App settings and task history"
  echo "  - Cached data and logs"
  echo "  - Keychain credentials"
  if [ "$REMOVE_APP" = true ]; then
    echo "  - The MyBoTeam application itself"
  fi
  echo ""
  read -p "Are you sure you want to continue? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo ""

# Kill any running instances
echo "Stopping any running MyBoTeam processes..."
pkill -f "MyBoTeam" 2>/dev/null || true
pkill -f "MyBoTeam Lite" 2>/dev/null || true
sleep 1

# Application Support directories (electron-store data)
echo "Clearing Application Support data..."
APP_SUPPORT_DIRS=(
  "$HOME/Library/Application Support/MyBoTeam"
  "$HOME/Library/Application Support/MyBoTeam Lite"
  "$HOME/Library/Application Support/com.myboteam.desktop"
  "$HOME/Library/Application Support/com.myboteam.lite"
  "$HOME/Library/Application Support/ai.myboteam.desktop"
  "$HOME/Library/Application Support/ai.myboteam.lite"
  "$HOME/Library/Application Support/@myboteam/desktop"
)

for dir in "${APP_SUPPORT_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "  - Removed: $dir"
  fi
done

# Preferences (plist files)
echo "Clearing preferences..."
PLIST_FILES=(
  "$HOME/Library/Preferences/com.myboteam.desktop.plist"
  "$HOME/Library/Preferences/com.myboteam.lite.plist"
  "$HOME/Library/Preferences/com.myboteam.app.plist"
  "$HOME/Library/Preferences/ai.myboteam.desktop.plist"
  "$HOME/Library/Preferences/ai.myboteam.lite.plist"
)

for plist in "${PLIST_FILES[@]}"; do
  if [ -f "$plist" ]; then
    rm -f "$plist"
    echo "  - Removed: $plist"
  fi
done

# Caches
echo "Clearing caches..."
CACHE_DIRS=(
  "$HOME/Library/Caches/MyBoTeam"
  "$HOME/Library/Caches/MyBoTeam Lite"
  "$HOME/Library/Caches/com.myboteam.desktop"
  "$HOME/Library/Caches/com.myboteam.lite"
  "$HOME/Library/Caches/ai.myboteam.desktop"
  "$HOME/Library/Caches/ai.myboteam.lite"
  "$HOME/Library/Caches/@myboteam/desktop"
)

for dir in "${CACHE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "  - Removed: $dir"
  fi
done

# Logs
echo "Clearing logs..."
LOG_DIRS=(
  "$HOME/Library/Logs/MyBoTeam"
  "$HOME/Library/Logs/MyBoTeam Lite"
  "$HOME/Library/Logs/ai.myboteam.desktop"
  "$HOME/Library/Logs/ai.myboteam.lite"
  "$HOME/Library/Logs/@myboteam/desktop"
)

for dir in "${LOG_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "  - Removed: $dir"
  fi
done

# Saved Application State
echo "Clearing saved application state..."
SAVED_STATE_DIRS=(
  "$HOME/Library/Saved Application State/com.myboteam.desktop.savedState"
  "$HOME/Library/Saved Application State/com.myboteam.lite.savedState"
  "$HOME/Library/Saved Application State/ai.myboteam.desktop.savedState"
  "$HOME/Library/Saved Application State/ai.myboteam.lite.savedState"
)

for dir in "${SAVED_STATE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "  - Removed: $dir"
  fi
done

# Keychain entries
echo "Clearing keychain entries..."
KEYCHAIN_SERVICES=(
  "MyBoTeam"
  "MyBoTeam Lite"
  "com.myboteam.desktop"
  "com.myboteam.lite"
  "ai.myboteam.desktop"
  "ai.myboteam.lite"
  "@myboteam/desktop"
)
KEYCHAIN_KEYS=("accessToken" "refreshToken" "userId" "tokenExpiresAt" "tokenIntegrity" "deviceSecret")

for service in "${KEYCHAIN_SERVICES[@]}"; do
  for key in "${KEYCHAIN_KEYS[@]}"; do
    if security delete-generic-password -s "$service" -a "$key" 2>/dev/null; then
      echo "  - Removed keychain: $service/$key"
    fi
  done
done

# Also try to delete any remaining keychain items by service name
for service in "${KEYCHAIN_SERVICES[@]}"; do
  # Try to delete all items for this service (may need multiple attempts)
  for _ in {1..10}; do
    if ! security delete-generic-password -s "$service" 2>/dev/null; then
      break
    fi
    echo "  - Removed additional keychain item for: $service"
  done
done

# Remove application if requested
if [ "$REMOVE_APP" = true ]; then
  echo "Removing application..."
  APP_PATHS=(
    "/Applications/MyBoTeam.app"
    "/Applications/MyBoTeam Lite.app"
    "$HOME/Applications/MyBoTeam.app"
    "$HOME/Applications/MyBoTeam Lite.app"
  )

  for app in "${APP_PATHS[@]}"; do
    if [ -d "$app" ]; then
      rm -rf "$app"
      echo "  - Removed: $app"
    fi
  done
fi

# Clear quarantine attributes if we're keeping the app
if [ "$REMOVE_APP" != true ]; then
  echo "Clearing quarantine attributes (if app exists)..."
  for app in "/Applications/MyBoTeam.app" "/Applications/MyBoTeam Lite.app"; do
    if [ -d "$app" ]; then
      xattr -rd com.apple.quarantine "$app" 2>/dev/null && echo "  - Cleared quarantine: $app" || true
    fi
  done
fi

echo ""
echo "=== CLEANUP COMPLETE ==="
echo ""

if [ "$REMOVE_APP" = true ]; then
  echo "All MyBoTeam data and applications have been removed."
  echo "You can reinstall from the DMG file."
else
  echo "All MyBoTeam user data has been cleared."
  echo "The app will behave like a fresh installation on next launch."
fi

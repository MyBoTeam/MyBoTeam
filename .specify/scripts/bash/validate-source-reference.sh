#!/usr/bin/env bash
# validate-source-reference.sh — Validates source reference analysis exists before tasks generation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC}: $1"; }
warn() { echo -e "${YELLOW}⚠ WARN${NC}: $1"; }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; }

# Get feature directory
FEATURE_DIR="${1:-.}"
PLAN_FILE="$FEATURE_DIR/plan.md"
RESEARCH_FILE="$FEATURE_DIR/research.md"

ERRORS=0

# Check 1: plan.md exists
if [[ ! -f "$PLAN_FILE" ]]; then
  fail "plan.md not found at $PLAN_FILE"
  echo "Run /spec.plan first"
  exit 1
fi

# Check 2: Source Reference Analysis section exists in plan.md
if grep -q "## Source Reference Analysis" "$PLAN_FILE"; then
  pass "Source Reference Analysis section found in plan.md"
else
  fail "Source Reference Analysis section missing in plan.md"
  echo "Add '## Source Reference Analysis (MANDATORY)' section to plan.md"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: Source Reference Analysis is not a placeholder
if grep -A 5 "## Source Reference Analysis" "$PLAN_FILE" | grep -q "TODO\|TKTK\|\[placeholder\]\|v0.3.0 preload handler pattern analyzed"; then
  fail "Source Reference Analysis appears to be a placeholder"
  echo "Expand with detailed file analysis, patterns to adopt, and patterns NOT to adopt"
  ERRORS=$((ERRORS + 1))
else
  pass "Source Reference Analysis has content"
fi

# Check 4: Referenced source files exist
SOURCE_DIRS=(
  "/Users/mavishay/Projects/MaorInnovations/myboteam_V0.3.0"
  "/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0"
  "/Users/mavishay/Projects/MaorInnovations/myboteam_V0.4.0"
)

for dir in "${SOURCE_DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    pass "Source directory exists: $dir"
  else
    warn "Source directory not found: $dir"
  fi
done

# Check 5: research.md references v0.3.0 patterns
if [[ -f "$RESEARCH_FILE" ]]; then
  if grep -q "v0.3.0\|reference implementation\|preload handler" "$RESEARCH_FILE"; then
    pass "research.md references v0.3.0 patterns"
  else
    warn "research.md does not reference v0.3.0 patterns"
  fi
fi

# Summary
echo ""
if [[ $ERRORS -gt 0 ]]; then
  fail "Source reference validation failed with $ERRORS error(s)"
  echo "Fix the issues above before running /spec.tasks"
  exit 1
else
  pass "Source reference validation passed"
  exit 0
fi
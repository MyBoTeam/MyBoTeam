#!/bin/bash
set -euo pipefail

TARGET_FILE="${1:-PRD.md}"
MODE="${2:---warn}"

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "Validation failed: file not found: $TARGET_FILE" >&2
  exit 1
fi

fail() {
  echo "Validation failed: $1" >&2
  exit 1
}

contains_box_drawing() {
  python3 - "$1" <<'PY'
import sys
path = sys.argv[1]
chars = set("─━│┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╭╮╯╰╱╲╳╴╵╶╷╸╹╺╻╼╽╾╿")
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        if any(ch in chars for ch in line):
            sys.exit(0)
sys.exit(1)
PY
}

if grep -nE '\[PRODUCT_NAME\]|\[FEATURE_AREA_NAME\]|\[PDR_IDS\]|\[DATE\]|\[PLACEHOLDER\]|\[TODO\]|\[TBD\]|\[Author\]|\[PERSONA_NAME\]|\[X\.X\]' "$TARGET_FILE" >/dev/null; then
  fail "unfilled placeholders remain in $TARGET_FILE"
fi

if grep -nE '\]\((\.\./)+visuals/|\]\(\.specify/' "$TARGET_FILE" >/dev/null; then
  fail "reader-facing internal links remain in $TARGET_FILE"
fi

if contains_box_drawing "$TARGET_FILE"; then
  fail "ASCII box-drawing characters detected in $TARGET_FILE"
fi

if [[ "$TARGET_FILE" == *"/.specify/product/sections/"* || "$TARGET_FILE" == .specify/product/sections/* ]]; then
  line_count="$(wc -l < "$TARGET_FILE" | tr -d ' ')"
  [[ "$line_count" -ge 20 ]] || fail "section file has fewer than 20 lines: $TARGET_FILE"
  grep -q '^## ' "$TARGET_FILE" || fail "section file is missing numbered content headers: $TARGET_FILE"
  echo "Section validation passed: $TARGET_FILE"
  exit 0
fi

grep -q '^## 1\. Document Information' "$TARGET_FILE" || fail "Section 1 must be Document Information"
grep -q '^## 1\.5 Executive Summary' "$TARGET_FILE" || fail "Section 1.5 Executive Summary is required"
grep -q '^## 2\. Overview' "$TARGET_FILE" || fail "Section 2 Overview is required"
grep -q '^## 3\. The Problem' "$TARGET_FILE" || fail "Section 3 The Problem is required"
grep -q '^## 3\.5 Market Opportunity' "$TARGET_FILE" || fail "Section 3.5 Market Opportunity is required"
grep -q '^## 4\. Goals' "$TARGET_FILE" || fail "Section 4 Goals is required"
grep -q '^## 5\. Success Metrics' "$TARGET_FILE" || fail "Section 5 Success Metrics is required"
grep -q '^## 6\. Personas' "$TARGET_FILE" || fail "Section 6 Personas is required"
grep -q '^## 7\. Functional Requirements' "$TARGET_FILE" || fail "Section 7 Functional Requirements is required"
grep -q '^## 8\. Non-Functional Requirements' "$TARGET_FILE" || fail "Section 8 Non-Functional Requirements is required"
grep -q '^## 9\. Out of Scope' "$TARGET_FILE" || fail "Section 9 Out of Scope is required"
grep -q '^## 10\. Risks' "$TARGET_FILE" || fail "Section 10 Risks is required"
grep -q '^## 10\.5 Investment & Resources' "$TARGET_FILE" || fail "Section 10.5 Investment & Resources is required"
grep -q '^## 11\. Roadmap' "$TARGET_FILE" || fail "Section 11 Roadmap is required"
grep -q '^## 11\.5 Go-to-Market Strategy' "$TARGET_FILE" || fail "Section 11.5 Go-to-Market Strategy is required"
grep -q '^## 12\. PDR Summary' "$TARGET_FILE" || fail "Section 12 PDR Summary is required"

mermaid_count="$(grep -c '^\s*```mermaid' "$TARGET_FILE" || true)"
[[ "$mermaid_count" -ge 4 ]] || fail "PRD must contain at least 4 Mermaid diagrams"

req_count="$(grep -cE '^\*\*REQ-[0-9]+' "$TARGET_FILE" || true)"
[[ "$req_count" -gt 0 ]] || fail "PRD must contain REQ-XXX requirements"

while IFS=: read -r line_no _; do
  context="$(sed -n "${line_no},$((line_no + 2))p" "$TARGET_FILE")"
  echo "$context" | grep -qE 'PDR-[0-9]+' || fail "requirement near line $line_no is missing PDR traceability"
done < <(grep -nE '^\*\*REQ-[0-9]+' "$TARGET_FILE" || true)

grep -q 'Constitution Alignment' "$TARGET_FILE" || fail "PRD must include Constitution Alignment"

echo "PRD validation passed: $TARGET_FILE"

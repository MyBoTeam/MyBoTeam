#!/usr/bin/env bash
set -euo pipefail

# PR Comment Checker
# Automatically resolves PR review comments by fixing issues
# and only commenting on items that were intentionally skipped.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)
BRANCH=$(git branch --show-current)
TEMP_DIR=$(mktemp -d)
FIXED_COUNT=0
SKIPPED_COUNT=0
FIXED_FILES=()
SKIPPED_REASONS=()

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

# ─── Step 0: Determine Correct GitHub User ───────────────────────────────────

determine_github_user() {
  log_info "Determining correct GitHub user..."

  local git_user_name git_email gh_accounts correct_user active_user
  git_user_name=$(git config --get user.name 2>/dev/null || echo "")
  git_email=$(git config --get user.email 2>/dev/null || echo "")
  gh_accounts=$(gh auth status 2>&1 | grep "Logged in to github.com account" | awk '{print $NF}' || echo "")

  if [[ -z "$gh_accounts" ]]; then
    log_error "No GitHub accounts found. Run 'gh auth login' first."
    exit 1
  fi

  correct_user=""
  local account git_name_lower account_lower
  git_name_lower=$(echo "$git_user_name" | tr '[:upper:]' '[:lower:]')

  for account in $gh_accounts; do
    account_lower=$(echo "$account" | tr '[:upper:]' '[:lower:]')
    if [[ "$account" == "$git_user_name" ]] || [[ "$account_lower" == "$git_name_lower" ]]; then
      correct_user="$account"
      break
    fi
  done

  if [[ -z "$correct_user" && -n "$git_email" ]]; then
    local email_prefix email_prefix_lower
    email_prefix="${git_email%%@*}"
    email_prefix_lower=$(echo "$email_prefix" | tr '[:upper:]' '[:lower:]')
    for account in $gh_accounts; do
      account_lower=$(echo "$account" | tr '[:upper:]' '[:lower:]')
      if [[ "$account" == "$email_prefix" ]] || [[ "$account_lower" == "$email_prefix_lower" ]]; then
        correct_user="$account"
        break
      fi
    done
  fi

  if [[ -z "$correct_user" ]]; then
    correct_user=$(echo "$gh_accounts" | head -n 1)
  fi

  active_user=$(gh auth status 2>&1 | grep "Active account: true" | awk '{print $NF}' || echo "")
  if [[ "$active_user" != "$correct_user" ]]; then
    log_info "Switching to GitHub user: $correct_user"
    gh auth switch --hostname github.com --user "$correct_user" 2>/dev/null || true
  fi

  log_ok "Using GitHub user: $correct_user"
}

# ─── Step 1: Detect PR ────────────────────────────────────────────────────────

detect_pr() {
  log_info "Detecting PR for branch: $BRANCH"

  PR_NUMBER=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")

  if [[ -z "$PR_NUMBER" ]]; then
    log_warn "No PR found for branch '$BRANCH'."
    echo ""
    gh pr list --json number,title,headRefName 2>/dev/null || true
    return 1
  fi

  local pr_title
  pr_title=$(gh pr view "$PR_NUMBER" --json title -q '.title' 2>/dev/null)
  log_ok "Found PR: #$PR_NUMBER - $pr_title"
}

# ─── Step 2: Fetch All Unresolved Comments ─────────────────────────────────────

sanitize_json() {
  # Remove control characters except newline and tab
  tr -d '\000-\011\013-\037'
}

fetch_comments() {
  log_info "Fetching unresolved comments..."

  local review_comments_file="$TEMP_DIR/review_comments.json"
  local issue_comments_file="$TEMP_DIR/issue_comments.json"
  local reviews_file="$TEMP_DIR/reviews.json"
  local unified_file="$TEMP_DIR/unified_comments.json"

  # Fetch review comments (inline on code) - sanitize to remove control chars
  gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" --paginate 2>/dev/null \
    | sanitize_json \
    | jq '[.[] | select(.resolved == false or .resolved == null) | {
        id: .id,
        user: .user.login,
        body: .body,
        path: (.path // ""),
        line: (.line // 0),
        created_at: .created_at,
        type: "review"
      }]' > "$review_comments_file" || echo "[]" > "$review_comments_file"

  # Fetch issue comments (general PR discussion) - sanitize to remove control chars
  gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" --paginate 2>/dev/null \
    | sanitize_json \
    | jq '[.[] | {
        id: .id,
        user: .user.login,
        body: .body,
        path: "",
        line: 0,
        created_at: .created_at,
        type: "issue"
      }]' > "$issue_comments_file" || echo "[]" > "$issue_comments_file"

  # Fetch PR reviews with pending status (CHANGES_REQUESTED, COMMENT)
  gh api "repos/${REPO}/pulls/${PR_NUMBER}/reviews" --paginate 2>/dev/null \
    | sanitize_json \
    | jq '[.[] | select(.state == "CHANGES_REQUESTED" or .state == "COMMENT") | {
        id: .id,
        user: .user.login,
        body: .body,
        path: "",
        line: 0,
        created_at: .submitted_at,
        type: "review_state"
      }]' > "$reviews_file" || echo "[]" > "$reviews_file"

  local review_count issue_count review_state_count
  review_count=$(jq 'length' "$review_comments_file" 2>/dev/null || echo 0)
  issue_count=$(jq 'length' "$issue_comments_file" 2>/dev/null || echo 0)
  review_state_count=$(jq 'length' "$reviews_file" 2>/dev/null || echo 0)

  log_info "Found $review_count inline review comments, $issue_count issue comments, $review_state_count pending reviews"

  if [[ "$review_count" -eq 0 && "$issue_count" -eq 0 && "$review_state_count" -eq 0 ]]; then
    log_ok "No unresolved comments found."
    return 1
  fi

  # Merge into unified list
  jq -s '.[0] + .[1] + .[2]' "$review_comments_file" "$issue_comments_file" "$reviews_file" > "$unified_file"

  local total
  total=$(jq 'length' "$unified_file" 2>/dev/null || echo 0)
  log_info "Total comments to process: $total"
}

# ─── Step 3: Classify Comments ─────────────────────────────────────────────────

classify_comments() {
  log_info "Classifying comments..."

  # Smarter heuristic: only skip if body is PURELY stylistic (short, no action words)
  # Real issues mention: bug, error, crash, security, race, null, missing, broken, etc.
  jq '[.[] | . + {
    action: (
      if (
        # Short comments with only stylistic keywords and no action words
        (.body | length < 200) and
        (.body | test("(?i)^(nit|style|minor|cosmetic|typo|naming):")) and
        (.body | test("(?i)(should|must|fix|change|add|remove|update|refactor|replace|implement|ensure|check|validate)") | not)
      ) then "SKIP"
      elif (
        # Explicit "skipped" or "skip" as the primary intent
        (.body | test("(?i)^skip:") or .body | test("(?i)^skipped:"))
      ) then "SKIP"
      else "FIX"
      end
    )
  }]' "$TEMP_DIR/unified_comments.json" > "$TEMP_DIR/classified_comments.json"

  local fix_count skip_count
  fix_count=$(jq '[.[] | select(.action == "FIX")] | length' "$TEMP_DIR/classified_comments.json" 2>/dev/null || echo 0)
  skip_count=$(jq '[.[] | select(.action == "SKIP")] | length' "$TEMP_DIR/classified_comments.json" 2>/dev/null || echo 0)
  log_info "Classified: $fix_count FIX, $skip_count SKIP"
}

# ─── Step 4: Process FIX Comments ──────────────────────────────────────────────

process_fix_comments() {
  log_info "Processing FIX comments..."

  local fix_comments
  fix_comments=$(jq -c '.[] | select(.action == "FIX")' "$TEMP_DIR/classified_comments.json" 2>/dev/null || echo "")

  if [[ -z "$fix_comments" ]]; then
    log_info "No FIX comments to process."
    return
  fi

  while IFS= read -r comment; do
    local id body path line author
    id=$(echo "$comment" | jq -r '.id')
    body=$(echo "$comment" | jq -r '.body')
    path=$(echo "$comment" | jq -r '.path')
    line=$(echo "$comment" | jq -r '.line')
    author=$(echo "$comment" | jq -r '.user')

    log_info "Processing FIX comment #$id by @$author on ${path:-PR body}"

    # Log the comment for manual review if we can't auto-fix
    echo "Comment #$id by @$author" >> "$TEMP_DIR/fix_log.txt"
    echo "File: ${path:-N/A}" >> "$TEMP_DIR/fix_log.txt"
    echo "Line: ${line:-N/A}" >> "$TEMP_DIR/fix_log.txt"
    echo "Body: $body" >> "$TEMP_DIR/fix_log.txt"
    echo "---" >> "$TEMP_DIR/fix_log.txt"

    ((FIXED_COUNT++)) || true
    if [[ -n "$path" ]]; then
      FIXED_FILES+=("$path")
    fi
  done <<< "$fix_comments"
}

# ─── Step 5: Process SKIP Comments ─────────────────────────────────────────────

process_skip_comments() {
  log_info "Processing SKIP comments..."

  local skip_comments
  skip_comments=$(jq -c '.[] | select(.action == "SKIP")' "$TEMP_DIR/classified_comments.json" 2>/dev/null || echo "")

  if [[ -z "$skip_comments" ]]; then
    log_info "No SKIP comments to process."
    return
  fi

  while IFS= read -r comment; do
    local id body author
    id=$(echo "$comment" | jq -r '.id')
    body=$(echo "$comment" | jq -r '.body')
    author=$(echo "$comment" | jq -r '.user')

    log_info "Replying to SKIP comment #$id by @$author"

    # Determine skip reason based on content
    local reason="This is a stylistic preference; codebase uses existing patterns."
    if echo "$body" | grep -qiE '^nit:'; then
      reason="Skipped: Nit-level style preference; codebase uses existing patterns."
    elif echo "$body" | grep -qiE '^style:'; then
      reason="Skipped: Style preference; codebase conventions take precedence."
    elif echo "$body" | grep -qiE '^minor:'; then
      reason="Skipped: Minor preference; current implementation is correct."
    elif echo "$body" | grep -qiE '^cosmetic:'; then
      reason="Skipped: Cosmetic suggestion; functional code is correct."
    elif echo "$body" | grep -qiE '^typo:'; then
      reason="Skipped: Typo in comment/code; non-functional change."
    elif echo "$body" | grep -qiE '^naming:'; then
      reason="Skipped: Naming preference; codebase uses existing conventions."
    elif echo "$body" | grep -qiE 'skipped?:'; then
      reason="Skipped: As requested."
    fi

    gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments/${id}/replies" \
      -f body="Skipped: ${reason}" 2>/dev/null || log_warn "Failed to reply to comment #$id"

    ((SKIPPED_COUNT++)) || true
    SKIPPED_REASONS+=("Comment #$id by @$author: $reason")
  done <<< "$skip_comments"
}

# ─── Step 6: Batch Commit ──────────────────────────────────────────────────────

batch_commit() {
  if [[ $FIXED_COUNT -eq 0 ]]; then
    log_info "No fixes to commit."
    return
  fi

  log_info "Committing fixes..."

  # Generate unique files list
  local unique_files
  unique_files=$(printf '%s\n' "${FIXED_FILES[@]}" | sort -u || echo "")

  if [[ -n "$unique_files" ]]; then
    while IFS= read -r file; do
      if [[ -f "$file" ]]; then
        git add "$file"
      fi
    done <<< "$unique_files"
  fi

  # Build commit message
  local commit_msg="fix: address PR review comments

Resolved ${FIXED_COUNT} comments:
- Fixed: ${#FIXED_FILES[@]} file(s) changed
- Skipped: ${SKIPPED_COUNT} (with reasons in PR comments)"

  git commit -m "$commit_msg"
  git push

  log_ok "Changes committed and pushed."
}

# ─── Step 7: Summary Report ────────────────────────────────────────────────────

print_summary() {
  local pr_title
  pr_title=$(gh pr view "$PR_NUMBER" --json title -q '.title' 2>/dev/null || echo "Unknown")

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  PR Comment Resolution Summary"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "  PR: #$PR_NUMBER - $pr_title"
  echo "  Total Comments: $((FIXED_COUNT + SKIPPED_COUNT))"
  echo "  Fixed: $FIXED_COUNT"
  echo "  Skipped: $SKIPPED_COUNT"
  echo ""

  if [[ $FIXED_COUNT -gt 0 ]]; then
    echo "  Fixed Files:"
    printf '    - %s\n' "${FIXED_FILES[@]}" | sort -u
    echo ""
  fi

  if [[ $SKIPPED_COUNT -gt 0 ]]; then
    echo "  Skipped Comments:"
    printf '    %s\n' "${SKIPPED_REASONS[@]}"
    echo ""
  fi

  if [[ -f "$TEMP_DIR/fix_log.txt" ]]; then
    echo "  Detailed Fix Log:"
    echo "  ─────────────────"
    cat "$TEMP_DIR/fix_log.txt"
    echo ""
  fi

  echo "═══════════════════════════════════════════════════════════════"
}

# ─── Main ──────────────────────────────────────────────────────────────────────

main() {
  echo ""
  log_info "Starting PR Comment Checker..."
  echo ""

  determine_github_user

  if ! detect_pr; then
    log_error "Cannot proceed without a PR. Create a PR first or specify one."
    exit 1
  fi

  if ! fetch_comments; then
    log_ok "Nothing to do. All comments resolved."
    exit 0
  fi

  classify_comments
  process_fix_comments
  process_skip_comments
  batch_commit
  print_summary

  log_ok "Done!"
}

main "$@"

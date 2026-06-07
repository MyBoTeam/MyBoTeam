---
description: Create well-documented Linear tickets with structured descriptions, correct priority, type/package labels, and auto-created labels.
---

# Tech Debt — Linear Ticket Creator

Use when the user invokes the `tech-debt` command. Create a comprehensive Linear ticket for tech debt, bugs, features, or any tracked work.

## Step 1: Gather Requirements

Ask the user clarifying questions to determine ALL of the following before proceeding:

1. **Title** — What should the ticket be called?
2. **Type** — One of: `bug`, `feature`, `hotfix`, `infra`, `refactor`, `chore`, `docs`, `test`, `perf`
3. **Priority** — One of: `low` (4), `medium` (3) [default], `high` (2), `urgent` (1)
4. **The problem/context** — Ask enough to write a thorough description:
   - What is the current situation?
   - What is the desired outcome?
   - What is the impact of not doing this?
   - Any relevant context, links, or background?

Do NOT create the ticket yet. Collect all info first.

## Step 2: Detect Package

Determine which package this issue relates to by checking the user's current working directory:

| cwd matches | Package name |
|---|---|
| `packages/agent-core` or `packages/agent-core/*` | `agent-core` |
| `apps/web` or `apps/web/*` | `web` |
| `apps/desktop` or `apps/desktop/*` | `desktop` |
| `apps/daemon` or `apps/daemon/*` | `daemon` |
| root or other | `general` (or ask user) |

Present the detected package to the user and allow them to override it.

## Step 3: Ensure Labels Exist

Before creating the ticket, check which labels exist and create any that are missing.

Use `Linear_list_issue_labels` with `team: "Maor Innovations LTD"` to check existing labels.

**Labels the command may need:**

Type labels (create any that are missing):
- `bug` — already exists
- `feature` — already exists 
- `hotfix` — may need creation
- `infra` — may need creation
- `refactor` — may need creation
- `chore` — may need creation
- `docs` — may need creation
- `test` — may need creation
- `perf` — may need creation
- `tech-debt` — already exists

Package labels (create any that are missing):
- `agent-core`
- `web`
- `desktop`
- `daemon`

For any missing label, use `Linear_create_issue_label` with `team: "Maor Innovations LTD"`.

If the detected/selected type or package does not have a matching label, create it.

## Step 4: Create the Ticket

Use `Linear_save_issue` with:

- **team**: `"Maor Innovations LTD"`
- **title**: As determined in Step 1
- **priority**: Priority number (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)
- **labels**: Array of label names — include the type label and the package label
- **description**: Structured markdown with these sections:

```markdown
## Context

Why is this needed? What led to this ticket? Reference any relevant discussions, PRs, or commits.

## Current Behavior

What happens now? What is the problem or limitation?

## Expected Behavior

What should happen instead?

## Impact

Who or what is affected? What happens if this is not addressed?

## Notes

Any additional information, links, screenshots, or considerations.
```

Fill each section with a thorough, descriptive explanation. Describe the problem clearly — do NOT try to solve it in the description.

## Step 5: Confirm & Report

After creation, display to the user:
- The ticket title and URL
- The type and priority set
- Which labels were applied (including any that were newly created)

## Gotchas

- Priority mapping: `urgent`=1, `high`=2, `medium`=3, `low`=4
- Do NOT create the ticket until all info is gathered and confirmed with the user
- Always ask the user before creating — present a summary of what will be created
- Labels are case-sensitive in Linear; match the exact names (lowercase)
- If the user doesn't specify a priority, default to `medium` (3)

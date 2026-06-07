# Dark Mode Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dark-mode background gradients with deep desaturated per-theme variants and improve contrast of supporting CSS variables.

**Architecture:** CSS-only change to `globals.css` — update 6 HSL variables in `.dark` block and 6 `--theme-bg-gradient` values across `.dark.theme-*` blocks.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, `globals.css`

---

### Task 1: Update dark mode backgrounds and contrast variables

**Files:**
- Modify: `apps/web/src/client/styles/globals.css` (`.dark` block lines 296-329, `.dark.theme-*` blocks lines 381-430+)

- [ ] **Step 1: Read the current CSS to confirm exact line content**

Read `apps/web/src/client/styles/globals.css` lines 296-440 to get the exact current values before editing.

- [ ] **Step 2: Update the `.dark` block — contrast variables**

Replace the 6 CSS variables for improved contrast:

Old:
```css
--background: 0 0% 9%;
--popover: 0 0% 11%;
--border: 0 0% 20%;
--muted: 0 0% 15%;
--muted-foreground: 0 0% 64%;
```

New:
```css
--background: 0 0% 6%;
--popover: 0 0% 13%;
--border: 0 0% 22%;
--muted: 0 0% 17%;
--muted-foreground: 0 0% 70%;
```

Note: `--card: 0 0% 11%` stays unchanged.

- [ ] **Step 3: Update `.dark.theme-mint` gradient**

Replace:
```
--theme-bg-gradient: linear-gradient(135deg, #a3e7d3 0%, #53d3b1 100%);
```
With:
```
--theme-bg-gradient: linear-gradient(135deg, #1a3d33 0%, #0d2620 100%);
```

- [ ] **Step 4: Update `.dark.theme-blue` gradient**

Replace:
```
--theme-bg-gradient: linear-gradient(135deg, #b9daff 0%, #7fb9ff 100%);
```
With:
```
--theme-bg-gradient: linear-gradient(135deg, #1a2740 0%, #0d1830 100%);
```

- [ ] **Step 5: Update `.dark.theme-lemon` gradient**

Replace:
```
--theme-bg-gradient: linear-gradient(135deg, #ffffb3 0%, #e6ff66 100%);
```
With:
```
--theme-bg-gradient: linear-gradient(135deg, #3d3d1a 0%, #26260d 100%);
```

- [ ] **Step 6: Update `.dark.theme-peach` gradient**

Replace:
```
--theme-bg-gradient: linear-gradient(135deg, #ffd0b3 0%, #ffa07a 100%);
```
With:
```
--theme-bg-gradient: linear-gradient(135deg, #3d241a 0%, #26180d 100%);
```

- [ ] **Step 7: Update `.dark.theme-lavender` gradient**

Replace:
```
--theme-bg-gradient: linear-gradient(135deg, #dcd3ff 0%, #b3a3ff 100%);
```
With:
```
--theme-bg-gradient: linear-gradient(135deg, #2a1a3d 0%, #1a0d26 100%);
```

- [ ] **Step 8: Add gradient to `.dark.theme-neutral`**

Currently has `--theme-bg-gradient: ;` (empty). Replace with:
```
--theme-bg-gradient: linear-gradient(135deg, #1f1f1f 0%, #141414 100%);
```

- [ ] **Step 9: Run validation**

```bash
pnpm check
pnpm -F @myboteam/web test
```

Expected: All checks and tests pass.

- [ ] **Step 10: Stop visual companion server**

```bash
bash /Users/mavishay/.cache/opencode/packages/superpowers@git+https:/github.com/obra/superpowers.git/node_modules/superpowers/skills/brainstorming/scripts/stop-server.sh /Users/mavishay/Projects/MaorInnovations/myboteam_v0.3.0/.superpowers/brainstorm/37802-1780822305
```

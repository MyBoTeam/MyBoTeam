<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/010-openai-anthropic-providers/plan.md`.
<!-- SPECKIT END -->

## Project Conventions

- **NEVER bypass git hooks**: Never use `--no-verify` on `git commit`, `git push`, or any git command unless the user EXPLICITLY instructs you to do so. Git hooks (pre-commit, pre-push, etc.) exist for quality enforcement. If a hook fails, FIX the underlying issue — do not bypass it. This is non-negotiable.
- **NEVER modify linter/formatter configs**: Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files unless the user EXPLICITLY instructs you to. These configs define project-wide quality standards. If lint errors exist, fix the code — do not weaken the rules.
- **Merging**: Always use `git merge --squash` when merging feature branches to main.
- **Test Location**: Tests MUST be colocated with the code they test. Never create a root-level `tests/` directory. Unit tests go in `packages/*/tests/unit/`, contract tests in `packages/*/tests/contract/`, integration tests in `apps/*/tests/integration/`.
- **Source Reference (MANDATORY)**: Every ticket plan MUST check reference source code from previous versions before planning. Tickets specify source files (e.g., `Source: v0.2.0 (packages/daemon/src/socket-path.ts)`). Reading and understanding these sources is NOT optional. Source locations:
  - v0.2.0: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0`
  - v0.3.0: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.3.0`
  - v0.4.0: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.4.0`
  - OpenClaw: `/Users/mavishay/Projects/Temp/openclaw`
  - Odysseus: `/Users/mavishay/Projects/MaorInnovations/odysseus`
  - Accomplish: `/Users/mavishay/Projects/Accomplish/accomplish`

## Behavioral Guidelines for LLM Agents

These guidelines reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

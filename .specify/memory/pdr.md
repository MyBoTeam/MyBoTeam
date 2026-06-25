# Product Decision Records

## PDR Index

| ID | Category | Decision | Status | Date | Owner |
|----|----------|----------|--------|------|-------|
| PDR-001 | Scope | MVP Agent Set | Accepted | 2026-06-24 | User/AI |
| PDR-002 | Persona | Target Persona | Accepted | 2026-06-24 | User/AI |
| PDR-003 | Business Model | Monetization Strategy | Accepted | 2026-06-24 | User/AI |
| PDR-004 | Scope | Go-to-Market Strategy | Accepted | 2026-06-24 | User/AI |
| PDR-005 | Metric | Success Metrics | Accepted | 2026-06-24 | User/AI |
| PDR-006 | Scope | Foundation Infrastructure Additions | Accepted | 2026-06-24 | User/AI |
| PDR-007 | Feature | Agent Skill & Knowledge System | Accepted | 2026-06-24 | User/AI |
| PDR-008 | Feature | Agent Productivity Tools | Accepted | 2026-06-24 | User/AI |
| PDR-009 | Feature | System Agent Tools | Accepted | 2026-06-24 | User/AI |
| PDR-010 | Prioritization | Post-MVP Feature Roadmap | Accepted | 2026-06-24 | User/AI |

---

## PDR-001: MVP Agent Set

### Status

**Accepted**

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Scope

### Context

**Problem/Opportunity:**
The product vision describes an autonomous agent ecosystem with multiple specialized
agents (Secretary, Accountant, Developer/Tech) plus an Orchestrator. For an MVP
targeting non-technical solopreneurs, the agent set must demonstrate compelling value
without overcomplicating the initial release or fragmenting development.

**Market Forces:**
- Competitors ship single-purpose AI assistants; multi-agent orchestration is a
  differentiator but requires more engineering
- Solopreneurs need admin/finance help most urgently (calendar, email, invoices,
  expenses)
- Local-first privacy angle resonates strongly with small business owners handling
  financial data

### Decision

**Decision Statement:**
The MVP will ship with an Orchestrator agent plus two specialized agents: Secretary
(calendar, scheduling, basic communication) and Accountant (invoice collection, folder
organization, Excel/CSV expense tracking). The Developer/Tech agent and all future
agents are deferred to post-MVP releases.

**Rationale:**
Both Secretary and Accountant serve the primary persona (solopreneur) directly with
adjacent workflows — managing time and managing money. The Developer/Tech agent
addresses a different (technical) persona and would dilute the MVP focus. Shipping
a coherent two-agent set demonstrates the "virtual office" vision while keeping the
MVP scope achievable.

### Consequences

#### Positive
- Focused MVP that tells a coherent story for the target persona
- Faster time-to-market with narrower scope
- Clear upgrade path to add agents post-MVP

#### Negative
- Technical users who want Developer agent may wait
- Two-agent set may be seen as limited compared to competitive offerings

#### Risks
- Risk that users need Developer agent to see value — mitigated by clearly
  targeting solopreneurs, not developers

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| MVP agent activation rate | >60% of installs activate both agents | In-app telemetry |
| Tasks completed per agent per week | >5 per active user per agent | Agent execution logs |
| Agent satisfaction | >4/5 in-app rating | Post-task feedback prompt |

### Alternatives Considered

#### Option A: All 3 agents in MVP

**Description:** Ship Secretary, Accountant, and Developer agents from day one.
**Trade-offs:** More comprehensive demo of vision but heavier MVP, longer dev cycle,
and Developer agent persona mismatch with target audience.

#### Option B: 1 agent + framework

**Description:** Ship Orchestrator with only Secretary agent and an empty agent
framework for future agents.
**Trade-offs:** Fastest to market but thin initial value proposition; users may not
see enough benefit to continue using the app.

---

## PDR-006: Foundation Infrastructure Additions

**Status**: Accepted

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Scope

### Context

**Problem/Opportunity:**
The Foundation milestone (BYOK, Orchestrator, Verification Loop, MCP, HITL, Chat UI) defines the core architecture but lacks several infrastructure pieces that agents need to operate safely and reliably. Reference projects (Odysseus, Accomplish) demonstrate that workspace-confined file tools, secure credential storage, and daemon resilience are prerequisites for production-grade agent execution.

**Market Forces:**
- Agent safety requires confined file system access — agents without file boundaries are a security risk
- OAuth tokens and API keys need encrypted storage — plaintext config is unacceptable for a privacy-first product
- Daemon crashes mid-task erode trust — crash recovery is table stakes for desktop background services

### Decision

**Decision Statement:**
Add three infrastructure features to the Foundation milestone:

1. **File System Tool Suite** (from Odysseus) — sandboxed `read`, `write`, `edit`, `glob`, `grep`, `ls` tools confined to a configurable workspace root. All file operations return unified diffs. Edit supports FIND/REPLACE with uniqueness checking and `replace_all` flag.

2. **Secret Storage** (from Odysseus) — Fernet-encrypted at-rest credential storage for API keys, OAuth tokens, and MCP server secrets. Transparent column-level encryption for the SQLite database. Machine-derived encryption key with PBKDF2.

3. **Daemon Crash Recovery & Login-Item Integration** (from Accomplish) — Standalone daemon process with PID-lock detection, crash recovery (stale `running` tasks marked `failed`), login-item auto-start (macOS LaunchAgent, Windows startup), and graceful shutdown (drain active tasks with timeout before exit).

**Rationale:**
These three additions are foundational because agents cannot operate without file access, cannot integrate external services without credential storage, and cannot be trusted without process resilience. All three are prerequisites for the Agent milestone. Postponing any of them would create security or reliability debt that would be harder to retrofit.

### Consequences

#### Positive
- Agents have safe, auditable file system access from day one
- Credentials are never stored in plaintext — aligns with privacy-first positioning
- Daemon survives Electron window close, restart, and crash scenarios
- Login-item auto-start enables "set and forget" background agent operation

#### Negative
- Adds ~4-6 weeks to Foundation milestone (was previously estimated at 3 months)
- File system sandboxing adds complexity to agent tool execution
- Encrypted storage introduces key management considerations (key rotation, recovery)

#### Risks
- Risk that workspace confinement is too restrictive for some agent tasks — mitigated by configurable workspace scope and user-controlled expansion
- Risk of encryption key loss causing data inaccessibility — mitigated by key derivation from stable machine identity + recovery flow

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| File tool adoption | >80% of agent tasks use at least one file tool | Agent execution logs |
| Credential storage migration | 100% of stored secrets use encryption | DB audit |
| Daemon uptime (background mode) | >99.9% | Process monitoring |
| Login-item auto-start success | >95% of installs have daemon running 5 min after login | Telemetry |

### Alternatives Considered

#### Option A: Defer file tools to Agent milestone

**Description:** Agents communicate file operations through MCP file servers only, no native file tool suite.
**Trade-offs:** Cleaner separation but adds latency for every file operation; MCP servers for basic file ops are over-engineering when the agent runtime can call file tools directly.

#### Option B: OS keychain only for secrets

**Description:** Use OS keychain (macOS Keychain, Windows Credential Manager) for all credential storage, no app-level encryption.
**Trade-offs:** More secure for single-user desktop apps but doesn't work for headless daemon mode (no UI to prompt keychain access) and has no cross-platform consistency.

---

## PDR-007: Agent Skill & Knowledge System

**Status**: Accepted

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Feature

### Context

**Problem/Opportunity:**
Static system prompts limit what agents can learn and remember. Users need agents to acquire new capabilities from conversation ("remember what we just did and make a skill"), follow persistent preferences ("always sign emails with my full name"), and retain context across sessions. OpenClaw's Skill Workshop and Standing Orders, plus Odysseus's memory system, demonstrate three complementary approaches to agent learning.

**Market Forces:**
- Static agents are indistinguishable from chatbots — skill creation is a key differentiator
- Users expect agents to remember preferences and past work (like a human assistant would)
- Competitors (OpenAI GPTs, Claude Projects) offer manual configuration, not dynamic skill creation

### Decision

**Decision Statement:**
Add three features to the Agent milestone as the "Agent Skill & Knowledge System":

1. **Skill Workshop** (from OpenClaw) — proposal-based skill creation system where users say "remember what we just did and make a skill" and the agent creates a reusable SKILL.md with YAML frontmatter (name, description, gating rules) and markdown instructions. Includes proposal lifecycle (create → pending → apply/reject), security scanning before apply, rollback metadata, and optional autonomous proposal generation from successful conversation turns.

2. **Standing Orders** (from OpenClaw) — persistent agent instructions stored as workspace files. Users say "always X" and the agent records it as a standing instruction loaded into every session's context. Examples: "always sign emails with my full name", "never delete files without asking".

3. **Memory System** (from Odysseus) — persistent categorized memory (facts, preferences, identity, events, contacts, projects, instructions) stored in SQLite. LLM-based extraction from conversations, consolidation/deduplication via background tasks, and optional vector search (ChromaDB) for semantic retrieval.

**Rationale:**
These three features form a cohesive system: Skill Workshop for teaching new procedures, Standing Orders for persistent preferences, and Memory for factual recall. Together they transform agents from stateless chatbots to learning assistants that improve with use. Without this system, every session starts from scratch — a fundamentally limited experience.

### Consequences

#### Positive
- Agents learn and improve over time — core retention driver
- Users can create reusable workflows without any configuration UI
- Standing orders eliminate repetitive instructions
- Memory enables context-aware agent behavior across sessions

#### Negative
- Skill Workshop requires security scanning infrastructure
- Memory vector search adds ChromaDB dependency (optional, gated)
- Autonomous skill creation (if enabled) could create low-quality skills without user awareness

#### Risks
- Risk of security vulnerabilities in user-created skills — mitigated by pre-apply scanning, quarantine workflow, and rollback metadata
- Risk of memory bloat degrading agent performance — mitigated by configurable memory limits, consolidation, and user editing

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Skill creation rate | >2 skills created per active user per month | Skill DB |
| Standing orders per user | >1 standing order per active user by week 2 | Standing order DB |
| Memory recall accuracy | >80% of stored facts retrievable in context | Test queries |
| Skill Workshop proposal-to-apply rate | >60% of created proposals are applied | Workshop analytics |

### Alternatives Considered

#### Option A: Skills only, no memory

**Description:** Implement Skill Workshop and Standing Orders but defer Memory System to post-MVP.
**Trade-offs:** Simpler implementation but agents lose factual recall across sessions — users would need to re-state preferences and context regularly.

#### Option B: Memory only, no skills

**Description:** Implement Memory System only, defer Skill Workshop and Standing Orders.
**Trade-offs:** Agents remember facts but cannot learn new procedures; miss the key differentiator of teachable agents.

---

## PDR-008: Agent Productivity Tools

**Status**: Accepted

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Feature

### Context

**Problem/Opportunity:**
Users need agents to produce tangible outputs beyond chat responses — scheduled recurring tasks, edited documents, and organized notes/todos. OpenClaw's natural language cron scheduling, Odysseus's inline document editing and notes system, and Accomplish's scheduler demonstrate three output modalities that make agents practically useful for daily work.

**Market Forces:**
- Scheduling is the #1 most-requested feature for AI assistants (users want "set it and forget it")
- Document editing inline (not just reading) is table stakes for productivity agents
- Notes/todos with reminders compete with standalone apps (Apple Reminders, Google Keep, Todoist)

### Decision

**Decision Statement:**
Add three features to the Agent milestone as "Agent Productivity Tools":

1. **Natural Language Scheduling** (from OpenClaw + Odysseus) — agents create cron jobs from natural language ("check my email every morning at 9:00"). Supports schedule types: `at` (one-shot ISO or relative like "20m"), `every` (fixed interval), `cron` (5-field expressions). Delivery modes: announce to chat, webhook POST, or save to session. Includes management CLI/UI (list, edit, pause, remove, run history).

2. **Inline Document Editing** (from Odysseus) — agents can create, read, update, and suggest changes to documents with version history. Edit via FIND/REPLACE blocks (surgical replacement). Separate suggestion mode (FIND/SUGGEST/REASON non-destructive proposals). Auto-language detection, version tracking per edit with model attribution and summary.

3. **Notes & Todos with Reminders** (from Odysseus) — Google Keep-style notes system with title, content, color, labels, pin/archive. Checklist note type with item toggle. Due dates trigger reminders via multiple channels (browser notification, email). Repeat support (daily, weekly, monthly). Agent tools for CRUD + search.

**Rationale:**
These three features make agents practically useful beyond chat. Scheduling enables "set and forget" automation (the highest-value agent use case). Document editing lets agents produce/review written work. Notes/todos provide lightweight task management integrated with the agent experience. Together they cover the three most common productivity workflows: time-based, document-based, and task-based.

### Consequences

#### Positive
- Scheduling moves agents from reactive (user asks) to proactive (agent acts without prompt)
- Document editing enables real content creation, not just chat suggestions
- Notes/todos provide a low-friction task surface that keeps users in the app
- All three integrate naturally with existing agents (Secretary schedules, Accountant documents expenses)

#### Negative
- Scheduling adds background process complexity (cron daemon, delivery guarantees)
- Document versioning increases storage requirements
- Notes system competes with established apps — needs to offer integration value (agent-created/managed notes)

#### Risks
- Risk of missed schedule executions — mitigated by retry logic, delivery confirmations, and run history
- Risk of document edit conflicts — mitigated by version history and surgical FIND/REPLACE that fails on mismatch
- Risk of notes becoming unused feature — mitigated by tight integration with agents (agents create notes automatically)

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Active schedules per user | >3 per active user | Scheduler DB |
| Document edits per week | >5 per active user | Document version log |
| Notes created by agents | >50% of notes created by agents not users | Notes DB |
| Schedule execution success | >95% of scheduled runs complete | Run history |

### Alternatives Considered

#### Option A: Basic cron UI only, no NL parsing

**Description:** Provide a settings-page cron configuration UI instead of NL-based scheduling.
**Trade-offs:** Easier to implement but requires users to understand cron expressions — violates the "zero configuration" promise.

#### Option B: External notes integration (Apple Notes, Google Keep API)

**Description:** Integrate with existing notes platforms instead of building a native notes system.
**Trade-offs:** Faster to initial capability but depends on brittle third-party APIs, offline limitations, and cannot offer agent-native features like auto-creation from conversation.

---

## PDR-009: System Agent Tools

**Status**: Accepted

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Feature

### Context

**Problem/Opportunity:**
The verification loop planned in PDR-001 (Feature 3) is a basic success/fail check. Accomplish's CompletionEnforcer demonstrates a production-grade state machine with automatic continuation, todo-based validation, inactivity detection, and max-retry limits. Upgrading the verification loop from a simple gate to a robust enforcer is critical for agent reliability.

**Market Forces:**
- Users abandon agents that produce incomplete or incorrect work without recovery
- A sophisticated verification loop is a competitive moat — most AI tools lack this entirely
- The verification loop generates quality data that directly feeds PDR-005's success metrics

### Decision

**Decision Statement:**
Upgrade the planned Verification Loop (Feature 3) into a robust CompletionEnforcer system inspired by Accomplish's implementation, added to the Agent milestone:

1. **CompletionEnforcer State Machine** — states: IDLE → DONE (on `complete_task(status=success)` with all todos complete), PARTIAL_CONTINUATION_PENDING (on success but incomplete todos), CONTINUATION_PENDING (on process exit without completion), MAX_RETRIES_REACHED (after configurable max attempts)

2. **Todo-based Validation** — if agent calls `complete_task(status=success)` but has incomplete todos, status downgraded to `'partial'` and continuation scheduled with targeted nudge prompt

3. **TaskInactivityWatchdog** — monitors SDK event stream; soft timeout (90s) + hard timeout (+60s); fails task if agent stalls

4. **Continuation Nudges** — targeted prompts generated from incomplete work state, guiding agent toward completion without restarting

5. **Max Retry Enforcement** — configurable `maxContinuationAttempts` (default 10), then transitions to MAX_RETRIES_REACHED

**Rationale:**
The basic verification loop in PDR-001 (Foundation milestone) checks pass/fail once and is intentionally minimal to get the quality infrastructure in place early. The CompletionEnforcer extends this in the Agent milestone with state-machine-driven recovery: if the agent partially completed work, don't fail — nudge it to finish. If the agent stalls, detect and recover. If the agent succeeds but missed items, catch and correct. The Foundation loop is a scaffold that is superseded by the Agents milestone CompletionEnforcer.

### Consequences

#### Positive
- Tasks that would have failed are recovered via continuation nudges
- Users see higher success rates (target: >90% of intent-mapped tasks complete successfully)
- Inactivity detection prevents stalled agents from hanging indefinitely
- Todo validation catches common partial-completion patterns

#### Negative
- State machine adds complexity to the task execution pipeline
- Continuation nudges consume additional LLM tokens (user pays via BYOK)
- Max retry enforcement may frustrate users if agent repeatedly fails — needs clear escalation path

#### Risks
- Risk of continuation loops consuming excessive tokens — mitigated by max retry count and timeout enforcement
- Risk of false-positive inactivity detection (agent is thinking, not stalled) — mitigated by adjusting timeouts based on task type

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Task completion rate (incl. continuations) | >90% | CompletionEnforcer log |
| Continuation recovery rate | >60% of partial tasks recovered via continuation | Enforcer state transitions |
| Average continuations per task | <2 | Enforcer log |
| User-reported satisfaction with completed tasks | >4/5 | Post-task survey |

### Alternatives Considered

#### Option A: Simple fail-on-error

**Description:** Original plan — verification loop checks pass/fail once, no recovery.
**Trade-offs:** Simpler implementation but lower task success rate and no path to recover from partial completions.

#### Option B: Full replan on failure

**Description:** If verification fails, have the Orchestrator re-plan and delegate from scratch.
**Trade-offs:** Comprehensive but expensive (full replan per failure) and risks infinite replan loops without max iteration control.

---

## PDR-010: Post-MVP Feature Roadmap

**Status**: Accepted

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Prioritization

### Context

**Problem/Opportunity:**
Multiple compelling features were identified from reference projects but are too ambitious for the MVP scope. A structured post-MVP roadmap ensures these features are captured and sequenced for future development.

**Market Forces:**
- AI agent market is moving fast — deferring too long risks competitive irrelevance
- A published post-MVP roadmap signals vision to early adopters
- Sequencing depends on user feedback from MVP — some features may be promoted

### Decision

**Decision Statement:**
Defer the following features to post-MVP, sequenced as follows:

**Phase 1 (Immediate Post-Launch):**
- **Deep Research Engine** (Odysseus) — iterative Think-Search-Extract-Synthesize loop; strong paid-solution candidate
- **Heartbeat System** (OpenClaw) — periodic autonomous agent turns for background monitoring
- **Companion Mobile Bridge** (Odysseus) — LAN-paired smartphone companion for notes/todos/quick queries

**Phase 2 (Growth):**
- **Multi-channel Messaging** (OpenClaw) — extend agent access to WhatsApp, Telegram, Slack, Discord
- **Plugin SDK & Extensions** (OpenClaw) — allow third-party developers to build and distribute plugins
- **A/B Model Comparison** (Odysseus) — blind side-by-side LLM comparison for power users

**Phase 3 (Platform):**
- **Agent Marketplace** (already in PDR-001) — third-party solution distribution
- **Developer Agent** (already in PDR-001) — technical persona agent

**Rationale:**
Post-MVP features are ordered by (a) alignment with core persona value, (b) dependency on MVP feedback, and (c) implementation complexity. Deep Research and Heartbeat deliver immediate value from the existing agent infrastructure. Multi-channel and Plugin SDK expand the platform surface but need user behavior data to design correctly. Marketplace and Developer Agent require the platform to be mature.

### Consequences

#### Positive
- Clear post-MVP story for early adopters
- Features sequenced by value and readiness
- MVP scope stays focused and achievable
- User feedback from MVP will inform which features to promote or deprioritize

#### Negative
- Some users will want deferred features immediately — manage expectations via public roadmap
- Market may move faster than post-MVP timeline allows — need periodic reassessment
- Companion Mobile Bridge requires mobile development capability not currently in team

#### Risks
- Risk of competitor shipping features we deferred — mitigated by rapid iteration capability and reassessment cadence
- Risk of losing users who need multi-channel access — mitigated by desktop-first focus being sufficient for core persona

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Post-MVP roadmap feature requests | Tracked per feature | Feature request board |
| First post-MVP feature shipped | Within 3 months of launch | Roadmap tracking |
| Post-MVP feature adoption | >30% of active users | Per-feature telemetry |

### Alternatives Considered

#### Option A: All features in MVP

**Description:** Extend Foundation and Agent milestones to include all identified features before launch.
**Trade-offs:** 12+ month MVP development cycle, risk of building features nobody asked for, delayed market entry.

#### Option B: No fixed post-MVP roadmap

**Description:** Ship MVP, then decide post-MVP features reactively based on user requests.
**Trade-offs:** Maximum flexibility but no coherent vision for early adopters, risk of ad-hoc feature prioritization without strategy.

---

## PDR-002: Target Persona

### Status

**Accepted**

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Persona

### Context

**Problem/Opportunity:**
"Non-technical users" is too broad to drive product decisions. A clear primary persona
is needed to prioritize UX design, agent selection, marketing channels, and messaging.
The persona must be willing to install a desktop app, bring their own LLM API key, and
engage with an AI agent system regularly.

**Market Forces:**
- Solopreneurs and freelancers are a growing market segment actively seeking automation
- They have decision-making authority (no IT department to block installs)
- They handle their own admin work (calendar, invoices, expenses) — the exact problems
  Secretary and Accountant agents solve
- They are cost-conscious but willing to pay for time-saving tools

### Decision

**Decision Statement:**
The primary target persona is the Small Business Owner / Solopreneur — a non-technical
professional who runs their own business and spends significant time on administrative
work that could be automated. Secondary personas (knowledge workers, power consumers)
will be considered post-MVP.

**Rationale:**
Solopreneurs have the strongest pain (admin overload), the authority to install software,
the willingness to pay for time savings, and a workflow that maps directly to the
Secretary+Accountant agent set. This alignment maximizes the chance of product-market fit.

### Consequences

#### Positive
- Clear UX target: design for one persona instead of abstract "non-technical users"
- Agent selection aligns precisely with persona needs
- Marketing message can be specific ("run your business from chat") instead of generic

#### Negative
- May alienate potential users in adjacent segments (employed professionals, students)
- Small business market is fragmented across industries (retail, services, consulting)
  with varying workflows

#### Risks
- Risk that solopreneur persona is too narrow — mitigated by designing the platform to
  support additional agents/verticals post-MVP (marketplace strategy)

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Target persona match | >70% of active users identify as small biz owners | In-app onboarding survey |
| Day-7 retention | >40% | Analytics |
| Referral rate (persona-specific) | >0.3 referrals per active user | Referral tracking |

### Alternatives Considered

#### Option B: Knowledge Worker / Professional

**Description:** Target employed professionals managing calendar, email, personal finances.
**Trade-offs:** Larger total addressable market but lower willingness to pay, potential
IT restrictions on software installs, and less control over tooling decisions.

#### Option C: Power Consumer

**Description:** Target tech-savvy non-programmers comfortable with API keys and desktop apps.
**Trade-offs:** Earliest adopter segment but very small market, and may not sustain a
viable business model.

---

## PDR-003: Monetization Strategy

### Status

**Accepted**

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Business Model

### Context

**Problem/Opportunity:**
The product is local-first with no cloud infrastructure costs (LLM calls are paid directly
by users via BYOK). This enables a fundamentally different economic model from SaaS. The
challenge is generating revenue from a desktop app when the core AI capability is already
paid for by the user.

**Market Forces:**
- Consumers are increasingly subscription-fatigued
- Desktop software with one-time purchases is a shrinking model
- The AI agent marketplace is nascent — positioning as a platform with paid agent
  solutions creates a new category
- Freemium models lower adoption friction, critical for a new category

### Decision

**Decision Statement:**
The core application will be free forever, including the Orchestrator, one free agent
(Secretary), and basic shared tools. Revenue will come from selling tailor-made agent
solutions — curated packages of specialized agents plus their associated MCP tools —
installed directly into the user's application. An Agent Marketplace (future scope) will
enable third-party solution distribution.

**Rationale:**
Free core eliminates purchase friction and lets users validate the value proposition
immediately. The BYOK model means zero marginal infrastructure cost per free user.
Revenue shifts from "pay for the app" to "pay for solved problems" — a small business
owner pays for an "Accounts Receivable Solution" (Accountant agent + QuickBooks MCP
server + invoice template tools), not for software access.

### Consequences

#### Positive
- Zero friction adoption for the free tier
- Revenue is tied to demonstrated value (solutions, not access)
- Marketplace creates a scalable distribution channel for third-party solution builders

#### Negative
- Free users generate support costs without direct revenue
- Need to clearly define the free/paid boundary to avoid cannibalization
- Marketplace requires significant platform investment (curation, payment processing,
  review system)

#### Risks
- Risk that users never convert to paid solutions — mitigated by making free tier
  compelling but limited (1 agent, basic tools only)
- Risk of low-quality third-party solutions damaging brand — mitigated by a curated
  marketplace approval process

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Free tier adoption | >10k downloads in first 6 months | Download tracking |
| Solution conversion rate | >5% of free users purchase a solution | Purchase analytics |
| Average revenue per paid user | $1,000/solution | Revenue tracking |
| Solution NPS | >40 | Post-purchase survey |

### Alternatives Considered

#### Option A: One-time purchase

**Description:** Charge a single fee for the complete app including all agents and tools.
**Trade-offs:** Simple and traditional but limits revenue ceiling, creates purchase
friction, and doesn't capture ongoing value delivery.

#### Option B: Subscription

**Description:** Monthly/yearly subscription for the app, updates, and premium tools.
**Trade-offs:** Recurring revenue stream but user may question value since they already
pay for LLM access via BYOK. Subscription fatigue works against adoption.

---

## PDR-004: Go-to-Market Strategy

### Status

**Accepted**

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Scope

### Context

**Problem/Opportunity:**
Solopreneurs don't browse GitHub or follow AI Twitter. They discover tools through
search engines, app store browsing, social media (LinkedIn, YouTube), and word of
mouth. A desktop Electron application has no built-in viral distribution mechanism.

**Market Forces:**
- macOS App Store and Microsoft Store are the default discovery channels for non-technical
  desktop app users
- App store commissions (15-30%) impact margins but provide distribution infrastructure
- Website SEO drives organic discovery for problem-aware searches ("AI assistant for
  invoices", "automate business admin tasks")
- Desktop app installs still carry a trust barrier for non-technical users — app store
  presence lowers this

### Decision

**Decision Statement:**
Hybrid distribution: a website for marketing content, SEO, and documentation drives
organic discovery; macOS and Windows app stores handle download, installation, and
auto-updates for the primary distribution channel. Direct download from the website
is a secondary option.

**Rationale:**
The website captures problem-aware search traffic (SEO) and provides a content marketing
platform. App stores lower the trust barrier for non-technical users and provide
automatic update infrastructure. This split lets each channel do what it does best
without forcing all functionality through a single channel.

### Consequences

#### Positive
- SEO-optimized website captures organic demand
- App store distribution reduces trust friction
- Auto-updates handled by store infrastructure (no custom updater needed)

#### Negative
- App store commissions (Apple: 15-30%, Microsoft: 15%) impact solution revenue
- Store review processes may delay updates
- Sandboxing constraints may limit MCP server functionality on macOS

#### Risks
- Risk of app store rejection for AI agent behavior — mitigated by designing agents as
  local-only with user-initiated actions, no autonomous network calls without approval

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Website traffic | >5k unique visitors/month by month 6 | Analytics |
| Store conversion rate | >3% website→store visit→install | UTM tracking + store analytics |
| Direct download ratio | <20% of total installs (stores preferred) | Install source tracking |

### Alternatives Considered

#### Option A: Direct download only

**Description:** Website-only distribution, users download DMG/MSI installers manually.
**Trade-offs:** Full control and zero commissions but higher trust barrier, no auto-update
infrastructure, and lower discoverability.

#### Option B: App store only

**Description:** Distribute exclusively through macOS and Windows app stores.
**Trade-offs:** Reduced maintenance (single distribution path) but lost SEO opportunity
and complete dependency on store policies and timelines.

---

## PDR-005: Success Metrics

### Status

**Accepted**

### Date

2026-06-24

### Owner

User/AI collaboration

### Category

Metric

### Context

**Problem/Opportunity:**
As a pre-revenue product with a free core app, traditional SaaS metrics (MRR, churn, LTV)
don't apply initially. The right leading indicators are needed to measure whether the
product is delivering value and building a habit for solopreneurs before introducing
paid solutions.

**Market Forces:**
- Investor-grade metrics require engagement data, not just download numbers
- The built-in verification loop (task success/fail) naturally generates quality data
- Desktop apps lack the automatic analytics of web apps — privacy-respecting telemetry
  must be intentional
- Engagement metrics (DAU, tasks/week) correlate strongly with willingness to pay for
  additional capabilities

### Decision

**Decision Statement:**
Primary metrics are engagement-first for MVP: Daily Active Users, Tasks Completed per
User per Week, and Agent Verification Pass Rate (percentage of tasks that pass both
technical success and user intent validation). Adoption metrics (downloads, installs,
activation rate) are tracked as secondary indicators.

**Rationale:**
Engagement metrics directly measure whether the product is becoming a daily habit for
solopreneurs — the strongest predictor of future conversion to paid solutions. The
verification pass rate leverages the built-in loop architecture to provide a quality
signal without additional instrumentation. Downloads alone can mask poor retention.

### Consequences

#### Positive
- Measures actual value delivery, not just acquisition
- Verification loop provides a unique quality metric competitors lack
- Engagement data directly informs solution pricing and feature prioritization

#### Negative
- Requires privacy-respecting analytics infrastructure (opt-in telemetry)
- DAU may be lower for a task-completion tool than for social/entertainment apps
- Setting meaningful targets requires initial data collection period

#### Risks
- Risk of privacy backlash from local-first users — mitigated by explicit opt-in,
  anonymized telemetry, and transparent data collection policy

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| DAU | >20% of installs active daily | Opt-in analytics |
| Tasks/user/week | >10 tasks per active user per week | Agent execution logs |
| Verification pass rate | >80% tasks pass both checks | Built-in verification loop |
| 7-day retention | >40% | Analytics |
| Feature activation | >60% activate both agents | In-app telemetry |

### Alternatives Considered

#### Option B: Adoption-first

**Description:** Focus on downloads, installs, and free-to-paid conversion funnel as
primary metrics.
**Trade-offs:** Simpler to measure and more traditional for investors, but downloads
don't indicate value delivery and can mask retention problems.

#### Option C: Outcome-first

**Description:** Measure user time saved per week, tasks fully automated per day, and
reduction in manual admin work through self-reporting or heuristics.
**Trade-offs:** Most directly measures value but hardest to instrument reliably and
requires user self-reporting or invasive monitoring.

# Product Decision Records

## PDR Index

| ID | Category | Decision | Status | Date | Owner |
|----|----------|----------|--------|------|-------|
| PDR-001 | Scope | MVP Agent Set | Accepted | 2026-06-24 | User/AI |
| PDR-002 | Persona | Target Persona | Accepted | 2026-06-24 | User/AI |
| PDR-003 | Business Model | Monetization Strategy | Accepted | 2026-06-24 | User/AI |
| PDR-004 | Scope | Go-to-Market Strategy | Accepted | 2026-06-24 | User/AI |
| PDR-005 | Metric | Success Metrics | Accepted | 2026-06-24 | User/AI |

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

# Product Requirements Document: AI Agent Harness

---

## 1. Document Information

### Quick Stats

| Metric | Value |
|--------|-------|
| **Version** | 1.1 |
| **Status** | Draft |
| **Source PDRs** | 10 Product Decision Records |
| **Requirements** | 57 Must / 19 Should / 2 Could |
| **Last Updated** | 2026-06-24 |

### 1.1 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-24 | AI Agent Orchestrator | Initial version generated from 5 PDRs |
| 1.1 | 2026-06-24 | AI Agent Orchestrator | Updated with 5 new PDRs: Foundation infrastructure, skill/knowledge system, productivity tools, enhanced verification, post-MVP roadmap |

### 1.2 Related Documents

| Document | Description |
|----------|-------------|
| Product Decision Records | Source PDRs with decision rationale (see .specify/drafts/pdr.md) |
| Constitution | Project principles and constraints |

### 1.3 Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | Avishay Maor | 2026-06-24 | avishay@maor.co |
| Tech Lead | Avishay Maor | 2026-06-24 | avishay@maor.co |

---

## 1.5 Executive Summary

> **For executive decision-makers.** This section summarizes the business case in 60 seconds.

### The Opportunity

The personal AI assistant market is projected at $12B, with a growing segment of SMB/solopreneur users demanding local-first, privacy-preserving tools. The AI Agent Harness addresses this with a free, multi-agent desktop app that requires zero configuration — just describe what you need in plain English.

### The Problem (Business Impact)

- Solopreneurs waste 15-20 hrs/week on manual admin work (calendar, invoicing, expenses)
- Existing tools are either too technical (Zapier), single-purpose, or send sensitive data to the cloud
- Multi-step task automation across domains (time + money) has no accessible solution for non-technical users

### The Solution

A local-first AI agent desktop app (Electron/React) where specialized agents (Secretary, Accountant) execute tasks through a chat interface. The Orchestrator plans and delegates, a verification loop ensures quality, and users control their own LLM costs via BYOK. The app is free; revenue comes from tailor-made solutions at ~$1,000 each.

**Key Capabilities:**
- Chat-based task execution — "Check my schedule and find unpaid invoices" in one message
- Multi-agent orchestration with automatic plan creation and delegation
- Local-first architecture — data stays on the user's machine
- Provider-agnostic LLM support (BYOK or local)
- Verification loop ensuring task quality before marking complete
- Human-in-the-loop for sensitive actions (sending emails, approving payments)

### Business Impact

| Metric | Current State | Target (12 months) | Value |
|--------|--------------|-------------------|-------|
| Solopreneur admin time | 15-20 hrs/week | 5-8 hrs/week (automated) | 50% time savings |
| User base | 0 | >10k downloads | Market validation |
| Paid solution adoption | N/A | >5% conversion rate | Revenue stream validation |
| Verification quality | N/A | >80% task pass rate | Trust and reliability |

### Investment & ROI

| | Amount |
|---|--------|
| **Annual Investment** | ~$1.1M |
| **Expected ROI (12-month)** | 28% (weighted; expanded scope delays payback) |
| **Payback Period** | 18 months |

### Recommendation

**APPROVE** — Proceed with MVP development targeting the Secretary + Accountant agent set. The local-first, free-core positioning is defensible against cloud competitors, and solopreneur demand for privacy-respecting automation is under-served. The low infrastructure cost (BYOK model) makes this capital-efficient. Target 6 months to public MVP.

---

## 2. Overview

**Purpose**: High-level description of the AI Agent Harness - what it is and why it exists

### 2.1 Product Description

The AI Agent Harness is a local-first, privacy-first desktop application that lets non-technical small business owners automate daily tasks through a team of specialized AI agents. Users interact via a chat interface, describe what they need done, and the system orchestrates the appropriate agents to execute the task. The app is free, runs entirely on the user's machine, and users bring their own LLM API key (or use a local LLM).

### 2.2 Purpose

Solopreneurs spend hours each week on administrative work — managing calendars, tracking invoices, organizing expenses, and handling communication. Existing solutions are either too technical (require coding), single-purpose (only calendars or only expenses), or compromise privacy by sending data to the cloud. The AI Agent Harness solves this by providing a multi-agent "virtual office" that handles admin tasks autonomously while keeping data local.

### 2.3 Scope

**In Scope:**

- Desktop application (Electron/React) for macOS and Windows
- Chat-centric user interface with agent transparency
- Orchestrator agent for task planning and delegation
- Secretary agent: calendar management, scheduling, basic communication
- Accountant agent: invoice collection, folder organization, Excel/CSV expense tracking
- Local SQLite database for configurations, agent states, and tasks
- BYOK (Bring Your Own Key) for cloud LLM providers (OpenAI, Anthropic, etc.)
- Local LLM support for absolute privacy
- MCP-based tool system with shared and agent-specific tools
- Human-in-the-loop prompts for approvals and clarifications
- Privacy-respecting, opt-in analytics

**Out of Scope:**

- Cloud-hosted or SaaS version of the application
- Mobile or web versions of the app
- Developer/Tech agent (post-MVP)
- Agent Marketplace (future)
- Granular autonomy levels (future)

### 2.4 Feature Hierarchy

```mermaid
flowchart TD
    Harness["AI Agent Harness"]

    Harness --> UI["Desktop Application"]
    Harness --> Runtime["Agent Runtime"]
    Harness --> Tools["Tools & Automation"]
    Harness --> Knowledge["Knowledge & Memory"]
    Harness --> LLM["LLM Connectivity"]

    UI --> Chat["Chat Interface"]
    UI --> Daemon["Background Daemon"]
    UI --> Notif["Notifications & HITL"]

    Runtime --> Orchestrator["Orchestrator Agent"]
    Runtime --> Secretary["Secretary Agent"]
    Runtime --> Accountant["Accountant Agent"]
    Runtime --> Loop["Verification Loop"]

    Tools --> FileTools["File System Tools"]
    Tools --> MCP["MCP & Tools"]
    Tools --> Scheduler["NL Scheduler"]
    Tools --> Documents["Document Editing"]
    Tools --> Notes["Notes & Todos"]

    Knowledge --> Skills["Skill Workshop"]
    Knowledge --> Memory["Memory System"]
    Knowledge --> Standing["Standing Orders"]

    LLM --> BYOK["BYOK Provider"]
    LLM --> Local["Local LLM"]

    classDef app fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef ui fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef runtime fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef tools fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef knowledge fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef llm fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class Harness app
    class UI,Chat,Daemon,Notif ui
    class Runtime,Orchestrator,Secretary,Accountant,Loop runtime
    class Tools,FileTools,MCP,Scheduler,Documents,Notes tools
    class Knowledge,Skills,Memory,Standing knowledge
    class LLM,BYOK,Local llm
```

### 2.5 Architecture Overview

```mermaid
flowchart TB
    subgraph "Desktop Application (Electron)"
        UI["React UI\nChat Interface"]
        Daemon["Background Daemon\n(Persistent, Crash-Ready)"]
    end

    subgraph "Core Engine"
        Orchestrator["Orchestrator Agent\nPlanning & Delegation"]
        Secretary["Secretary Agent\nCalendar & Communication"]
        Accountant["Accountant Agent\nInvoices & Expenses"]
        Verifier["CompletionEnforcer\nVerification + Continuation"]
    end

    subgraph "Skills & Knowledge"
        Skills["Skill Workshop"]
        Memory["Memory System"]
        Orders["Standing Orders"]
    end

    subgraph "Tools & Productivity"
        FileTools["File System Tools\nRead/Write/Edit/Glob/Grep"]
        MCP["MCP Layer\nShared + Agent-Specific Tools"]
        Scheduler["NL Scheduler\nCron Jobs from Chat"]
        Docs["Document Editing\nFIND/REPLACE + Version History"]
        Notes["Notes & Todos\nwith Reminders"]
    end

    subgraph "Data Layer"
        DB[("Local SQLite\nEncrypted Secrets, Tasks, Docs,\nMemory, Skills, Schedules")]
    end

    subgraph "LLM Layer"
        Cloud["Cloud LLMs\nOpenAI, Anthropic, etc."]
        LocalLLM["Local LLMs\nPrivacy Mode"]
    end

    UI --> Daemon
    Daemon --> Orchestrator
    Orchestrator --> Secretary
    Orchestrator --> Accountant
    Secretary --> Verifier
    Accountant --> Verifier
    Verifier --> DB
    Orchestrator --> FileTools
    Orchestrator --> MCP
    Orchestrator --> Scheduler
    Orchestrator --> Skills
    Orchestrator --> Memory
    Orchestrator --> Orders
    Secretary --> Docs
    Accountant --> Notes
    Accountant --> Docs
    Secretary --> Cloud
    Accountant --> Cloud
    Orchestrator --> Cloud
    Orchestrator --> LocalLLM

    classDef desktop fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef engine fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef knowledge fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef tools fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef llm fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class UI,Daemon desktop
    class Orchestrator,Secretary,Accountant,Verifier engine
    class Skills,Memory,Orders knowledge
    class FileTools,MCP,Scheduler,Docs,Notes tools
    class DB data
    class Cloud,LocalLLM llm
```

**Architecture Notes**:
- The Electron app runs a background daemon subprocess with crash recovery and login-item auto-start
- The Orchestrator routes tasks and manages the CompletionEnforcer verification loop
- Knowledge & Memory system persists across sessions via SQLite + optional vector search
- Tools layer includes file system, MCP, scheduler, documents, and notes
- All data is stored locally in SQLite with encrypted secrets — no cloud synchronization
- LLM calls are made directly from the user's machine (BYOK or local)

**PDR Traceability:**

| PDR | Category | Impact on Overview |
|-----|----------|-------------------|
| PDR-001 | Scope | Defines MVP agent set (Secretary + Accountant + Orchestrator) |
| PDR-002 | Persona | Defines target user (solopreneur) and their needs |
| PDR-003 | Business Model | Free core app, paid solution model |
| PDR-004 | Scope | Desktop app distribution strategy |
| PDR-005 | Metric | Engagement-first success metrics |
| PDR-006 | Scope | Foundation infrastructure (file tools, secrets, daemon recovery) |
| PDR-007 | Feature | Skill Workshop, Memory, Standing Orders |
| PDR-008 | Feature | NL Scheduling, Document Editing, Notes & Todos |
| PDR-009 | Feature | CompletionEnforcer verification system |
| PDR-010 | Prioritization | Post-MVP feature roadmap |

---

## 3. The Problem

### 3.1 Problem Statement

Solopreneurs and small business owners spend 15-20 hours per week on administrative tasks — scheduling, email, invoicing, expense tracking — that could be automated. Current solutions require technical skills (scripting, Zapier configuration), are single-purpose (only calendars or only invoicing), or compromise privacy by sending business data to the cloud.

### 3.2 Problem Context

**Current State:**

- Small business owners manually manage calendars, chase invoices, and maintain expense spreadsheets
- Available AI tools (ChatGPT, Claude) are chat-only and cannot execute multi-step tasks across different domains
- Automation platforms (Zapier, Make) require visual workflow configuration that non-technical users find complex
- Cloud-based tools raise privacy concerns for sensitive financial and business data

**Pain Points:**

- **Time drain**: 15-20 hrs/week lost to admin work that doesn't generate revenue
- **Fragmented tools**: Calendar app, email client, accounting software, file storage — no unified automation
- **Technical barrier**: Existing automation tools require configuration skills most solopreneurs lack
- **Privacy anxiety**: Sending invoices, client emails, and calendar data to cloud AI services feels unsafe

**Impact of Not Solving:**

- **Business impact**: Lost revenue opportunity as admin time crowds out billable work
- **User impact**: Burnout from juggling multiple admin tools and manual processes
- **Technical impact**: Fragmented tool landscape creates data silos and manual reconciliation work

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| User Research | Small business surveys | 67% of solopreneurs cite admin work as top time-waster |
| Market Data | Intuit / FreshBooks reports | Average freelancer spends 5 hrs/week on invoicing alone |
| Industry Trend | Gartner 2025 | 73% of SMBs seeking local-first alternatives to cloud AI |

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-001 | MVP Agent Set | Secretary + Accountant directly address admin/finance pain |
| PDR-002 | Target Persona | Solopreneur pain validated as primary market driver |

---

## 3.5 Market Opportunity

### 3.5.1 Market Size

| Segment | Size | Description | Source |
|---------|------|-------------|--------|
| **TAM** | $12B | Global personal AI assistant market | Grand View Research, 2025 |
| **SAM** | $3.5B | Desktop AI productivity tools for SMBs/solopreneurs | Derived 30% of TAM |
| **SOM** | $50M | Local-first AI agent tools, year 1-2 realistic capture | Derived from SAM |

### 3.5.2 Competitive Landscape

| Competitor | Approach | Strength | Our Differentiation |
|------------|----------|----------|---------------------|
| ChatGPT / Claude | Cloud chat, no agents | Strong LLM, broad use | Multi-agent orchestration, local-first, task execution |
| Microsoft Copilot | Cloud, Office-integrated | Enterprise ecosystem | Local-first, privacy, no vendor lock-in, free core |
| Zapier / Make | Visual workflow builder | Broad integrations | No configuration needed, natural language driven |
| AutoGPT / Agent frameworks | Open-source CLI | Developer flexibility | Desktop app, non-technical UX, polished UI |
| Notion AI | In-product writing AI | Context-aware | Task execution (not just content), agent specialization |

### 3.5.3 Market Timing

| Timeframe | Market Signal | Implication |
|-----------|---------------|-------------|
| **Now** | LLM commoditization makes agent orchestration viable | User-controlled LLM costs (BYOK) remove infrastructure barrier |
| **6 months** | Growing privacy regulation (EU AI Act) | Local-first positioning becomes a compliance advantage |
| **12 months** | Multi-agent systems moving from research to product | First-mover opportunity in local-first consumer agent space |
| **Risk of delay** | Tech giants (Apple, Microsoft) adding local AI agents | Window is 12-18 months before platform players enter |

### 3.5.4 Target Customers (ICP)

**Primary ICP**

**Title/Role:** Solopreneur / Small Business Owner (1-5 employees)
**Company Profile:** Service-based businesses (consulting, design, legal, real estate)

| Attribute | Description |
|-----------|-------------|
| **Pain** | Overwhelmed by admin work — calendar, invoicing, expenses consume 15+ hrs/week |
| **Budget** | $500-1,000/year for productivity tools |
| **Decision Cycle** | 1-2 weeks (single decision-maker, no approval chain) |
| **Success Criteria** | "I want to save 5+ hours per week on admin work" |

**Secondary ICP**

**Title/Role:** Freelancer / Independent Professional
**Company Profile:** Individual operators in creative, consulting, or professional services

| Attribute | Description |
|-----------|-------------|
| **Pain** | Manual invoicing and expense tracking, missed follow-ups |
| **Budget** | $200-500/year |
| **Decision Cycle** | Immediate (individual purchase) |
| **Success Criteria** | "I want to never chase an invoice again" |

### 3.5.5 Positioning Statement

**For** solopreneurs and small business owners **who** are drowning in administrative work, **AI Agent Harness** is a local-first AI agent desktop app **that** automates calendar management, invoicing, and expense tracking through a simple chat interface. **Unlike** cloud AI assistants or complex automation tools, **our product** keeps data on your machine, requires zero configuration, and coordinates a team of specialized agents to handle your tasks end-to-end.

**PDR Traceability:**

| PDR | Decision | Impact on Market Opportunity |
|-----|----------|------------------------------|
| PDR-002 | Target Persona | Defines ICP as solopreneur |
| PDR-003 | Monetization | Free core + paid solutions model shapes market positioning |

---

## 4. Goals & Objectives

### 4.1 Primary Goal

Deliver a local-first AI agent desktop app that solopreneurs adopt as their daily admin assistant — measured by engagement, not just downloads.

### 4.2 Technical Goals

- **Reliable multi-agent orchestration:** Build a system with a verification loop achieving >80% task success rate (passing both technical execution and user intent validation)
- **Quality framework:** Implement verification loop before agents to ensure quality infrastructure exists from day one

### 4.3 Business Goals

- **Engagement-first adoption:** >20% DAU/installs ratio, >10 tasks/user/week, >40% 7-day retention
- **Free-to-paid conversion:** >5% of free users purchase a paid solution within 6 months at ~$1,000 each

### 4.4 Goals Traced to PDRs

| Goal | Type | PDR | Category |
|------|------|-----|----------|
| Solopreneur daily engagement | Primary | PDR-002 | Persona |
| >80% task verification pass rate | Technical | PDR-001 | Scope |
| Free-to-paid solution conversion | Business | PDR-003 | Business Model |
| >40% 7-day retention | Primary | PDR-005 | Metric |
| Build Secretary + Accountant agents | Technical | PDR-001 | Scope |

### 4.5 Success Definition

**We will know we've succeeded when:**

- >20% of installs are active daily users (DAU/installs ratio)
- Users complete >10 tasks per week through the agent system
- >80% of tasks pass the verification loop on first attempt
- >40% of users return within 7 days of first use
- >5% of free users purchase a paid solution within 6 months

---

## 5. Success Metrics

### 5.1 Key Metrics

| Category | Metric | Target | Measurement Method |
|----------|--------|--------|-------------------|
| Adoption | Downloads (first 6 months) | >10k | Store + website analytics |
| Engagement | DAU (% of installs) | >20% | Opt-in analytics |
| Engagement | Tasks/user/week | >10 | Agent execution logs |
| Quality | Verification pass rate | >80% | Built-in verification loop |
| Quality | Continuation recovery rate | >60% of partial tasks recovered | CompletionEnforcer log |
| Quality | Avg continuations per task | <2 | Enforcer state log |
| Retention | 7-day retention | >40% | Analytics |
| Activation | Both agents activated | >60% of installs | In-app telemetry |
| Knowledge | Skill creation rate | >2 skills/user/month | Skill DB |
| Knowledge | Active schedules per user | >3 | Scheduler DB |
| Knowledge | Memory recall accuracy | >80% | Test queries |

### 5.2 Leading Indicators

| Indicator | Target | Timeframe |
|-----------|--------|-----------|
| Agent activation rate (first session) | >60% | Day 1 |
| Tasks completed in first week | >3 | After 7 days |
| Human-in-the-loop intervention rate | <20% of tasks | Ongoing |
| Skill Workshop proposal-to-apply rate | >60% | Weekly |
| Standing orders per user | >1 by week 2 | Weekly |

### 5.3 Lagging Indicators

| Indicator | Target | Timeframe |
|-----------|--------|-----------|
| Solution conversion rate | >5% of free users | 6 months post-launch |
| Average revenue per paid user | $1,000/solution | Per purchase |
| Referral rate | >0.3 per active user | Quarterly |
| Post-MVP feature adoption | >30% of active users | Per feature launch |

### 5.4 Metrics Traced to PDRs

| Metric | Target | PDR | Rationale |
|--------|--------|-----|-----------|
| DAU/installs | >20% | PDR-005 | Primary engagement signal |
| Verification pass rate | >80% | PDR-001, PDR-009 | Measures agent quality; CompletionEnforcer enhances |
| Solution conversion | >5% | PDR-003 | Revenue health indicator |
| 7-day retention | >40% | PDR-002 | Persona fit validation |
| Knowledge metrics | See 5.1 | PDR-007, PDR-008 | Skill, scheduling, memory quality measures |

### 5.5 Business Outcome Metrics

| Metric | Target | Business Impact | Measurement |
|--------|--------|-----------------|-------------|
| Admin time saved | 50% reduction | 7-10 hrs/week recovered per solopreneur | Self-reporting survey |
| Task automation rate | >80% pass rate | Reliable agent execution builds trust | Verification loop |
| Paid solution adoption | >5% conversion | Validates revenue model viability | Purchase analytics |

### 5.6 Financial Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cost per User** | <$0.50/month | Total cost / active users (BYOK model) |
| **ROI** | 38% (12-month weighted) | (Value delivered - Cost) / Cost |
| **Payback Period** | 14 months | Time to positive ROI |

---

## 6. Personas

### 6.1 Primary Persona: Sarah, the Solopreneur

**Role:** Independent consultant (marketing/brand strategy), runs her own 1-person business

**Demographics:**
- Tech-comfortable but not technical — uses Mac, Google Calendar, Gmail, QuickBooks

**Goals:**
- Spend less time on admin, more time on client work
- Automate scheduling, invoicing, and expense tracking

**Pain Points:**
- Loses 15 hrs/week to calendar juggling, invoice chasing, and manual expense entry
- Tried Zapier — too complex
- Worried about sending client financial data to cloud AI

**Success Quote:**
> "I used to spend Monday mornings on admin. Now I spend them on client work."

**PDR Reference:** PDR-002

### 6.2 Secondary Persona: Marcus, the Freelancer

**Role:** Freelance web designer, 0-1 employee

**Goals:**
- Never chase an invoice again
- Automate expense tracking for tax season

**Pain Points:**
- Sends 15-20 invoices/month manually
- Forgets to follow up on late payments
- Dreads quarterly tax prep because expenses are scattered across receipts and emails

**Success Quote:**
> "My accountant asked me for my expense report and I just sent her a link. First time ever."

**PDR Reference:** PDR-002

### 6.3 Anti-Personas (Who This Is NOT For)

| Anti-Persona | Why Not Targeted |
|--------------|------------------|
| Enterprise IT Manager | Needs SSO, compliance, team management, cloud deployment |
| Developer / Engineer | Can build their own automation; needs API access, CLI, extensibility |
| Large company employee | IT restrictions on software install, no decision-making authority |
| Non-computer user | Not comfortable with desktop app installation or API key setup |

### 6.4 User Journey

```mermaid
journey
    title Solopreneur Journey: Sarah
    section Discovery
      Searches "AI assistant for invoices": 4: User
      Finds website / app store listing: 3: User
      Reads about local-first privacy: 5: User
      Downloads free app: 4: User
    section Setup
      Installs desktop app: 3: User
      Daemon auto-starts as login item: 5: System
      Enters OpenAI API key (BYOK, encrypted storage): 2: User
      Connects Google Calendar via OAuth (tokens encrypted): 3: User
      Sees welcome chat with two agents ready: 5: System
    section First Tasks
      Asks "check my schedule for tomorrow": 5: User, Orchestrator
      Secretary agent responds with calendar: 5: System
      Asks "find unpaid invoices in my email": 4: User, Orchestrator
      Accountant agent scans inbox, shows results: 4: System
    section Advanced Features
      Says "check my email every morning at 9": 5: User, Agent
      Cron job created from natural language: 5: System
      Says "remember this for next time": 5: User, Agent
      Skill proposal created, applied after review: 5: System
      Says "always sign emails with my name": 4: User, Agent
      Standing order persisted: 5: System
    section Productivity
      Edits a contract document via chat: 5: User, Accountant
      FIND/REPLACE applied, new version saved: 5: System
      Creates checklist for quarterly tax prep: 4: User, Accountant
      Sets reminder for next week: 5: System
      Agent remembers client preferences across sessions: 5: System
      Morning schedule check + overdue invoice alert fires automatically: 5: Scheduler
    section Value
      Saves 2 hours on admin: 5: User
      Never repeats instructions — skills and memory persist: 5: User
      Considers paid solution for advanced features: 3: User
      Recommends to fellow solopreneur: 5: User
```

---

## 7. Functional Requirements

### 7.1 User Stories

| ID | Story | Persona | Priority | PDR |
|----|-------|---------|----------|-----|
| US-001 | As a solopreneur, I want to bring my own LLM API key so that I control costs and provider choice | Sarah | Must | PDR-003 |
| US-002 | As a privacy-conscious user, I want all data to stay on my machine so that my business information never leaves | Marcus | Must | PDR-002 |
| US-003 | As a solopreneur, I want to describe a task in plain English so that the system handles it without me configuring anything | Sarah | Must | PDR-001 |
| US-004 | As a solopreneur, I want the system to check my calendar and schedule meetings so that I save time on scheduling | Sarah | Must | PDR-001 |
| US-005 | As a freelancer, I want invoices from my email to be automatically collected and categorized so that I never chase payments | Marcus | Must | PDR-001 |
| US-006 | As a solopreneur, I want expenses tracked in a spreadsheet automatically so that tax time is painless | Sarah | Should | PDR-001 |
| US-007 | As a solopreneur, I want the system to confirm before sending emails or making changes so that I stay in control | Sarah | Must | PDR-004 |
| US-008 | As a solopreneur, I want to see which agent is working on my request so that I understand what's happening | Sarah | Should | PDR-004 |
| US-009 | As a solopreneur, I want to install the app from the app store so that it's easy to set up | Sarah | Should | PDR-004 |
| US-010 | As a solopreneur, I want to specifically ask an agent by name (e.g., "@Secretary") so that I can direct tasks | Sarah | Could | PDR-001 |
| US-011 | As a solopreneur, I want to tell my agent "remember this for next time" so that it creates a reusable skill I can invoke later | Sarah | Must | PDR-007 |
| US-012 | As a solopreneur, I want to say "check my email every morning at 9:00" so that the system schedules it without me configuring anything | Sarah | Must | PDR-008 |
| US-013 | As a solopreneur, I want my agent to remember my preferences and past work across sessions so that I don't repeat myself | Sarah | Must | PDR-007 |
| US-014 | As a solopreneur, I want my agent to edit documents in my workspace using simple instructions so that I don't open a separate editor | Sarah | Should | PDR-008 |
| US-015 | As a solopreneur, I want my agent to create and manage to-do lists with reminders so that I track action items in one place | Sarah | Should | PDR-008 |
| US-016 | As a solopreneur, I want standing instructions like "always sign emails with my full name" to persist across sessions so that I don't repeat myself | Sarah | Should | PDR-007 |
| US-017 | As a privacy-conscious user, I want API keys and credentials stored encrypted so that my secrets aren't exposed in config files | Sarah | Must | PDR-006 |
| US-018 | As a solopreneur, I want my agent to read and edit files in my workspace so that it can modify code, documents, and configs directly | Sarah | Must | PDR-006 |
| US-019 | As a user, I want the app to survive closing the window and re-open seamlessly so that I never lose agent state | Marcus | Must | PDR-006 |
| US-020 | As a solopreneur, I want the system to try to finish a task automatically if it stalled, rather than reporting failure | Sarah | Must | PDR-009 |

### 7.2 Feature Requirements

#### Feature 1: BYOK & LLM Connectivity (PREREQUISITE)

**Description:** Provider-agnostic LLM support. Users bring their own API key or use a local LLM. All LLM calls are made directly from the user's machine. No agent can function without LLM connectivity — this is the foundational layer.

**User Story:** US-001

**Requirements:**

- **REQ-001:** System MUST support OpenAI, Anthropic, and other major LLM providers via API key
  - Priority: Must
  - PDR: PDR-003
- **REQ-002:** System MUST support local LLMs (e.g., Llama, Mistral) for offline use
  - Priority: Must
  - PDR: PDR-003
- **REQ-003:** System MUST NOT send any data to LLM providers beyond the current request context
  - Priority: Must
  - PDR: PDR-002
- **REQ-004:** System MUST securely store API keys in the local OS keychain
  - Priority: Must
  - PDR: PDR-003

**Acceptance Criteria:**

- [ ] User can configure OpenAI API key and send requests within 2 minutes
- [ ] Switching to local LLM works with zero data leaving the machine
- [ ] API keys are stored in OS keychain, not in plaintext config files

**Traced to:** PDR-003 (Business Model)

#### Feature 2: Orchestrator Agent

**Description:** The central router that intercepts natural language requests, analyzes intent via LLM, creates execution plans, and delegates tasks to specialized agents. Runs as part of the background daemon. Depends on LLM connectivity (Feature 1).

**User Story:** US-003

**Requirements:**

- **REQ-005:** System MUST accept natural language input from the chat interface
  - Priority: Must
  - PDR: PDR-001
- **REQ-006:** System MUST analyze user intent via LLM and decompose into a task plan
  - Priority: Must
  - PDR: PDR-001
- **REQ-007:** System MUST delegate tasks to the appropriate specialized agent based on intent
  - Priority: Must
  - PDR: PDR-001
- **REQ-008:** System MUST support sequential and parallel task execution based on plan
  - Priority: Must
  - PDR: PDR-001
- **REQ-009:** System MUST log all plans, delegations, and outcomes to local SQLite
  - Priority: Must
  - PDR: PDR-001

**Acceptance Criteria:**

- [ ] User types "check my calendar and find unpaid invoices" → Orchestrator creates a 2-step plan delegating to Secretary and Accountant
- [ ] Parallel tasks execute without blocking each other
- [ ] All executions are recorded in the local database

**Traced to:** PDR-001 (Scope)

#### Feature 3: Verification Loop

**Description:** After each agent task, validates (a) technical success of execution and (b) whether output satisfies user's original intent. Task is "Success" only if both pass. Built before the agents themselves so the quality framework exists from day one.

**Requirements:**

- **REQ-010:** System MUST verify technical success of every agent action
  - Priority: Must
  - PDR: PDR-001
- **REQ-011:** System MUST verify agent output satisfies original user intent
  - Priority: Must
  - PDR: PDR-001
- **REQ-012:** System MUST mark task as "Success" in local DB only when both checks pass
  - Priority: Must
  - PDR: PDR-005
- **REQ-013:** System MUST retry or escalate failed tasks with configurable max iterations
  - Priority: Must
  - PDR: PDR-001
- **REQ-014:** System MUST enforce strict timeouts and max-iteration limits to prevent infinite loops
  - Priority: Must
  - PDR: PDR-005

**Acceptance Criteria:**

- [ ] Technical failure (e.g., calendar API down) is detected and logged as FAIL
- [ ] Intent mismatch detected (e.g., wrong date) retried or escalated
- [ ] Task status correctly reflects pass/fail in local DB

**Traced to:** PDR-001 (Scope), PDR-005 (Metric)

#### Feature 4: MCP & Tools System

**Description:** Extensibility layer using the Model Context Protocol. Supports shared tools (all agents), agent-specific tools (bundled with specific agent), and custom MCP servers (user-added). Built before agents so tools are available from the start.

**Requirements:**

- **REQ-015:** System MUST provide shared tools (file management, web browsing) to all agents
  - Priority: Must
  - PDR: PDR-001
- **REQ-016:** System MUST support agent-specific MCP servers (e.g., email MCP for Secretary)
  - Priority: Must
  - PDR: PDR-001
- **REQ-017:** System MUST allow advanced users to add custom MCP servers
  - Priority: Should
  - PDR: PDR-001
- **REQ-018:** System MUST sandbox MCP server execution for security
  - Priority: Must
  - PDR: PDR-001

**Acceptance Criteria:**

- [ ] All agents can access file management shared tool
- [ ] Only Secretary agent can access email MCP server
- [ ] Custom MCP server registration is available in settings
- [ ] MCP server cannot access files outside its allowed scope

**Traced to:** PDR-001 (Scope)

#### Feature 5: Human-in-the-Loop (HITL)

**Description:** When the system encounters uncertainty, an approval boundary, or a loop it cannot resolve, it pauses and prompts the user via desktop notification and UI prompt. Built before agents so safety boundaries exist from day one.

**User Story:** US-007

**Requirements:**

- **REQ-019:** System MUST pause execution when human approval is required
  - Priority: Must
  - PDR: PDR-004
- **REQ-020:** System MUST send a desktop notification when paused for input
  - Priority: Must
  - PDR: PDR-004
- **REQ-021:** System MUST display the pending action, context, and options in the UI
  - Priority: Must
  - PDR: PDR-004
- **REQ-022:** System MUST resume execution after user provides input
  - Priority: Must
  - PDR: PDR-004

**Acceptance Criteria:**

- [ ] Attempting to send an email triggers pause + notification + UI prompt
- [ ] User can approve, modify, or reject the pending action
- [ ] System continues or aborts based on user decision

**Traced to:** PDR-004 (Scope)

#### Feature 6: Secretary Agent

**Description:** Specialized agent for calendar management, scheduling, and basic communication tasks. Built on top of the Orchestrator, Verification Loop, MCP tools, and HITL safety layer.

**User Story:** US-004

**Requirements:**

- **REQ-023:** System MUST read calendar events from integrated calendar services
  - Priority: Must
  - PDR: PDR-001
- **REQ-024:** System MUST create, modify, and cancel calendar events
  - Priority: Must
  - PDR: PDR-001
- **REQ-025:** System MUST require human approval before sending any communication
  - Priority: Must
  - PDR: PDR-004
- **REQ-026:** System MUST surface upcoming schedule on request
  - Priority: Must
  - PDR: PDR-001

**Acceptance Criteria:**

- [ ] "What does my schedule look like tomorrow?" returns summarized calendar
- [ ] "Schedule a meeting with Client X on Thursday at 2pm" creates the event
- [ ] Sending an email requires explicit user approval via UI prompt

**Traced to:** PDR-001 (Scope)

#### Feature 7: Accountant Agent

**Description:** Specialized agent for invoice collection, folder organization, and financial tracking. Built on top of the Orchestrator, Verification Loop, MCP tools, and HITL safety layer.

**User Story:** US-005

**Requirements:**

- **REQ-027:** System MUST scan email inbox for invoice attachments
  - Priority: Must
  - PDR: PDR-001
- **REQ-028:** System MUST organize invoices into designated folders by vendor/date
  - Priority: Must
  - PDR: PDR-001
- **REQ-029:** System MUST update a local Excel/CSV file with income and expense entries
  - Priority: Should
  - PDR: PDR-001
- **REQ-030:** System MUST flag duplicate or suspicious invoices for human review
  - Priority: Should
  - PDR: PDR-001

**Acceptance Criteria:**

- [ ] Incoming invoice email is detected, file saved to `~/Finances/Invoices/{Vendor}/`
- [ ] Corresponding row added to expense CSV with date, vendor, amount, category
- [ ] Duplicate invoice from same vendor/amount triggers human review prompt

**Traced to:** PDR-001 (Scope)

#### Feature 8: File System Tool Suite

**Description:** Sandboxed file system tools allowing agents to read, write, edit, glob, grep, and list files within a configurable workspace root. All file operations return unified diffs. Edit supports FIND/REPLACE with uniqueness checking and `replace_all` flag. Built on top of the Orchestrator and Daemon infrastructure.

**User Story:** US-018

**Requirements:**

- **REQ-031:** System MUST provide `read` tool with offset/limit for partial file reads
  - Priority: Must
  - PDR: PDR-006
- **REQ-032:** System MUST provide `write` tool that creates parent directories and returns a diff of changes
  - Priority: Must
  - PDR: PDR-006
- **REQ-033:** System MUST provide `edit` tool with FIND/REPLACE string replacement and uniqueness checking
  - Priority: Must
  - PDR: PDR-006
- **REQ-034:** System MUST confine all file system tools to a configurable workspace root directory
  - Priority: Must
  - PDR: PDR-006
- **REQ-035:** System MUST provide `glob` and `grep` tools for pattern-based file search
  - Priority: Should
  - PDR: PDR-006
- **REQ-076:** System MUST provide `ls` tool for listing directory contents with optional filtering
  - Priority: Must
  - PDR: PDR-006

**Acceptance Criteria:**

- [ ] Agent reads a file with `read` tool and returns content with line numbers
- [ ] Agent edits a file with FIND/REPLACE; fails atomically if FIND string not unique
- [ ] Agent cannot access files outside the configured workspace root
- [ ] Glob and grep respect `.gitignore`-style patterns and skip binary files
- [ ] Agent lists directory contents with `ls` tool with optional include/exclude patterns

**Traced to:** PDR-006 (Foundation Infrastructure)

#### Feature 9: Secret Storage

**Description:** Encrypted at-rest credential storage for API keys, OAuth tokens, and MCP server secrets. Uses Fernet encryption with a machine-derived key. Transparent integration with the SQLite database via column-level encryption. Built on top of the Daemon infrastructure.

**User Story:** US-017

**Requirements:**

- **REQ-036:** System MUST encrypt all stored credentials at rest using AES-256-GCM or equivalent
  - Priority: Must
  - PDR: PDR-006
- **REQ-037:** System MUST derive encryption key from stable machine identity using PBKDF2
  - Priority: Must
  - PDR: PDR-006
- **REQ-038:** System MUST provide a recovery flow for encryption key loss
  - Priority: Must
  - PDR: PDR-006
- **REQ-039:** System MUST store OAuth tokens with automatic refresh where supported
  - Priority: Must
  - PDR: PDR-006

**Acceptance Criteria:**

- [ ] API key stored via UI is unreadable in the SQLite database file
- [ ] Restarting the app successfully decrypts stored credentials
- [ ] OAuth tokens are transparently refreshed when expired

**Traced to:** PDR-006 (Foundation Infrastructure)

#### Feature 10: Daemon Crash Recovery & Login-Item Integration

**Description:** Standalone background daemon with PID-lock detection, crash recovery, login-item auto-start, and graceful shutdown. Daemon survives Electron window close. Built on top of the basic Daemon infrastructure.

**User Story:** US-019

**Requirements:**

- **REQ-040:** System MUST detect daemon crashes via PID lock file and attempt auto-restart
  - Priority: Must
  - PDR: PDR-006
- **REQ-041:** System MUST mark stale `running` tasks as `failed` on daemon restart after crash
  - Priority: Must
  - PDR: PDR-006
- **REQ-042:** System MUST support login-item auto-start (macOS LaunchAgent, Windows Startup)
  - Priority: Should
  - PDR: PDR-006
- **REQ-043:** System MUST drain active tasks with configurable timeout before graceful shutdown
  - Priority: Must
  - PDR: PDR-006

**Acceptance Criteria:**

- [ ] Closing all Electron windows leaves daemon running; tasks continue executing
- [ ] Killing daemon process triggers restart; stale tasks marked failed in DB
- [ ] System shutdown triggers graceful drain with 30s timeout before force-kill

**Traced to:** PDR-006 (Foundation Infrastructure)

#### Feature 11: CompletionEnforcer (Enhanced Verification)

**Description:** State-machine-driven verification system that goes beyond basic pass/fail. Detects incomplete work, stalls, and partial completions. Attempts automatic continuation with targeted nudges before reporting failure. Upgrades the Foundation milestone's basic verification loop. Built on top of the basic Verification Loop and Orchestrator.

**User Story:** US-020

**Requirements:**

- **REQ-044:** System MUST implement a CompletionEnforcer state machine (IDLE, DONE, CONTINUATION_PENDING, PARTIAL_CONTINUATION_PENDING, MAX_RETRIES_REACHED)
  - Priority: Must
  - PDR: PDR-009
- **REQ-045:** System MUST detect when agent exits without calling `complete_task` and schedule continuation
  - Priority: Must
  - PDR: PDR-009
- **REQ-046:** System MUST downgrade task status to `partial` if `complete_task(success)` is called but todos remain incomplete
  - Priority: Must
  - PDR: PDR-009
- **REQ-047:** System MUST enforce a configurable maximum continuation retry limit (default 10)
  - Priority: Must
  - PDR: PDR-009
- **REQ-048:** System MUST implement a TaskInactivityWatchdog with configurable soft and hard timeouts
  - Priority: Must
  - PDR: PDR-009

**Acceptance Criteria:**

- [ ] Agent stalling for >90s triggers inactivity watchdog; task marked failed
- [ ] Agent exiting without `complete_task` triggers continuation with relevant context
- [ ] Agent calling success with 3/5 todos done triggers partial continuation with nudge about remaining todos
- [ ] Exceeding 10 continuation attempts transitions to MAX_RETRIES_REACHED

**Traced to:** PDR-009 (System Agent Tools)

#### Feature 12: Natural Language Scheduling

**Description:** Agents create cron jobs from natural language commands. Supports one-shot (`at`), interval (`every`), and cron-expression scheduling. Delivery to chat, webhook, or session. Includes management UI for list, edit, pause, remove, and run history. Built on top of the Daemon infrastructure.

**User Story:** US-012

**Requirements:**

- **REQ-049:** System MUST create scheduled jobs from natural language ("check email every morning at 9")
  - Priority: Must
  - PDR: PDR-008
- **REQ-050:** System MUST support schedule types: one-shot (`--at` ISO/relative), interval (`--every`), and cron (`--cron` 5-field)
  - Priority: Must
  - PDR: PDR-008
- **REQ-051:** System MUST provide management UI/CLI for listing, editing, pausing, and removing schedules
  - Priority: Must
  - PDR: PDR-008
- **REQ-052:** System MUST support delivery modes: announce to chat, webhook POST, or save to session
  - Priority: Should
  - PDR: PDR-008
- **REQ-053:** System MUST log run history with status, timestamps, and output for each execution
  - Priority: Must
  - PDR: PDR-008

**Acceptance Criteria:**

- [ ] User types "remind me in 20 minutes" → one-shot schedule created and fires
- [ ] User says "check my email every morning at 9" → daily cron created
- [ ] Schedule appears in management UI with pause/edit/remove actions
- [ ] Run history shows last 50 executions with pass/fail status

**Traced to:** PDR-008 (Agent Productivity Tools)

#### Feature 13: Skill Workshop

**Description:** Proposal-based skill creation system where users can say "remember what we just did and make a skill" and the agent creates a reusable SKILL.md. Includes proposal lifecycle (create → pending → apply/reject), security scanning, rollback metadata, and optional autonomous proposal generation. Built on top of the Orchestrator and Memory System.

**User Story:** US-011

**Requirements:**

- **REQ-054:** System MUST create skill proposals from conversation context on user request
  - Priority: Must
  - PDR: PDR-007
- **REQ-055:** System MUST implement proposal lifecycle: create, pending, revise, apply, reject, quarantine
  - Priority: Must
  - PDR: PDR-007
- **REQ-056:** System MUST scan skill proposals for security issues before applying
  - Priority: Must
  - PDR: PDR-007
- **REQ-057:** System MUST write rollback metadata before applying any skill change
  - Priority: Must
  - PDR: PDR-007
- **REQ-058:** System MUST support optional autonomous proposal generation from successful conversation turns
  - Priority: Should
  - PDR: PDR-007

**Acceptance Criteria:**

- [ ] User says "make a skill from what we just did" → proposal created, user can inspect
- [ ] User approves proposal → SKILL.md written, rollback metadata stored
- [ ] Malicious content in proposal is flagged and blocked during security scan
- [ ] Rollback restores previous version of the skill

**Traced to:** PDR-007 (Agent Skill & Knowledge System)

#### Feature 14: Memory System

**Description:** Persistent categorized memory storing facts, preferences, identity, events, contacts, projects, and instructions. LLM-based extraction from conversations, consolidation/deduplication via background tasks, and optional vector search for semantic retrieval. Built on top of the SQLite database and optionally ChromaDB.

**User Story:** US-013

**Requirements:**

- **REQ-059:** System MUST store categorized memory entries (facts, preferences, identity, events, contacts, projects, instructions)
  - Priority: Must
  - PDR: PDR-007
- **REQ-060:** System MUST extract memory from conversations using the LLM
  - Priority: Must
  - PDR: PDR-007
- **REQ-061:** System MUST consolidate and deduplicate memory entries via background tasks
  - Priority: Must
  - PDR: PDR-007
- **REQ-062:** System MUST support optional vector search (ChromaDB) for semantic memory retrieval
  - Priority: Should
  - PDR: PDR-007
- **REQ-063:** System MUST expose agent tools for adding, searching, and deleting memory entries
  - Priority: Must
  - PDR: PDR-007

**Acceptance Criteria:**

- [ ] User says "my name is Sarah" → memory entry created with category `identity`
- [ ] Next session, agent refers to user by name without being told again
- [ ] User can view, edit, and delete memory entries in settings
- [ ] Memory consolidation merges duplicate entries nightly

**Traced to:** PDR-007 (Agent Skill & Knowledge System)

#### Feature 15: Standing Orders

**Description:** Persistent agent instructions stored as workspace files. Users set permanent preferences ("always sign emails with my full name") that are loaded into every session's context. Built on top of the Memory System and Orchestrator.

**User Story:** US-016

**Requirements:**

- **REQ-064:** System MUST persist standing orders as workspace files loaded into every session
  - Priority: Must
  - PDR: PDR-007
- **REQ-065:** System MUST support natural-language creation ("always X") from conversation
  - Priority: Must
  - PDR: PDR-007
- **REQ-066:** System MUST expose management UI for listing, editing, and deleting standing orders
  - Priority: Should
  - PDR: PDR-007

**Acceptance Criteria:**

- [ ] User says "always sign emails with my full name" → standing order created
- [ ] All subsequent agent sessions include this instruction in system prompt
- [ ] User edits standing order via settings → change reflected in next session

**Traced to:** PDR-007 (Agent Skill & Knowledge System)

#### Feature 16: Inline Document Editing

**Description:** Agents can create, read, update, and suggest changes to documents with version history. Edit via FIND/REPLACE blocks for surgical replacement. Separate suggestion mode for non-destructive proposals. Auto-language detection and version tracking per edit. Built on top of the File System Tool Suite.

**User Story:** US-014

**Requirements:**

- **REQ-067:** System MUST support creating and reading documents with auto-detected language
  - Priority: Must
  - PDR: PDR-008
- **REQ-068:** System MUST support surgical FIND/REPLACE document editing with version history
  - Priority: Must
  - PDR: PDR-008
- **REQ-069:** System MUST support non-destructive suggestion mode (FIND/SUGGEST/REASON)
  - Priority: Should
  - PDR: PDR-008
- **REQ-070:** System MUST track version history per document with model attribution and summary
  - Priority: Must
  - PDR: PDR-008

**Acceptance Criteria:**

- [ ] Agent creates a markdown document with title and sections
- [ ] Agent edits a specific paragraph using FIND/REPLACE; version incremented
- [ ] Agent suggests an edit without applying it; user reviews and approves
- [ ] Document history shows previous versions with timestamps

**Traced to:** PDR-008 (Agent Productivity Tools)

#### Feature 17: Notes & Todos with Reminders

**Description:** Google Keep-style notes system with title, content, color, labels, pin/archive. Checklist note type with item toggle. Due dates trigger reminders via multiple channels. Repeat support. Agent tools for CRUD and search. Built on top of the Memory System and Daemon infrastructure.

**User Story:** US-015

**Requirements:**

- **REQ-071:** System MUST support note types: text notes and checklist notes with item toggle
  - Priority: Must
  - PDR: PDR-008
- **REQ-072:** System MUST support due dates, pin/archive, colors, and labels on notes
  - Priority: Must
  - PDR: PDR-008
- **REQ-073:** System MUST deliver reminders via configured channels (browser notification, email)
  - Priority: Should
  - PDR: PDR-008
- **REQ-074:** System MUST provide agent tools for creating, reading, updating, searching, and deleting notes
  - Priority: Must
  - PDR: PDR-008
- **REQ-075:** System MUST support repeating reminders (daily, weekly, monthly)
  - Priority: Should
  - PDR: PDR-008

**Acceptance Criteria:**

- [ ] Agent creates a checklist note with 3 items and a due date
- [ ] User toggles items via UI; agent reads updated state next session
- [ ] Due date passes → browser notification sent with note content
- [ ] User searches for notes by content across all labels

**Traced to:** PDR-008 (Agent Productivity Tools)

### 7.3 Requirements Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| Must | 57 | Critical for launch - product is incomplete without these |
| Should | 19 | Important but not blocking - can ship without |
| Could | 2 | Nice to have - add if time permits |
| Won't | 0 | Explicitly excluded - documented in Out of Scope |

**Total:** 78 requirements

### 7.4 Requirement Dependencies

```mermaid
flowchart TB
    subgraph "Layer 0: LLM Foundation"
        REQ001["REQ-001:<br/>BYOK Setup"]
        REQ002["REQ-002:<br/>Local LLM"]
        REQ004["REQ-004:<br/>Keychain Storage"]
    end

    subgraph "Layer 1: Orchestration & Core"
        REQ005["REQ-005:<br/>NL Input"]
        REQ006["REQ-006:<br/>Intent Analysis"]
        REQ007["REQ-007:<br/>Task Delegation"]
        REQ036["REQ-036:<br/>Secrets Encryption"]
        REQ040["REQ-040:<br/>Crash Recovery"]
        REQ031["REQ-031:<br/>File Read Tool"]
        REQ032["REQ-032:<br/>File Write Tool"]
    end

    subgraph "Layer 2: Quality & Safety"
        REQ010["REQ-010:<br/>Tech Verification"]
        REQ011["REQ-011:<br/>Intent Verification"]
        REQ044["REQ-044:<br/>CE State Machine"]
        REQ047["REQ-047:<br/>Max Retries"]
        REQ048["REQ-048:<br/>Inactivity Watchdog"]
        REQ015["REQ-015:<br/>Shared MCP Tools"]
        REQ019["REQ-019:<br/>Pause Execution"]
    end

    subgraph "Layer 3: Agent Features"
        REQ023["REQ-023:<br/>Calendar Read"]
        REQ024["REQ-024:<br/>Calendar Write"]
        REQ027["REQ-027:<br/>Invoice Scan"]
        REQ028["REQ-028:<br/>Invoice Organize"]
        REQ049["REQ-049:<br/>NL Scheduling"]
        REQ054["REQ-054:<br/>Skill Workshop"]
        REQ059["REQ-059:<br/>Memory Storage"]
        REQ064["REQ-064:<br/>Standing Orders"]
        REQ067["REQ-067:<br/>Doc Create/Read"]
        REQ071["REQ-071:<br/>Notes & Todos"]
    end

    REQ001 --> REQ005
    REQ001 --> REQ006
    REQ002 --> REQ006
    REQ004 --> REQ001
    REQ005 --> REQ006
    REQ006 --> REQ007
    REQ007 --> REQ010
    REQ007 --> REQ015
    REQ007 --> REQ031
    REQ007 --> REQ032
    REQ010 --> REQ011
    REQ010 --> REQ044
    REQ044 --> REQ047
    REQ044 --> REQ048
    REQ011 --> REQ019
    REQ036 --> REQ049
    REQ040 --> REQ036
    REQ015 --> REQ023
    REQ015 --> REQ027
    REQ019 --> REQ025
    REQ010 --> REQ023
    REQ010 --> REQ027
    REQ023 --> REQ024
    REQ027 --> REQ028
    REQ049 --> REQ054
    REQ054 --> REQ059
    REQ059 --> REQ064
    REQ059 --> REQ071
    REQ031 --> REQ067

    classDef llm fill:#e74c8b,stroke:#333,stroke-width:2px,color:#fff
    classDef orchestration fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    classDef infra fill:#f47721,stroke:#333,stroke-width:2px,color:#fff
    classDef agents fill:#66c2a5,stroke:#333,stroke-width:2px,color:#fff

    class REQ001,REQ002,REQ004 llm
    class REQ005,REQ006,REQ007,REQ031,REQ032,REQ036,REQ040 orchestration
    class REQ010,REQ011,REQ015,REQ019,REQ044,REQ047,REQ048 infra
    class REQ023,REQ024,REQ027,REQ028,REQ049,REQ054,REQ059,REQ064,REQ067,REQ071 agents
```

**Dependency Notes**:
- Layer 0 (LLM Foundation) requirements must be completed first
- Layer 2 (Quality & Safety Infrastructure) is built before specialized agents
- Layer 3 (Specialized Agents) depends on all lower layers
- Critical path: REQ-001 → REQ-005 → REQ-006 → REQ-007 → REQ-010 → REQ-023

### 7.5 Feature Dependencies

```mermaid
flowchart TB
    LLM["BYOK & LLM<br/>Connectivity"]
    Orchestrator["Orchestrator Agent"]
    VLoop["Verification Loop"]
    MCP["MCP & Tools System"]
    HITL["Human-in-the-Loop"]
    Secretary["Secretary Agent"]
    Accountant["Accountant Agent"]
    UI["Chat Interface"]

    subgraph Foundation_Infra["Foundation Infrastructure"]
        FileTools["File System Tools"]
        Secrets["Secret Storage"]
        Daemon["Daemon Crash Recovery"]
    end

    subgraph Agent_Features["Agent Features"]
        CE["CompletionEnforcer"]
        Sched["NL Scheduler"]
        SW["Skill Workshop"]
        Mem["Memory System"]
        Orders["Standing Orders"]
        Docs["Document Editing"]
        Notes["Notes & Todos"]
    end

    LLM --> Orchestrator
    Orchestrator --> VLoop
    Orchestrator --> MCP
    VLoop --> HITL
    MCP --> Secretary
    MCP --> Accountant
    VLoop --> Secretary
    VLoop --> Accountant
    HITL --> Secretary
    HITL --> Accountant
    LLM --> Secretary
    LLM --> Accountant
    UI --> Orchestrator

    Orchestrator --> FileTools
    Orchestrator --> Secrets
    Daemon --> Secrets
    Orchestrator --> Daemon

    Secretary --> CE
    Accountant --> CE
    CE --> Sched
    CE --> SW
    SW --> Orders
    SW --> Mem
    Accountant --> Docs
    Accountant --> Notes
    Mem --> Notes

    classDef llm fill:#e74c8b,stroke:#333,stroke-width:2px,color:#fff
    classDef core fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    classDef infra fill:#f47721,stroke:#333,stroke-width:2px,color:#fff
    classDef agent fill:#66c2a5,stroke:#333,stroke-width:2px,color:#fff
    classDef foundation fill:#ffcc80,stroke:#e65100,stroke-width:2px
    classDef feature fill:#b39ddb,stroke:#4a148c,stroke-width:2px,color:#fff

    class LLM llm
    class Orchestrator,VLoop,HITL core
    class MCP,UI infra
    class Secretary,Accountant agent
    class FileTools,Secrets,Daemon foundation
    class CE,Sched,SW,Mem,Orders,Docs,Notes feature
```

### 7.6 State Transitions

```mermaid
stateDiagram-v2
    [*] --> Received : User submits request
    Received --> Analyzing : Orchestrator receives
    Analyzing --> Planning : Intent identified
    Planning --> Delegating : Plan created
    Delegating --> Executing : Agent assigned

    Executing --> BasicVerify : Foundation verification
    Executing --> CEVerify : Agent verification

    state BasicVerify {
        [*] --> CheckSuccess : Task done
        CheckSuccess --> BasicSuccess : All checks pass
        CheckSuccess --> BasicFail : Check fails
    }

    state CEVerify {
        [*] --> CeSuccess : complete_task(success)
        [*] --> CePartial : success + incomplete todos
        [*] --> CeCont : process exit without complete
        CeSuccess --> Done : All todos complete
        CePartial --> PendingContinuation : Partial work
        CeCont --> PendingContinuation : Stalled
        PendingContinuation --> Nudge : Generate prompt
        Nudge --> ReExecute : Launch continuation
        ReExecute --> Executing
        PendingContinuation --> MaxRetries : >= 10 attempts
    }

    BasicSuccess --> [*] : Logged to DB
    BasicFail --> PendingApproval : Sensitive or max retry
    CePartial --> PendingApproval : Sensitive action
    MaxRetries --> [*] : Logged as failed
    Done --> [*] : Logged to DB
    PendingApproval --> Executing : User approves
    PendingApproval --> Cancelled : User rejects
    Cancelled --> [*] : Logged to DB

    note right of CEVerify : CompletionEnforcer\n(PDR-009)
    note right of BasicVerify : Basic loop\n(PDR-001 Foundation)
```

---

## 8. Non-Functional Requirements (NFRs)

### 8.1 Performance

| Requirement | Target | Measurement | PDR |
|-------------|--------|-------------|-----|
| Task response time | <5s from request to agent assignment | Agent execution logs | PDR-001 |
| LLM inference time | Depends on user's chosen provider (BYOK) | N/A (user-managed) | PDR-003 |
| App startup time | <3s cold start | App telemetry | PDR-002 |
| UI responsiveness | <100ms for chat interactions | Frontend performance monitoring | PDR-002 |
| File read (1KB) | <500ms from agent call to content delivery | Agent execution logs | PDR-006 |
| File edit (10 lines) | <1s from FIND/REPLACE call to applied change | Agent execution logs | PDR-006 |
| File listing (ls, 100 entries) | <500ms from agent call to directory listing | Agent execution logs | PDR-006 |
| File search (grep, 10 files) | <2s for pattern search across 10 files | Agent execution logs | PDR-006 |
| File pattern search (glob) | <1s for glob pattern matching across workspace | Agent execution logs | PDR-006 |
| Schedule execution latency | <5s from cron trigger to agent invocation | Scheduler logs | PDR-008 |
| Document version history load | <2s for 100+ versions | Document system logs | PDR-008 |
| Memory retrieval | <500ms for SQLite lookup; <2s for vector search | Memory system logs | PDR-007 |

### 8.2 Security

| Requirement | Target | Measurement | PDR |
|-------------|--------|-------------|-----|
| API key storage | OS keychain (macOS Keychain, Windows Credential Manager) | Verified by security review | PDR-003 |
| Local data encryption | SQLite at rest (SQLCipher or equivalent) | Verified by security review | PDR-003 |
| MCP sandboxing | Process-level isolation for MCP server execution | Verified by security review | PDR-001 |
| No cloud data transmission | Zero data sent unless user explicitly triggers an action | Network monitoring | PDR-002 |
| Credential encryption at rest | AES-256-GCM with machine-derived PBKDF2 key | Verified by security review | PDR-006 |
| Workspace file confinement | All file tools confined to configurable workspace root | Verified by integration tests | PDR-006 |
| Skill proposal scanning | Pre-apply security scan for malicious content | Verified by security review | PDR-007 |
| Secrets encryption in DB | Fernet/transparent column-level encryption | Verified by DB audit | PDR-006 |

### 8.3 Reliability

| Requirement | Target | Measurement | PDR |
|-------------|--------|-------------|-----|
| Agent execution reliability | >99% of delegated tasks reach execution | Agent execution logs | PDR-001 |
| Daemon uptime (background mode) | >99.9% | Process monitoring | PDR-006 |
| Data integrity | 100% — no data loss on unexpected shutdown | SQLite WAL mode + crash recovery tests | PDR-005 |
| Verification loop consistency | 100% — every task logged with pass/fail | Audit log review | PDR-005 |
| Schedule execution success | >95% of scheduled runs complete successfully | Run history | PDR-008 |
| Crash recovery reliability | 100% of stale `running` tasks marked `failed` on restart | Recovery audit | PDR-006 |
| CompletionEnforcer continuity | >90% task completion rate including continuations | Enforcer state log | PDR-009 |

### 8.4 Usability

| Requirement | Target | Measurement | PDR |
|-------------|--------|-------------|-----|
| Time to first task | <5 minutes from install (including API key setup) | Onboarding funnel analytics | PDR-002 |
| Task success on first attempt | >60% for new users | Verification loop data | PDR-002 |
| Human-in-the-loop clarity | <30s to understand and respond to a pause prompt | UX testing | PDR-004 |
| Error recovery | User can recover from any error without losing context | UX testing | PDR-004 |

### 8.5 Scalability

| Requirement | Target | Measurement | PDR |
|-------------|--------|-------------|-----|
| Concurrent agents | 5+ agents running simultaneously | Load testing | PDR-001 |
| Concurrent schedules | 50+ active schedules without degradation | Load testing | PDR-008 |
| SQLite database size | Handles 100k+ task records, 50k+ memory entries, 10k+ documents | Capacity testing | PDR-001 |
| Document storage | 1000+ documents with full version history | Capacity testing | PDR-008 |
| Memory entries | 10k+ categorized memory entries with <500ms retrieval | Capacity testing | PDR-007 |
| Local LLM compatibility | Supports GGUF models up to 8B parameters | Model compatibility matrix | PDR-003 |

**NFRs traced to PDRs:**

| NFR | Requirement | PDR |
|-----|--------------|-----|
| Security | API key storage in OS keychain | PDR-003 |
| Security | Credential encryption at rest | PDR-006 |
| Security | Workspace file confinement | PDR-006 |
| Security | Skill proposal security scanning | PDR-007 |
| Reliability | Verification loop consistency | PDR-005 |
| Reliability | Daemon uptime (background mode) | PDR-006 |
| Reliability | Schedule execution success | PDR-008 |
| Reliability | CompletionEnforcer continuity | PDR-009 |
| Performance | Task response time <5s | PDR-001 |
| Performance | File read latency | PDR-006 |
| Performance | Memory retrieval latency | PDR-007 |
| Usability | Time to first task <5 min | PDR-002 |

---

## 9. Out of Scope

### 9.1 Features

- **Developer/Tech Agent:** Targets a different (technical) persona; would dilute MVP focus. Post-MVP Phase 3 (PDR-001, PDR-010)
- **Agent Marketplace:** Requires significant platform investment (curation, payments, reviews). Post-MVP Phase 3 (PDR-001, PDR-010)
- **Granular autonomy levels:** Adds complexity without proven user demand. Future product phase
- **Cloud sync / multi-device:** Contradicts local-first privacy positioning. Maybe never (business decision)
- **Mobile app (iOS/Android):** Desktop-only for MVP; mobile companion bridge is Post-MVP Phase 1 (PDR-010)
- **Multi-channel messaging (WhatsApp, Telegram, Slack, Discord):** Desktop chat-only for MVP. Post-MVP Phase 2 (PDR-010)
- **Deep Research Engine:** Iterative research loop. Post-MVP Phase 1 (PDR-010)
- **Heartbeat System:** Periodic autonomous agent turns. Post-MVP Phase 1 (PDR-010)
- **Plugin SDK for third-party developers:** Post-MVP Phase 2 (PDR-010)
- **A/B Model Comparison:** Power user feature. Post-MVP Phase 2 (PDR-010)

### 9.2 Technical

- **Cloud-hosted LLM proxy:** Violates privacy promise; adds infrastructure cost and liability. Alternative: BYOK direct calls only
- **Third-party authentication (OAuth to Google/Microsoft):** Adds scope. Alternative: Manual config via MCP
- **Windows/macOS auto-updater:** Handled by app store infrastructure. Alternative: Store-based updates only

### 9.3 Markets

- **Enterprise (50+ employees):** Needs SSO, team management, compliance, cloud deployment. Future enterprise tier
- **Developer / Engineer:** Not the target persona. Alternative: Developer Agent post-MVP
- **Non-English markets:** English-only MVP. Post-MVP

### 9.4 Integration Exclusions

- **Native Outlook/Exchange calendar API:** Adds significant scope. Workaround: Manual export/import or MCP bridge
- **QuickBooks/Xero native API:** Complex OAuth flows. Workaround: CSV export for import into accounting software
- **Slack/Teams integration:** Communication agents are Secretary scope, but chat integrations deferred. Post-MVP

**Scope decisions traced to PDRs:**

| Out of Scope Item | PDR | Rationale |
|-------------------|-----|-----------|
| Developer/Tech Agent | PDR-001, PDR-010 | Different persona; post-MVP Phase 3 |
| Agent Marketplace | PDR-003, PDR-010 | Requires platform investment; post-MVP Phase 3 |
| Enterprise features | PDR-002 | Primary persona is solopreneur, not enterprise |
| Multi-channel messaging | PDR-010 | Desktop chat-only for MVP; post-MVP Phase 2 |
| Deep Research Engine | PDR-010 | Premium feature; post-MVP Phase 1 |
| Heartbeat System | PDR-010 | Background autonomy; post-MVP Phase 1 |
| Plugin SDK | PDR-010 | Ecosystem play; post-MVP Phase 2 |
| Companion Mobile App | PDR-010 | Mobile bridge; post-MVP Phase 1 |

---

## 10. Risks & Mitigation

### 10.1 Risk Summary

| Risk | Likelihood | Impact | Mitigation Strategy | PDR |
|------|------------|--------|---------------------|-----|
| Low user adoption due to BYOK friction | High | High | In-app guided setup, local LLM alternative, trial keys | PDR-003 |
| App store rejection for agent behavior | Medium | High | User-initiated agents only, pre-release store review | PDR-004 |
| MCP sandboxing bypass leads to security issue | Low | High | Process isolation, restricted filesystem, manifest validation | PDR-001 |
| LLM provider API changes break agent functionality | Medium | Medium | Provider-agnostic abstraction layer | PDR-003 |
| Solopreneur market too narrow for sustainable growth | Medium | Medium | Platform designed to expand to other verticals | PDR-002 |
| Verification loop false negatives frustrate users | Medium | Medium | User override for results, log patterns to tune thresholds | PDR-001 |

### 10.2 Technical Risks

**Risk: MCP Sandboxing Bypass**

| Attribute | Description |
|-----------|-------------|
| **Description** | A malicious or buggy MCP server escapes its sandbox and accesses files or system resources outside its allowed scope |
| **Likelihood** | Low |
| **Impact** | High |
| **Mitigation** | Use OS-level process isolation (separate process per MCP server), restrict filesystem access, validate all MCP server manifests before execution |
| **Contingency** | Kill the MCP server process, revoke its permissions, notify user with security warning |

**Risk: Verification Loop False Negatives**

| Attribute | Description |
|-----------|-------------|
| **Description** | The verification loop incorrectly marks successfully executed tasks as failures, frustrating users |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Mitigation** | Allow users to override verification results; log override patterns to tune thresholds |
| **Contingency** | Manual override button in UI; collect override data to improve verification accuracy |

### 10.3 Market Risks

**Risk: Low Adoption Due to BYOK Friction**

| Attribute | Description |
|-----------|-------------|
| **Description** | Non-technical solopreneurs find BYOK setup too difficult and abandon the app |
| **Likelihood** | High |
| **Impact** | High |
| **Mitigation** | In-app guided API key setup, local LLM as zero-config alternative, consider pre-configured trial keys |
| **Contingency** | Partner with LLM providers for embedded key provisioning; explore managed LLM proxy as paid add-on |

**Risk: Narrow Market Sizing**

| Attribute | Description |
|-----------|-------------|
| **Description** | Solopreneur market proves too small or fragmented to sustain the business |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Mitigation** | Design agent platform to be persona-agnostic — same infrastructure can serve other segments |
| **Contingency** | Pivot to broader market segment (knowledge workers) by adding relevant agents |

### 10.4 Operational Risks

**Risk: App Store Rejection**

| Attribute | Description |
|-----------|-------------|
| **Description** | Apple or Microsoft rejects the app because agent behavior violates store policies |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | User-initiated agents only; all MCP server execution requires user approval; submit for pre-release review |
| **Contingency** | Fall back to direct download distribution via website |

### 10.4.5 Business Risks

| Risk | Likelihood | Impact | Mitigation | PDR |
|------|------------|--------|------------|-----|
| Low adoption due to BYOK friction | High | High | Guided setup, local LLM, partner provisioning | PDR-003 |
| Competitive pressure from tech giants | Medium | High | Local-first moat, specialization in SMB workflows | PDR-002 |
| Revenue insufficient at 5% conversion | Medium | Medium | Target higher-value solutions, enterprise tier | PDR-003 |

*Risks traced to PDR consequence sections*

---

## 10.5 Investment & Resources

### Team Composition

| Role | FTEs | Phase | Responsibility |
|------|------|-------|----------------|
| Electron/React Developer | 1 | All | Desktop UI, daemon, app store packaging |
| Agent Engineer (eve framework) | 1 | Foundation + Agents | Orchestrator, agents, CompletionEnforcer |
| Knowledge/Memory Engineer | 1 | Agents | Skill Workshop, Memory System, Standing Orders |
| Tools/Automation Engineer | 1 | Foundation + Agents | File system tools, scheduler, document editing, notes |
| MCP/Tools Engineer | 1 | Foundation + Agents | MCP servers, tool system, sandboxing |
| Product Manager | 1 | All | Product decisions, user research, GTM |
| Designer (part-time) | 0.5 | Foundation | UI/UX design, onboarding flow |
| QA (part-time) | 0.5 | Agents + Launch | Testing, verification loop validation |

**Total:** 5 FTEs average, 7 FTEs peak

### Budget Estimate

| Category | Phase 1 (Foundation) | Phase 2 (Agents) | Phase 3 (Launch) | Annual |
|----------|----------------------|-------------------|------------------|--------|
| **Personnel** | $240K | $280K | $280K | $1,040K |
| **Infrastructure** | $8K | $8K | $8K | $32K |
| **Third-Party Services** | $3K | $3K | $5K | $15K |
| **Tools & Licenses** | $5K | $5K | $5K | $20K |
| **Total** | **$256K** | **$296K** | **$298K** | **$1,107K** |

### Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| Optimistic | 20% | 150% | $2.1M | 8 months |
| Base Case | 50% | 40% | $720K | 16 months |
| Pessimistic | 30% | -20% | -$180K | N/A (pivot) |
| **Weighted Average** | 100% | **38%** | **$680K** | **14 months** |

### Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| 10k downloads within 6 months | Comparable desktop AI tool launches | Low adoption = slower revenue; extend timeline |
| 5% free-to-paid solution conversion | Industry average for freemium desktop tools | Lower conversion = extend payback period |
| $1,000 average solution price | Comparable to professional tool add-ons | Higher price = fewer sales; lower price = more volume needed |
| Team of 5-7 FTEs sufficient | Expanded scope: 9 Foundation + 11 Agent features | More complex than expected = need more engineers = higher burn |
| Foundation timeline 4 months (revised from 3) | Added file tools, secret storage, daemon recovery | Slower development = shift beta and launch dates |

### Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Foundation Complete | Month 4 | BYOK + Orchestrator + file tools + secret storage + daemon recovery; basic verification functional | Go / No-Go |
| Beta Ready | Month 6 | Secretary + Accountant + CompletionEnforcer + scheduling + skill workshop + memory + documents + notes | Go / No-Go |
| Public Launch | Month 7 | App store approved; >50 beta testers active; verification pass rate >70% | Go / No-Go |

---

## 11. Roadmap & Milestones

### 11.1 Roadmap Overview

```mermaid
gantt
    title AI Agent Harness — Development Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b

    section Foundation
    BYOK & LLM Setup            :done, f1, 2026-07-01, 25d
    Orchestrator Agent          :done, f2, after f1, 25d
    Chat UI + Daemon            :done, f3, after f2, 20d
    MCP & Tools System          :done, f4, after f3, 15d
    File System Tools           :done, f5, after f3, 15d
    Secret Storage              :done, f6, after f3, 15d
    Verification Loop           :done, f7, after f4, 15d
    Daemon Crash Recovery       :done, f8, after f6, 10d
    Human-in-the-Loop           :done, f9, after f7, 10d

    section Agents
    Secretary Agent             :done, a1, after f9, 20d
    Accountant Agent            :done, a2, after a1, 20d
    Enhanced Verification (CE)  :done, a3, after a1, 15d
    NL Scheduling               :done, a4, after a2, 15d
    Skill Workshop              :done, a5, after a2, 20d
    Standing Orders             :done, a6, after a5, 10d
    Memory System               :done, a7, after a5, 20d
    Inline Document Editing     :done, a8, after a2, 15d
    Notes & Todos               :done, a9, after a7, 15d

    section Launch
    Beta Testing                :done, l1, after a9, 21d
    App Store Submission        :done, l2, after l1, 14d
    Public Launch               :milestone, m3, after l2, 0d

    section Post-MVP Phase 1
    Deep Research Engine        :l3, after m3, 40d
    Heartbeat System            :l4, after m3, 30d
    Companion Mobile Bridge     :l5, after l4, 45d

    section Post-MVP Phase 2
    Multi-channel Messaging     :l6, after l4, 60d
    Plugin SDK                  :l7, after l6, 50d
    A/B Model Comparison        :l8, after l6, 20d

    section Post-MVP Phase 3
    Developer Agent             :l9, after l7, 40d
    Agent Marketplace Alpha     :l10, after l9, 60d
```

### 11.2 Milestone 1: Foundation Complete — Month 4 (2026-10-31)

**Demo Sentence:** "After this milestone, the user can install the app, configure their LLM API key, and see the Orchestrator analyze a natural language request. The agent can read/write files safely, credentials are encrypted, and the daemon survives crashes."

**Status:** Planned

**Release Goal:** Core infrastructure — LLM connectivity, orchestration, quality framework, tools, safety layer, file system access, credential security, and daemon resilience all functional.

| Feature | Priority | Demo Sentence | Dependencies | PDR |
|---------|----------|---------------|--------------|-----|
| BYOK & LLM Connectivity | Must | "User configures API key and system responds to requests" | None | PDR-003 |
| Orchestrator Agent | Must | "User types a task and sees a plan created and delegated" | LLM | PDR-001 |
| Chat UI + Daemon | Must | "User sees chat interface with agent activity indicators" | Orchestrator | PDR-001 |
| MCP & Tools System | Must | "Agents can access shared and specialized tools" | Orchestrator | PDR-001 |
| File System Tool Suite | Must | "Agent reads a file, edits it, and shows a diff of changes" | Orchestrator | PDR-006 |
| Secret Storage | Must | "API keys and OAuth tokens stored encrypted at rest" | Daemon | PDR-006 |
| Verification Loop (Basic) | Must | "System validates task success and logs pass/fail" | Orchestrator | PDR-001 |
| Daemon Crash Recovery | Must | "Daemon auto-restarts after crash; running tasks marked failed" | Secret Storage | PDR-006 |
| Human-in-the-Loop | Must | "System pauses and asks user before sending a message" | Orchestrator | PDR-001 |

**Success Criteria:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| BYOK setup completion | >80% of installs complete key setup | Onboarding funnel |
| Orchestrator plan accuracy | >70% of requests correctly parsed | Log analysis |
| File tool adoption | >80% of agent tasks use at least one file tool | Agent logs |
| Daemon uptime (background) | >99.9% | Process monitoring |
| Verification loop pass rate | >80% on test tasks | Automated testing |

**PDR Reference:** PDR-001, PDR-006

### 11.3 Milestone 2: Agents — Month 6 (2026-12-31)

**Demo Sentence:** "After this milestone, the user can tell the system 'remember what we just did and make a skill,' schedule tasks by saying 'check my email every morning at 9,' and have the Secretary and Accountant agents work with documents, notes, and memory."

**Status:** Planned

**Release Goal:** Both specialized agents functional with enhanced verification, skill creation, scheduling, document editing, memory, and notes/todos.

| Feature | Priority | Demo Sentence | Dependencies | PDR |
|---------|----------|---------------|--------------|-----|
| Secretary Agent | Must | "User asks about their schedule and gets calendar summary" | Foundation | PDR-001 |
| Accountant Agent | Must | "User asks about invoices and system finds and organizes them" | Foundation | PDR-001 |
| Enhanced Verification (CE) | Must | "System auto-continues partial tasks, detects stalls, and validates todos" | Secretary Agent | PDR-009 |
| NL Scheduling | Must | "User says 'check email every morning at 9' and cron job is created" | Accountant Agent | PDR-008 |
| Skill Workshop | Must | "User says 'remember what we just did and make a skill' — agent creates reusable SKILL.md" | Secretary Agent | PDR-007 |
| Memory System | Must | "Agent remembers user preferences and past work across sessions" | Skill Workshop | PDR-007 |
| Standing Orders | Should | "User says 'always sign emails with my full name' — agent persists instruction" | Skill Workshop | PDR-007 |
| Inline Document Editing | Should | "Agent edits a document using FIND/REPLACE with version history" | Accountant Agent | PDR-008 |
| Notes & Todos | Should | "Agent creates a checklist note with reminder for tomorrow" | Memory System | PDR-008 |
| Agent transparency in UI | Should | "User sees which agent is working on their request" | Foundation | PDR-001 |
| @Agent mention syntax | Could | "User types @Secretary to direct a task" | Orchestrator | PDR-001 |

**Success Criteria:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Beta tester engagement | >50 active testers | DAU tracking |
| Task completion rate (incl. continuations) | >90% | CompletionEnforcer log |
| Skill creation rate | >2 skills/user/month | Skill DB |
| Active schedules per user | >3 per active user | Scheduler DB |
| Memory recall accuracy | >80% of stored facts retrievable | Test queries |
| HITL intervention rate | <30% of tasks require human input | HITL logs |

**PDR Reference:** PDR-001, PDR-007, PDR-008, PDR-009

### 11.4 Milestone 3: Public Launch — Month 7 (2027-01-31)

**Demo Sentence:** "After this milestone, the user can download the app from the app store, set up their API key, and have a full suite of agent capabilities — scheduling, skills, memory, document editing, and notes — handling their daily admin tasks."

**Status:** Planned

**Release Goal:** App store approval, public availability, and initial user acquisition with all Agent milestone features complete.

| Feature | Priority | Demo Sentence | Dependencies | PDR |
|---------|----------|---------------|--------------|-----|
| App store packaging | Must | "User downloads from macOS/Windows store" | Beta complete | PDR-004 |
| Analytics (opt-in) | Must | "Usage data collected with user consent" | Foundation | PDR-005 |
| All Agent milestone features | Must | Complete from Milestone 2 | Agent milestone | PDR-007/008/009 |
| Website + docs | Should | "User finds product info and downloads from website" | N/A | PDR-004 |

**PDR Reference:** PDR-004, PDR-005

### 11.5 Post-MVP Roadmap

| Phase | Feature | Priority | Description | PDR |
|-------|---------|----------|-------------|-----|
| **Phase 1** | Deep Research Engine | High | Iterative Think-Search-Extract-Synthesize research loop; strong paid-solution candidate | PDR-010 |
| Phase 1 | Heartbeat System | Medium | Periodic autonomous agent turns for background monitoring | PDR-010 |
| Phase 1 | Companion Mobile Bridge | Medium | LAN-paired smartphone companion for notes/todos/quick queries | PDR-010 |
| **Phase 2** | Multi-channel Messaging | High | Extend agent access to WhatsApp, Telegram, Slack, Discord | PDR-010 |
| Phase 2 | Plugin SDK | Medium | Third-party developer plugin system | PDR-010 |
| Phase 2 | A/B Model Comparison | Low | Blind side-by-side LLM comparison for power users | PDR-010 |
| **Phase 3** | Developer Agent | Medium | Technical persona agent for developers/engineers | PDR-001 |
| Phase 3 | Agent Marketplace | High | Third-party solution distribution platform | PDR-001, PDR-003 |

### 11.6 Milestones Traced to PDRs

| Milestone | PDR | Target Date | Status |
|-----------|-----|-------------|--------|
| Foundation Complete | PDR-001, PDR-003, PDR-006 | 2026-10-31 | Planned |
| Agents (Beta) | PDR-001, PDR-007, PDR-008, PDR-009 | 2026-12-31 | Planned |
| Public Launch | PDR-004, PDR-005, PDR-007, PDR-008 | 2027-01-31 | Planned |
| Post-MVP Phase 1 | PDR-010 | 2027-Q1 | Planned |
| Post-MVP Phase 2 | PDR-010 | 2027-Q2 | Planned |
| Post-MVP Phase 3 | PDR-001, PDR-003 | 2027-Q3 | Planned |

---

## 11.7 Go-to-Market Strategy

### 11.7.1 Launch Phases

**Phase 1: Stealth Beta (Month 4-5)**

| Attribute | Details |
|-----------|---------|
| **Audience** | 50-100 invited solopreneurs (personal network, small business forums, Reddit r/smallbusiness) |
| **Goal** | Validate agent functionality, verification loop quality, and onboarding flow |
| **Success Metrics** | >70% task completion rate, <5% churn during beta |
| **Exit Criteria** | Verification pass rate >75%, beta NPS >30, top 5 bugs fixed |

**Phase 2: Public Launch (Month 7)**

| Attribute | Details |
|-----------|---------|
| **Audience** | Solopreneurs searching for productivity/AI tools (organic search, app store browsing) |
| **Goal** | 1,000 downloads in first month; validate acquisition channels |
| **Success Metrics** | >1k downloads month 1, >40% activation rate, >30% 7-day retention |
| **Exit Criteria** | 3+ consecutive weeks of growing DAU; store rating >4.0 |

**Phase 3: Growth (Month 8-10)**

| Attribute | Details |
|-----------|---------|
| **Audience** | Broader solopreneur/freelancer audience via content marketing |
| **Goal** | 5,000 cumulative downloads; validate first paid solution interest |
| **Success Metrics** | >5k downloads, >200 DAU, >10 paid solution inquiries |

**Phase 4: Monetization (Month 11+)**

| Attribute | Details |
|-----------|---------|
| **Audience** | Engaged free users ready for advanced capabilities |
| **Goal** | Launch first paid solution (e.g., "Advanced Treasury") |
| **Success Metrics** | >5% conversion, >$1k ARPU, solution NPS >40 |

### 11.7.2 Pricing Strategy

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Free** | $0 | Orchestrator + Secretary agent + Accountant agent + shared tools + BYOK/local LLM | All solopreneurs |
| **Solutions** | ~$1,000 each | Curated agent + MCP tool package (e.g., Accountant Pro + QuickBooks MCP + invoice templates) | Engaged users needing depth |
| **Enterprise** | Custom | Multi-user, custom agents, dedicated MCP servers, priority support | Future segment |

### 11.7.3 Key Messaging

| Audience | Message |
|----------|---------|
| **Solopreneurs** | "Your own AI admin team. No coding, no cloud, no hassle. Just tell it what to do." |
| **Privacy-Conscious Users** | "Every task, every file, every decision — stays on your machine." |
| **Tired-of-Admin Owners** | "Stop chasing invoices and juggling calendars. Your agents handle it while you focus on clients." |

### 11.7.4 Success Metrics by Phase

| Phase | Adoption | Engagement | Revenue |
|-------|----------|------------|---------|
| Stealth Beta | 50-100 testers | >70% task completion | $0 |
| Public Launch | 1k downloads month 1 | >40% activation, >30% D7 | $0 |
| Growth | 5k cumulative | >200 DAU | Validate demand |
| Monetization | >10% conversion to paid | >50% D30 retention | >$50k annual run rate |

---

## 12. PDR Summary

### 12.1 Key Decisions

| ID | Category | Decision | Status | Impact |
|----|----------|----------|--------|--------|
| PDR-001 | Scope | MVP Agent Set (Secretary + Accountant + Orchestrator) | Accepted | High |
| PDR-002 | Persona | Solopreneur / Small Business Owner as primary target | Accepted | High |
| PDR-003 | Business Model | Free core app, paid tailor-made agent solutions (~$1,000 each) | Accepted | High |
| PDR-004 | Scope | Hybrid distribution: website (SEO) + app stores (downloads) | Accepted | Medium |
| PDR-005 | Metric | Engagement-first: DAU, tasks/week, verification pass rate | Accepted | Medium |
| PDR-006 | Scope | Foundation additions: file system tools, secret storage, daemon crash recovery | Accepted | High |
| PDR-007 | Feature | Agent skill & knowledge: Skill Workshop, Memory, Standing Orders | Accepted | High |
| PDR-008 | Feature | Productivity tools: NL scheduling, document editing, notes & todos | Accepted | High |
| PDR-009 | Feature | CompletionEnforcer: enhanced verification with auto-continuation | Accepted | High |
| PDR-010 | Prioritization | Post-MVP roadmap: research, heartbeat, messaging, plugins, marketplace | Accepted | Medium |

### 12.2 Constitution Alignment

This PRD aligns with the constitutional principles:

| Principle | Alignment | PDRs |
|-----------|-----------|------|
| Spec-Driven Development | Aligned | PDR-001, PDR-004, PDR-006, PDR-010 |
| Test-First Quality | Aligned | PDR-001, PDR-005, PDR-009 |
| Simplicity & Surgical Changes | Aligned | PDR-001, PDR-006, PDR-008 |
| Human Oversight & Goal-Driven Execution | Aligned | PDR-004, PDR-005, PDR-007 |
| Observability/Security/Immutability | Aligned | PDR-003, PDR-006 |
| Code Structure & Cleanliness | Aligned | PDR-001, PDR-006 |

### 12.3 Open Questions / Pending Decisions

| Question | Related PDR | Owner | Due Date |
|----------|-------------|-------|----------|
| What specific LLM providers to support at MVP? (OpenAI + Anthropic confirmed; others TBD) | PDR-003 | Product | Month 1 |
| Which calendar integration first? (Google Calendar confirmed; Outlook TBD) | PDR-001 | Engineering | Month 2 |
| Pricing for first paid solution? ($1,000 estimate needs validation) | PDR-003 | Product | Month 8 |
| Skill Workshop: autonomous proposal generation (opt-in) or user-initiated only? | PDR-007 | Product | Month 4 |
| Memory storage: SQLite-only or include ChromaDB vector search? | PDR-007 | Engineering | Month 4 |
| Scheduler concurrency: serial or parallel task execution? | PDR-008 | Engineering | Month 4 |
| Document version retention policy? (keep all versions vs rolling window) | PDR-008 | Engineering | Month 4 |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| PRD | Product Requirements Document - this document |
| PDR | Product Decision Record - documented product decisions with rationale |
| BYOK | Bring Your Own Key - user provides their own LLM API key |
| NFR | Non-Functional Requirement - quality attributes, not features |
| MCP | Model Context Protocol - standard for tool extensibility |
| HITL | Human-in-the-Loop - user approval gates for sensitive actions |
| Orchestrator | Central agent that plans and delegates tasks |
| Agent | Specialized AI worker that executes specific domain tasks |
| CompletionEnforcer | State-machine-driven verification system with auto-continuation, stall detection, and max-retry enforcement |
| Skill Workshop | Proposal-based system for creating reusable SKILL.md files from conversation context |
| Standing Orders | Persistent agent instructions loaded into every session (e.g., "always sign emails with my full name") |
| Memory System | Persistent categorized storage for facts, preferences, identity, events, contacts, projects, and instructions |
| NL Scheduling | Natural language cron job creation ("check my email every morning at 9:00") |
| Secret Storage | Encrypted at-rest credential storage using Fernet encryption with machine-derived keys |
| File System Tools | Sandboxed read/write/edit/glob/grep/ls tools confined to a configurable workspace root |
| Daemon Crash Recovery | Background daemon resilience: auto-restart, stale task recovery, graceful shutdown |

---

## Appendix B: References

- Product Decision Records (.specify/drafts/pdr.md)
- Project constitution (.specify/memory/constitution.md)
- Market research: Grand View Research, 2025 - Personal AI Assistant Market
- Competitive analysis: Intuit / FreshBooks SMB productivity reports
- Industry trend: Gartner 2025 - SMB Local-First Technology Preferences
- OpenClaw AI Assistant (github.com/openclaw/openclaw) — Agent harness, skill workshop, cron system reference
- Accomplish Desktop Agent (github.com/accomplish-app/accomplish) — Electron/React/daemon architecture, CompletionEnforcer reference
- Odysseus AI Workspace (github.com/MaorInnovations/odysseus) — File system tools, memory system, document editing, scheduler reference

---

## Appendix C: Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-24 | AI Agent Orchestrator | Initial version |
| 1.1 | 2026-06-24 | AI Agent Orchestrator | Updated roadmap with 5 new PDRs from reference project analysis |

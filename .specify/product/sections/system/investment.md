# Investment & Resources: System

**Feature Area**: System
**PDRs Referenced**: PDR-001, PDR-002, PDR-003, PDR-004
**Generated**: 2026-06-24
**Dependencies**: Requirements, Risks
**Section Number**: 10.5 (in final PRD)

---

## 10.5 Investment & Resources

**Purpose**: Define team, budget, and resource requirements for stakeholder resource allocation decisions

### 10.5.1 Team Composition

| Role | FTEs | Phase | Duration | Responsibility |
|------|------|-------|----------|----------------|
| Electron/React Developer | 1 | All | 6 months | Desktop UI, daemon, app store packaging |
| Agent Engineer (eve framework) | 1 | Foundation + Agents | 5 months | Orchestrator, agents, verification loop |
| MCP/Tools Engineer | 1 | Foundation + Agents | 4 months | MCP servers, tool system, sandboxing |
| Product Manager | 1 | All | 6 months | Product decisions, user research, GTM |
| Designer (part-time) | 0.5 | Foundation | 2 months | UI/UX design, onboarding flow |
| QA (part-time) | 0.5 | Agents + Launch | 3 months | Testing, verification loop validation |

**Total:** 3.5 FTEs average, 5 FTEs peak

### 10.5.2 Budget Estimate

| Category | Phase 1 (Foundation) | Phase 2 (Agents) | Phase 3 (Launch) | Annual Run Rate |
|----------|----------------------|-------------------|------------------|-----------------|
| **Personnel** | $180K (3 FTEs x 3 months) | $200K (4 FTEs x 3 months) | $200K (4 FTEs x 3 months) | $780K |
| **Infrastructure** | $5K (dev tools, CI) | $5K (testing infra) | $5K (app store fees) | $20K |
| **Third-Party Services** | $2K (design tools) | $2K (analytics) | $5K (website hosting, marketing) | $12K |
| **Tools & Licenses** | $5K (LLM eval credits) | $5K (LLM eval credits) | $5K (LLM eval credits) | $20K |
| **Total** | **$192K** | **$212K** | **$215K** | **$832K** |

### 10.5.3 Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| **Optimistic** | 20% | 150% | $2.1M | 8 months |
| **Base Case** | 50% | 40% | $720K | 16 months |
| **Pessimistic** | 30% | -20% | -$180K | N/A (pivot) |
| **Weighted Average** | 100% | **38%** | **$680K** | **14 months** |

*Revenue projection assumes 10k downloads at 5% conversion to $1,000 solutions*

### 10.5.4 Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| 10k downloads within 6 months | Comparable desktop AI tool launches (Ollama, LM Studio) | Low adoption = slower revenue; extend timeline |
| 5% free-to-paid solution conversion | Industry average for freemium desktop tools | Lower conversion = extend payback period |
| $1,000 average solution price | Comparable to professional tool add-ons (Photoshop plugins, CAD extensions) | Higher price = fewer sales; lower price = more volume needed |
| Team of 3-5 FTEs sufficient | MVP scope is focused (2 agents, not 5) | More complex than expected = need more engineers = higher burn |

### 10.5.5 Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Foundation Complete | Month 3 | BYOK + Orchestrator working end-to-end; verification loop functional | Go / No-Go |
| Beta Ready | Month 5 | Secretary + Accountant agents functional with verification; MCP tool system complete | Go / No-Go |
| Public Launch | Month 6 | App store approved; >50 beta testers active; verification pass rate >70% | Go / No-Go |

---

**PDR Traceability:**

| PDR | Decision | Impact on Investment |
|-----|----------|---------------------|
| PDR-001 | MVP Agent Set | 2 agents instead of 3 reduces team size and timeline |
| PDR-003 | Monetization | Free core + $1k solutions drives revenue projection |
| PDR-004 | Go-to-Market | App store distribution eliminates custom update infrastructure cost |

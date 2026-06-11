# Success Metrics: Task Orchestration

**Feature Area**: Task Orchestration
**PDRs Referenced**: PDR-001, PDR-002, PDR-006, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Goals

---

## 5. Success Metrics

**Purpose**: Define measurable outcomes for the task-first experience.

### 5.1 Key Metrics

| Category | Metric | Target | Measurement Method |
|----------|--------|--------|-------------------|
| Adoption | First task started after onboarding | High enough to sustain weekly activation reviews | Count newly created tasks from new users |
| Engagement | Repeat tasks per active user | Upward trend after first useful completion | Compare repeat task creation over time |
| Revenue/Value | Future bundle demand signal | Defer until free core value is proven | Proxy with repeat usage and saved recurring tasks |
| Quality | User-confirmed useful task completion rate | Primary product KPI | Completion confirmation and follow-up sentiment |

### 5.2 Leading Indicators

| Indicator | Target | Timeframe |
|-----------|--------|-----------|
| Tasks that reach a visible completion state | Majority of started tasks | Weekly |
| Users who return to task history or favorites | Sustained growth | Monthly |

### 5.3 Lagging Indicators

| Indicator | Target | Timeframe |
|-----------|--------|-----------|
| Weekly retained users completing repeat tasks | Upward trend | Quarterly |
| Scheduled task reuse | Growth after initial activation | Quarterly |

### 5.4 Metrics Traced to PDRs

| Metric | Target | PDR | Rationale |
|--------|--------|-----|-----------|
| Useful task completion rate | Highest-priority metric | PDR-002 | The task is the primary workflow unit. |
| Repeat-task retention | Secondary metric | PDR-001 | Retention validates the workforce positioning. |
| Reduced interruptions per completed task | Improvement trend | PDR-006 | Guardrails should stay safe without excessive friction. |
| Free-core repeat usage | Improvement trend | PDR-008 | Usage must justify future commercialization. |

### 5.5 Metric Baselines

| Metric | Current Baseline | Target | Delta |
|--------|-----------------|--------|-------|
| Useful task completion rate | Baseline not yet instrumented | Establish baseline, then improve release over release | Positive trend |
| Repeat tasks per retained user | Baseline not yet instrumented | Establish baseline in post-PRD telemetry planning | Positive trend |

### 5.6 Measurement Cadence

| Metric | Frequency | Owner | Review Forum |
|--------|-----------|-------|-------------|
| Useful task completion rate | Weekly | Product and engineering | Product review |
| Repeat-task retention | Monthly | Product | Roadmap review |
| Permission interruption rate | Weekly | Product and engineering | UX quality review |

---

**PDR Traceability:**

| PDR | Decision | Impact on Metrics |
|-----|----------|-------------------|
| PDR-001 | Simple-user positioning | Metrics must reflect real usefulness, not just feature exposure. |
| PDR-002 | Task completion is primary | Sets the top-level KPI. |
| PDR-006 | Guardrailed automation | Adds interruption and trust-sensitive quality measurement. |
| PDR-008 | Free-core current scope | Defers hard revenue metrics until after value proof. |

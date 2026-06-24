# Problem: System

**Feature Area**: System
**PDRs Referenced**: PDR-001, PDR-002
**Generated**: 2026-06-24
**Dependencies**: Overview
**Section Number**: 3 (in final PRD)

---

## 3. The Problem

**Purpose**: Articulate the problem being solved

### 3.1 Problem Statement

Solopreneurs and small business owners spend 15-20 hours per week on
administrative tasks — scheduling, email, invoicing, expense tracking — that
could be automated. Current solutions require technical skills (scripting,
Zapier configuration), are single-purpose (only calendars or only invoicing),
or compromise privacy by sending business data to the cloud.

### 3.2 Problem Context

**Current State:**

- Small business owners manually manage calendars, chase invoices, and maintain
  expense spreadsheets
- Available AI tools (ChatGPT, Claude) are chat-only and cannot execute multi-step
  tasks across different domains
- Automation platforms (Zapier, Make) require visual workflow configuration that
  non-technical users find complex
- Cloud-based tools raise privacy concerns for sensitive financial and business data

**Pain Points:**

- **Time drain**: 15-20 hrs/week lost to admin work that doesn't generate revenue
- **Fragmented tools**: Calendar app, email client, accounting software, file storage
  — no unified automation
- **Technical barrier**: Existing automation tools require configuration skills most
  solopreneurs lack
- **Privacy anxiety**: Sending invoices, client emails, and calendar data to cloud
  AI services feels unsafe

**Impact of Not Solving:**

- **Business impact**: Lost revenue opportunity as admin time crowds out billable work
- **User impact**: Burnout from juggling multiple admin tools and manual processes
- **Technical impact**: Fragmented tool landscape creates data silos and manual
  reconciliation work

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| User Research | Small business surveys | 67% of solopreneurs cite admin work as top time-waster |
| Market Data | Intuit / FreshBooks reports | Average freelancer spends 5 hrs/week on invoicing alone |
| Industry Trend | Gartner 2025 | 73% of SMBs seeking local-first alternatives to cloud AI |
---

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-001 | MVP Agent Set | Secretary + Accountant directly address admin/finance pain |
| PDR-002 | Target Persona | Solopreneur pain validated as primary market driver |

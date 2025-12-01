---
title: "Day 6: Observability (TBU)"
description: Observability tracking using D1
---


I am want to track everything thought a dashboard with analytics. D1 maybe a good choice that we can track everything for a single request with everything happens. I am telling Claude what I want:

```
Checkout the new branch and implement this feature.

I want to store all logging data in the D1 database with the following information:

- app (telegram-webhook, github-webhook)
- trigger events
- who triggered it
- trigger time
- status
- error
- response
- duration
- token counts
- agents involved (flexible enough to explore later)
- all useful information for building the dashboard with charts and tables later.
```

![[day-6-plan.png]]

Plan Summary

| Aspect      | Decision                                                |
|-------------|---------------------------------------------------------|
| Package     | New `@duyetbot/observability`                           |
| Schema      | Single events table with JSON columns for agents/tokens |
| Granularity | Full agent chain in agents JSON array                   |
| Retention   | No auto-delete                                          |
| Database    | New duyetbot D1 database                                |
I am also asking shared-agents should manage this D1 migrations as will be using for multiple apps. The implement starting

```
✽ Creating duyetbot D1 database… (esc to interrupt · ctrl+t to hide todos · 4m 49s · ↓ 4.4k tokens)
  ⎿ ☐ Phase 1: Create duyetbot D1 database
     ☐ Phase 1: Create observability migration in shared-agents
     ☐ Phase 1: Add D1 binding to shared-agents wrangler.toml
     ☐ Phase 2: Update observability storage.ts with prefixed tables
     ☐ Phase 3: Create memory-mcp rename migration
     ☐ Phase 3: Update memory-mcp source files with prefixed tables
     ☐ Phase 3: Delete old observability migration from memory-mcp
     ☐ Phase 4: Update telegram-bot wrangler.toml
     ☐ Phase 4: Update github-bot wrangler.toml
     ☐ Phase 5: Run checks and verify builds
```
---
title: "TL;DR: Effective Harnesses for Long-Running Agents"
description: Summary of Anthropic's guide on building harnesses for agents that work across multiple context windows.
---

Long-running agents lose memory between sessions - like engineers working shifts with no handoff notes.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLUTION ARCHITECTURE                        │
│                                                                 │
│  Session 1: Initializer Agent                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Create init.sh (dev environment setup)                │    │
│  │ • Create claude-progress.txt (work log)                 │    │
│  │ • Initial git commit                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  Session 2+: Coding Agent                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Read progress.txt + git log                          │    │
│  │ 2. Work on ONE feature                                  │    │
│  │ 3. Test end-to-end (Puppeteer, not just unit tests)     │    │
│  │ 4. Commit with descriptive message                      │    │
│  │ 5. Update progress.txt                                  │    │
│  │ 6. Leave codebase production-ready                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Patterns

- **Feature list (JSON)**: 200+ features to prevent premature "I'm done"
- **Incremental progress**: One feature at a time, not one-shot everything
- **E2E testing**: Browser automation catches bugs code review misses
- **Session startup checklist**: Read dir → progress file → feature list → git log → run tests

## Testing with Browser Automation

![Puppeteer testing](https://www-cdn.anthropic.com/images/4zrzovbb/website/f94c2257964fb2d623f1e81f874977ebfc0986bc-1920x1080.gif)

## Open Question

Single general-purpose agent vs. specialized agents (testing, QA, cleanup)?

## Reference

- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Anthropic Engineering

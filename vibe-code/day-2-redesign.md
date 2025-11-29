---
title: "Day 2: Redesign"
description: Pivoting from one complex agent to 8 specialized agents using Cloudflare Durable Objects.
---

# Day 2: Redesign

After all I read last night about agents SDK and DO, I redesigned with multiple simple agents instead of one complex one.



## The New Architecture

```
┌────────────────────────────────────────────────────┐
│               Cloudflare Agents SDK Pattern        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Telegram/GitHub Webhook                           │
│         │                                          │
│         ▼                                          │
│  ┌────────────────┐                                │
│  │  Router Agent  │ ◄── Pattern matching first     │
│  │  (DO)          │     LLM fallback if unsure     │
│  └────────┬───────┘                                │
│           │                                        │
│  ┌────────┼────────────────┬──────────────┐        │
│  ▼        ▼                ▼              ▼        │
│ ┌──────┐ ┌──────┐  ┌────────────┐  ┌──────────┐    │
│ │Simple│ │HITL  │  │Orchestrator│  │Research  │    │
│ │Agent │ │Agent │  │Agent (DO)  │  │Worker(DO)│    │
│ │(DO)  │ │(DO)  │  └──────┬─────┘  └──────────┘    │
│ └──────┘ └──────┘         │                        │
│                   ┌───────┼────────┐               │
│                   ▼       ▼        ▼               │
│              ┌────────┐ ┌─────┐ ┌───────┐          │
│              │Code    │ │Git  │ │Duyet  │          │
│              │Worker  │ │Hub  │ │Info   │          │
│              │(DO)    │ │(DO) │ │(DO)   │          │
│              └────────┘ └─────┘ └───────┘          │
└────────────────────────────────────────────────────┘
```

8 Durable Objects. Each one does one thing.

## Why This Design

**1. Cloudflare Agents SDK instead of Claude Code SDK**
- Built for Workers + Durable Objects
- Works for short-running tasks
- Fire-and-forget webhooks

**2. Multi-Agent Routing**
- **SimpleAgent** → Quick answers, no tools needed
- **OrchestratorAgent** → Complex stuff, breaks it down
- **HITLAgent** → Needs approval before acting
- **Workers** → Specialized tasks (code, github, research)

**3. Pattern Matching First**

Router doesn't use LLM for every classification. That's slow and expensive.

```typescript
// Fast pattern matching
if (text.includes('weather') || text.includes('time')) {
  return 'simple';
}
if (text.includes('PR') || text.includes('review')) {
  return 'github';
}
// Only use LLM if patterns don't match
return await classifyWithLLM(text);
```

## The LLM Choice: Grok-4.1-fast

Grok is currently free via OpenRouter.

```
User → Cloudflare AI Gateway → OpenRouter → Grok-4.1-fast
```

When something is free and fast enough, use it. I can switch to Claude/GPT later.

## Fire-and-Forget Pattern

Telegram/GitHub webhooks need response in <5 seconds.

```
┌────────────────────────────────────────────────────────┐
│                   WEBHOOK FLOW                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Telegram: "Hey @duyetbot what's up?"                  │
│         │                                              │
│         ▼                                              │
│  ┌────────────────────┐                                │
│  │   Worker (HTTP)    │                                │
│  │   • Parse message  │                                │
│  │   • Send to DO     │ ◄── Fire-and-forget            │
│  │   • Return 200 OK  │     Don't wait for result      │
│  └─────────┬──────────┘                                │
│            │ ~50ms                                     │
│            ▼                                           │
│  ┌────────────────────┐                                │
│  │   Durable Object   │                                │
│  │   • Think          │                                │
│  │   • Reply async    │ ◄── Takes as long as needed    │
│  └────────────────────┘                                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Webhook returns immediately. DO takes its time.

## Pain Points

1. **30-second timeout** is still there per DO request
2. Main agent waiting for child = timeout risk
3. Need async patterns for everything

## What I Built

- RouterAgent skeleton
- Fire-and-forget webhook handler
- Basic pattern matching classifier
- Grok integration via OpenRouter

```bash
# The monorepo structure
packages/
├── chat-agent     # Multi-agent routing (main logic)
├── providers      # LLM providers (OpenRouter)
├── prompts        # System prompts
└── tools          # Built-in tools

apps/
├── telegram-bot   # Telegram webhook + DO
├── github-bot     # GitHub webhook + DO
└── shared-agents  # 8 shared DOs
```

## What I Learned

1. **Specialized agents > one big agent** - Each DO does one thing

2. **Fire-and-forget is essential** - Webhooks need to respond fast

3. **Free LLMs are real** - Grok-4.1-fast via OpenRouter works

---

*[Previous: Day 1 - First Pivot](./day-1-first-pivot)*

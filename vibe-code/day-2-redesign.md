---
title: "Day 2: Redesign"
description: Pivoting from one complex agent to 8 specialized agents using Cloudflare Durable Objects.
---

After reading about the Agents SDK and Durable Objects last night, I am understand more about their concept, Claude Code was right about the design but I was keep debate with it. Time to redesign with multiple specialized agents to extending more.

## The Problem with Single Agent

The Day 1 design was just one agent handling everything:

```
User → Webhook → Agent → LLM → Reply
```

This works for simple questions. But what about:
- "Review this PR and suggest changes" (needs GitHub API + code analysis)
- "What meetings do I have today?" (needs calendar access)
- "Search for recent news about AI agents" (needs web search)

One agent can just doing all of the things, in theory with all of tools it can automactlly works well and pick the right one. I am not design the agent with too much purpose like that before, we also need to a good model that can handle that. Different tasks need different tools, different prompts, different handling.

## Asking Claude Code for a New Design

I opened plan mode and asked:

```
Redesign the architecture with multiple specialized agents. Each agent should handle one type of task. Use Cloudflare Durable Objects for each agent. Include a router to dispatch incoming messages to the right agent.
```

Claude Code came back with an 8-agent architecture:

```
Telegram/GitHub Webhook
        │
        ▼
┌────────────────┐
│  Router Agent  │ ◄── Pattern matching first, LLM fallback
│  (DO)          │
└────────┬───────┘
         │
┌────────┼────────────────┬──────────────┐
▼        ▼                ▼              ▼
┌──────┐ ┌──────┐  ┌────────────┐  ┌──────────┐
│Simple│ │HITL  │  │Orchestrator│  │Research  │
│Agent │ │Agent │  │Agent (DO)  │  │Worker(DO)│
│(DO)  │ │(DO)  │  └──────┬─────┘  └──────────┘
└──────┘ └──────┘         │
                  ┌───────┼────────┐
                  ▼       ▼        ▼
             ┌────────┐ ┌─────┐ ┌───────┐
             │Code    │ │Git  │ │Duyet  │
             │Worker  │ │Hub  │ │Info   │
             │(DO)    │ │(DO) │ │(DO)   │
             └────────┘ └─────┘ └───────┘
```

8 Durable Objects. Each one does one thing.

## Why Multiple Agents

**Router Agent** decides where to send the message. It uses pattern matching first (fast, no LLM call), then falls back to LLM classification if patterns don't match.

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

**SimpleAgent** handles quick questions that don't need tools. Just LLM call and reply.

**HITLAgent** (Human-in-the-Loop) handles actions that need my approval before executing. Like deleting a branch or closing a PR.

**OrchestratorAgent** breaks down complex tasks into subtasks and coordinates multiple workers.

**Worker agents** (Code, GitHub, DuyetInfo, Research) are specialized for specific domains.

## Fire-and-Forget Pattern

One thing I learned: Telegram and GitHub webhooks need response in <5 seconds. If the worker takes too long, the webhook times out and retries.

The solution is fire-and-forget:

```
Telegram: "Hey @duyetbot what's up?"
        │
        ▼
┌────────────────────┐
│   Worker (HTTP)    │
│   • Parse message  │
│   • Send to DO     │ ◄── Don't wait for result
│   • Return 200 OK  │
└─────────┬──────────┘
          │ ~50ms
          ▼
┌────────────────────┐
│   Durable Object   │
│   • Think          │
│   • Reply async    │ ◄── Takes as long as needed
└────────────────────┘
```

The webhook handler just passes the message to the Durable Object and returns immediately. The DO takes as long as needed to think and reply directly to Telegram/GitHub.

I asked Claude Code to implement this:

```
Implement the fire-and-forget webhook pattern. The Hono worker should parse the incoming message, trigger the RouterAgent DO, and return 200 OK immediately. The RouterAgent will handle the response asynchronously.
```

## The Monorepo Structure

Claude Code suggested a monorepo structure to keep things organized:

```
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

The `packages/` folder contains shared code. The `apps/` folder contains the deployable workers.

I asked to implement the structure:

```
Create the monorepo structure with pnpm workspaces. Set up the telegram-bot app with Hono and the RouterAgent DO. Include TypeScript config and wrangler.toml for deployment.
```

## Pain Points

1. **30-second timeout** is still there per DO request. Long-running tasks will still timeout.
2. Main agent waiting for child agent = timeout risk. Need to think about async coordination.
3. Need async patterns for everything.

These will become problems later. For now, the basic structure works.

## What I Built Today

- RouterAgent skeleton with pattern matching
- Fire-and-forget webhook handler with Hono
- Basic Durable Object structure
- Monorepo with pnpm workspaces

## What I Learned

1. **Specialized agents > one big agent** - Each DO handles one type of task, easier to maintain and debug.

2. **Fire-and-forget is essential** - Webhooks can't wait for slow LLM calls. Trigger async, respond immediately.

3. **Pattern matching before LLM** - Save tokens and latency by handling obvious cases with simple string matching.

---

*[Previous: Day 1 - First Idea](./day-1-first-idea)*

*[Next: Day 3 - MCP Integration](./day-3-mcp-integration)*

## References

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) - Stateful serverless
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) - Agent patterns for Workers
- [Hono](https://hono.dev/) - Fast web framework for Cloudflare Workers
- [pnpm Workspaces](https://pnpm.io/workspaces) - Monorepo package management

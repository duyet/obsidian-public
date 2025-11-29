---
title: "Day 1: First Idea"
description: Starting with the wrong SDK and learning platform constraints.
---

# Day 1: First idea

The idea: build a personal AI agent that lives on GitHub, Telegram, maybe CLI later. All sharing the same memory.

I picked Claude Code SDK because it seemed powerful for multi-agent orchestration. I would only need to define the sub-agents or skills for each capability like code review, checking PRs, summary news, ... There is something I am wonder is not clear about how it is organized like session, memory, etc.

## The Starting Point

I am started ask Claude Code Web to help plan:

```
Research and write everything to PLAN.md in detail for building an AI Agent with multiple interface:
- I can chat with @duyetbot via Telegram (e.g. "what's the news today?", "any open PRs", ...)
- I can tag him via GitHub issues and PRs (e.g. "@duyetbot close this pr", "@duyetbot summarize this issue", "@duyetbot write the PR content", ...)
- Deploy to Cloudflare
- Shared memory between all interfaces
- Database options (D1? KV? Both?)
- MCP
- Long-running agent patterns
```

Claude came back with a detailed PLAN.md. Multi-tier architecture, orchestrator patterns. Claude Agent SDK can only be hosted on Cloudflare Sandbox, if not should be in VM or service like Fly.io.

```
┌────────────────────────────────────────┐
│  What I Wanted                         │
│  ┌──────────────────────────────────┐  │
│  │  Claude Code SDK                 │  │
│  │  • Long-running tasks            │  │
│  │  • Stateful execution            │  │
│  │  • Complex orchestration         │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
                 ❌
                 │
                 ▼
┌────────────────────────────────────────┐
│  What Cloudflare Workers Offer         │
│  ┌──────────────────────────────────┐  │
│  │  Workers + Durable Objects       │  │
│  │  • 30-second CPU timeout         │  │
│  │  • Edge-native state             │  │
│  │  • Different paradigm            │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

Claude Code SDK needs to spawn containers, run long processes, do complex multi-step reasoning and tool calls. Workers is not designed for that. It is serverless with strict timeout limits.

Cloudflare Agents SDK offers Durable Objects pattern: a Worker with state (SQLite backed database) that can be triggered from other Workers. This design allows chaining steps without hitting timeout limits.

But for the most of the cases I think the actual questions I want to ask are simple except for coding agent tasks and research tasks. For example:

- "What's the news today?"
- "Summarize this PR"
- "What's on my calendar?"
- "Who is duyet?"

So, Claude Code SDK is seem overkill. 

## The Pivot

New plan: start simple. Build for the common case first.

**Simple queries → Simple agent → Quick response**

No complex orchestration. No long-running containers. Just:
1. Get message
2. Think
3. Reply

OK then I am asking for update the plan again:

```
Research and update the plan for using Cloudflare Workers + Durable Objects to build an AI Agent with multiple interface instead of Claude Code SDK. 
```

Later I am realized that I can start with Cloudflare [agents SDK](https://agents.cloudflare.com). That's what I need, in their document page:

> Build agents on Cloudflare — the platform designed for durable execution, serverless inference, and pricing that scales up (and down).

That's wrapper on top of Workers + Durable Objects, optimized for AI agents. Offer patterns for persist state, schedule tasks, run asynchronous workflows, browse the web, query data, etc. 

The example quite clean with [example code repo](https://github.com/cloudflare/agents-starter): I am plan to (1) define an agent, (2) handle incoming request via `/webhook` and triggering agent to run, then let the agent handle the rest. Agent also need a LLM provider so I choose to use Cloudflare AI Gateway which is built-in integration and seamlessly work with Agents SDK.

```typescript
import { Agent, AgentNamespace } from "agents";

export class MyAgent extends Agent {
  // Define methods on the Agent:
  // https://developers.cloudflare.com/agents/api-reference/agents-api/
  //
  // Every Agent has built in state via this.setState and this.sql
  // Built-in scheduling via this.schedule
  // Agents support WebSockets, HTTP requests, state synchronization and
  // can run for seconds, minutes or hours: as long as the tasks need.
}
```
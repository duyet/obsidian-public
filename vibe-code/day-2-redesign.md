---
title: "Day 2: Redesign"
description: Pivoting from one complex agent to 8 specialized agents using Cloudflare Durable Objects.
---

After reading about the [Agents SDK](https://developers.cloudflare.com/agents) and [Durable Objects](https://developers.cloudflare.com/durable-objects/) last night, I now understood more about their concepts. Claude Code was right about the design, but I kept debating with it. Now it's time to redesign with multiple specialized agents to extend functionality.

## The Current Single Agent

The Day 1 design was just one agent handling everything:

```
User → Webhook → Agent → LLM → Reply
```

This works for simple questions. But what about:
- "Review this PR and suggest changes" (needs GitHub API and code analysis)
- "What meetings do I have today?" (needs calendar access)
- "Search for recent news about AI agents" (needs web search)

In theory, one agent with all the tools could automatically pick the right one. But in practice, this doesn't work well. Different tasks need different tools, different prompts, and different handling with a lot of tokens to have in single context. A single LLM can't handle everything well. We need specialized agents.

## Asking Claude Code for a New Design

I opened plan mode and asked:

```
Redesign the architecture with multiple specialized agents. Each agent should handle one type of task. Use Cloudflare Durable Objects for each agent. Include a router to dispatch incoming messages to the right agent.
```

Claude Code came back with a multiple agent architecture:

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

Each one does one thing. Looks nice. I asked Claude Code to start implementation.

Noticed about Worker at the bottom, I asked Claude Code to explain:

```
Prompt: Explain the difference between Agents and Workers

⏺ Agents vs Workers

  |           | Agents         | Workers           |
  |-----------|----------------|-------------------|
  | Role      | Decide & route | Execute tasks     |
  | State     | Stateful       | Stateless         |
  | Called by | Router         | Orchestrator only |
  | Examples  | SimpleAgent    | CodeWorker        |

  TL;DR: Agents decide → Workers do.


⏺ User: "Research the latest React 19 features and write a blog post about them"
                      │
                      ▼
               ┌─────────────┐
               │ RouterAgent │ ← Classifies as: complex/research/medium
               └─────────────┘
                      │
                      ▼  (routes to)
            ┌─────────────────────┐
            │  OrchestratorAgent  │ ← Creates execution plan
            └─────────────────────┘
                      │
          ┌───────────┴───────────┐
          │ Creates plan steps:   │
          │ 1. research-step      │
          │ 2. write-step         │
          └───────────┬───────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
  ┌────────────────┐    ┌────────────────┐
  │ ResearchWorker │    │  CodeWorker    │
  │ (step 1)       │───▶│ (step 2)       │ ← Receives research results
  └────────────────┘    └────────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
            ┌─────────────────────┐
            │  OrchestratorAgent  │ ← Aggregates worker results
            └─────────────────────┘
                      │
                      ▼
              Final Response
```


## The Implementation

I opened the code it wrote after a few hours and started testing. The architecture looked good but testing revealed issues.

### RouterAgent

The router agent uses pattern matching first (fast, no LLM call), then falls back to LLM classification if patterns don't match. This is a good idea to save tokens and latency.

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

### SimpleAgent

**SimpleAgent** handles quick questions that don't need tools. Just LLM call and reply.

### HITLAgent

**HITLAgent** (Human-in-the-Loop) handles actions that need my approval before executing. Like deleting a branch or closing a PR.

### OrchestratorAgent and Worker Agents

**OrchestratorAgent** breaks down complex tasks into subtasks and coordinates multiple workers.

**Worker agents** (Code, GitHub, Research, DuyetInfo) are specialized for specific domains.

## Testing and Issues

When testing on Telegram, I saw the bot show `"Thinking..."` but never send a response. Something was causing double invocations, but no response was ever sent back.

```
Thinking...
Thinking...
```


I was too lazy to debug locally, so I copied all the Cloudflare logs and pasted them directly into Claude Code. It explained that there was an LLM timeout issue. I still didn't understand why the thinking text was appearing twice. I used the more SuperClaude command, which gave better context. I approved the plan to fix it and hoped it would work.

```
/sc:task Here are the logs. Fix the timeout issue: [Pasted logs]
```

Claude Code's analysis revealed that Telegram webhook need to respond fast, or they timeout and retry. That's exactly what I was seeing. The solution is the fire-and-forget pattern:

![[day-2-testing-and-issue.png]]

## Fire-and-Forget Pattern

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

I asked Claude Code to implement this pattern:

```
Implement the fire-and-forget webhook pattern. The Hono worker should parse the incoming message, trigger the RouterAgent DO, and return 200 OK immediately. The RouterAgent will handle the response asynchronously.
```

After implementation, Cloudflare Observability logs showed two invocations: one for the webhook handler (fast) and one for the agent RPC trigger.

![[day-2-two-invocations.png]]

## References

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) - Stateful serverless
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) - Agent patterns for Workers
- [Hono](https://hono.dev/) - Fast web framework for Cloudflare Workers
- [pnpm Workspaces](https://pnpm.io/workspaces) - Monorepo package management

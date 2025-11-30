---
title: "Day 1: First Idea"
description: Starting with the wrong SDK and learning platform constraints.
---


The idea is to build a personal AI agent that lives on GitHub, Telegram, Web, and maybe CLI later. All sharing the same memory for helping me with daily tasks: code reviews, PR management, news summary, calendar management, etc. [@duyetbot](http://github.com/duyetbot) has been running for a while now. The first design was just to keep my git history clean from automatic commit stuff and extend it later, but now it needs more than that in this AI agent era.

I picked Claude Code SDK because it seemed powerful for multi-agent orchestration. I would only need to define the sub-agents or skills for each capability like code review, checking PRs, news summary, etc. There are some things I wonder about that are not clear, like how sessions, memory, etc. are organized.

I am mainly using Claude Code and Claude Code Web with Max subscription for this project. Claude Code Web has a lot of limitations, but it offers a free $1000 credit for beta testing. So I can use it for prototyping and see how far I can go. After that I mainly use Claude Code in terminal, mostly using the powerful PLAN mode for planning and implementation.
## Planning mode

I started asking Claude Code Web to help plan:

```
Research and write everything to PLAN.md in detail for building an AI Agent with multiple interfaces:
- I can chat with @duyetbot via Telegram (e.g. "what's the news today?", "any open PRs", ...)
- I can tag him via GitHub issues and PRs (e.g. "@duyetbot close this pr", "@duyetbot summarize this issue", "@duyetbot write the PR content", ...)
- Deploy to Cloudflare
- Shared memory between all interfaces
- Database options (D1? KV? Both?)
- MCP
- Long-running agent patterns
```

Claude came back with a detailed PLAN.md. Multi-tier architecture, orchestrator patterns. Claude Agent SDK can only be hosted on Cloudflare Sandbox, otherwise it should be on a VM or service like Fly.io.

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code SDK                  Cloudflare Workers            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Long-running tasks             • 30-second CPU timeout       │
│  • Spawn containers               • Serverless, no containers   │
│  • Stateful execution             • Stateless by default        │
│  • Complex orchestration          • Simple request/response     │
│  • VM or Fly.io hosting           • Edge-native                 │
│                                                                 │
│                    ❌ Not compatible ❌                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Claude Code SDK needs to spawn containers, run long processes, and do complex multi-step reasoning and tool calls. Workers is not designed for that. It is serverless with strict timeout limits.

But for most cases I think the actual questions I want to ask are simple, except for coding agent tasks and research tasks. For example:

- "What's the news today?"
- "Summarize this PR"
- "What's on my calendar?"
- "Who is duyet?"

So Claude Code SDK seems like overkill.

## The Pivot

New plan: start simple. Build for the common case first.

**Simple queries → Simple agent → Quick response**

No complex orchestration. No long-running containers. Just:
1. Get message
2. Think
3. Reply

```
User: "What's the news today?"
    │
    ▼
┌──────────────────┐
│  1. Get message  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────┐
│  2. Think        │────▶│  LLM Provider   │
└────────┬─────────┘     └─────────────────┘
         │
         ▼
┌──────────────────┐
│  3. Reply        │
└──────────────────┘
         │
         ▼
User: "Here are today's headlines..."
```

So I asked to update the plan again:

```
Research and update the plan for using Cloudflare Workers + Durable Objects to build an AI Agent with multiple interfaces instead of Claude Code SDK.
```

Later I realized that I can start with Cloudflare [agents SDK](https://agents.cloudflare.com). That's what I need. From their documentation:

> Build agents on Cloudflare — the platform designed for durable execution, serverless inference, and pricing that scales up (and down).

It's a wrapper on top of Workers + Durable Objects, built for AI agents. Offers patterns for persisting state, scheduling tasks, running asynchronous workflows, browsing the web, querying data, etc.

The example is quite clean with the [example code repo](https://github.com/cloudflare/agents-starter). My plan is to (1) define an agent, (2) handle incoming requests via `/webhook` and trigger the agent to run, then let the agent handle the rest. The agent also needs an LLM provider, so I chose to use Cloudflare AI Gateway which has built-in integration and works well with the Agents SDK.

```typescript
import { Agent, AgentNamespace } from "agents";

export class MyAgent extends Agent {
  // Define methods on the Agent:
  // https://developers.cloudflare.com/agents/api-reference/agents-api/
  //
  // Every Agent has built-in state via this.setState and this.sql
  // Built-in scheduling via this.schedule
  // Agents support WebSockets, HTTP requests, state synchronization and
  // can run for seconds, minutes or hours: as long as the tasks need.
}
```

## Starting Implementation

I opened plan mode again and asked for an update to the design, the prompt in plan mode:

```
Design a simple telegram webhook to handle telegram messages. Design the agent with Cloudflare AI Gateway and CloudflareAgent to handle user messages.
```

Plan mode started asking me a few questions.
- **Which framework to use for API handling?** I chose **Hono**, which has high performance on Cloudflare Workers.
- **Which LLM provider to use?** I chose **OpenRouter** since it has a free tier and supports Grok models. I have a custom note for using OpenRouter via Cloudflare AI Gateway which only needs to bind directly to the workers.
- Claude Code chooses `npm` by default. I also asked to use [`bun`](https://bun.com/) instead for much better performance combined with the monorepo architecture, and [`biome`](https://biomejs.dev/) for linting and formatting. 

I opened Cloudflare Dashboard to configure an **AI Gateway**, named it `duyetbot` and added the OpenRouter key. Using the `grok-4.1-fast` model which is still free and quite promising. I am a fan of Grok at the moment. Note that this project was inspired a lot by seeing people can tag `@grok` on X for any question and it perfectly answers anything.

```
┌────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Telegram                                              │
│      │                                                 │
│      ▼                                                 │
│  ┌─────────────────────┐                               │
│  │  Hono Worker        │                               │
│  │  POST /webhook      │                               │
│  └──────────┬──────────┘                               │
│             │                                          │
│             ▼                                          │
│  ┌─────────────────────┐     ┌─────────────────────┐   │
│  │  CloudflareAgent    │────▶│  AI Gateway         │   │
│  │  (Durable Object)   │     │  └─▶ OpenRouter     │   │
│  └─────────────────────┘     │      └─▶ Grok       │   │
│                              └─────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

I let Claude Code start implementing. This took a long time.

Thanks to the `PLAN.md` file, it can keep working on the task. I also guided it to keep updating the `PLAN.md` file during implementation so another session can pick up and continue without any issues.

```
Implement the plan we have in PLAN.md for telegram webhook and agent. Keep updating the PLAN.md file with any changes or progress. Mark completed items and add any new requirements discovered during implementation.
```

Adding tests:

```
Implement unit tests and e2e tests for all apps and shared packages. Use a testing framework suitable for Cloudflare Workers. Take note to CLAUDE.md to apply TDD principles.
```

## First Deploy

Everything deployed easily via `bun run deploy` with configuration in `wrangler.toml`. Separate `apps` for each worker with shared `packages`.

```
duyetbot-agent/
├── apps/
│   ├── telegram-bot/           # Telegram webhook worker
│   │   ├── src/
│   │   └── wrangler.toml
│   │
│   └── github-bot/             # GitHub webhook worker
│       ├── src/
│       └── wrangler.toml
│
├── packages/
│   ├── chat-agent/             # Agent logic
│   ├── providers/              # LLM providers
│   ├── prompts/                # System prompts
│   └── tools/                  # Tool definitions
│
├── package.json
└── wrangler.toml               # Root wrangler config
```

Each component has its own deployment:

```bash
bun run deploy:telegram
bun run deploy:github
```

Two webhooks have been deployed.
## References

- [Cloudflare Agents SDK](https://agents.cloudflare.com) - Build agents on Cloudflare
- [Cloudflare Agents SDK Docs](https://developers.cloudflare.com/agents/) - Official documentation
- [Agents Starter Template](https://github.com/cloudflare/agents-starter) - Example code repo
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Serverless compute platform
- [Durable Objects](https://developers.cloudflare.com/durable-objects/) - Stateful serverless
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) - LLM provider proxy
- [Hono](https://hono.dev/) - Fast web framework for Cloudflare Workers
- [OpenRouter](https://openrouter.ai/) - LLM routing service
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk) - Anthropic's agent SDK

---
title: "Day 3: MCP Integration"
description: Adding memory with Model Context Protocol and discovering that async patterns are not optional.
---

The Simple Agent works well with basic questions but starts making up information when I ask for specific details about myself or the latest news.

![[day-3-first-issue.png]]

The first attempt response looks cool but totally makes up information. I started adding the [`duyet-mcp-server`](https://github.com/duyet/duyet-mcp-server/) via remote MCP server to provide real data. The implementation had been done before, including vibe code, to test it with another AI provider.

```json
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.duyet.net/sse"
      ]
    }
  }
}
```

| ![](https://github.com/duyet/duyet-mcp-server/blob/master/.github/screenshots/screenshot-1.png?raw=true) | ![](https://github.com/duyet/duyet-mcp-server/raw/master/.github/screenshots/screenshot-3.png) |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |

I gave Claude Code the README of this repo and asked it to implement it for DuyetInfoWorker.

```
Prompt: Implement MCP server integration following the duyet-mcp-server README.
Create a DuyetInfoWorker that can call MCP tools to get real information about me.
```

I kept testing a few times but it kept routing to the SimpleAgent instead of OrchestratorAgent → DuyetInfoWorker. I think the issue is RouterAgent does not know about the deep dive to DuyetInfo. There are two options now:

- (1) Making **RouterAgent** and **OrchestratorAgent** aware of **DuyetInfoWorker**: **RouterAgent** → **OrchestratorAgent** → **DuyetInfoWorker**. This needs updating the prompts for two agents.
- (2) Making a sub-agent **DuyetInfoAgent** under RouterAgent directly.

Option (2) is much better since we can build something like a sub-agent register to extend more kinds of tools or agents in the future dynamically. We can do a sub-agent builder with markdown-backed config just like Claude Code does.

The expected design now:

```
User Query
    │
    ▼
┌────────────────┐
│  RouterAgent   │
└────────┬───────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    ▼         ▼          ▼              ▼
┌─────────┐ ┌────┐ ┌──────────┐ ┌──────────────┐
│Simple   │ │HITL│ │Orchestr. │ │DuyetInfo     │
│Agent    │ │    │ │Agent     │ │Agent (NEW)   │
└─────────┘ └────┘ └──────────┘ └──────────────┘
                         │              │
                         │              └─► MCP Server
                         │
                    ┌────┴─────┬──────┐
                    ▼          ▼      ▼
                ┌────────┐ ┌────┐ ┌────┐
                │Code    │ │Git │ │Res │
                │Worker  │ │Hub │ │    │
                └────────┘ └────┘ └────┘
```

The main RouterAgent trigger rpc -> DuyetInfoAgent still has a problem: TIMEOUT after 30 seconds if MCP connection takes too long. Although they are separated DOs, the parent DO (CloudflareAgent) is still waiting for the child DO (DuyetInfoAgent) to finish. If the child DO calls MCP which takes 5-10 seconds, the total time can exceed 30 seconds.


```
Main Agent (CloudflareAgent DO)
    │
    ├─> Child Agent (DuyetInfoAgent DO)
    │        │
    │        └─> MCP Call (5-10 seconds)
    │
    └─> TIMEOUT! (30s limit hit)
```


## The Refactoring: Async + Alarms

I asked Claude Code to help refactor to async patterns with the [`alarm`](https://developers.cloudflare.com/durable-objects/api/alarms/) feature.

```
Prompt: Refactor the design to alarm-based async execution to avoid DO timeout.
```


**Fire-and-forget + alarms:**

```typescript
// Don't wait for child
childAgent.process(task);

// Schedule a check-in
await storage.setAlarm(Date.now() + 100);

// Return immediately
return { status: 'processing' };
```

The pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    ALARM PATTERN                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Parent DO                                              │
│      │                                                  │
│      ├──► Trigger child (don't wait)                    │
│      ├──► Set alarm for 1 second                        │
│      └──► Return "processing"                           │
│                                                         │
│  ... 1 second later ...                                 │
│                                                         │
│  Alarm fires                                            │
│      │                                                  │
│      └──► Check if child done?                          │
│           ├── Yes → Send response                       │
│           └── No → Set another alarm                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## The Alarm Timing Issue

In the first version: alarm at 100ms, but I experienced that the alarm sometimes never triggered. I think this is a timing issue, so I asked to change it to 1 second delay with another DO just for state observability.

```
612810d fix(chat-agent): use 1s alarm delay and add state do observability
```

The new pattern with State DO observability is too complex to explain, but here is the diagram:

```
Request → CloudflareAgent
             │
             ├──► Report to State DO (fire-and-forget)
             │     └─► registerBatch()
             │
             ├──► Trigger RouterAgent (don't wait)
             │
             └──► Return "processing"

RouterAgent → DuyetInfoAgent
    │              │
    │              ├──► MCP call (slow 5-10s)
    │              └──► Report heartbeat to State DO
    │
    └──► Meanwhile: State DO watchdog runs every 30s
         ├── Check stuck sessions (no heartbeat >60s)
         ├── Notify user if stuck
         └── Recovery if needed
```

## The Cloudflare Logs Problem

While debugging the timeout issues, I noticed something strange with the Cloudflare Logs UI. The log streaming is very delayed, up to 10 minutes. This makes debugging production issues nearly impossible when I can't wait 10 minutes to see if my fix worked.

I started asking to add more debug information attached directly to the response:

```
Prompt: Respond to the error directly in the response message when in debug mode. 

Only show debug information to the admin. Add a check for the admin user by comparing the Telegram username with env.TELEGRAM_ADMIN. 

For normal responses, attach the route information to the debug footer.

Example of debug footer:

router-agent (0.2s) -> simple-agent (4s)
```

The result looks like:

![[day-3-debug-footer.png]]


## Opus 4.5

[Opus 4.5 has been released](https://www.anthropic.com/news/claude-opus-4-5). Time to rewrite everything, hmm? 

## References

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) - Stateful serverless with alarm support
- [Cloudflare Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/) - Scheduled execution in Durable Objects
- [Model Context Protocol](https://modelcontextprotocol.io/) - Standardized AI tool integration
- [duyet-mcp-server](https://github.com/duyet/duyet-mcp-server/) - Personal information MCP server

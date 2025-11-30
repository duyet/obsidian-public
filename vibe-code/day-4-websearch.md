---
title: "Day 4: Web Search"
description: When your AI agent starts making up news and you have to figure out why.
---

I continued adding web search capabilities due to the made-up data issue I faced yesterday. The web search plugin is powered by native search for Anthropic, OpenAI, Perplexity, and xAI models but it is costly. For the current grok-4.1-model I can enable `web_search` and `x_search`, which run entirely on xAI's infrastructure. 

- https://openrouter.ai/docs/guides/features/web-search
- https://docs.x.ai/docs/guides/tools/search-tools

**Prompt:** 
```
Research and enable web_search for SimpleAgent with adjusted prompt.

- https://openrouter.ai/docs/guides/features/web-search
- https://docs.x.ai/docs/guides/tools/search-tools
```
 
Cloudflare Agents SDK v0.2.24 also just released. This update includes MCP client API improvements and fixes a bug where [schedules ↗](https://developers.cloudflare.com/agents/api-reference/schedule-tasks/) meant to fire immediately with this.schedule(0, ...) or `this.schedule(new Date(), ...)` would not fire. Good to upgrade now.

```
Read the changelog and apply an upgrade to Cloudflare Agents SDK v0.2.24
https://developers.cloudflare.com/changelog/2025-11-26-agents-resumable-streaming/
```

Time to test. I tried asking for some latest news and even forwarded a Hacker News link to get a summary:

![[day-4-first-issue.png]]

Cool. Got up-to-date responses now.

## Slow Response Improvements

Something to notice is that the response is taking quite long

```
🔍 router-agent (18.37s) → [simple/research/low] → simple-agent (24.70s)
```

Checking the AI Gateway Logs gives some more insights:
- search_tool seems to be taking long
- reasoning mode - I don't think I need that for now for trivial questions
- Another request shows that a lot of input tokens are being used: 15k tokens.

![[day-4-ai-gateway-logs.png]]

## Tool Context Overhead

While researching this, I found an Anthropic blog post about tool context overhead that was just published a few days ago.

https://www.anthropic.com/engineering/advanced-tool-use


> "At Anthropic, we've seen tool definitions consume 134K tokens before optimization."

They break down a typical 5-server MCP setup:
- GitHub: 35 tools (~26K tokens)
- Slack: 11 tools (~21K tokens)
- Sentry: 5 tools (~3K tokens)

That is 55K+ tokens before the conversation even starts.

![](http://www-cdn.anthropic.com/images/4zrzovbb/website/f359296f770706608901eadaffbff4ca0b67874c-1999x1125.png)

Their solution is a Tool Search Tool that discovers tools on-demand. I have no idea how to start implementing that because they implemented that solution as Claude internal tools `tool_search_tool_*`.

I gave this article to Claude Plan mode and asked if it had some ideas. It suggests having a separate agent to handle tool selection and RouterAgent picks the suggested tools, which is good for now. 

```
PLAN: Please analyze this https://www.anthropic.com/engineering/advanced-tool-use and suggest some improvements.
```

## The Current Design

After all the iterations, here is the final multi-agent architecture with token optimization and prompting:

```
Analyze the current codebase and docs/, show me the final architecture diagram
```

```
Telegram/GitHub Webhook
         │
         ▼ [Fire-and-forget]
┌───────────────────────┐
│ Platform Agent DO     │
│  (Telegram/GitHub)    │
│                       │
│  Batch Queue:         │ (500ms window)
│  ├─ activeBatch       │ ← Processing (immutable)
│  └─ pendingBatch      │ ← Collecting new messages
└─────────┬─────────────┘
          │
          ▼
┌───────────────────┐
│  RouterAgent      │
│  Hybrid Classify  │
│  ├─ Pattern (80%) │ → 0 tokens ⚡
│  └─ LLM (20%)     │ → 300 tokens
└─────────┬─────────┘
          │
  ┌───────┼────────┬──────────────┬──────────────┐
  ▼       ▼        ▼              ▼              ▼
┌─────┐ ┌────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Sim  │ │HITL│ │Orchestr. │ │Duyet     │ │Lead      │
│ple  │ │    │ │Agent     │ │Info      │ │Research  │
│Agent│ │    │ │          │ │Agent     │ │Agent     │
│     │ │    │ │ (Plan+   │ │          │ │          │
│     │ │    │ │ Dispatch)│ │          │ │          │
└─────┘ └────┘ └────┬─────┘ └──────────┘ └──────────┘
                    │
            ┌───────┼────────┐
            ▼       ▼        ▼
        ┌────────┐  ┌─────────┐  ┌────────┐
        │Code    │  │Research │  │GitHub  │
        │Worker  │  │Worker   │  │Worker  │
        └────────┘  └─────────┘  └────────┘

┌───────────────────┐
│  State DO         │ ← Watchdog (30s)
│  (Observability)  │
│  ├─ Sessions      │
│  ├─ Traces        │
│  └─ Metrics       │
└───────────────────┘
```

## Github Webhook

Since Telegram seems to be working fine, I asked Claude to implement a similar Github webhook based on the current architecture. Enter plan mode:

```
Reading the docs and starting to implement a GitHub webhook the same as the Telegram webhook. 
Webhook listen on @duyetbot placeholder.
"eyes" reaction to the comment instead of sending Telegram typing. 
Show "thinking..." with rotation. 
Show the debug footer message with collapsible HTML support.
Remove "eyes" reaction when finished.
```

First attempt at the implementation did not work. Back and forth with debugging many times until finally got it working:

![[day-4-github-web-search.png]]

![[day-4-web-search-2.png]]
## References

- [Grok API Documentation](https://docs.x.ai/api) - xAI's Grok API reference
- [Cloudflare Agents SDK v0.2.24](https://developers.cloudflare.com/changelog/2025-11-26-agents-resumable-streaming/) - Changelog for new MCP API
- [Anthropic Tool Use Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) - Tool context optimization

---
title: "Day 4: Hallucination"
description: When your AI agent starts making up news and you have to figure out why.
---

# Day 4: Hallucination

Time to test the bot for real.

Me: "Today news"

Bot: "Here are today's top stories from 2024:
1. [Article about something that didn't happen]
2. [Another completely fake story]
..."

I clicked the URLs. 404. Doesn't exist.

**The bot is lying to me.**

## The Investigation

My first thought: prompt issue.

```
Prompt update: "Do not make up news. If you cannot
find the news, just say 'no news found'"
```

Test again.

Bot: "Here are today's verified stories..."

*Shows more fake URLs.*

The prompt isn't the problem.

## The Real Issue

Grok doesn't have real-time web access by default. It's using training data from who knows when.

But Grok has built-in `web_search` tool. I just need to enable it.

## The Provider Stack Confusion

Here's my current stack:

```
┌──────────────────────────────────────────┐
│  The Confusing Stack                     │
├──────────────────────────────────────────┤
│                                          │
│  OpenAI SDK                              │
│         │                                │
│         ▼                                │
│  Cloudflare AI Gateway                   │
│         │                                │
│         ▼                                │
│  OpenRouter                              │
│         │                                │
│         ▼                                │
│  Grok-4.1-fast (xAI)                     │
│                                          │
└──────────────────────────────────────────┘
```

Claude Code kept getting confused about:
- What's OpenRouter vs Cloudflare AI Gateway?
- OpenRouter SDK vs OpenAI SDK?
- Tool params: `tools` (Grok) vs `plugins` (OpenRouter)?

Every time I asked "add web search", something different broke.

## The Refactoring

Enough abstraction layers. Time to simplify.

**Decision:** Use raw fetch with Grok's native API format.

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4.1-fast',
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for current information"
        }
      },
      {
        type: "function",
        function: {
          name: "x_search",
          description: "Search X/Twitter for recent posts"
        }
      }
    ]
  })
});
```

No more SDK confusion. Just raw API calls.

```
998cab8 refactor: simplify providers to openrouter only
e8f5d64 fix(providers): use raw fetch instead of openrouter sdk
13fe75e feat(tools): add xai web and x search tools
```

## The Temptation

News dropped: Cloudflare Agents SDK v0.2.24 released.

https://developers.cloudflare.com/changelog/2025-11-26-agents-resumable-streaming/

"Maybe I should use Claude Code Agent SDK now? It has proper container support..."

I started reading the docs. Started planning the migration.

Then I stopped.

**Current thing works.** It just needed web search.

I'm not switching SDKs mid-project for shinier tools. That's how projects die.

```
d372589 feat(agents): upgrade to sdk v0.2.24 with new mcp api
```

(Just updated MCP integration. Didn't migrate whole architecture.)

## After the Fix

Me: "Today news"

Bot: "Based on web search results from today:
1. [Real article with working URL]
2. [Another real story]
..."

Clicked links. They work.

No more hallucinations.

## Tool Context Overhead

While researching this, I found an Anthropic blog post about tool context:

> "At Anthropic, we've seen tool definitions consume 134K tokens before optimization."

They break down a typical 5-server MCP setup:
- GitHub: 35 tools (~26K tokens)
- Slack: 11 tools (~21K tokens)
- Sentry: 5 tools (~3K tokens)
- etc.

That's 55K+ tokens before the conversation even starts.

I'm only using a few tools. But good to know this is a real issue.

## Pain Points

1. **LLMs hallucinate without web search** - They'll confidently make stuff up

2. **SDK layers cause confusion** - OpenAI SDK → AI Gateway → OpenRouter → Grok = too many layers

3. **Tool format differences** - `tools` vs `plugins` vs other formats

4. **Temptation to switch tech mid-project** - Resist this

## What Worked

1. **Simplified provider stack** - Raw fetch, no SDK confusion

2. **Added web_search tool** - Grounds responses in reality

3. **Stayed focused** - Didn't migrate to new SDK just because it exists

## What I Learned

1. **Web search is essential** - For anything time-sensitive

2. **Fewer abstraction layers** - Less confusion, easier debugging

3. **Finish before migrating** - New shiny SDK can wait

---

*[Previous: Day 3 - MCP Integration](./day-3-mcp-integration)*

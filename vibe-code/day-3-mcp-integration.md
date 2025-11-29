---
title: "Day 3: MCP Integration"
description: Adding memory with Model Context Protocol and discovering that async patterns are not optional.
---

# Day 3: MCP Integration

Goal: Make the bot remember things.

I want a `duyet-info` agent that answers questions like:
- "Show me duyet's CV"
- "Who is this guy?"
- "Latest blog post?"

I have an MCP server at `mcp.duyet.net/sse`. Just need to connect it.

## The First Attempt

Asked Claude Code to research MCP integration. Got a plan. Started coding.

```typescript
// Looks reasonable
async function handleQuery(query: string) {
  const agent = await getDuyetInfoAgent();
  const result = await agent.callMCP('get_info', { query });
  return result;
}
```

First test: "Who is duyet?"

Response: TIMEOUT

## Understanding the Problem

Here's what was happening:

```
Main Agent (CloudflareAgent DO)
    │
    ├─> Child Agent (DuyetInfoAgent DO)
    │        │
    │        └─> MCP Call (5-10 seconds)
    │
    └─> TIMEOUT! (30s limit hit)
```

Parent DO waits for child DO. Child DO calls MCP. MCP is slow. Parent times out.

The 30-second limit I mentioned on Day 1 is per request. And it includes everything.

## The Refactoring: Async + Alarms

I asked Claude Code to help refactor to async patterns.

**Before (synchronous):**
```javascript
const result = await childAgent.process(task);
return result;  // TIMEOUT!
```

**After (fire-and-forget + alarms):**
```javascript
// Don't wait for child
childAgent.process(task);

// Schedule a check-in
await storage.setAlarm(Date.now() + 1000);

// Return immediately
return { status: 'processing' };
```

The pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    ALARM PATTERN                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Parent DO                                              │
│      │                                                  │
│      ├──► Trigger child (don't wait)                    │
│      │                                                  │
│      ├──► Set alarm for 1 second                        │
│      │                                                  │
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

First version: alarm at 100ms.

Result: Alarm never triggered.

Cloudflare alarms have minimum timing requirements. Too tight means they might not fire.

**Fix:** Changed to 1 second delay.

```
612810d fix(chat-agent): use 1s alarm delay and add state do observability
```

## The Cloudflare Logs Problem

While debugging, I noticed something.

Logs were delayed. Sometimes by minutes. Sometimes 10 minutes.

I'm debugging production issues with logs that show up 10 minutes late.

**The fix:** Add debug info directly to the response.

## Adding Debug Footer

Since I can't trust logs, I made the bot show its own debugging info:

```
┌─────────────────────────────────────────────────────┐
│ Debug Footer                                        │
├─────────────────────────────────────────────────────┤
│ Router → SimpleAgent [150ms]                        │
│   └─> Tools: [github.search, web.search]           │
│                                                     │
│ Orchestrator → [CodeWorker, ResearchWorker] [2.3s] │
│   ├─> CodeWorker [1.1s]                             │
│   └─> ResearchWorker [1.8s] → [web.search]         │
└─────────────────────────────────────────────────────┘
```

Now I can see what happened in real-time without waiting for logs.

```
9c092d7 feat(chat-agent): improve debug footer with per-agent timing and tool chains
```

## Pain Points

1. **30-second timeout is tight** - Everything needs to be async

2. **Cloudflare logs are unreliable for debugging** - Delays of 10+ minutes

3. **Async patterns required from day 1** - Should have done this earlier

4. **MCP calls are slow** - 5-10 seconds is normal

## What Worked

1. **Alarm-based async execution** - Fire, set alarm, check later

2. **Debug footer** - Don't trust logs, show the info in response

3. **Fire-and-forget everywhere** - Never wait for child agents

## Code Commits

```bash
498023f feat(chat-agent): add mcp server integration support
20976d7 fix(chat-agent): add 10s timeout to mcp connections
612810d fix(chat-agent): use 1s alarm delay
9c092d7 feat(chat-agent): improve debug footer
```

## What I Learned

1. **Async is not optional** - Everything in Durable Objects should be async

2. **Don't trust external logs** - Build visibility into your app

3. **Timeouts compound** - Parent waits for child waits for MCP = disaster

---

*[Previous: Day 2 - Redesign](./day-2-redesign)*

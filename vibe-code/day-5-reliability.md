---
title: "Day 5: Reliability"
description: Making the bot feel less janky and discovering that Telegram and GitHub speak different Markdown.
---

# Day 5: Reliability

The bot works. But it feels janky.

- "Thinking..." spins forever when something breaks
- No idea what's happening during long requests
- Forgets conversation context between messages

And then I tried to add GitHub support.

## Part 1: The Janky UX Problem

### Circuit Breaker for "Thinking..."

The issue: user sees "Thinking..." and it just spins. Forever. Then ERROR.

```
Before: "Thinking..." [spins 30s] ERROR
After:  "Thinking..." → "Still working..." → Circuit break → graceful error
```

The pattern:

```
┌──────────────────────────────────────────────────┐
│  CIRCUIT BREAKER PATTERN                         │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Request] ──► [Counter: 0] ──► Process          │
│              (on failure) ▼                      │
│            [Counter: 1] ──► Still try            │
│              (on failure) ▼                      │
│            [Counter: 3] ──► CIRCUIT OPEN         │
│                          ▼                       │
│            [Graceful Fallback]                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

```
6c72dad fix(chat-agent): add circuit breaker to thinking rotator
```

### Step Progress Tracker

Users should see what's happening:

```
🔄 Routing query...
🔄 SimpleAgent processing...
🔄 Calling web_search tool...
✅ Got search results (3 items)
🔄 Generating response...
✅ Done!
```

Better than "Thinking..." for 10 seconds.

```
f602e41 feat(chat-agent): add step progress tracker
```

### Conversation History

The bot had goldfish memory. Every message was a fresh start.

"What's the weather in Tokyo?"
→ "It's 22°C and sunny"

"And in New York?"
→ "I don't know what you're asking about"

Fixed by storing last N messages in Durable Object state:

```typescript
interface ConversationState {
  messages: Message[];  // Last 10
  summary?: string;     // Compressed older context
}
```

```
69246e3 feat(chat-agent): add conversation history support
```

Now:
"What's the weather in Tokyo?"
→ "It's 22°C and sunny"

"And in New York?"
→ "In New York it's 15°C and cloudy"

It remembers.

## Part 2: Cross-Platform Chaos

Bot works on Telegram. Time to add GitHub.

First test on GitHub:

*Markdown looks completely broken*

## The Markdown Problem

Telegram uses its own Markdown:
```
*bold* _italic_ `code`
```

GitHub uses standard:
```
**bold** *italic* `code`
```

Same LLM response. Different rendering. Broken everywhere.

### OutputFormat Abstraction

```
┌──────────────────────────────────────────────────────────┐
│                  PLATFORM ABSTRACTION                    │
│                                                          │
│  LLM Response (platform-neutral)                         │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────────────────────┐                 │
│  │      OutputFormat Transformer       │                 │
│  │  ┌─────────┐  ┌─────────┐  ┌─────┐  │                 │
│  │  │Telegram │  │ GitHub  │  │Plain│  │                 │
│  │  │*bold*   │  │**bold** │  │bold │  │                 │
│  │  └─────────┘  └─────────┘  └─────┘  │                 │
│  └─────────────────────────────────────┘                 │
│         │              │           │                     │
│         ▼              ▼           ▼                     │
│  [Telegram Bot]  [GitHub Bot]  [CLI]                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

```typescript
enum OutputFormat {
  TELEGRAM = 'telegram',
  GITHUB = 'github',
  PLAIN = 'plain'
}

function formatBold(text: string, format: OutputFormat): string {
  switch (format) {
    case OutputFormat.TELEGRAM: return `*${text}*`;
    case OutputFormat.GITHUB: return `**${text}**`;
    default: return text;
  }
}
```

```
e680528 feat(prompts): add outputformat
6c11ce1 refactor(prompts): make builder platform-neutral
```

## Credential Propagation Hell

Next problem: GitHub bot calls worked fine. Then they didn't.

```
telegram-bot (Worker)
    │
    └─> RouterAgent (shared DO)
            │
            └─> SimpleAgent (shared DO)
                    │
                    └─> AI Gateway call
                            │
                            └─> ERROR: No API key!
```

**The issue:** Shared Durable Objects don't have access to parent Worker's env.

Each Worker has its own secrets. Shared DOs have nothing.

### The Fix: platformConfig

```typescript
interface PlatformConfig {
  outputFormat: OutputFormat;
  aiGatewayUrl: string;
  aiGatewayKey: string;
}

// Parent passes config when calling DO
await router.process(message, {
  platformConfig: {
    outputFormat: OutputFormat.TELEGRAM,
    aiGatewayUrl: env.AI_GATEWAY_URL,
    aiGatewayKey: env.AI_GATEWAY_KEY,
  }
});
```

Explicit config passing. No magic.

```
0b8803d feat(chat-agent): add platformConfig
1b140c9 fix(shared-agents): propagate AI Gateway credentials
```

## MCP Connection Pool Exhaustion

One more bug.

Added GitHub MCP server for PR operations. Bot started randomly timing out.

Investigation: Each DO instance creates MCP connections. 8 DOs × multiple instances = connection pool exhausted.

**Quick fix:** Disable GitHub MCP until proper pooling.

```
9cc316c fix(telegram-bot): disable github mcp server
```

Sometimes disabling features beats broken production.

## Pain Points

1. **Platform differences are subtle** - Markdown alone has 3 formats

2. **Credentials don't flow automatically** - Explicit passing required

3. **Connection pooling in distributed systems** - Hard

4. **Features that break prod** - Sometimes you have to turn them off

## What Worked

1. **Circuit breaker** - Graceful failures

2. **Step tracker** - Users see progress

3. **OutputFormat abstraction** - Clean platform separation

4. **platformConfig** - Explicit credential flow

5. **Disabling broken features** - Stability > features

## What I Learned

1. **UX details matter** - "Thinking..." forever is bad

2. **Platform abstraction early** - Markdown differences are real

3. **Explicit > implicit** - Pass credentials, don't assume

4. **It's okay to disable things** - Working bot > feature-complete broken bot

This is where the series pauses. The bot is working, reliable enough for daily use. More days coming as development continues.

---

## The Story So Far

| Day | What Happened |
|-----|---------------|
| [Day 1](./day-1-first-idea) | Wanted Claude Code SDK, realized Workers limitations, pivoted |
| [Day 2](./day-2-redesign) | Redesigned with 8 Durable Objects, picked Grok (free) |
| [Day 3](./day-3-mcp-integration) | Added MCP, fought with timeouts, discovered alarms |
| [Day 4](./day-4-hallucination) | Bot lied about news, added web search, simplified providers |
| [Day 5](./day-5-reliability) | Added reliability features, discovered platform differences |

More coming as development continues.

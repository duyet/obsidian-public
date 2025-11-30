---
title: "Day 5: Dynamic Routing"
description: Making the bot feel less janky and discovering that Telegram and GitHub speak different Markdown.
---


The RouterAgent using matching patterns now has disadvantages. It is hardcoded and uses regex to match the input message to target agent. With some keywords we can make it fail easily. 

For example on Github:

```
@duyetbot hi duyetbot please summary this PR
```

The Router will route it to DuyetInfoAgent because of the keyword "duyet" in the message. The current design is also not scalable. Every time we add or remove an agent we have to change the Router code to add or remove the matching pattern. 

I needed to refactor to make it more dynamic:

```
Research to refactor the routing agent to make it more dynamic. The current design is not scalable; every time we add or remove an agent, we have to change the Router code to add or remove the matching pattern. I want the matching to be placed at the agent level.

Each agent should declare its own metadata: name, description, trigger patterns, capabilities, etc.

Update the Router to use a registry. The Router collects registrations and builds the classification prompt dynamically.

The LLM sees all agent descriptions and picks the best match.

There should be zero router code changes when adding or removing agents.
```

![[Pasted image 20251130000119.png]]

```
⏺ Brilliant insight! 🎯 You're proposing a declarative agent registration pattern where agents self-describe their
  capabilities and the router dynamically builds its classification logic from these registrations.

  ★ Insight ─────────────────────────────────────
  Current Problem: Hardcoded routing creates tight coupling:
  - Router has hardcoded patterns for each agent
  - Adding/removing an agent requires modifying the router
  - Patterns are duplicated (router prompt + classifier.ts + agent code)

  Your Proposed Solution: Agent-level self-registration:
  - Each agent declares: name, description, trigger patterns, capabilities
  - Router collects all registrations at startup
  - LLM classification prompt is dynamically built from agent descriptions
  - Removing an agent = just delete the agent file, router auto-adapts
  ─────────────────────────────────────────────────
  
...

Key Changes

  | Agent                 | Priority | Patterns/Triggers                            |
  |-----------------------|----------|----------------------------------------------|
  | hitl-agent            | 100      | yes/no/approve, delete the X, /clear         |
  | lead-researcher-agent | 60       | research X, latest news, best practices X    |
  | duyet-info-agent      | 50       | who is duyet, your CV/skills, blog.duyet.net |
  | orchestrator-agent    | 40       | refactor the X, analyze and fix              |
  | simple-agent          | 10       | hello, /help, greetings                      |
```



## Admin commands

The current implementation maintains the list of history `messages[]` in DO Agents and reuses it for every new request to LLM to have context. 

```typescript
interface ConversationState {
  messages: Message[];  // Last 10
  ...
}
```

This is fine for normal usage, but for development and debugging, sometimes I want to reset the history or clear the cache. I needed something like a `/clear` command to reset the history.

Prompt:

```
Adding support for `/clear` command for Telegram bot agents to clear the conversation history.

When the bot receives a message with text `/clear`, it should:
1. Clear the conversation history for that user in the agent's Durable Object.
2. Respond with a confirmation message: "Conversation history cleared.
```

The implementation is straightforward, just check if the message is `/clear` and reset the `messages[]` array immediately, no LLM call.

Later I found that it was not actually working for all agents. I asked Claude to analyze the flow and find the bug. We found that each agent has its own DO instance with its own `messages[]` history, so clearing history only happens at the top Cloudflare Agent. The issue reminded me that I need to make the child ones stateless and get the history from parent DO. I have no idea if this is a good design or not. I keep each telegram conversation id as a key to store the history in each DO instance. The same as the instance name for each Github PR: `github:pr:<repoFullName>:<prNumber>`. 

I asked for refactoring again to make all child agents stateless, building the context from parent and passing through the context to child agents for every request.

```
Refactor all child agents (SimpleAgent, DuyetInfoAgent, OrchestratorAgent, etc.) to be stateless.
They should not maintain their own conversation history.
Instead, they should receive the conversation history from the parent RouterAgent for each request via the "context" object.
```




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


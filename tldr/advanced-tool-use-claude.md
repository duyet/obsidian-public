---
title: "TL;DR: Advanced Tool Use on Claude"
description: Three features to cut tokens and boost accuracy - Tool Search, Programmatic Calling, and Usage Examples.
---

Claude's tool system eats context fast. 50 tools = 50K tokens gone before you ask anything.

```
              CONTEXT USAGE: TRADITIONAL vs TOOL SEARCH
                           (200k token context)

  Traditional approach (77.2k/200k tokens)
  ┌────────────────────────────────────────────────────────────┐
  │███████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░│ 61.4% free
  └────────────────────────────────────────────────────────────┘
   ██ MCP tools: 72k  ▒ System: 5k  ░ Free: 122.8k

  Tool Search approach (8.7k/200k tokens)
  ┌────────────────────────────────────────────────────────────┐
  │████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ 95.6% free
  └────────────────────────────────────────────────────────────┘
   ██ Search tool: 0.5k  ▓ Discovered: 3k  ▒ System: 5k  ░ Free: 191.3k

  Token savings: 68.5k tokens → 89% reduction in tool overhead
```

## Three Features

### 1. Tool Search Tool
Mark tools with `defer_loading: true` - they won't load until Claude searches for them.

- **85% token reduction** while keeping access to full tool library
- Only search tool loads initially (~500 tokens)
- Best for: 10+ tools, MCP-powered systems

### 2. Programmatic Tool Calling
Instead of each tool result returning to Claude, Claude writes a Python script that orchestrates the entire workflow. The script runs in the Code Execution tool (sandboxed), pausing when it needs results from your tools. Tool results are processed by the script rather than consumed by the model. Claude only sees the final output.

```
                  PROGRAMMATIC TOOL CALLING FLOW

  User          API         Code Execution       Claude
   │              │                │                │
   │──Request────►│                │                │
   │              │────Sampling───────────────────► │
   │              │                │   Claude generates Python script
   │              │◄────────────────────────────────│
   │              │                │                │
   │              │──Run script───►│                │
   │              │                │                │
   │              │◄─Pause: need───│                │
   │◄─Tool call───│   tool result  │                │
   │              │                │                │
   │──Tool result►│                │                │
   │              │──Resume───────►│                │
   │              │      ...       │  (loop for each tool)
   │              │◄─Script done───│                │
   │              │                │                │
   │              │────Sampling: script result─────►│
   │              │◄──────Claude interprets─────────│
   │◄──Response───│                │                │
```

- **37% token reduction** on complex research tasks
- Mark tools with `allowed_callers: ["code_execution_20250825"]`
- Best for: Large datasets, multi-step workflows, parallel operations
- 20+ tool calls in ONE inference pass - intermediate results stay in sandbox

### 3. Tool Use Examples
Show Claude correct parameter patterns beyond JSON Schema.

```json
{
  "tool_use_examples": [
    {
      "name": "create_event",
      "input": {
        "date": "2024-03-15",
        "attendees": ["user:123", "user:456"]
      }
    }
  ]
}
```

- **72% → 90% accuracy** on complex parameter handling
- Best for: Nested structures, domain conventions, many optional params

## Accuracy Gains

| Model | Before | After (Tool Search) |
|-------|--------|---------------------|
| Opus 4 | 49% | 74% |
| Opus 4.5 | 79.5% | 88.1% |

## When to Use What

| Problem | Solution |
|---------|----------|
| Context bloat (10K+ tokens in tools) | Tool Search |
| Many intermediate results | Programmatic Calling |
| Parameter formatting errors | Tool Use Examples |

## Reference

- [Advanced Tool Use on Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) - Anthropic Engineering

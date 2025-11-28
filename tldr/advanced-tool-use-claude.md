---
title: "TL;DR: Advanced Tool Use on Claude"
description: Three features to cut tokens and boost accuracy - Tool Search, Programmatic Calling, and Usage Examples.
---

Claude's tool system eats context fast. 50 tools = 50K tokens gone before you ask anything.

```
┌──────────────────────────────────────────────────────────────────┐
│                   TRADITIONAL vs ADVANCED                        │
│                                                                  │
│  Before: Load ALL tools upfront                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │ 50 tools × 1K tokens = 50K tokens in context       │  ❌ Slow │
│  └────────────────────────────────────────────────────┘          │
│                                                                  │
│  After: Tool Search + Programmatic Calling                       │
│  ┌────────────────────────────────────────────────────┐          │
│  │ 1. Search tool only (~500 tokens)                  │          │
│  │ 2. Find 3-5 relevant tools (~3K tokens)            │  ✅ Fast │
│  │ 3. Execute via code (results stay in sandbox)      │          │
│  └────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

## Three Features

### 1. Tool Search Tool
Mark tools with `defer_loading: true` - they won't load until Claude searches for them.

- **85% token reduction** while keeping access to full tool library
- Only search tool loads initially (~500 tokens)
- Best for: 10+ tools, MCP-powered systems

### 2. Programmatic Tool Calling
Let Claude write Python to orchestrate tools instead of individual API calls.

```
┌───────────────────────────────────────────────────────────────┐
│                    PROGRAMMATIC CALLING                       │
│                                                               │
│  Claude ──► Python Code ──► Code Sandbox                      │
│                                  │                            │
│                    ┌─────────────┼─────────────┐              │
│                    ▼             ▼             ▼              │
│               Tool A         Tool B        Tool C             │
│                    │             │             │              │
│                    └─────────────┼─────────────┘              │
│                                  ▼                            │
│                          Final Result ──► Claude              │
│                                                               │
│  20+ tool calls in ONE inference pass                         │
│  Intermediate results stay in sandbox (not Claude's context)  │
└───────────────────────────────────────────────────────────────┘
```

- **37% token reduction** on complex research tasks
- Mark tools with `allowed_callers: ["code_execution_20250825"]`
- Best for: Large datasets, multi-step workflows, parallel operations

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

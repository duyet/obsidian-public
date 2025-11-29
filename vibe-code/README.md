---
title: Building @duyetbot
description: A series documenting the journey of building a multi-agent AI system on Cloudflare Workers.
---

# Building @duyetbot

A series documenting the journey of building a multi-agent AI system on Cloudflare Workers + Durable Objects. Real struggles, pivots, debugging sessions, and lessons learned.

## The Series

| Day | Title | What Happened |
|-----|-------|---------------|
| [Day 1](./day-1-first-idea) | First Idea | Wanted Claude Code SDK, realized Workers limitations, pivoted |
| [Day 2](./day-2-redesign) | Redesign | Redesigned with 8 Durable Objects, picked Grok (free) |
| [Day 3](./day-3-mcp-integration) | MCP Integration | Added MCP, fought with timeouts, discovered alarms |
| [Day 4](./day-4-hallucination) | Hallucination | Bot lied about news, added web search, simplified providers |
| [Day 5](./day-5-reliability) | Reliability | Added reliability features, discovered platform differences |

## Key Concepts Covered

- Cloudflare Workers + Durable Objects
- 30-second timeout constraints
- Fire-and-forget webhooks
- Alarm-based async execution
- MCP (Model Context Protocol)
- Circuit breaker pattern
- Cross-platform abstraction (Telegram vs GitHub Markdown)
- Credential propagation (platformConfig pattern)

## Status

This series is a work in progress. More days coming as development continues.

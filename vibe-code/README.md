---
title: Building @duyetbot
description: A series documenting the journey of building a multi-agent AI system on Cloudflare Workers.
---

# Building @duyetbot agent

A series documenting the journey of building a multi-agent AI system on Cloudflare Workers + Durable Objects. Real struggles, pivots, debugging sessions, and lessons learned.

**The Goal:** 100% vibe coding - building an AI agent using only Claude Code. My effort is limited to setup and Cloudflare configuration. When bugs appear, I paste them back to Claude Code to fix itself.

## Using Claude Code the Right Way

**Plan Mode**

I always start with Plan mode. It asks questions to help make decisions, keeps updating the plan file. When ready, switch to Implement mode and let it follow its own plan.

**CLAUDE.md**

Put important context, instructions, and constraints here so Claude Code can refer to it consistently. I do not edit the file myself. I ask Claude Code to do that:
- *"Take note to CLAUDE.md to use TDD methodology"*
- *"Take note to CLAUDE.md about the stack: Bun + TypeScript + Hono + Cloudflare Workers + Vitest"*
- *"Take note to CLAUDE.md: reading docs/ for reference and keep it up to date"*
- *"Take note to CLAUDE.md: always using semantic commit, format `<type>: <description in lowercase>`"*

## The Series

| Day | Title | Description |
|-----|-------|-------------|
| [Day 1](./day-1-first-idea) | First Idea | Wanted Claude Code SDK, realized Workers limitations, pivoted |
| [Day 2](./day-2-redesign) | Redesign | Redesigned with 8 Durable Objects, picked Grok (free) |
| [Day 3](./day-3-mcp-integration) | MCP Integration | Added MCP, fought with timeouts, discovered alarms |
| [Day 4](./day-4-websearch) | Web Search | Bot lied about news, added web search, simplified providers |
| [Day 5](./day-5-reliability) | Reliability | Added reliability features, discovered platform differences |

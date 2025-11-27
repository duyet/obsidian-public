---
title: Claude Code Agent Skills
description: How skills work internally in Claude Code.
---

Skills are model-invoked capabilities that Claude auto-discovers and activates.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SKILL DISCOVERY (on startup)                     │
│                                                                     │
│  ~/.claude/skills/     .claude/skills/      ~/.claude/plugins/      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐        │
│  │   SKILL.md    │    │   SKILL.md    │    │   SKILL.md    │        │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘        │
│          │                    │                    │                │
│          └────────────────────┼────────────────────┘                │
│                               ▼                                     │
│                    ┌─────────────────────┐                          │
│                    │  SKILL REGISTRY     │                          │
│                    │  (name + description│                          │
│                    │   only, ~1KB each)  │                          │
│                    └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SKILL ACTIVATION (on match)                      │
│                                                                     │
│  User: "create spreadsheet report"                                  │
│                    │                                                │
│                    ▼                                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              CONTEXT WINDOW                                 │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │ System prompt                           ~2-4K tokens│    │    │
│  │  ├─────────────────────────────────────────────────────┤    │    │
│  │  │ SKILL.md content (full)                 ~1-2K tokens│◄───┼────┤
│  │  ├─────────────────────────────────────────────────────┤    │    │
│  │  │ Supporting files (progressive load)     as needed   │    │    │
│  │  ├─────────────────────────────────────────────────────┤    │    │
│  │  │ Conversation history                    variable    │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## SKILL.md Structure

```
┌─────────────────────────────────────────────┐
│  ---                                        │
│  name: my-skill         (max 64 chars)      │  ◄─ indexed at startup
│  description: ...       (max 1024 chars)    │  ◄─ used for matching
│  allowed-tools: [...]   (optional)          │
│  ---                                        │
│                                             │
│  # Instructions                             │  ◄─ loaded on activation
│  Full skill instructions here...            │
│  Can reference supporting files             │
│                                             │
└─────────────────────────────────────────────┘
```

## Key Points

- **Discovery**: only `name` + `description` loaded initially (lightweight)
- **Activation**: full `SKILL.md` injected into context when matched
- **Progressive**: supporting files loaded only when referenced
- **Restart required**: changes take effect on next Claude Code start

## References

- [Agent Skills Docs](https://code.claude.com/docs/en/skills)

---
title: Agent Skills
description: How skills work internally in Claude Code.
---

Skills are modular packages of instructions, scripts, and resources that extend Claude's capabilities. They are auto-discovered at startup and activated dynamically when relevant to the current task.

![Agent + Skills + Virtual Machine](https://www-cdn.anthropic.com/images/4zrzovbb/website/4b05be6bdcb92ab1f920ef95c5f6cdf82a7a44e9-2512x1396.png)

A skill is a directory containing a `SKILL.md` file with organized folders of instructions, scripts, and resources that give agents additional capabilities.

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

## Progressive Disclosure Architecture

Skills employ a tiered information loading system to prevent context window bloat:

![Skills and the Context Window](https://www-cdn.anthropic.com/images/4zrzovbb/website/8eaf0f86467f2a3be2becea6a42a8f26ed5f65e7-2512x1860.png)

| Level | What's Loaded | When |
|-------|---------------|------|
| 1 | Skill name + description | At startup (in system prompt) |
| 2 | Full `SKILL.md` content | When Claude detects relevance |
| 3+ | Referenced files (`forms.md`, `reference.md`, etc.) | As needed during task |

## How Skills Are Triggered

1. Context window initially contains core system prompt + all skill metadata
2. User sends a message (e.g., "Fill out this PDF")
3. Claude matches task to skill description
4. Claude invokes `Bash("cat /mnt/skills/pdf/SKILL.md")` to read full instructions
5. Claude selectively loads bundled reference files based on task requirements
6. Agent proceeds with task-specific instructions

## Code Execution

Skills can bundle executable scripts (particularly Python). Claude runs these deterministically without loading script content into context, improving efficiency for operations like data sorting or PDF field extraction.

## Key Points

- **Discovery**: only `name` + `description` loaded initially (lightweight)
- **Activation**: full `SKILL.md` injected into context when matched
- **Progressive**: supporting files loaded only when referenced
- **Restart required**: changes take effect on next Claude Code start

## Best Practices

- **Start with evaluation**: test agents on representative tasks, identify capability gaps, then build skills incrementally
- **Structure for scale**: split unwieldy `SKILL.md` files into separate referenced documents
- **Keep mutually exclusive contexts separate**: reduces token usage
- **Iterate collaboratively**: work with Claude to capture successful approaches into reusable skill contexts

## Security

Install skills only from trusted sources. Audit unfamiliar skills by reviewing bundled files, code dependencies, and external network connections before deployment.

## References

- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) - Anthropic Engineering Blog
- [Agent Skills Docs](https://code.claude.com/docs/en/skills)

---
title: Slash Commands
description: Create custom slash commands to automate repetitive workflows.
---

Slash commands turn repetitive prompts into reusable shortcuts. Type `/command` and Claude expands it into a full prompt with instructions.

## Why Slash Commands?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT SLASH COMMANDS                           │
│                                                                     │
│  Every time you want a TL;DR post:                                  │
│  > "Summarize this URL, create ASCII diagram, write to Public/tldr, │
│     follow my formatting style, update README..."                   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────   │
│                                                                     │
│                    WITH SLASH COMMANDS                              │
│                                                                     │
│  > /tldr https://example.com/article                                │
│                                                                     │
│  Same result. Every time.                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- **Consistency**: Same output format every time
- **Speed**: One command vs. typing detailed instructions
- **Shareable**: Team members use the same workflows
- **Composable**: Build complex workflows from simple commands

## How It Works

```
┌────────────────────────────────────────────────────────────┐
│                    SLASH COMMAND FLOW                      │
│                                                            │
│  User: /tldr https://example.com/article                   │
│              │                                             │
│              ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. DISCOVER                                         │  │
│  │     .claude/commands/tldr.md  (project)              │  │
│  │     ~/.claude/commands/*.md   (global)               │  │
│  └──────────────────────────────────────────────────────┘  │
│              │                                             │
│              ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. EXPAND                                           │  │
│  │     $ARGUMENTS = "https://example.com/article"       │  │
│  │     Load full markdown instructions into context     │  │
│  └──────────────────────────────────────────────────────┘  │
│              │                                             │
│              ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. EXECUTE                                          │  │
│  │     Claude follows instructions with allowed tools   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Command File Structure

```
.claude/commands/my-command.md
─────────────────────────────────────────────────────────
---
allowed-tools: [Read, Write, WebFetch]   ◄── Optional: restrict tools
description: "What this command does"     ◄── Shows in /help
---

# Command Title

Instructions for Claude...

Use $ARGUMENTS to access user input after the command name.
─────────────────────────────────────────────────────────
```

**Key fields:**
- `$ARGUMENTS` - Everything user types after `/command`
- `allowed-tools` - Restrict which tools Claude can use (optional)
- `description` - Shown in command list

**Nested commands:** `commands/sc/research.md` → `/sc:research`


## Examples


- Example 1: [`/tldr` - Summary Post Writer](./tldr)
- Example 2: [`/git-commit-push` - Commit and Push Workflow](./git-commit-push)


## Location Priority

```
┌───────────────────────────────────────────────────────┐
│  COMMAND RESOLUTION ORDER                             │
│                                                       │
│  1. .claude/commands/       (project-specific)        │
│           │                                           │
│           ▼ (if not found)                            │
│  2. ~/.claude/commands/     (global/user)             │
│                                                       │
│  Project commands override global with same name      │
└───────────────────────────────────────────────────────┘
```

## Tips

- **One command = one workflow**: Keep commands focused
- **Use $ARGUMENTS**: Makes commands flexible and reusable
- **Include examples**: Help Claude understand expected output
- **Add quality checklists**: Ensure consistent results

## References

- [Slash Commands Docs](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework)
---
title: Claude Code Hooks
description: Lifecycle hooks to customize Claude Code behavior.
---

Hooks let you run scripts or prompts at key lifecycle events.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOOK LIFECYCLE                                  │
│                                                                         │
│  ┌─────────────┐                                                        │
│  │SessionStart │  Session begins, inject env/context                    │
│  └──────┬──────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────────┐                                                   │
│  │UserPromptSubmit  │  User sends message, can modify/add context       │
│  └────────┬─────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     TOOL LOOP (repeats)                         │    │
│  │                                                                 │    │
│  │    ┌────────────┐      ┌──────┐      ┌─────────────┐            │    │
│  │    │PreToolUse  │─────►│ TOOL │─────►│PostToolUse  │            │    │
│  │    │can block   │      │ runs │      │ can format  │            │    │
│  │    └────────────┘      └──────┘      └─────────────┘            │    │
│  │         │                                   │                   │    │
│  │         │◄──────────────────────────────────┘                   │    │
│  │         │         (loop until done)                             │    │
│  └─────────┼───────────────────────────────────────────────────────┘    │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────┐                                                    │
│  │      Stop       │  Claude wants to stop, can approve/block           │
│  │  (prompt type)  │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────┐                                                        │
│  │ SessionEnd  │  Cleanup                                               │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘

OTHER EVENTS:
  • PreCompact        Before context compaction
  • Notification      When Claude sends notifications
  • SubagentStop      When subagent (Task tool) completes
  • PermissionRequest When permission dialog appears
```

## Hook Types

```
┌────────────────────────────────────────────────────────────────┐
│  type: command                    type: prompt                 │
│  ┌────────────────────────┐      ┌────────────────────────┐    │
│  │ Runs bash script       │      │ LLM evaluates prompt   │    │
│  │                        │      │                        │    │
│  │ Exit codes:            │      │ Returns JSON:          │    │
│  │  0 = success           │      │ {                      │    │
│  │  2 = block (stderr)    │      │   "decision": "allow"  │    │
│  │  other = non-blocking  │      │       or "block",      │    │
│  │                        │      │   "reason": "..."      │    │
│  │ All events             │      │ }                      │    │
│  └────────────────────────┘      │                        │    │
│                                  │ Stop/SubagentStop only │    │
│                                  └────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

## Example 1: Markdown Formatting Hook

Auto-format markdown files after edits:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "[[ \"$TOOL_INPUT\" =~ \\.md$ ]] && prettier --write \"$(echo $TOOL_INPUT | jq -r .file_path)\""
        }]
      }
    ]
  }
}
```

## Example 2: Plan Follow-up Hook

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "prompt",
        "prompt": "Check if ~/.claude/plans/ has a recent plan. If yes, remind: 'Plan created. Run /implement to execute.' Return JSON: {\"decision\": \"approve\", \"reason\": \"...\"}",
        "timeout": 30
      }]
    }]
  }
}
```

## Example 3: Intelligent Stop Hook

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "prompt",
        "prompt": "Evaluate if Claude should stop. Context: $ARGUMENTS\n\nCheck:\n1. All tasks complete?\n2. Errors addressed?\n3. Follow-up needed?\n\nReturn: {\"decision\": \"approve\"|\"block\", \"reason\": \"...\"}",
        "timeout": 30
      }]
    }]
  }
}
```

```
┌───────────────────────────────────────────────────────────┐
│              STOP HOOK DECISION FLOW                      │
│                                                           │
│  Claude: "Done"                                           │
│       │                                                   │
│       ▼                                                   │
│  ┌──────────────┐                                         │
│  │  Stop Hook   │                                         │
│  │  evaluates   │                                         │
│  └──────┬───────┘                                         │
│         │                                                 │
│    ┌────┴────┐                                            │
│    ▼         ▼                                            │
│ approve    block ──► Claude continues working             │
│    │                                                      │
│    ▼                                                      │
│ Session ends                                              │
└───────────────────────────────────────────────────────────┘
```

## References

- [Hooks Overview](https://code.claude.com/docs/en/hooks)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)

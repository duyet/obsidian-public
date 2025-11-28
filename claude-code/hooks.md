---
title: Hooks
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

## Example 4: Auto-Update README on File Changes

Track changes to Public/ folder and update README.md before session ends:

```
┌─────────────────────────────────────────────────────────────────────┐
│              AUTO-UPDATE README FLOW                                │
│                                                                     │
│  Write/Edit to Public/*.md                                          │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────┐                                               │
│  │  PostToolUse     │  Track: touch /tmp/claude_public_changed      │
│  │  (command hook)  │  Skip: README.md itself                       │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  [... more edits ...]                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐     ┌─────────────────────────────────────┐   │
│  │  Stop            │────►│  1. Command: check flag file        │   │
│  │  (chained hooks) │     │     output PUBLIC_CHANGED if exists │   │
│  └──────────────────┘     │  2. Prompt: if PUBLIC_CHANGED,      │   │
│                           │     update Public/README.md         │   │
│                           └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "file_path=$(echo $TOOL_INPUT | jq -r '.file_path // empty' 2>/dev/null); if echo \"$file_path\" | grep -q 'Public/.*\\.md' && ! echo \"$file_path\" | grep -q 'README.md'; then touch /tmp/claude_public_changed; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "if [ -f /tmp/claude_public_changed ]; then rm /tmp/claude_public_changed; echo 'PUBLIC_CHANGED'; exit 0; fi; exit 0"
          },
          {
            "type": "prompt",
            "prompt": "If PUBLIC_CHANGED was output, update Public/README.md to list all markdown files in Public/ folder with their titles. Keep existing format. Return JSON: {\"decision\": \"approve\", \"reason\": \"...\"}",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**How it works:**
- **PostToolUse**: On every Write/Edit, checks if file is in `Public/*.md` (excluding README.md), creates flag file
- **Stop (command)**: Checks flag, outputs `PUBLIC_CHANGED` to stdout, cleans up
- **Stop (prompt)**: LLM sees stdout, updates README if needed

## References

- [Hooks Overview](https://code.claude.com/docs/en/hooks)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)

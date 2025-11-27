---
title: AskUserQuestion tool
description: Bring Claude's plan-mode question asker to your custom slash commands.
---

Love Claude's plan-mode question asker? Bring it to your custom commands.

![AskUserQuestion in PR review](https://pbs.twimg.com/media/G6opUjpbIAAK-BH?format=jpg&name=medium)

## How

1. Add `AskUserQuestion` to `allowed-tools` in your `.claude/commands/*.md`
2. Explicitly tell Claude to use it in the prompt

```markdown
---
allowed-tools: [AskUserQuestion, Read, Grep]
---

Review this PR and use the AskUserQuestion tool to ask
the user about any unclear requirements or decisions.
```

## Example: PR Review Command

```markdown
---
allowed-tools: [AskUserQuestion, Read, Grep, Bash]
---

Review the current PR changes.

Use the AskUserQuestion tool to:
- Clarify ambiguous code intent
- Confirm breaking changes are intentional
- Ask about missing test coverage
```

## Reference

- [Slash Commands Docs](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

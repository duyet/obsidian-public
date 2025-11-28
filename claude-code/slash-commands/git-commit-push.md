---
title: "`/git-commit-push` - Commit and Push Workflow"
description: Automate the git commit workflow with semantic commit messages
---


Automate the git commit workflow with semantic commit messages.

**Usage:**
```
/git-commit-push
/git-commit-push fix the authentication bug
```

**Full command file** (`.claude/commands/git-commit-push.md`):

```markdown
---
allowed-tools: [Bash, Read, Glob, Grep]
description: "Stage changes, create semantic commit, and push to remote"
---

# /git-commit-push - Git Commit and Push

## Purpose
Automate the git workflow: review changes, create a semantic commit message, and push.

## Arguments
- `$ARGUMENTS` - Optional: hint for commit message context

## Execution Flow

### 1. Review Changes
Run these commands to understand what changed:
- `git status` - See modified/untracked files
- `git diff --staged` - Review staged changes
- `git diff` - Review unstaged changes
- `git log -3 --oneline` - Check recent commit style

### 2. Stage Changes
- Stage relevant files with `git add`
- Skip files that shouldn't be committed (.env, credentials, etc.)

### 3. Create Commit Message
Follow semantic commit format:

<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Formatting, no code change
- refactor: Code restructuring
- perf: Performance improvement
- test: Adding tests
- chore: Maintenance tasks

Rules:
- Subject in imperative mood ("add" not "added")
- No period at end
- Max 72 characters
- Scope is optional but helpful

### 4. Commit and Push
- Create commit with semantic message
- Push to current branch
- Report success with commit hash

## Safety Rules
- NEVER commit .env, credentials, or secrets
- NEVER force push
- NEVER amend commits already pushed
- Ask before committing if changes look unintentional

## Example Output
Staged: 3 files (src/auth.ts, src/utils.ts, tests/auth.test.ts)
Commit: feat(auth): add JWT refresh token support
Pushed: abc1234 → origin/feature/auth
```



## References

- [Slash Commands](../)
- [Slash Commands Docs](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

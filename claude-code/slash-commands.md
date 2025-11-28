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

## Example 1: `/tldr` - Summary Post Writer

This command creates TL;DR posts from URLs. Used to generate content in the [TL;DR section](/#tldr).

**Usage:**
```
/tldr https://anthropic.com/engineering/some-article
```

**Full command file** (`.claude/commands/tldr.md`):

```markdown
---
allowed-tools: [Read, Write, Edit, WebFetch, Glob, Grep]
description: "Write TL;DR summary post to Public/tldr/ from URL or content"
---

# /tldr - Quick Summary Post Writer

## Purpose
Create TL;DR posts for `Public/tldr/` folder - quick, digestible summaries you'd share with a friend who wants the gist without reading everything.

## Usage
/tldr [URL or content]

## Arguments
- `$ARGUMENTS` - URL to summarize OR paste content directly

## Execution Flow

### 1. Input Processing
- If URL provided: Fetch content using WebFetch
- If content provided: Use directly
- Extract key information: title, main concepts, takeaways

### 2. Content Analysis
- Identify the core problem/solution
- Extract key patterns and use cases
- Note any open questions or trade-offs
- Find relevant diagrams or images from source

### 3. Write TL;DR Post

**Structure (follow existing patterns in `Public/tldr/`):**

---
title: "TL;DR: [Descriptive Title]"
description: [One sentence - what this is about]
---

[One-liner problem statement or hook]

[ASCII diagram showing core concept/architecture]

## Key Points/Patterns/Use Cases
- **Point 1**: Brief explanation
- **Point 2**: Brief explanation
- **Point 3**: Brief explanation

[Optional: Relevant image from source]

## Open Question
[If applicable - unanswered questions or discussion points]

## Reference
- [Source Title](URL) - Source name/author

### 4. Update README
Add entry to `Public/README.md` under TL;DR section.

## Writing Style
- **Casual but informative**: Like explaining to a smart friend over coffee
- **Visual-first**: ASCII diagrams explain concepts before text
- **Short paragraphs**: 1-2 sentences max per bullet
- **No fluff**: Cut marketing speak, get to the point
- **Concrete examples**: Real use cases, not abstract concepts

## ASCII Diagram Guidelines
Use box drawing characters for architecture/flow diagrams:
┌──────────────────────────────────────┐
│             COMPONENT NAME           │
│  ┌──────────┐         ┌──────────┐   │
│  │  Input   │────────►│  Output  │   │
│  └──────────┘         └──────────┘   │
└──────────────────────────────────────┘

## Filename Convention
- Lowercase with hyphens: `topic-name.md`
- Keep it short but descriptive

## Quality Checklist
- [ ] Title starts with "TL;DR:"
- [ ] Has ASCII diagram explaining core concept
- [ ] 3-5 key points, each with bold label
- [ ] Reference section with source link
- [ ] README.md updated with new entry
- [ ] File saved to `Public/tldr/`

## Boundaries
**Will**: Summarize technical content, create visual diagrams, extract key insights
**Won't**: Make up information not in source, add opinions beyond source material
```

## Example 2: `/git-commit-push` - Commit and Push Workflow

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

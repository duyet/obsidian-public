---
title: "`/tldr` - Summary Post Writer"
description: This command creates TL;DR posts from URLs and saved to Public/ folder.
---

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

## References

- [Slash Commands](../)
- [Slash Commands Docs](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

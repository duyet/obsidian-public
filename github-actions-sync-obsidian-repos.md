---
title: Sync Obsidian Vault to Public Repo with GitHub Actions
description: How to automatically sync selected notes from a private Obsidian vault to a public repository for sharing via GitHub Pages.
---

## Overview

```
┌──────────────────┐      ┌──────────────────┐
│ duyet/obsidian   │      │ duyet/obsidian-  │
│ (private)        │      │ public (public)  │
├──────────────────┤      ├──────────────────┤
│                  │      │                  │  build             GitHub Pages
│ Personal/        │      │ note-1.md        │  (GitHub Actions)  duyet.github.io/
│ Work/            │      │ note-2.md        │──────────────────► obsidian-public
│ Journals/        │      │ .github/fumadocs │
│ Public/     ───────────►│                  │
│   note-1.md      │      │                  │
│   note-2.md      │      │                  │
│                  │      │                  │
└────────┬─────────┘      └──────────────────┘
         │                            ▲
         │  repo-file-sync (Public/)  │
         └────────────────────────────┘
              GitHub Actions
```

The idea: keep your full Obsidian vault private, but expose a `Public/` folder to a separate public repo that can be served via GitHub Pages.

## Setup

### 1. Create a Personal Access Token (PAT)

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Generate new token with `repo` scope
3. Copy the token

### 2. Add Secret to Private Repo

1. Go to your private `obsidian` repo → **Settings** → **Secrets and variables** → **Actions**
2. Add new secret: `GH_PAT` with your token value

### 3. Create Sync Configuration

Create `.github/sync.yml` in your private repo:

```yaml
your-username/obsidian-public:
  - source: Public/
    dest: ./
    deleteOrphaned: true
```

- `source`: folder in private repo to sync
- `dest`: destination in public repo (`./ ` = root)
- `deleteOrphaned`: remove files in dest that no longer exist in source

### 4. Create Workflow

Create `.github/workflows/sync.yml`:

```yaml
name: Sync Public Files
on:
  push:
    branches:
      - master
    paths:
      - 'Public/**'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Run GitHub File Sync
        uses: BetaHuhn/repo-file-sync-action@v1
        with:
          GH_PAT: ${{ secrets.GH_PAT }}
          SKIP_PR: true
          COMMIT_PREFIX: 'chore(sync):'
```

### 5. Enable GitHub Pages on Public Repo

1. Go to `obsidian-public` → **Settings** → **Pages**
2. Source: Deploy from branch
3. Branch: `main` (or `master`), folder: `/ (root)`
4. Your notes will be available at `https://your-username.github.io/obsidian-public/`

## How It Works

1. Add/edit notes in `Public/` folder of your private vault
2. Commit and push to `master` branch
3. GitHub Actions triggers on changes to `Public/**`
4. `repo-file-sync-action` syncs files to public repo
5. GitHub Pages serves the public repo

## Tips

- Only put notes you want public in the `Public/` folder
- Use `workflow_dispatch` to manually trigger sync
- `deleteOrphaned: true` keeps public repo clean when you remove notes
- Consider adding an `INDEX.md` as landing page

## Note

This page is rendered using [fumadocs.dev](https://fumadocs.dev). See the [.github/fumadocs](https://github.com/duyet/obsidian-public/tree/master/.github/fumadocs) folder for configuration.

You can build the public repo with any static framework (Next.js, Astro, etc.) and deploy to any platform (Vercel, Cloudflare Pages, Netlify, etc.).

## References

- [duyet/obsidian-public](https://github.com/duyet/obsidian-public) - Live example of this setup
- [BetaHuhn/repo-file-sync-action](https://github.com/BetaHuhn/repo-file-sync-action)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [fumadocs.dev](https://fumadocs.dev)

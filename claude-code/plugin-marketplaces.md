---
title: Plugin Marketplaces
description: Share and discover Claude Code plugins via marketplaces.
---

Claude Code supports plugin marketplaces - JSON catalogs for sharing extensions across teams.

```
┌────────────────────────────────────────────────────────────┐
│                      MARKETPLACE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  plugin-a   │  │  plugin-b   │  │  plugin-c   │   ...   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE                           │
│         /plugin install plugin-a@my-marketplace            │
└────────────────────────────────────────────────────────────┘
```

Key insight: add `extraKnownMarketplaces` in `.claude/settings.json` for team-wide auto-install.

## Popular Marketplaces

```bash
# Official Anthropic marketplaces
/plugin marketplace add anthropics/claude-code
/plugin marketplace add anthropics/skills
/plugin marketplace add anthropics/life-sciences

# Large plugin collection (243+ plugins)
/plugin marketplace add jeremylongshore/claude-code-plugins-plus

# Community marketplace
/plugin marketplace add ananddtyagi/claude-code-marketplace

# Curated awesome plugins
/plugin marketplace add GiladShoham/awesome-claude-plugins
/plugin marketplace add ccplugins/awesome-claude-code-plugins
```

## Awesome Lists

- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) - Skills, resources, tools
- [awesome-claude-code-plugins](https://github.com/hekmon8/awesome-claude-code-plugins) - Curated plugins list
- [claudecodemarketplace.com](https://claudecodemarketplace.com/) - Web-based plugin browser

## References

- [Plugin Marketplaces Docs](https://code.claude.com/docs/en/plugin-marketplaces)
- [Anthropic Blog: Claude Code Plugins](https://www.anthropic.com/news/claude-code-plugins)

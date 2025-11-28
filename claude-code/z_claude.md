---
title: Z.AI Claude Code
description: Wrapper script to run Claude Code with custom Z.AI environment
---

Save this script somewhere in your `$PATH`, e.g.:

```bash
vi ~/bin/z_claude
chmod +x ~/bin/z_claude
```

Replace `your_zai_api_key_here` with your real key (or export `ZAI_API_KEY` before running). Using the new command for Claude Code with Z.AI models:

```bash
$ z_claude

⚡ Running Claude Code with Z.AI config...
Base URL: https://api.z.ai/api/anthropic
Model: glm-4.6


 ▐▛███▜▌   Claude Code v2.0.55
▝▜█████▛▘  glm-4.6 · API Usage Billing
  ▘▘ ▝▝    ~/project/duyetbot-agent

────────────────────────────────────────────────────
> ...
────────────────────────────────────────────────────
```


File: `z_claude`
```bash
#!/usr/bin/env bash
# File: z_claude
# Wrapper script to run Claude Code with custom Z.AI environment

# ---- CONFIG ----
ZAI_API_KEY="${ZAI_API_KEY:-your_zai_api_key_here}"
ZAI_BASE_URL="https://api.z.ai/api/anthropic"

# Optional: override models (comment out if not needed)
MODEL_HAIKU="glm-4.5-air"
MODEL_SONNET="glm-4.6"
MODEL_OPUS="glm-4.6"

# ---- SET ENV ----
export ANTHROPIC_AUTH_TOKEN="$ZAI_API_KEY"
export ANTHROPIC_BASE_URL="$ZAI_BASE_URL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODEL_HAIKU"
export ANTHROPIC_DEFAULT_SONNET_MODEL="$MODEL_SONNET"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$MODEL_OPUS"
export API_TIMEOUT_MS=3000000

# ---- RUN CLAUDE ----
echo "⚡ Running Claude Code with Z.AI config..."
echo "Base URL: $ANTHROPIC_BASE_URL"
echo "Model: $ANTHROPIC_DEFAULT_SONNET_MODEL"
echo

# Pass along any args
claude --dangerously-skip-permissions "$@"
```
---
title: "TL;DR: Mount R2 buckets in Cloudflare Containers"
description: Cloudflare Containers now support mounting R2 buckets as filesystem volumes.
---

Mount R2 buckets as local directories in Cloudflare Containers using FUSE.

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE CONTAINER                           │
│                                                                 │
│  ┌──────────────┐      FUSE        ┌──────────────────┐         │
│  │  /data/      │◄────────────────►│  R2 Bucket       │         │
│  │  models/     │   (tigrisfs,     │                  │         │
│  │  datasets/   │    s3fs, etc.)   │  objects/        │         │
│  └──────────────┘                  └──────────────────┘         │
│         │                                                       │
│         ▼                                                       │
│  Standard filesystem ops (read, write, ls)                      │
│  No download needed at startup                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Use Cases

- **Data bootstrapping**: Load ML models, datasets without bloating images
- **State persistence**: User config, app state without manual downloads
- **Static files**: Access large files on-demand, not at startup

## FUSE Adapters

- `tigrisfs`
- `s3fs`
- `gcsfuse`

## Reference

- [FUSE support in Containers](https://developers.cloudflare.com/changelog/2025-11-21-fuse-support-in-containers/) - Cloudflare Changelog

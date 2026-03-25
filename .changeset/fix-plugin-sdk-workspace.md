---
"@coongro/calendar": patch
---

fix: use workspace protocol for plugin-sdk devDependency

Prevents pnpm install from failing in the monorepo by resolving
plugin-sdk from the workspace instead of npm public registry.

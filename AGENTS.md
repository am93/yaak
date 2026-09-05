- Tag safety: app AND CLI releases both ship from `v*` tags (the CLI is version-locked to the app and publishes to npm on every app tag); `@yaakapp/api` uses `yaak-api-*` tags. Always confirm which is requested before retagging.
- Do not commit, push, or tag without explicit approval
- This fork diverges from `mountain-loop/yaak` (Windows-x64-only CI, no Yaak license/update/telemetry network calls). When merging/rebasing onto upstream and resolving conflicts, read [.github/skills/fork-upstream-merge/SKILL.md](.github/skills/fork-upstream-merge/SKILL.md) first to know what must be kept.


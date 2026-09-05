---
name: fork-upstream-merge
description: 'Resolve merge/rebase conflicts when pulling updates from the upstream source repo (mountain-loop/yaak) into this fork. Use when: syncing fork with upstream, merging upstream/main, rebasing onto mountain-loop/yaak, resolving merge conflicts after `git pull upstream`, or updating master/main from the source repository. Lists the fork-specific customizations (Windows-x64-only CI, no Yaak license/update/telemetry network calls, no auto-updater) that must survive the merge.'
---

# Fork upstream-merge conflict resolution

This fork intentionally diverges from `mountain-loop/yaak` in a few targeted ways:
Windows-x64-only CI, no reliance on Yaak-owned servers (license/update/notifications),
and no automatic update checking. When merging or rebasing onto new upstream commits,
**do not blindly take upstream's version of a conflicting hunk** in the files below —
re-apply the fork's intent on top of whatever upstream changed.

General rule: if upstream touched one of these files for an unrelated reason (bug fix,
new dependency version, new unrelated field), take upstream's change but keep the
fork-specific behavior described here layered on top. If you're unsure whether a hunk
is "the fork's customization" vs. "an unrelated upstream change", diff against what's
described below before resolving.

After resolving, per this repo's `AGENTS.md`: do not commit/push the merge without
explicit user approval.

## 1. `.github/workflows/release-app.yml`

Fork builds **only** a single Windows x64 job — no build matrix, no macOS/Linux/CEF/
Windows-arm64 entries, no `if: github.repository == 'mountain-loop/yaak'` guard on the
job (that guard is what stops the workflow from ever running on this fork — it must
stay removed here, even though upstream's other workflows keep it intentionally).

Keep:
- Single `runs-on: windows-latest` job, no `strategy.matrix`.
- No Apple/Linux-only steps (CEF cache, apt installs, macOS codesign, CEF deb/tarball
  upload, per-machine NSIS variant).
- No `AZURE_*` / Trusted-Signing / `TAURI_SIGNING_PRIVATE_KEY*` envs unless the user has
  since configured their *own* signing (ask before assuming otherwise).
- Tauri build args stay `--config ./tauri.release.conf.json` with no `--config
  '{"build":{"features":[...]}}'` override that reintroduces `license`/`updater`.

If upstream adds a genuinely new, platform-agnostic step (e.g. a new lint check, a
Protoc/Node version bump, a new required env var for the build to succeed at all),
port that one step into the simplified job — don't re-add the matrix to get it.

## 2. `crates-tauri/yaak-app-client/tauri.release.conf.json`

Keep:
- `"build": { "features": ["wry"] }` — never add `"license"` or `"updater"` back.
- No `plugins.updater` block (no `update.yaak.app` endpoint/pubkey).
- No `bundle.createUpdaterArtifacts`.
- No `bundle.windows.signCommand` (unless the user has explicitly asked to wire up
  their own signing — see README/PR notes on Authenticode vs. Azure Trusted Signing).
- No macOS/Linux-only bundle keys (`macOS`, `linux`) — Windows-only fork.
- `"targets": ["nsis"]`.

If upstream changes unrelated bundle metadata (description, category, icon paths),
take upstream's value but keep the above fields as listed.

## 3. `crates/yaak-models/src/queries/settings.rs`

Keep `check_notifications: false` in the default `Settings` struct built by
`get_settings()` (upstream default is `true` — it pings `notify.yaak.app` on every
window focus). If upstream adds new settings fields in this struct literal, add them
too, just don't flip `check_notifications` back to `true`.

## 4. `crates-tauri/yaak-app-client/src/plugins_ext.rs`

The automatic background plugin-update checker (`PluginUpdater` struct/impl, and the
`RunEvent::WindowEvent { Focused(true), .. }` arm that polled `api.yaak.app` every 12h)
was removed entirely — it was dead code once the scheduler was cut, so it's gone, not
just disabled. Manual plugin search/install/update (`cmd_plugins_search`,
`cmd_plugins_install`, `cmd_plugins_updates`, `cmd_plugins_update_all`) are untouched
and should stay working.

If upstream reintroduces/modifies a `PluginUpdater`-style automatic background check in
this file, remove the automatic scheduling again but keep any underlying bugfixes to
`check_plugin_updates`/`search_plugins` in `crates/yaak-plugins/src/api.rs` (those are
still used by the manual "Check for plugin updates" button).

## 5. `crates-cli/yaak-cli/src/version_check.rs`

Keep `should_skip_check()` returning `true` unconditionally as its first statement
(disables the CLI's automatic ping to `update.yaak.app` on every invocation). If
upstream changes the surrounding cache/warning logic, that's fine to take — just keep
the early `return true`.

## 6. `apps/yaak-client/components/Settings/SettingsPlugins.tsx`

Two network calls to `api.yaak.app` must stay gated behind explicit user action (not
fired on mount — all Settings tabs mount simultaneously via `TabContent`, so opening
Settings for *any* reason previously fired both):
- `PluginSearch`'s `useQuery` must keep `enabled: hasQuery` (only searches once the
  user types something).
- `usePluginUpdates()` must keep `enabled: false`; the only way to populate it is the
  `useCheckPluginUpdates()` mutation wired to the "Check for plugin updates"
  `IconButton` in the Installed-tab footer. Don't let a future merge silently drop that
  button or flip the query back to auto-fetching.

## Not fork-specific — leave upstream's version alone

- `release-cli-npm.yml`, `release-api-npm.yml`, `release-web-image.yml`,
  `flathub.yml` — untouched, still guarded by
  `if: github.repository == 'mountain-loop/yaak'`. Don't remove that guard from these;
  it's only `release-app.yml` where the fork needs it gone.
- `crates-tauri/yaak-license/**`, `license.yaak.app` calls — the crate is excluded from
  the build via the `license` Cargo feature, not deleted. No source changes there.
- User-initiated network calls to `yaak.app` (pricing/docs/changelog/feedback links,
  OAuth2 hosted callback, manual plugin marketplace actions) are all intentionally
  untouched — they're fine to keep taking upstream's version of.

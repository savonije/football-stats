---
name: deploy
description: >-
    Use when the user wants to release / deploy the app to production (e.g. "deploy to
    prod", "ship a release", "cut a new version", "/deploy"). Runs the full production
    release flow: bump the semver, create and push a git tag, publish a GitHub release
    with generated notes, build, and deploy to Firebase Hosting. Do NOT trigger for
    `npm run dev`, preview builds, or non-production work.
---

# Deploy to production

Release flow for this app: **bump version → tag → GitHub release → build → `firebase deploy`**.
Follow the phases in order. Stop and report if any step fails — never continue a release
on top of a failed step.

## Facts (don't re-derive)

- Version is tracked in `package.json` (`version` field). Tags follow the `vX.Y.Z`
  convention (e.g. `v3.2.0`) — `npm version` produces exactly this.
- Production is **Firebase Hosting**, serving the `dist/` folder (see `firebase.json`).
  `firebase` CLI is installed at `/usr/local/bin/firebase`.
- The repo builds with `npm run build` (runs `type-check` + `vite build` into `dist/`).
- Remote is `origin` → `github.com/savonije/football-stats`.
- Production releases go out from the **`main`** branch.

## Phase 1 — Preflight (verify before touching anything)

Run these and confirm each before proceeding:

1. **Clean tree** — `git status --porcelain` must be empty. `npm version` refuses to run
   with uncommitted changes; don't `--force` past it. If dirty, stop and ask the user.
2. **On `main` and synced** — `git branch --show-current` should be `main`, and
   `git fetch && git status` should show up to date with `origin/main`. If the user is on
   a feature branch (e.g. mid-refactor), confirm with them whether to merge to `main`
   first or deploy from the current branch. Don't assume.
3. **Firebase auth** — `firebase projects:list` should succeed (i.e. logged in). If not,
   tell the user to run `! firebase login` in the prompt.
4. **GitHub auth** — `gh auth status` should succeed. If not, tell the user to run
   `! gh auth login` in the prompt (interactive; can't be done for them).
5. **Show what's shipping** — `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
   so the user sees the commits since the last release.

## Phase 2 — Bump the version

Ask the user (or read from the skill args) which bump to apply, following semver:

- `patch` — bug fixes only (e.g. `3.2.0` → `3.2.1`)
- `minor` — new backwards-compatible features (`3.2.0` → `3.3.0`)
- `major` — breaking changes (`3.2.0` → `4.0.0`)

Then run:

```bash
npm version <patch|minor|major> -m "chore(release): %s"
```

This bumps `package.json`, creates a release commit, and creates the `vX.Y.Z` tag in one
step. Capture the new version string (e.g. `v3.3.0`) — you'll reuse it below.

## Phase 3 — Push commit + tag, then publish the GitHub release

```bash
git push --follow-tags        # pushes the release commit AND the new tag
```

Create the GitHub release with `gh` (installed; auth verified in Phase 1):

```bash
gh release create <vX.Y.Z> --generate-notes --title "<vX.Y.Z>"
```

`--generate-notes` auto-builds the release notes from the commits/PRs since the last tag.
The command prints the release URL — capture it for the final report.

## Phase 4 — Build and deploy

```bash
npm run build      # type-check + vite build → dist/. If this fails, STOP.
firebase deploy    # deploys dist/ to Firebase Hosting
```

If `npm run build` fails **after** the tag/release were already created, don't leave prod
half-shipped: report the failure, and note that the tag/release exist but nothing was
deployed. Fix forward with a follow-up patch release rather than deleting the tag, unless
the user explicitly asks to roll it back.

## Done

Report: the new version, the pushed tag, the GitHub release URL, and the Firebase Hosting
URL from the `firebase deploy` output.

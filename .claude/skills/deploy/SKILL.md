---
name: deploy
description: >-
    Use when the user wants to release / deploy the app to production (e.g. "deploy to
    prod", "ship a release", "cut a new version", "/deploy"). Runs the full production
    release flow: bump the semver, create and push a git tag, publish a GitHub release
    with a written summary of the changes, build, and deploy to Firebase Hosting. Do NOT
    trigger for `npm run dev`, preview builds, or non-production work.
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
5. **Show what's shipping** — and capture the current tag as the release-notes baseline:

   ```bash
   git describe --tags --abbrev=0                                # e.g. v3.4.0
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```

   Show the user that commit list. **Write the tag down** (e.g. `v3.4.0`) and paste it
   literally into the Phase 3 commands — shell variables don't survive between Bash
   calls, and after Phase 2 `git describe` returns the *new* tag, not this one.

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

### 3a. Read the changes properly

This repo commits straight to `main` rather than through PRs, so GitHub's auto-generated
notes have no PR titles to list and collapse to a single "Full Changelog" line. That is
why the notes are written by hand here.

Start from the full commit messages — bodies included, not just subjects — between the
previous tag (captured in Phase 1) and the release:

```bash
git log <PREV_TAG>..HEAD --pretty=format:'%h %s%n%b%n---'
```

If a subject is too terse to explain the user-visible effect (`fix: washing schema`),
look at the actual change before writing about it — don't guess:

```bash
git show --stat <sha>
```

### 3b. Write the notes

Write to a `release-notes.md` in your scratchpad directory. Rules:

- **Describe the effect, not the commit.** `fix: filter out guest players from washing
  schema` becomes "Guest players are no longer included in the washing schedule." Never
  paste raw conventional-commit subjects as bullets.
- **English**, matching the commit convention (the app UI is Dutch; these notes are not).
- **Group under `###` headings, and only include headings that have content:**
  - `### New` — `feat:`
  - `### Fixes` — `fix:`
  - `### Under the hood` — `refactor:`, `perf:`, `build:`, `ci:`, `test:`, `docs:`,
    and dependency bumps that users would never notice
- **One line per change**, no trailing period pile-up, no essays. If a section would run
  past ~8 bullets, merge related commits into one bullet instead of listing each.
- **Skip pure noise**: the `chore(release):` commit itself, merge commits, formatting-only
  passes.
- **Don't invent anything** that isn't in the commits — no speculative "improved
  performance" claims.
- For a `minor`/`major` release, open with one plain sentence framing the release before
  the first heading. A `patch` can go straight to the bullets.

Use the app's own vocabulary: matches, players, top scorers, training, washing schedule
(wasschema), seasons.

<details>
<summary>Example for a patch release</summary>

```markdown
### Fixes

- Guest players are no longer included in the washing schedule.
- Statistics now only count matches that have actually finished, so an in-progress match
  no longer skews the totals.

### Under the hood

- Split the player detail page into smaller components.
```

</details>

### 3c. Publish

```bash
gh release create <vX.Y.Z> --title "<vX.Y.Z>" \
  --notes-file <scratchpad>/release-notes.md \
  --generate-notes
```

Keep **both** flags. GitHub prepends the `--notes-file` content to the generated notes, so
the release page shows the written summary on top and still gets the
`**Full Changelog**: …compare/vA.B.C...vX.Y.Z` link at the bottom (verified behaviour, not
an assumption). Passing `--title` explicitly stops `--generate-notes` from overriding it.

The command prints the release URL — capture it for the final report.

### Amending notes on an already-published release

```bash
gh release edit <vX.Y.Z> --notes-file <scratchpad>/release-notes.md
```

Two differences from `create`, both easy to get wrong:

- `edit` **replaces the whole body** — it doesn't merge with what's there.
- `edit` has **no `--generate-notes` flag**, so the compare link is not re-added for you.

So before amending, append the link to the notes file yourself, or you'll silently drop it:

```markdown
**Full Changelog**: https://github.com/savonije/football-stats/compare/<PREV_TAG>...<vX.Y.Z>
```

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

Report: the new version, the pushed tag, the GitHub release URL, the Firebase Hosting URL
from the `firebase deploy` output, and the release notes you published (so the user can
spot a wording fix without opening GitHub — amend with `gh release edit`).

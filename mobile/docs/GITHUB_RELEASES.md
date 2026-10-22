# Publishing a completed numbered release

`research/publish-github.py` copies the completed mobile app into a separate Git checkout, preserves the existing `web/` and `prototype/` projects, then creates a numbered commit, tag and GitHub release. `research/native-tools/publish.mjs` publishes the corresponding Expo Snack first. Both use `verifed-mobile/release.json` as their single version source.

## Release metadata

Prepare `verifed-mobile/release.json`:

```json
{
  "number": 10,
  "name": "Verifed V10",
  "description": "Describe the finished changes in this version.",
  "verification": [
    "Record actual checks and their results, including device limits."
  ]
}
```

Use the next sequential number and the exact name `Verifed V<number>`. The description belongs in release notes; it should explain the final behavior. `verification` is optional factual documentation. The script does not invent or automatically claim test results. Complete the relevant app checks before publishing.

## Commands

From the CAC workspace root, after the implementation and checks are complete:

```powershell
node research/native-tools/publish.mjs
python research/publish-github.py --dry-run --checkout tmp/version-recovery/repository
python research/publish-github.py --checkout tmp/version-recovery/repository
```

The historical publishing clone is `tmp/version-recovery/repository`. Without `--checkout`, the script uses a separate clone at `tmp/github-release/repository`. A dry run does not create a clone or modify, stage, commit, tag, push, or create a release. It performs read-only Snack downloads and Git remote checks, so it still needs internet and existing GitHub access.

The Snack publisher records the returned ID, `name`, `version`, source file inventory and URL in `verifed-mobile/publication.json`. The GitHub publisher requires this to match `release.json`. It downloads that Snack and compares every published code file and carrot asset byte for byte with the current source. If source changed after Snack publication, publication stops until the finished source is republished. This establishes source correspondence; it does not substitute for running the app on a device.

After visual QA of the actual PDF/ZIP, optional release attachments can be supplied explicitly:

```powershell
python research/publish-github.py --dry-run --checkout tmp/version-recovery/repository --asset outputs/verifed-design/Verifed_Source.zip
python research/publish-github.py --checkout tmp/version-recovery/repository --asset outputs/verifed-design/Verifed_Source.zip
```

Repeat `--asset` for multiple reviewed PDFs or ZIPs. Assets are not attached automatically. ZIP entries receive path and credential-marker checks. Existing same-name assets are retained only when GitHub reports the same SHA-256 digest; different assets are never silently replaced.

## What the script publishes

The full `verifed-mobile/` source becomes repository `mobile/`, including docs and tests. Environment files, Git metadata, modules, Expo/build output, temporary files and coverage are excluded. The script copies a named allowlist of public research files: menu data, sources and credits, district evidence, menu generator/importer, verification tools and the two publishers. Only the explicitly public `menu-sources/` and `district-evidence/` research folders are recursively copied. It does not copy arbitrary research captures or authentication screenshots. The allowlists are near the top of `publish-github.py` and can be reviewed as the project grows.

The current `mobile/` subtree is replaced inside the isolated clone after its absolute destination is checked. Its `release.json` is copied as part of that source. Public research files on the allowlist are updated; unrelated existing research history remains. Browser/prototype folders and older versions remain intact. The script adds a `versions/v<number>.json` provenance record and a new row in the repository's README version table. Unrelated school-district research files and authentication captures are excluded from the new publishing allowlist.

## Guards, authentication and recovery

The publishing checkout must be clean, on `main`, inside this workspace's `tmp/` folder, and connected to `shloksheth/Verifed-App`. New releases require the next remote version number and a local branch matching remote `main`. Review and synchronize a stale checkout before trying again. An unexpected remote, uncommitted work, unsafe path, credential marker or stale Snack stops publication. The scanner checks recognizable secret formats and Supabase service-role JWTs; it is a preflight aid, not proof that arbitrary personal content is suitable to publish.

Git pushes use the existing Git Credential Manager login. The GitHub release request obtains that existing credential only in process memory. Credentials are never printed, saved in project files or embedded in remote URLs. The script does not create credentials, use force push, rewrite old commits or replace existing tags.

If a push or release request fails after the commit/tag exists, rerun the same command from the same clean checkout without changing source or release metadata. A matching existing tag is resumable only when its stored source digest and checkout HEAD agree. A different existing tag stops publication. Existing release titles and assets are not overwritten. If source must change after publication, create the next version instead.

The recovered history currently ends at **Verifed V9**; current completed work should become **Verifed V10**. V1–V5 were browser applications without historical Snacks. V6–V9 have explicitly labeled version-named copies of recovered native snapshots. Original saved dates and source references were preserved as metadata; no authorship dates were fabricated.

# Historical credential exposure response

On 2026-07-19, full-history Gitleaks identified the same OpenRouter credential pattern in commit `06b34e5` in both `.aider.chat.history.md` and `files.txt`. Those generated transcript/code-dump files are removed from the current tree, client-side OpenRouter configuration is removed from the supported bundle, and no AI route is compiled or mounted by the production server.

Treat the credential as exposed even if an owner believes it was a test value. Before launch, an authorized account owner must:

1. Revoke/rotate the OpenRouter key and any key derived from or reused with it.
2. Review provider usage, billing, authentication, and IP logs from the first commit date (2025-06-16) through revocation; preserve evidence and investigate anomalies.
3. Search forks, mirrors, CI artifacts, caches, releases, backups, and deployment environments for the value without copying it into tickets or chat.
4. Coordinate a Git-history purge of the two generated artifacts, force-update authorized mirrors, and invalidate stale clones/artifacts according to the organization's incident process.
5. Re-run full-history and current-tree Gitleaks after purge, then remove the two incident fingerprints from `.gitleaksignore`.
6. Obtain documented security-owner sign-off.

The exact historical fingerprints are baselined so CI can still scan all 316 commits and fail on any new finding. This baseline is not evidence that the credential is safe and does not waive rotation or history purge.

# Iteration 30 — Release: EAS Build, Config, Store Preflight
**Primary subagents:** journallink-release  
**Support subagents:** journallink-architect, journallink-qa, journallink-mobile-ui

## Goal
Prepare for App Store / Play Store:
- EAS build configs
- app icons/splash
- environment setup
- privacy policy + in-app links
- crash reporting (minimal)

## Implementation Requirements
- Verify `app.json/app.config` values and permissions
- Add EAS configs (profiles: dev/preview/prod)
- Ensure secrets are not committed
- Add a simple Privacy Policy + Terms placeholder screen and external link
- Add crash reporting (Sentry or equivalent) + toggle

## Acceptance Criteria
- `eas build -p ios` and `eas build -p android` succeed (at least preview).
- App boots in release build.
- No keys in repo.

## Commit
`chore(release): eas configs + store preflight + crash reporting`

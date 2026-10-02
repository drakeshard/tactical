# Security Policy

## Scope

This policy covers source code, build configuration, dependencies, CI, and future release artifacts.

## Requirements

- Secrets must not be committed.
- External definitions, persisted state, configuration, and other untrusted data must be validated at system boundaries.
- Dependency versions must be exact and the lockfile committed.
- CI uses frozen installs.
- Runtime dependencies start at zero; new dependencies require explicit architecture/dependency admission.
- GitHub Actions use least-privilege permissions.
- Security-sensitive fixes require tests where reproducible.

## Reporting

Do not report suspected vulnerabilities in public issues. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately.

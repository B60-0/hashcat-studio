# Security Policy

## Supported Versions

Only the latest release is supported.

## Reporting A Vulnerability

Please open a private security advisory on GitHub if available. If not, open an issue with minimal details and ask for a maintainer contact path.

Do not include real hashes, credentials, private wordlists, or customer data in public reports.

## Scope

Security-sensitive areas include:

- subprocess argument building
- Hashcat binary path handling
- task control and process cleanup
- file path handling for hashes, wordlists, rules, masks, and outputs
- release workflow integrity

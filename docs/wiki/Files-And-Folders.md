# Files And Folders

Hashcat Studio scans configured folders for local assets.

Recommended layout:

```text
hashes/        hash files
dictionaries/ wordlists
rules/        .rule files
masks/        .hcmask files
output/       recovered outputs
```

Use the Files page to rescan after adding files.

Large wordlists should stay outside git. Do not commit hashes, recovered passwords, or private audit data.

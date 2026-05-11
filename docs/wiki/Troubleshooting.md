# Troubleshooting

## Hashcat does not validate

Check that the binary path is correct.

Try in a terminal:

```bash
hashcat --version
hashcat --hash-info --quiet
```

If those fail, fix the Hashcat installation first.

## No devices appear

Try:

```bash
hashcat -I --quiet
```

GPU support depends on your driver and OpenCL/CUDA runtime.

## A task starts then fails

Open the task log. Hashcat usually prints the exact reason, such as an invalid hash mode, missing file, unsupported device, or driver issue.

## Wordlists do not appear

Confirm the folder path in Settings, then use Files > Rescan.

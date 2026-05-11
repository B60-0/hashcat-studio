# Creating Tasks

Go to New Task.

## Dictionary Attack

Use this when you have one or more wordlists.

1. Choose a hash file or enter a hash path.
2. Select the hash mode.
3. Select Dictionary attack.
4. Choose one or more dictionaries.
5. Optionally choose rules.
6. Choose an output file.
7. Review the command preview.
8. Create or Create & Start.

## Mask Attack

Use this when you know the shape of the password.

Examples:

```text
?l?l?l?l?d?d
?u?l?l?l?l?d?d?d
?a?a?a?a?a?a?a?a
```

Enable increment mode when you want Hashcat to try shorter lengths first.

## Task Controls

- Pause pauses the running session.
- Resume continues a paused session.
- Checkpoint asks Hashcat to stop safely at the next checkpoint.
- Skip moves past the current guess base.
- Stop asks Hashcat to quit.

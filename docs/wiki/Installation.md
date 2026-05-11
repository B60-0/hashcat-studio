# Installation

Hashcat Studio can download the latest official Hashcat release during first-run setup. You can also use an existing Hashcat install.

After opening the app, click Get Started and choose:

- Download Hashcat
- Choose a Hashcat folder
- Choose a Hashcat binary
- Use `hashcat` from PATH

## macOS

You can let setup download Hashcat, or install it with Homebrew:

```bash
brew install hashcat
```

Apple Silicon path:

```text
/opt/homebrew/bin/hashcat
```

Intel Homebrew path:

```text
/usr/local/bin/hashcat
```

## Windows

You can let setup download Hashcat, or download Hashcat yourself from:

```text
https://hashcat.net/hashcat/
```

In Hashcat Studio, choose the full path to `hashcat.exe`.

## Linux

You can let setup download Hashcat, use your package manager, or download from Hashcat:

```bash
sudo apt install hashcat
```

Some GPU drivers require extra vendor runtime packages. If Hashcat runs in a terminal, Hashcat Studio can use it too.

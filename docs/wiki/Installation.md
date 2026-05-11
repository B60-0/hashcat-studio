# Installation

Hashcat Studio does not include Hashcat. Install Hashcat first, then install the app.

## macOS

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

Download Hashcat from:

```text
https://hashcat.net/hashcat/
```

In Hashcat Studio, choose the full path to `hashcat.exe`.

## Linux

Use your package manager or download from Hashcat:

```bash
sudo apt install hashcat
```

Some GPU drivers require extra vendor runtime packages. If Hashcat runs in a terminal, Hashcat Studio can use it too.

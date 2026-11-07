# Aphrody & YOLO Cargo Distribution Guide

## 1. Local Cargo Installation
To install the unified `aphrody` binary directly into your `~/.cargo/bin`:
```bash
cargo install --path crates/aphrody --force
```
This builds and registers:
- `aphrody` (Main multi-agent orchestrator & CLI)
- Symbolic alias `yolo` linking directly to the same unified engine.

## 2. Cargo Crates.io Publishing
The package `aphrody` is configured in `crates/aphrody/Cargo.toml`:
- Version: `1.4.7`
- License: `Apache-2.0`
- Target: `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`

To publish to crates.io:
```bash
cargo publish -p aphrody --token $CARGO_REGISTRY_TOKEN
```

## 3. Git-based Installation
Users can install directly from source repository:
```bash
cargo install --git https://github.com/aphrody-labs/aphrody.git aphrody
```

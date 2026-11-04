# Workspace development

The root Cargo workspace lists `cross`, `xtask`, `cargo-xwin`, and
`cargo-zigbuild`. The `cargo-xwin` and `cargo-zigbuild` source trees are
flattened into `crates/` at pinned upstream commits, with MIT licenses retained.
Their original history bundles and nested Git metadata are backed up outside
the checkout under `C:\src\migration-backups\yolo-cross-submodule-flatten`;
the parent repository contains the flattened source, not their upstream Git
history. `cross-toolchains`, `manylinux-cross`, and `rust-musl-cross` remain Git
submodules. The latter two contain image/build assets outside Cargo's package
graph. Both xwin/zigbuild and the full Cargo workspace pass `cargo check` on
Windows 11. This verifies host compilation only; target SDKs, cross-produced
artifacts, and the generated target matrix still require validation.

The Cargo workspace includes `cross`, `xtask`, `cargo-xwin`, `cargo-zigbuild`,
POSIX/hardware support, Android JNI, Windows process/capture and maintenance
interop, and BunOS NT/Steam adapters. `workspace.json` lists every Cargo
package path as well as Bun package and image projects. The platform layer
includes `yolo-posix` and `yolo-hardware` Rust crates, with `yolo-posix-bun`
and `yolo-hardware-db` Bun packages.
`schemas/` holds hardware, CPU/GPU, virtualization, POSIX, Linux, Wayland,
WebGPU, and Khronos data. Platform and architecture notes live in `docs/`.

Use `just <task>` or `bun run <task>` for one consistent developer interface.
The workspace catalog in `workspace.json` drives both Cargo and Bun tasks;
`workspace.schema.json` defines its structure. Cross target definitions remain
in `targets.toml` and are interpreted by the existing Rust `xtask`.

`cross --target-cpu-profile x86-64-v1|v2|v3|v4` is intended to use the
`yolo-hardware` Rust crate to validate an explicit x86-64 ISA baseline for the
selected target and forward it to Cargo. This is a deployment target choice;
Cross never assumes the builder's CPU is safe for the resulting binary. Verify
the integration with a build before relying on it. See
[`docs/hardware-targeting.md`](docs/hardware-targeting.md).

The workspace shares dependency versions and Cargo profiles. The root
`tempfile` development pin is aligned with `cargo-zigbuild`'s requirement, and
the `dist` profile is declared at the workspace root as Cargo requires.

| Task                               | Effect                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `list`                             | List all active Cargo package paths, Bun packages, and image projects from `workspace.json`              |
| `check`                            | Run Cargo workspace check and Bun 1.4 native typecheck for every cataloged Bun package                   |
| `test`                             | Run Cargo tests and `bun test` in every cataloged Bun package                                            |
| `fmt`, `lint`                      | Run Bun native formatting check and lint across cataloged Bun packages                                   |
| `fmt:rust`, `clippy`               | Run Cargo formatting check and Clippy across the workspace                                               |
| `bun:check`, `bun:fmt`, `bun:lint` | Run one Bun native quality check across the cataloged packages                                           |
| `aot:check`, `aot:explain`         | Check CLI entrypoints with Bun AOT rules; `aot:explain` reports slow paths, neither builds a binary      |
| `targets`                          | Generate the `cross` target matrix via `xtask`                                                           |
| `submodules`                       | Initialize the three remaining root Git submodules; this does not hydrate the 372-entry Bun OS inventory |

`check` and Bun lint/type checks are separate from target SDK validation. The
Cargo formatter remains available as `fmt:rust`; Bun `fmt` only checks supported
source, configuration, and documentation files and skips generated build trees
and machine-generated data.

The packages target Bun 1.4.4 or newer. Root development pins
`bun@1.4.4-canary.1` for native `bun lint` and AOT analysis. Stable 1.4.4
provides `bun check` and `bun fmt` but does not expose `bun lint` or the AOT
flags. AOT policy and LTO/CPU
baseline guidance are documented in [`docs/toolchain-2026.md`](docs/toolchain-2026.md).
`aot:check` is Bun's static `check --aot` pass; `aot:explain` prints compiler
slow paths. Neither task compiles an executable. Real AOT builds must run and be measured on the matching host platform. The
migrated Rust formatter check still fails on broad upstream formatting drift.
Clippy's `-D warnings` check fails on inherited findings in `cross` and `xtask`.
These Cargo issues are separate from the passing Bun checks.

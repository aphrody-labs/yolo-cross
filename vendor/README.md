# Bun OS vendor inventory

`bun-os-submodules.json` pins the complete set of 372 submodule declarations found in the source checkout's
`.gitmodules`; 369 paths had a commit in its Git index. `bun-os.gitmodules` preserves the source URLs and path names.

This is an inventory of Bun OS's source submodules, not a hydrated copy of those 372 repositories. The active root
`.gitmodules` is smaller and now contains only `cross-toolchains`, `manylinux-cross`, and `rust-musl-cross`; `cargo-xwin`
and `cargo-zigbuild` are flattened source trees under `crates/` at pinned upstream commits. Upstream checkouts remain
lazy so a normal clone of `yolo-cross` does not fetch unrelated OS, kernel, browser, emulator, or SDK repositories. In particular, the MSYS2,
Cygwin, MinGW, Wine-CachyOS, Proton, CachyOS, LLVM, CMake, vcpkg, QEMU, and WebAssembly sources are recorded here but
are not yet checked out under `vendor/`. Keep their licenses and upstream commit IDs when adding a selected checkout.

Some imported BunCC and native build recipes expect additional tool repositories below `vendor/`; populate only the
sources a selected build needs, at the paths recorded in `bun-os-submodules.json`.

# GEMINI.md — yolo-cross

## 0. Directives Fondatrices
- **NHITL (No Human In The Loop)** : autonomie complete de compilation et de distribution de toolchains cross-plateformes.
- **Zero Emoji** : conformite absolue au protocole global YOLO.
- **Purete Technique** : Upstream Bun v1.4.4+, Rust 2024, LLVM / Clang, Cl.exe (MSVC), Zig bare-metal.

## 1. Role et Architecture
`yolo-cross` orchestre les cross-compilateurs, les sysroots et les chaines d'outils natives universelles :
- `buncc` : Pilote unifie cc, c++, ar, link pour Windows (MSVC `vcvarsall` / `vswhere`), Linux (musl/glibc) et macOS.
- `cargo-xwin` & `cargo-zigbuild` : Cross-compilation Rust vers Windows et Linux sans Docker lourd.
- `android-pipeline` & `bun-android` : Toolchain AOSP / NDK et empaquetage d'artefacts Android (APK, AAB, APEX).
- `bun-dotnet-windows` : Bindings CsWinRT, Direct3D 12 et generation AOT .NET 10/11 sans runtime lourd.
- `windows-samples-tests` : Matrice de conformite WinUI 3, WinAppSDK, WARP Direct3D 12 sur les 4 langages (C++, C#, Rust, Bun).
- `wasm` : Toolchain WebAssembly component model (`wasm32-wasip1`, `wasm32-wasip2`, `wasm32-unknown-unknown`).

## 2. Commandes Canoniques
- `bun run orchestrate.ts list` : Lister les cibles et composants.
- `bun run orchestrate.ts check` : Verification statique des modules TypeScript et Rust.
- `bun test` : Execution des tests unitaires de `yolo-cross`.

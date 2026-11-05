# yolo-cross `dotnet/` — C#/.NET + native interop layer

A real, buildable .NET solution that demonstrates cross-language interop and
cross-compilation inside the yolo-cross workspace. It is Bun/Rust/C#/C++ only;
no Node.js/npm is used by any tooling here.

## Layout

```
dotnet/
  YoloCross.slnx             XML solution format (dotnet new sln, .NET 10 default)
  native/yolo_interop/        Rust cdylib (C ABI): yolo_interop.dll / libyolo_interop.so
  src/YoloCross.Interop/      C# class library: LibraryImport P/Invoke + UnmanagedCallersOnly export
  src/YoloCross.Cli/          Console app (AssemblyName: yolo-cross-dotnet) that exercises + self-checks
  src/YoloCross.NativeExport/ NativeAOT shared library exporting a C# function to native code
  module/YoloCross/           PowerShell 7 module (.psd1 + .psm1) that loads and exercises the library
```

## Interop demonstrated

- **C# -> Rust** via source-generated P/Invoke (`[LibraryImport]`): `Add`,
  `Fnv1a64`, `Version`.
- **Native -> C#** via `[UnmanagedCallersOnly]`: the managed `ManagedDouble`
  function pointer is handed to Rust (`yolo_cross_apply`), which calls back into
  managed code in-process; the same method is exported as the native symbol
  `yolo_managed_double` by the NativeAOT `NativeLib` build.

## Build and run (Windows host)

```bash
# 1. Build the Rust cdylib into a deterministic, crate-local target dir.
cargo build --release --target-dir target \
  --manifest-path native/yolo_interop/Cargo.toml

# 2. Build the solution (MSBuild copies yolo_interop.dll next to the managed assembly).
dotnet build -c Release

# 3. Run the demo (self-checks, non-zero exit on failure).
./src/YoloCross.Cli/bin/Release/net10.0/yolo-cross-dotnet.exe
```

Or use the helper script `scripts/dotnet-interop.ps1` / `scripts/dotnet-interop.sh`.

## Cross-compilation targets

- `dotnet publish -r linux-x64` cross-publishes the managed app from Windows.
- `dotnet publish -r win-x64 -p:PublishAot=true` produces a native Windows exe.
- See `docs/csharp/` for the full guide and `docs/csharp/FEASIBILITY.md` for the
  honest per-target verdict table. Build receipts live in `docs/receipts/csharp/`.

## Licensing

This directory is original yolo-cross work (MIT OR Apache-2.0, matching the
workspace). It does not modify or relicense the vendored upstream `cross`,
`cargo-xwin`, or `cargo-zigbuild` sources.

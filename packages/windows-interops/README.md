# @yolo/windows-interops

Windows-only adapters for the cross workspace: the .NET WinUI host and the
BunOS device IOCTL client. Core Win32, registry, services, shell, `bun:windows`,
and `bun:winrt` APIs are owned by `@yolo/windows` in yolo-bun. The typed
windows-rs N-API provider belongs to yolo-os.

The WinUI compatibility module requires the yolo-bun `@yolo/windows` plugin to
be registered first so `bun:winrt` is available. The core package dependency
uses a local sibling repository path until the package publication path is
available; this checkout is not independently releasable yet.

License: Apache-2.0.

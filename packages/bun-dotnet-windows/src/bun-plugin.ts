// SPDX-License-Identifier: MIT
// Optional Bun aliases for the .NET, PowerShell, winget, and Direct3D APIs; register explicitly with Bun.plugin().
import { defineCrossPlugin } from "@yolo/cross-plugins/define";

export default defineCrossPlugin({
  name: "@yolo/bun-dotnet-windows",
  modules: {
    "bun:winget": new URL("./winget.ts", import.meta.url),
    "bun:pwsh": new URL("./pwsh.ts", import.meta.url),
    "bun:d3d12": new URL("./d3d12.ts", import.meta.url),
  },
  bins: {
    "bunos-winget": new URL("./cli/bunos-winget.ts", import.meta.url),
    "bunos-pwsh": new URL("./cli/bunos-pwsh.ts", import.meta.url),
  },
});

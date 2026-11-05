// SPDX-License-Identifier: MIT
// The fork's `bun:dotnet`: .NET hosted in-process through hostfxr and bun:ffi (no other Bun OS owner hosts the CLR).
import { defineCrossPlugin } from "../define.ts";

export default defineCrossPlugin({
  name: "@yolo/cross-plugins/dotnet",
  replaces: ["bun:dotnet"],
  modules: {
    "bun:dotnet": new URL("./dotnet.ts", import.meta.url),
  },
});

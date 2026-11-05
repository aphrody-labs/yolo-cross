// SPDX-License-Identifier: MIT
/** Minimal cross-toolchain plugin contract and the in-process .NET hostfxr bridge. */
export {
  defineCrossPlugin,
  targetPath,
  type CrossPlugin,
  type CrossPluginSpec,
  type ModuleTarget,
} from "./define.ts";
export * from "./dotnet/dotnet.ts";
export { default as dotnetPlugin } from "./dotnet/plugin.ts";

// SPDX-License-Identifier: Apache-2.0
// Optional Bun aliases for the Windows APIs, registered explicitly with Bun.plugin().
import { defineCrossPlugin } from "@yolo/cross-plugins/define";

export default defineCrossPlugin({
  name: "@yolo/windows",
  replaces: ["bun:windows", "bun:winrt", "bun:winui"],
  modules: {
    "bun:windows": new URL("./fork/windows.ts", import.meta.url),
    "bun:winrt": new URL("./fork/winrt.ts", import.meta.url),
    "bun:winui": new URL("./fork/winui.ts", import.meta.url),
  },
});

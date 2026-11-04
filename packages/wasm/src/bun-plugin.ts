// SPDX-License-Identifier: MIT
// Optional `bun:wasm` alias over this package; register explicitly with Bun.plugin().
import { defineCrossPlugin } from "@yolo/cross-plugins/define";

export default defineCrossPlugin({
  name: "@yolo/wasm",
  replaces: ["bun:wasm", "bun wasm", "bun build --target=wasm"],
  modules: {
    "bun:wasm": new URL("./fork.ts", import.meta.url),
  },
  bins: {
    "yolo-wasm": new URL("./cli.ts", import.meta.url),
  },
});

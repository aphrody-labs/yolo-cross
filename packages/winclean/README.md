<!-- SPDX-License-Identifier: Apache-2.0 -->

# @yolo/winclean

Bun client for Windows cleanup, computer-use, and OS-control tools routed through
the local kernel endpoint.

```ts
import { Winclean } from "@yolo/winclean";

using wc = Winclean.open();
const obs = (await wc.computerObserve({ windowHandle: 0 })).ok();
await Bun.write("window.png", obs.images[0]!.bytes);
await wc.computerClick({ windowHandle: 0, x: 120, y: 48 });
const os = (await wc.call("get_os_info")).json();
```

- Calls use the local kernel endpoint selected by `@yolo/kernel-client`. Import
  `KernelClient` from `@yolo/kernel-client` for direct kernel access.
- `callSync` and direct DLL loading are intentionally removed.
- `src/generated.ts` and `src/catalog.ts` mirror the canonical Rust catalog
  (`packages/bun-windows-winclean/src/tools.json`); regenerate them, `generated.rs` and the
  migration ledger with `bun scripts/aphrody/tools/os/scripts/generate-winclean-catalog.ts`
  (`--check` verifies). Do not edit them by hand.
- Gaming profile: the `gaming_*` tools (GPU window capture, frame pacing, raw input, Steam
  launch, read-only optimisation checks); see `packages/bun-windows-winclean/README.md`.
- Tests: `bun test`.

See [`docs/winclean-native-import.md`](../../docs/winclean-native-import.md).

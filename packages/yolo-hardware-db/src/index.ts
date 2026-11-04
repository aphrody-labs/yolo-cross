// SPDX-License-Identifier: MIT
// yolo-hardware-db: Public API exports and singletons

export * from "./types.ts";
export * from "./fetcher.ts";
export * from "./db.ts";

import { HardwareDatabase } from "./db.ts";

let defaultDb: HardwareDatabase | null = null;

export async function getHardwareDatabase(options?: {
  forceLive?: boolean;
}): Promise<HardwareDatabase> {
  if (!defaultDb) {
    defaultDb = new HardwareDatabase();
    await defaultDb.init(options);
  }
  return defaultDb;
}

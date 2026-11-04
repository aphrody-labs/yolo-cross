#!/usr/bin/env bun
// SPDX-License-Identifier: MIT
// yolo-hardware-db: CLI tool `bun run hw <cpu|gpu|driver|pci|usb|search|sync>`

import { HardwareDatabase } from "./db.ts";

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || "help";
const query = args.slice(1).join(" ").trim();

async function main() {
  const db = new HardwareDatabase();

  if (command === "sync") {
    console.log(
      "⚡ [YOLO-HARDWARE-DB] Syncing upstream PCI and USB ID registries...",
    );
    await db.init({ forceLive: true });
    console.log(
      `✓ Synchronized: ${db.getCpus().length} CPUs, ${db.getGpus().length} GPUs, ${db.getDrivers().length} Drivers`,
    );
    console.log(`✓ PCI Devices: ${db.getPciEntries().length}`);
    console.log(`✓ USB Devices: ${db.getUsbEntries().length}`);
    return;
  }

  await db.init();

  switch (command) {
    case "cpu": {
      if (!query) {
        console.log("=== CPUs Catalog ===");
        for (const c of db.getCpus()) {
          console.log(
            `- [${c.id}] ${c.name} (${c.vendor}, ${c.cores.total}C/${c.cores.threads}T, Boost: ${c.frequencies.boostMhz}MHz)`,
          );
        }
        return;
      }
      const cpu = db.findCpu(query);
      if (!cpu) {
        console.error(`CPU not found for query: "${query}"`);
        process.exit(1);
      }
      console.log(JSON.stringify(cpu, null, 2));
      break;
    }

    case "gpu": {
      if (!query) {
        console.log("=== GPUs Catalog ===");
        for (const g of db.getGpus()) {
          console.log(
            `- [${g.id}] ${g.name} (${g.vendor}, ${g.architecture}, ${g.memory.sizeGb}GB ${g.memory.type})`,
          );
        }
        return;
      }
      const gpu = db.findGpu(query);
      if (!gpu) {
        console.error(`GPU not found for query: "${query}"`);
        process.exit(1);
      }
      console.log(JSON.stringify(gpu, null, 2));
      break;
    }

    case "driver": {
      if (!query) {
        console.log("=== Drivers Matrix ===");
        for (const d of db.getDrivers()) {
          console.log(
            `- [${d.id}] ${d.name} (OS: ${d.os}, Ver: ${d.latestVersion})`,
          );
        }
        return;
      }
      const drv = db.findDriver(query);
      if (!drv) {
        console.error(`Driver not found for query: "${query}"`);
        process.exit(1);
      }
      console.log(JSON.stringify(drv, null, 2));
      break;
    }

    case "pci": {
      const parts = query.split(/[:\s]+/);
      if (!parts[0]) {
        console.log(`Total PCI entries: ${db.getPciEntries().length}`);
        return;
      }
      const entries = db.lookupPci(parts[0], parts[1]);
      console.log(JSON.stringify(entries, null, 2));
      break;
    }

    case "usb": {
      const parts = query.split(/[:\s]+/);
      if (!parts[0]) {
        console.log(`Total USB entries: ${db.getUsbEntries().length}`);
        return;
      }
      const entries = db.lookupUsb(parts[0], parts[1]);
      console.log(JSON.stringify(entries, null, 2));
      break;
    }

    case "search": {
      if (!query) {
        console.error(
          "Please provide a search term, e.g.: `bun run hw search 5090`",
        );
        process.exit(1);
      }
      const results = db.search(query);
      console.log(`=== Found ${results.length} matches for "${query}" ===`);
      for (const res of results) {
        console.log(
          `[${res.type.toUpperCase()}] ${res.title} (Score: ${res.score})`,
        );
        console.log(`  ${res.subtitle}`);
      }
      break;
    }

    case "help":
    default:
      console.log(`
YOLO Hardware DB CLI (2026 Telemetry & Hardware Registry)

Usage:
  bun run hw cpu [query]       Query CPU model details or list all
  bun run hw gpu [query]       Query GPU model, specs, Vulkan/Metal/DX support
  bun run hw driver [query]    Query driver matrices (NVIDIA, RADV, ANV, NVK, Turnip, Asahi)
  bun run hw pci <vendor> [id] Query PCI IDs registry (e.g. 10de 2b80)
  bun run hw usb <vendor> [id] Query USB IDs registry (e.g. 045e 028e)
  bun run hw search <term>     Universal search across CPU, GPU, Driver, PCI, USB
  bun run hw sync              Fetch latest upstream definitions into local cache
`);
      break;
  }
}

if (import.meta.main) {
  void main();
}

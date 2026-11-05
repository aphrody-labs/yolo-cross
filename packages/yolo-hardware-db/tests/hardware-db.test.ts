// SPDX-License-Identifier: MIT
// yolo-hardware-db: Unit and integration tests

import { describe, expect, it, beforeAll } from "bun:test";
import { HardwareDatabase, HardwareFetcher } from "../src/index.ts";

describe("HardwareFetcher & Parsers", () => {
  it("should parse sample PCI ID format correctly including subsystems", () => {
    const rawPci = `
10de  NVIDIA Corporation
\t2b80  GB202 [GeForce RTX 5090]
\t\t10de 18d2  GeForce RTX 5090 Founders Edition
\t2684  AD102 [GeForce RTX 4090]
8086  Intel Corporation
\te20b  Battlemage B580 [Arc B580]
`;
    const entries = HardwareFetcher.parsePciIds(rawPci);
    // 2b80 device + 2b80 subdevice + 2684 device + e20b device = 4 entries
    expect(entries.length).toBe(4);

    const rtx5090Sub = entries.find((e) => e.subsystemDeviceId === "18d2");
    expect(rtx5090Sub).toBeDefined();
    expect(rtx5090Sub?.vendorName).toBe("NVIDIA Corporation");
    expect(rtx5090Sub?.subsystemName).toBe("GeForce RTX 5090 Founders Edition");
  });

  it("should parse sample USB ID format correctly", () => {
    const rawUsb = `
045e  Microsoft Corp.
\t028e  Xbox360 Controller
\t02d1  Xbox One Controller
054c  Sony Corp.
\t0ce6  DualSense Wireless Controller (PS5)
`;
    const entries = HardwareFetcher.parseUsbIds(rawUsb);
    expect(entries.length).toBe(3);

    const ds5 = entries.find((e) => e.deviceId === "0ce6");
    expect(ds5?.vendorName).toBe("Sony Corp.");
    expect(ds5?.deviceName).toBe("DualSense Wireless Controller (PS5)");
  });
});

describe("HardwareDatabase Queries & Offline Caches", () => {
  let db: HardwareDatabase;

  beforeAll(async () => {
    db = new HardwareDatabase();
    await db.init();
  });

  it("should load offline CPUs dataset with modern 2024-2026 architectures", () => {
    const cpus = db.getCpus();
    expect(cpus.length).toBeGreaterThanOrEqual(8);

    // Arrow Lake
    const ultra9 = db.findCpu("intel-core-ultra-9-285k");
    expect(ultra9).toBeDefined();
    expect(ultra9?.vendor).toBe("Intel");
    expect(ultra9?.cores.total).toBe(24);
    expect(ultra9?.instructionSets).toContain("AVX2");

    // Zen 5
    const ryzen9 = db.findCpu("amd-ryzen-9-9950x");
    expect(ryzen9).toBeDefined();
    expect(ryzen9?.vendor).toBe("AMD");
    expect(ryzen9?.cores.threads).toBe(32);

    // ARM Snapdragon X Elite Oryon
    const snapdragon = db.findCpu("snapdragon");
    expect(snapdragon).toBeDefined();
    expect(snapdragon?.family).toBe("Oryon");
    expect(snapdragon?.architecture).toBe("arm64");

    // Apple M4
    const m4 = db.findCpu("apple-m4");
    expect(m4).toBeDefined();
    expect(m4?.family).toBe("M4");
  });

  it("should load offline GPUs dataset with Blackwell, RDNA4, and Xe2", () => {
    const gpus = db.getGpus();
    expect(gpus.length).toBeGreaterThanOrEqual(7);

    // RTX 5090 Blackwell
    const rtx5090 = db.findGpu("nvidia-geforce-rtx-5090");
    expect(rtx5090).toBeDefined();
    expect(rtx5090?.architecture).toBe("Blackwell");
    expect(rtx5090?.memory.type).toBe("GDDR7");
    expect(rtx5090?.pciDeviceId).toBe("2b80");

    // AMD RDNA 4
    const rx9070 = db.findGpu("rx 9070");
    expect(rx9070).toBeDefined();
    expect(rx9070?.architecture).toBe("RDNA 4");

    // Battlemage Arc B580
    const b580 = db.findGpu("b580");
    expect(b580).toBeDefined();
    expect(b580?.vendor).toBe("Intel");
  });

  it("should load driver matrix with Vulkan, Mesa, and proprietary drivers", () => {
    const drivers = db.getDrivers();
    expect(drivers.length).toBeGreaterThanOrEqual(6);

    const radv = db.findDriver("mesa-radv");
    expect(radv).toBeDefined();
    expect(radv?.openSource).toBe(true);
    expect(radv?.kernelModule).toBe("amdgpu");

    const asahi = db.findDriver("asahi");
    expect(asahi).toBeDefined();
    expect(asahi?.vendor).toBe("Apple");
  });

  it("should lookup PCI devices by vendor and device ID", () => {
    const nvdEntries = db.lookupPci("10de", "2b80");
    expect(nvdEntries.length).toBeGreaterThanOrEqual(1);
    expect(nvdEntries[0].deviceName).toContain("RTX 5090");
  });

  it("should lookup USB devices by vendor and device ID", () => {
    const usbXbox = db.lookupUsb("045e", "028e");
    expect(usbXbox.length).toBeGreaterThanOrEqual(1);
    expect(usbXbox[0].deviceName).toContain("Xbox360");
  });

  it("should perform fast fuzzy BM25-style search across all datasets", () => {
    const results = db.search("Blackwell");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("RTX 5090");

    const cpuResults = db.search("Oryon");
    expect(cpuResults.length).toBeGreaterThan(0);
    expect(cpuResults[0].type).toBe("cpu");

    const driverResults = db.search("radv");
    expect(driverResults.length).toBeGreaterThan(0);
    expect(driverResults[0].type).toBe("driver");
  });
});

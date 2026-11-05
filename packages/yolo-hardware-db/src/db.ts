// SPDX-License-Identifier: MIT
// yolo-hardware-db: Fast in-memory query, indexing and BM25 search engine

import type {
  CpuModel,
  DriverMatrix,
  GpuModel,
  HardwareSearchResult,
  PciDeviceEntry,
  UsbDeviceEntry,
} from "./types.ts";
import { HardwareFetcher } from "./fetcher.ts";

export class HardwareDatabase {
  private cpus: CpuModel[] = [];
  private gpus: GpuModel[] = [];
  private drivers: DriverMatrix[] = [];
  private pciEntries: PciDeviceEntry[] = [];
  private usbEntries: UsbDeviceEntry[] = [];
  private fetcher: HardwareFetcher;
  private initialized = false;

  constructor(customDataDir?: string) {
    this.fetcher = new HardwareFetcher(customDataDir);
  }

  public async init(options?: { forceLive?: boolean }): Promise<void> {
    if (this.initialized && !options?.forceLive) return;

    const [cpus, gpus, drivers, pciRaw, usbRaw] = await Promise.all([
      this.fetcher.loadCpus(),
      this.fetcher.loadGpus(),
      this.fetcher.loadDrivers(),
      this.fetcher.fetchOrLoadPciIds(options),
      this.fetcher.fetchOrLoadUsbIds(options),
    ]);

    this.cpus = cpus;
    this.gpus = gpus;
    this.drivers = drivers;
    this.pciEntries = HardwareFetcher.parsePciIds(pciRaw);
    this.usbEntries = HardwareFetcher.parseUsbIds(usbRaw);
    this.initialized = true;
  }

  public getCpus(): CpuModel[] {
    return this.cpus;
  }

  public getGpus(): GpuModel[] {
    return this.gpus;
  }

  public getDrivers(): DriverMatrix[] {
    return this.drivers;
  }

  public getPciEntries(): PciDeviceEntry[] {
    return this.pciEntries;
  }

  public getUsbEntries(): UsbDeviceEntry[] {
    return this.usbEntries;
  }

  public findCpu(query: string): CpuModel | undefined {
    const q = query.toLowerCase().trim();
    return this.cpus.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.name.toLowerCase().includes(q) ||
        (c.codeName && c.codeName.toLowerCase() === q),
    );
  }

  public findGpu(query: string): GpuModel | undefined {
    const q = query.toLowerCase().trim();
    return this.gpus.find(
      (g) =>
        g.id.toLowerCase() === q ||
        g.name.toLowerCase().includes(q) ||
        (g.pciDeviceId && g.pciDeviceId.toLowerCase() === q),
    );
  }

  public findDriver(query: string): DriverMatrix | undefined {
    const q = query.toLowerCase().trim();
    return this.drivers.find(
      (d) =>
        d.id.toLowerCase() === q ||
        d.name.toLowerCase().includes(q) ||
        (d.kernelModule && d.kernelModule.toLowerCase().includes(q)) ||
        (d.userSpaceDriver && d.userSpaceDriver.toLowerCase().includes(q)),
    );
  }

  public lookupPci(vendorId: string, deviceId?: string): PciDeviceEntry[] {
    const v = vendorId.toLowerCase().trim();
    if (!deviceId) {
      return this.pciEntries.filter((p) => p.vendorId === v);
    }
    const d = deviceId.toLowerCase().trim();
    return this.pciEntries.filter((p) => p.vendorId === v && p.deviceId === d);
  }

  public lookupUsb(vendorId: string, deviceId?: string): UsbDeviceEntry[] {
    const v = vendorId.toLowerCase().trim();
    if (!deviceId) {
      return this.usbEntries.filter((u) => u.vendorId === v);
    }
    const d = deviceId.toLowerCase().trim();
    return this.usbEntries.filter((u) => u.vendorId === v && u.deviceId === d);
  }

  public search(query: string, maxResults = 25): HardwareSearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const results: HardwareSearchResult[] = [];

    // Helper score calculator
    const calcScore = (
      targetName: string,
      targetId: string,
      fullText: string,
    ): number => {
      const lowerFull = fullText.toLowerCase();
      const lowerName = targetName.toLowerCase();
      const lowerId = targetId.toLowerCase();

      if (lowerName === q || lowerId === q) return 100;
      if (lowerName.startsWith(q) || lowerId.startsWith(q)) return 85;
      if (lowerName.includes(q) || lowerId.includes(q)) return 70;

      let matchCount = 0;
      for (const tok of tokens) {
        if (lowerFull.includes(tok)) matchCount++;
      }
      if (matchCount === tokens.length) return 50 + matchCount * 5;
      if (matchCount > 0) return 20 + matchCount * 5;
      return 0;
    };

    // 1. Search CPUs
    for (const cpu of this.cpus) {
      const strToMatch = `${cpu.id} ${cpu.name} ${cpu.vendor} ${cpu.family} ${cpu.codeName ?? ""} ${cpu.instructionSets.join(" ")}`;
      const score = calcScore(cpu.name, cpu.id, strToMatch);
      if (score > 0) {
        results.push({
          score,
          type: "cpu",
          id: cpu.id,
          title: cpu.name,
          subtitle: `${cpu.cores.total} Cores (${cpu.cores.threads}T), ${cpu.frequencies.boostMhz} MHz, Arch: ${cpu.architecture}`,
          vendor: cpu.vendor,
          details: cpu as unknown as Record<string, unknown>,
        });
      }
    }

    // 2. Search GPUs
    for (const gpu of this.gpus) {
      const strToMatch = `${gpu.id} ${gpu.name} ${gpu.vendor} ${gpu.architecture} ${gpu.pciDeviceId ?? ""} ${gpu.driverLinux ?? ""}`;
      const score = calcScore(gpu.name, gpu.id, strToMatch);
      if (score > 0) {
        results.push({
          score,
          type: "gpu",
          id: gpu.id,
          title: gpu.name,
          subtitle: `${gpu.architecture} - ${gpu.memory.sizeGb}GB ${gpu.memory.type} - TDP: ${gpu.tdpWatts}W`,
          vendor: gpu.vendor,
          details: gpu as unknown as Record<string, unknown>,
        });
      }
    }

    // 3. Search Drivers
    for (const drv of this.drivers) {
      const strToMatch = `${drv.id} ${drv.name} ${drv.vendor} ${drv.category} ${drv.os} ${drv.userSpaceDriver ?? ""} ${drv.kernelModule ?? ""} ${drv.features.join(" ")}`;
      const score = calcScore(drv.name, drv.id, strToMatch);
      if (score > 0) {
        results.push({
          score,
          type: "driver",
          id: drv.id,
          title: drv.name,
          subtitle: `OS: ${drv.os} | Ver: ${drv.latestVersion} | ${drv.userSpaceDriver ?? drv.kernelModule ?? ""}`,
          vendor: drv.vendor,
          details: drv as unknown as Record<string, unknown>,
        });
      }
    }

    // 4. Search PCI database
    for (const pci of this.pciEntries) {
      const strToMatch = `${pci.vendorId}:${pci.deviceId} ${pci.vendorName} ${pci.deviceName} ${pci.subsystemName ?? ""}`;
      const score = calcScore(pci.deviceName, pci.deviceId, strToMatch);
      if (score > 0) {
        results.push({
          score: Math.min(score, 60),
          type: "pci",
          id: `pci-${pci.vendorId}-${pci.deviceId}`,
          title: pci.deviceName,
          subtitle: `PCI [${pci.vendorId}:${pci.deviceId}] Vendor: ${pci.vendorName}`,
          vendor: pci.vendorName,
          details: pci as unknown as Record<string, unknown>,
        });
      }
    }

    // 5. Search USB database
    for (const usb of this.usbEntries) {
      const strToMatch = `${usb.vendorId}:${usb.deviceId} ${usb.vendorName} ${usb.deviceName}`;
      const score = calcScore(usb.deviceName, usb.deviceId, strToMatch);
      if (score > 0) {
        results.push({
          score: Math.min(score, 60),
          type: "usb",
          id: `usb-${usb.vendorId}-${usb.deviceId}`,
          title: usb.deviceName,
          subtitle: `USB [${usb.vendorId}:${usb.deviceId}] Vendor: ${usb.vendorName}`,
          vendor: usb.vendorName,
          details: usb as unknown as Record<string, unknown>,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }
}

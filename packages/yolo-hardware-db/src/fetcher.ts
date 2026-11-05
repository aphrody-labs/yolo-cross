// SPDX-License-Identifier: MIT
// yolo-hardware-db: Live upstream fetcher with fallback to local cached files

import { join, resolve } from "node:path";
import type {
  CpuModel,
  DriverMatrix,
  GpuModel,
  PciDeviceEntry,
  UsbDeviceEntry,
} from "./types.ts";

export const UPSTREAM_URLS = {
  pciIds: "https://raw.githubusercontent.com/pciutils/pciids/master/pci.ids",
  usbIds: "https://raw.githubusercontent.com/gentoo/hwids/master/usb.ids",
};

export class HardwareFetcher {
  private dataDir: string;

  constructor(customDataDir?: string) {
    if (customDataDir) {
      this.dataDir = customDataDir;
    } else {
      const currentDir = resolve(
        new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
      );
      this.dataDir = join(currentDir, "..", "data");
    }
  }

  public getDataDir(): string {
    return this.dataDir;
  }

  public async loadCpus(): Promise<CpuModel[]> {
    const file = Bun.file(join(this.dataDir, "cpus.json"));
    if (!(await file.exists())) return [];
    return file.json();
  }

  public async loadGpus(): Promise<GpuModel[]> {
    const file = Bun.file(join(this.dataDir, "gpus.json"));
    if (!(await file.exists())) return [];
    return file.json();
  }

  public async loadDrivers(): Promise<DriverMatrix[]> {
    const file = Bun.file(join(this.dataDir, "drivers.json"));
    if (!(await file.exists())) return [];
    return file.json();
  }

  public async fetchOrLoadPciIds(options?: {
    forceLive?: boolean;
  }): Promise<string> {
    const localFile = Bun.file(join(this.dataDir, "pci.ids"));
    if (options?.forceLive) {
      try {
        const resp = await fetch(UPSTREAM_URLS.pciIds, {
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const text = await resp.text();
          await Bun.write(localFile, text);
          return text;
        }
      } catch (e) {
        // Fallback to local
      }
    }

    if (await localFile.exists()) {
      return localFile.text();
    }
    return "";
  }

  public async fetchOrLoadUsbIds(options?: {
    forceLive?: boolean;
  }): Promise<string> {
    const localFile = Bun.file(join(this.dataDir, "usb.ids"));
    if (options?.forceLive) {
      try {
        const resp = await fetch(UPSTREAM_URLS.usbIds, {
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const text = await resp.text();
          await Bun.write(localFile, text);
          return text;
        }
      } catch (e) {
        // Fallback to local
      }
    }

    if (await localFile.exists()) {
      return localFile.text();
    }
    return "";
  }

  public static parsePciIds(rawContent: string): PciDeviceEntry[] {
    const results: PciDeviceEntry[] = [];
    const lines = rawContent.split(/\r?\n/);
    let currentVendorId = "";
    let currentVendorName = "";
    let currentDeviceId = "";
    let currentDeviceName = "";

    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;

      // Two tabs: Subsystem
      if (line.startsWith("\t\t")) {
        const trimmed = line.slice(2).trim();
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3 && currentVendorId && currentDeviceId) {
          const subVendor = parts[0].toLowerCase();
          const subDevice = parts[1].toLowerCase();
          const subName = parts.slice(2).join(" ");
          results.push({
            vendorId: currentVendorId,
            vendorName: currentVendorName,
            deviceId: currentDeviceId,
            deviceName: currentDeviceName,
            subsystemVendorId: subVendor,
            subsystemDeviceId: subDevice,
            subsystemName: subName,
          });
        }
        continue;
      }

      // One tab: Device
      if (line.startsWith("\t")) {
        const trimmed = line.slice(1).trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace !== -1 && currentVendorId) {
          currentDeviceId = trimmed.slice(0, firstSpace).toLowerCase();
          currentDeviceName = trimmed.slice(firstSpace).trim();
          results.push({
            vendorId: currentVendorId,
            vendorName: currentVendorName,
            deviceId: currentDeviceId,
            deviceName: currentDeviceName,
          });
        }
        continue;
      }

      // No tab: Vendor
      const firstSpace = line.indexOf(" ");
      if (firstSpace !== -1) {
        const vId = line.slice(0, firstSpace).trim().toLowerCase();
        // Skip syntax like "C 00  ..." (PCI class lines)
        if (/^[0-9a-f]{4}$/.test(vId)) {
          currentVendorId = vId;
          currentVendorName = line.slice(firstSpace).trim();
          currentDeviceId = "";
          currentDeviceName = "";
        } else {
          // It's a class code or other definition, reset current vendor
          currentVendorId = "";
          currentVendorName = "";
        }
      }
    }

    return results;
  }

  public static parseUsbIds(rawContent: string): UsbDeviceEntry[] {
    const results: UsbDeviceEntry[] = [];
    const lines = rawContent.split(/\r?\n/);
    let currentVendorId = "";
    let currentVendorName = "";

    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;

      if (line.startsWith("\t\t")) {
        // Interface class / name - ignore or attach
        continue;
      }

      if (line.startsWith("\t")) {
        const trimmed = line.slice(1).trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace !== -1 && currentVendorId) {
          const dId = trimmed.slice(0, firstSpace).toLowerCase();
          const dName = trimmed.slice(firstSpace).trim();
          results.push({
            vendorId: currentVendorId,
            vendorName: currentVendorName,
            deviceId: dId,
            deviceName: dName,
          });
        }
        continue;
      }

      const firstSpace = line.indexOf(" ");
      if (firstSpace !== -1) {
        const vId = line.slice(0, firstSpace).trim().toLowerCase();
        if (/^[0-9a-f]{4}$/.test(vId)) {
          currentVendorId = vId;
          currentVendorName = line.slice(firstSpace).trim();
        } else {
          currentVendorId = "";
          currentVendorName = "";
        }
      }
    }

    return results;
  }
}

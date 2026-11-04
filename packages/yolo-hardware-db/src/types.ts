// SPDX-License-Identifier: MIT
// yolo-hardware-db: Hardware, CPU, GPU, Driver & Bus Identifier Types

export type Architecture =
  "x86_64" | "arm64" | "riscv64" | "loongarch64" | "ppc64le";

export type Vendor =
  | "Intel"
  | "AMD"
  | "NVIDIA"
  | "Apple"
  | "Qualcomm"
  | "ARM"
  | "Broadcom"
  | "MediaTek"
  | "Amazon"
  | "Google"
  | "Microsoft"
  | "Samsung"
  | "Other";

export interface CpuMicrocode {
  minRevision?: string;
  recommendedRevision?: string;
  notes?: string;
}

export interface CpuModel {
  id: string; // e.g. "intel-ultra9-285k", "amd-ryzen9-9950x"
  name: string; // "Intel Core Ultra 9 285K"
  vendor: Vendor;
  family: string; // "Arrow Lake-S", "Zen 5", "Oryon", "M4"
  architecture: Architecture;
  codeName?: string;
  socket?: string; // "LGA1851", "AM5"
  cores: {
    total: number;
    performance?: number;
    efficiency?: number;
    lowPowerEfficiency?: number;
    threads: number;
  };
  frequencies: {
    baseMhz: number;
    boostMhz: number;
    allCoreBoostMhz?: number;
  };
  cache: {
    l1dKb?: number;
    l1iKb?: number;
    l2Kb?: number;
    l3Kb?: number;
    systemLevelCacheMb?: number;
  };
  processNode?: string; // "TSMC N3B", "Intel 20A"
  tdpWatts: number;
  maxTurboPowerWatts?: number;
  cpuid?: {
    family: number;
    model: number;
    stepping: number;
    signatureHex?: string;
  };
  instructionSets: string[]; // ["AVX-512", "AVX2", "AMX", "NEON", "SVE2"]
  npu?: {
    name: string;
    tops: number;
  };
  integratedGpu?: string;
  releaseDate?: string;
}

export interface GpuModel {
  id: string; // "nvidia-rtx-5090", "amd-rx-9070-xt"
  name: string; // "NVIDIA GeForce RTX 5090"
  vendor: Vendor;
  architecture: string; // "Blackwell", "Ada Lovelace", "RDNA 3.5", "RDNA 4", "Xe2-LPG", "Apple M4"
  pciVendorId?: string; // "10de"
  pciDeviceId?: string; // "2b80"
  pciSubsystemId?: string;
  busInterface?: string; // "PCIe 5.0 x16"
  shadingUnits?: number; // CUDA cores / Stream Processors / Execution Units
  rayTracingCores?: number;
  tensorCores?: number;
  clockSpeeds: {
    baseMhz: number;
    boostMhz: number;
    memoryMhz?: number;
  };
  memory: {
    sizeGb: number;
    type: "GDDR7" | "GDDR6X" | "GDDR6" | "HBM3e" | "LPDDR5X" | "Unified";
    busWidthBits: number;
    bandwidthGbps?: number;
  };
  tdpWatts: number;
  vulkanSupport?: {
    apiVersion: string; // "1.3.296" or "1.4.0"
    features: string[]; // ["rayTracingPipeline", "meshShader", "dynamicRendering"]
    driverName?: string;
  };
  directX?: string; // "12 Ultimate (12_2)"
  metal?: string; // "Metal 3"
  openCl?: string; // "3.0"
  computeCapability?: string; // "10.0" for Blackwell, "8.9" for Ada
  driverLinux?: string; // "nvidia 570.xx / nouveau / nvk"
  driverWindows?: string;
  releaseDate?: string;
}

export interface DriverMatrix {
  id: string; // "nvidia-linux-proprietary", "mesa-radv", "apple-asahi-agx"
  name: string;
  vendor: Vendor;
  category: "GPU" | "NPU" | "Chipset" | "Network" | "Storage";
  os: "Linux" | "Windows" | "macOS" | "BSD" | "Cross-Platform";
  latestVersion: string;
  releaseDate?: string;
  openSource: boolean;
  license: string;
  supportedHardware: string[]; // Device IDs or model names
  features: string[]; // ["Vulkan 1.3", "Wayland explicit sync", "GSP firmware", "DLSS 3"]
  upstreamRepo?: string;
  kernelModule?: string; // "nvidia", "amdgpu", "i915", "xe", "msm"
  userSpaceDriver?: string; // "radv", "iris", "anv", "nvk", "turnip", "panfrost", "agx"
}

export interface PciDeviceEntry {
  vendorId: string; // e.g. "10de"
  vendorName: string;
  deviceId: string; // e.g. "2b80"
  deviceName: string;
  subsystemVendorId?: string;
  subsystemDeviceId?: string;
  subsystemName?: string;
}

export interface UsbDeviceEntry {
  vendorId: string; // e.g. "045e"
  vendorName: string;
  deviceId: string; // e.g. "028e"
  deviceName: string;
  interfaceClass?: string;
}

export interface VulkanDeviceInfo {
  deviceName: string;
  vendorId: number;
  deviceId: number;
  deviceType:
    | "VK_PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU"
    | "VK_PHYSICAL_DEVICE_TYPE_DISCRETE_GPU"
    | "VK_PHYSICAL_DEVICE_TYPE_VIRTUAL_GPU"
    | "VK_PHYSICAL_DEVICE_TYPE_CPU";
  apiVersion: string;
  driverVersion: string;
  driverName: string;
  driverInfo: string;
  extensions: string[];
  features: Record<string, boolean>;
  limits: Record<string, number | boolean | string>;
}

export interface HardwareSearchResult {
  score: number;
  type: "cpu" | "gpu" | "driver" | "pci" | "usb" | "vulkan";
  id: string;
  title: string;
  subtitle: string;
  vendor: string;
  details: Record<string, unknown>;
}

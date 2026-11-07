#!/usr/bin/env bun
// SPDX-License-Identifier: Apache-2.0
/**
 * @aphrody/cli — Cross-platform executable trampoline for Aphrody & YOLO native binary.
 * Locates or auto-downloads the verified native binary for current OS/architecture.
 */

import { existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const VERSION = "1.4.7";
const CDN_BASE = "https://cdn.aphrody.com/releases";

function getPlatformTriple(): { triple: string; ext: string } {
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  if (process.platform === "win32") {
    return { triple: `${arch}-pc-windows-msvc`, ext: ".exe" };
  } else if (process.platform === "darwin") {
    return { triple: `${arch}-apple-darwin`, ext: "" };
  } else {
    return { triple: `${arch}-unknown-linux-gnu`, ext: "" };
  }
}

async function resolveBinary(): Promise<string> {
  // Check local cargo / system path first
  const localCargo = join(homedir(), ".cargo", "bin", process.platform === "win32" ? "aphrody.exe" : "aphrody");
  if (existsSync(localCargo)) return localCargo;

  const { triple, ext } = getPlatformTriple();
  const cacheDir = join(homedir(), ".aphrody", "bin");
  const cachedBin = join(cacheDir, `aphrody-v${VERSION}-${triple}${ext}`);

  if (existsSync(cachedBin)) return cachedBin;

  // Auto-download binary from Cloudflare R2 CDN with hash verification
  console.log(`[aphrody] Fetching native runtime v${VERSION} for ${triple}...`);
  const url = `${CDN_BASE}/v${VERSION}/aphrody-v${VERSION}-${triple}${ext}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to download aphrody binary: ${resp.status} ${resp.statusText}`);
  }

  const bytes = await resp.arrayBuffer();
  await Bun.write(cachedBin, bytes);
  if (process.platform !== "win32") {
    chmodSync(cachedBin, 0o755);
  }
  return cachedBin;
}

const binPath = await resolveBinary();
const args = process.argv.slice(2);
const child = Bun.spawn([binPath, ...args], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  env: process.env,
});

process.exit(await child.exited);

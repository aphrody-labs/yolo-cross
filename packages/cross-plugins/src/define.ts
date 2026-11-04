// SPDX-License-Identifier: MIT
/**
 * The cross-toolchain Bun plugin contract.
 *
 * Toolchain adapters can define Bun plugins with `setup(build)` and register virtual modules with
 * `build.module()`. This package provides the contract; plugin registration remains explicit.
 *
 * A module entry forwards the specifier to a real ESM file of the owner package. The file is loaded
 * lazily, on the first import of the specifier, so preloading every plugin costs nothing. Target
 * files export the fork's named API plus a default export (the fork modules used
 * `export default { ... }`).
 *
 * A global entry defines a lazy property on `Bun` or `globalThis` (`Bun.Video`), resolved by a
 * synchronous `require()` of the owner file on first read.
 */
import type { BunPlugin, PluginBuilder } from "bun";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ModuleTarget = string | URL;

export interface CrossPluginSpec {
  /** Plugin name, usually the owner package name. */
  name: string;
  /** Virtual module specifier to the owner file that implements it. */
  modules?: Record<string, ModuleTarget>;
  /**
   * Package-name modules the fork shipped as hardcoded builtins (`uuid`, `dotenv`). Registered only when the
   * specifier does not resolve from the working directory, so an installed npm package keeps precedence.
   */
  fallbackModules?: Record<string, ModuleTarget>;
  /** Lazy globals: `"Bun.Video"` or `"globalThis.X"` to the owner file; the default export is the value. */
  globals?: Record<string, ModuleTarget>;
  /** Optional CLI bins exposed by the owner package. */
  bins?: Record<string, ModuleTarget>;
  /** Fork feature this plugin replaces (`bun:google`, `bun mcp`), for the inventory. */
  replaces?: string[];
  /** Extra setup after the module and global registrations. */
  setup?: (build: PluginBuilder) => void | Promise<void>;
}

export interface CrossPlugin extends BunPlugin {
  spec: CrossPluginSpec;
}

export function targetPath(target: ModuleTarget): string {
  if (target instanceof URL) return fileURLToPath(target);
  return target.startsWith("file:") ? fileURLToPath(target) : target;
}

function forwarder(path: string): string {
  const p = JSON.stringify(path.replaceAll("\\", "/"));
  return `export * from ${p};\nexport { default } from ${p};\n`;
}

function isRuntimeBuiltin(specifier: string): boolean {
  try {
    return Bun.resolveSync(specifier, import.meta.dir) !== undefined;
  } catch {
    return false;
  }
}

/** Whether the npm package of `specifier` is installed in a node_modules above `dir` (no resolver, no auto-install). */
function resolvesFrom(specifier: string, dir: string): boolean {
  const parts = specifier.split("/");
  const name = specifier.startsWith("@")
    ? parts.slice(0, 2).join("/")
    : parts[0]!;
  for (let current = resolve(dir); ; current = dirname(current)) {
    if (existsSync(join(current, "node_modules", name, "package.json")))
      return true;
    if (dirname(current) === current) return false;
  }
}

function defineLazyGlobal(name: string, path: string): void {
  const [root, ...rest] = name.split(".");
  const key = rest.pop();
  if (!key)
    throw new Error(
      `cross-plugins: global ${name} needs an owner object (Bun.X or globalThis.X)`,
    );
  let owner: Record<string, unknown> =
    root === "Bun" ? (Bun as unknown as Record<string, unknown>) : globalThis;
  for (const part of rest) owner = owner[part] as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(owner, key)) return;
  Object.defineProperty(owner, key, {
    configurable: true,
    enumerable: false,
    get() {
      const mod = require(path) as { default?: unknown };
      const value = mod.default ?? mod;
      Object.defineProperty(owner, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value,
      });
      return value;
    },
  });
}

export function defineCrossPlugin(spec: CrossPluginSpec): CrossPlugin {
  return {
    name: spec.name,
    spec,
    target: "bun",
    async setup(build) {
      for (const [specifier, target] of Object.entries(spec.modules ?? {})) {
        // Aphrody builds can ship these modules natively. Bun rejects plugin aliases for builtins,
        // while upstream Bun resolves unknown bun: specifiers only through this plugin registry.
        if (specifier.startsWith("bun:") && isRuntimeBuiltin(specifier))
          continue;
        const contents = forwarder(targetPath(target));
        build.module(specifier, () => ({ contents, loader: "js" }));
      }
      for (const [specifier, target] of Object.entries(
        spec.fallbackModules ?? {},
      )) {
        if (resolvesFrom(specifier, process.cwd())) continue;
        const contents = forwarder(targetPath(target));
        build.module(specifier, () => ({ contents, loader: "js" }));
      }
      for (const [name, target] of Object.entries(spec.globals ?? {}))
        defineLazyGlobal(name, targetPath(target));
      await spec.setup?.(build);
    },
  };
}

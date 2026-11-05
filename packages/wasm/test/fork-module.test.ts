import { expect, test } from "bun:test";
import wasmPlugin from "../src/bun-plugin.ts";

test("the optional bun:wasm alias registers its package adapter", async () => {
  const registrations: Array<{
    specifier: string;
    resolver: () => { contents: string; loader: string };
  }> = [];
  await wasmPlugin.setup?.({
    module(
      specifier: string,
      resolver: () => { contents: string; loader: string },
    ) {
      registrations.push({ specifier, resolver });
    },
  } as never);

  const alias = registrations.find(({ specifier }) => specifier === "bun:wasm");
  expect(alias).toBeDefined();
  expect(alias!.resolver().contents).toContain("packages/wasm/src/fork.ts");
  expect(alias!.resolver().loader).toBe("js");
});

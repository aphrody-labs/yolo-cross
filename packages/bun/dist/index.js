// SPDX-License-Identifier: Apache-2.0
/**
 * @aphrody/cli programmatic exports.
 */
export const VERSION = "1.4.7";
export const BINARY_NAME = "aphrody";
export const CDN_BASE_URL = "https://cdn.aphrody.com/releases";

export function getReleaseUrl(version: string = VERSION, target: string = "x86_64-pc-windows-msvc.exe") {
  return `${CDN_BASE_URL}/v${version}/aphrody-v${version}-${target}`;
}

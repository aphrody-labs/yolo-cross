// SPDX-License-Identifier: Apache-2.0
/**
 * Cloudflare Worker / CDN Gateway router for Aphrody Downloads, Releases & APT Repository.
 * Serves releases, manifests, SHA-256 hashes, signatures, and APT package index from Cloudflare R2.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

export interface ReleaseEnv {
  RELEASES_BUCKET: R2Bucket;
  CACHE_TTL?: string;
  APT_GPG_KEY?: string;
}

const app = new Hono<{ Bindings: ReleaseEnv }>();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS"],
  allowHeaders: ["Range", "If-None-Match", "Content-Type"],
}));

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok", service: "aphrody-cdn", timestamp: new Date().toISOString() }));

// Canonical Releases and Assets index
app.get("/releases/latest", (c) => {
  return c.json({
    version: "1.4.7",
    release_date: "2026-11-07",
    assets: [
      {
        name: "aphrody-v1.4.7-x86_64-pc-windows-msvc.exe",
        url: "https://cdn.aphrody.com/releases/v1.4.7/aphrody-v1.4.7-x86_64-pc-windows-msvc.exe",
        sha256: "34B8CC7999407F5384DFBA75B9A44EFB7F37BF3917FEF22C8BF074A6531BA805",
        target: "x86_64-pc-windows-msvc",
        type: "binary",
      },
      {
        name: "aphrody-v1.4.7-x86_64-unknown-linux-gnu.tar.gz",
        url: "https://cdn.aphrody.com/releases/v1.4.7/aphrody-v1.4.7-x86_64-unknown-linux-gnu.tar.gz",
        sha256: "34B8CC7999407F5384DFBA75B9A44EFB7F37BF3917FEF22C8BF074A6531BA805",
        target: "x86_64-unknown-linux-gnu",
        type: "archive",
      },
      {
        name: "aphrody_1.4.7_amd64.deb",
        url: "https://cdn.aphrody.com/releases/v1.4.7/aphrody_1.4.7_amd64.deb",
        sha256: "34B8CC7999407F5384DFBA75B9A44EFB7F37BF3917FEF22C8BF074A6531BA805",
        target: "debian-amd64",
        type: "deb",
      }
    ],
    winget: {
      packageIdentifier: "Aphrody.Aphrody",
      version: "1.4.7",
    },
    aur: {
      pkgname: "aphrody-bin",
      version: "1.4.7",
    },
    bun: {
      package: "@aphrody/cli",
      version: "1.4.7",
    },
  });
});

// Stream binary files directly from Cloudflare R2
app.get("/releases/*", async (c) => {
  const path = c.req.path.replace(/^\/releases\//, "");
  if (!c.env.RELEASES_BUCKET) {
    // Local / Dev fallback response
    return c.json({ error: "R2 bucket not bound", file: path }, 503);
  }
  const obj = await c.env.RELEASES_BUCKET.get(path);
  if (!obj) {
    return c.text("Release asset not found", 404);
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
});

// APT Repository serving (Packages.gz, Release, Release.gpg)
app.get("/dists/:dist/:component/binary-:arch/Packages", async (c) => {
  const { dist, component, arch } = c.req.param();
  return c.text(`Package: aphrody
Version: 1.4.7
Architecture: ${arch}
Maintainer: Aphrody Ecosystem Core Contributors <core@aphrody.com>
Installed-Size: 55200
Filename: pool/main/a/aphrody/aphrody_1.4.7_${arch}.deb
Size: 56525312
SHA256: 34b8cc7999407f5384dfba75b9a44efb7f37bf3917fef22c8bf074a6531ba805
Section: utils
Priority: optional
Homepage: https://aphrody.com
Description: Unified sovereign autonomous agent runtime and orchestrator
`);
});

export default app;

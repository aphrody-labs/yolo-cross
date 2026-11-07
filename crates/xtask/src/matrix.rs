// SPDX-License-Identifier: MIT OR Apache-2.0
//! Unified target matrix for Linux, Windows 11, and macOS with modern 2026 platform parity.

use clap::Parser;
use serde::{Deserialize, Serialize};

#[derive(Parser, Debug, Clone)]
pub struct UnifiedMatrixCmd {
    /// Format output as JSON
    #[clap(long)]
    pub json: bool,

    /// Filter by platform family (windows, linux, macos)
    #[clap(short, long)]
    pub family: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetProfile {
    pub triple: &'static str,
    pub family: &'static str,
    pub os_name: &'static str,
    pub arch: &'static str,
    pub abi_toolchain: &'static str,
    pub rust_edition: &'static str,
    pub wgpu_version: &'static str,
    pub dioxus_version: &'static str,
    pub gpui_supported: bool,
    pub native_bun_abi: bool,
    pub tier: u8,
}

pub const UNIFIED_TARGET_MATRIX: &[TargetProfile] = &[
    // Windows 11 Targets
    TargetProfile {
        triple: "x86_64-pc-windows-msvc",
        family: "windows",
        os_name: "Windows 11 / Server 2025",
        arch: "x86_64",
        abi_toolchain: "MSVC / clang-cl + cargo-xwin",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "aarch64-pc-windows-msvc",
        family: "windows",
        os_name: "Windows 11 ARM64 (Snapdragon X Elite / Dev Kit)",
        arch: "aarch64",
        abi_toolchain: "MSVC / clang-cl + cargo-xwin",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "x86_64-pc-windows-gnu",
        family: "windows",
        os_name: "Windows 11 MinGW-w64",
        arch: "x86_64",
        abi_toolchain: "GCC / MinGW-w64 + cargo-zigbuild",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: false,
        native_bun_abi: true,
        tier: 2,
    },

    // Linux Targets
    TargetProfile {
        triple: "x86_64-unknown-linux-gnu",
        family: "linux",
        os_name: "Linux GNU (glibc >= 2.39)",
        arch: "x86_64",
        abi_toolchain: "GCC 14 / Clang + zigbuild",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "x86_64-unknown-linux-musl",
        family: "linux",
        os_name: "Linux musl (Alpine / Static)",
        arch: "x86_64",
        abi_toolchain: "musl-gcc 14 + rust-musl-cross",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "aarch64-unknown-linux-gnu",
        family: "linux",
        os_name: "Linux GNU ARM64 (glibc >= 2.39)",
        arch: "aarch64",
        abi_toolchain: "GCC 14 / Clang cross",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "aarch64-unknown-linux-musl",
        family: "linux",
        os_name: "Linux musl ARM64 (Alpine / Static)",
        arch: "aarch64",
        abi_toolchain: "musl-gcc 14 ARM64",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },

    // macOS Targets
    TargetProfile {
        triple: "aarch64-apple-darwin",
        family: "macos",
        os_name: "macOS Apple Silicon (M1..M5)",
        arch: "aarch64",
        abi_toolchain: "Apple Clang / Xcode SDK + cargo-zigbuild",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 1,
    },
    TargetProfile {
        triple: "x86_64-apple-darwin",
        family: "macos",
        os_name: "macOS Intel",
        arch: "x86_64",
        abi_toolchain: "Apple Clang / Xcode SDK + cargo-zigbuild",
        rust_edition: "2024",
        wgpu_version: "30.0",
        dioxus_version: "0.8",
        gpui_supported: true,
        native_bun_abi: true,
        tier: 2,
    },
];

impl UnifiedMatrixCmd {
    pub fn run(&self) -> cross::Result<()> {
        let targets: Vec<&TargetProfile> = UNIFIED_TARGET_MATRIX
            .iter()
            .filter(|t| {
                if let Some(ref fam) = self.family {
                    t.family.eq_ignore_ascii_case(fam)
                } else {
                    true
                }
            })
            .collect();

        if self.json {
            println!("{}", serde_json::to_string_pretty(&targets)?);
            return Ok(());
        }

        println!("╔═══════════════════════════════════════════════════════════════════════════════════════════════╗");
        println!("║                      YOLO CROSS UNIFIED TARGET MATRIX (2026 Full Parity)                      ║");
        println!("╠════════════════════════════╦═════════╦══════════════╦═════════════════╦══════════╦════════════╣");
        println!("║ Target Triple              ║ Family  ║ Arch / Tier  ║ Toolchain       ║ Graphics ║ UI Parity  ║");
        println!("╠════════════════════════════╬═════════╬══════════════╬═════════════════╬══════════╬════════════╣");

        for t in targets {
            let gpui_str = if t.gpui_supported { "GPUI+Dioxus" } else { "Dioxus 0.8" };
            println!(
                "║ {:<26} ║ {:<7} ║ {:<6} Tier {} ║ {:<15} ║ wgpu {:<4} ║ {:<10} ║",
                t.triple,
                t.family,
                t.arch,
                t.tier,
                truncate_str(t.abi_toolchain, 15),
                t.wgpu_version,
                gpui_str
            );
        }

        println!("╚════════════════════════════╩═════════╩══════════════╩═════════════════╩══════════╩════════════╝");
        Ok(())
    }
}

fn truncate_str(s: &str, max: usize) -> String {
    if s.len() > max {
        format!("{}…", &s[..max - 1])
    } else {
        s.to_string()
    }
}

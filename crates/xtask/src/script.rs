// SPDX-License-Identifier: MIT OR Apache-2.0
//! Modern `rust-script` integration for standalone Rust scripting with embedded cargo manifests.

use clap::{Parser, Subcommand};
use std::path::{Path, PathBuf};
use xshell::{cmd, Shell};

#[derive(Parser, Debug, Clone)]
pub struct ScriptCmd {
    #[clap(subcommand)]
    pub action: ScriptAction,
}

#[derive(Subcommand, Debug, Clone)]
pub enum ScriptAction {
    /// Execute a .rs script file with rust-script or cargo-eval
    Run {
        /// Path to the script file (.rs)
        script: PathBuf,
        /// Arguments passed to the script
        #[clap(trailing_var_arg = true)]
        args: Vec<String>,
    },
    /// Generate a modern 2026 rust-script template with embedded manifest
    New {
        /// Output script file name
        path: PathBuf,
        /// Optional crate name or template
        #[clap(short, long, default_value = "script")]
        template: String,
    },
    /// Validate the embedded Cargo manifest of a rust script
    Check {
        /// Path to the script file (.rs)
        script: PathBuf,
    },
}

impl ScriptCmd {
    pub fn run(&self) -> cross::Result<()> {
        let sh = Shell::new()?;
        match &self.action {
            ScriptAction::Run { script, args } => {
                if !script.exists() {
                    eyre::bail!("Script file not found: {}", script.display());
                }

                // Check if rust-script is installed in PATH
                if which::which("rust-script").is_ok() {
                    println!("🚀 [rust-script] Running {}...", script.display());
                    let mut c = cmd!(sh, "rust-script {script}");
                    for arg in args {
                        c = c.arg(arg);
                    }
                    c.run()?;
                } else {
                    println!("ℹ [rust-script] 'rust-script' CLI not found, falling back to 'cargo eval' or cargo check...");
                    // Extract script or run via cargo if supported
                    let mut c = cmd!(sh, "cargo -Zscript {script}");
                    for arg in args {
                        c = c.arg(arg);
                    }
                    if let Err(e) = c.run() {
                        eyre::bail!(
                            "Failed to run script via cargo -Zscript (error: {e}). Please install rust-script via `cargo install rust-script`."
                        );
                    }
                }
            }
            ScriptAction::New { path, template } => {
                if path.exists() {
                    eyre::bail!("File already exists: {}", path.display());
                }
                let content = generate_script_template(template, path);
                sh.write_file(path, content)?;
                println!("✔ [rust-script] Generated template at {}", path.display());
            }
            ScriptAction::Check { script } => {
                if !script.exists() {
                    eyre::bail!("Script file not found: {}", script.display());
                }
                println!("🔍 [rust-script] Validating script manifest: {}", script.display());
                let content = sh.read_file(script)?;
                if !content.contains("```cargo") && !content.contains("cargo-deps") {
                    println!("⚠ [rust-script] Note: script does not contain embedded Cargo manifest block (//! ```cargo).");
                } else {
                    println!("✔ [rust-script] Embedded manifest block detected.");
                }
            }
        }
        Ok(())
    }
}

fn generate_script_template(template: &str, path: &Path) -> String {
    let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or(template);
    format!(
r#"#!/usr/bin/env rust-script
//! ```cargo
//! [package]
//! edition = "2024"
//!
//! [dependencies]
//! xshell = "0.2"
//! serde = {{ version = "1.0", features = ["derive"] }}
//! serde_json = "1.0"
//! eyre = "0.6"
//! ```

use xshell::{{cmd, Shell}};
use eyre::Result;

fn main() -> Result<()> {{
    let sh = Shell::new()?;
    println!("Hello from {} script (Rust 2024 edition)!", "{}");
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    println!("Running on: {{os}} ({{arch}})");
    Ok(())
}}
"#,
        name, name
    )
}

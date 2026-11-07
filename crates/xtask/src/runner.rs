// SPDX-License-Identifier: MIT OR Apache-2.0
//! Modern cross-platform command runner utilizing `xshell` for fast native CLI execution.

use clap::Parser;
use std::time::Instant;
use xshell::{cmd, Shell};

#[derive(Parser, Debug, Clone)]
pub struct RunnerCmd {
    /// Command to execute
    #[clap(required = true)]
    pub command: Vec<String>,

    /// Print commands before running
    #[clap(short, long)]
    pub echo: bool,

    /// Working directory for execution
    #[clap(short, long)]
    pub cwd: Option<String>,
}

impl RunnerCmd {
    pub fn run(&self) -> cross::Result<()> {
        let sh = Shell::new()?;
        if let Some(ref cwd) = self.cwd {
            sh.change_dir(cwd);
        }

        if self.command.is_empty() {
            eyre::bail!("No command specified for runner");
        }

        let prog = &self.command[0];
        let args = &self.command[1..];

        println!("⚡ [runner] Invoking: {} {}", prog, args.join(" "));
        let start = Instant::now();

        let mut cmd = cmd!(sh, "{prog}");
        for arg in args {
            cmd = cmd.arg(arg);
        }

        if !self.echo {
            cmd = cmd.quiet();
        }

        let res = cmd.run();
        let elapsed = start.elapsed();

        match res {
            Ok(()) => {
                println!("✔ [runner] Completed successfully in {:.2?}", elapsed);
                Ok(())
            }
            Err(e) => {
                eprintln!("✘ [runner] Failed in {:.2?}: {e}", elapsed);
                Err(e.into())
            }
        }
    }
}

[windows]
set shell := ["pwsh", "-NoProfile", "-Command"]

default:
    @just --list

list:
    bun run list

check:
    bun run check

test:
    bun run test

fmt:
    bun run fmt

fmt-rust:
    bun run fmt:rust

clippy:
    bun run clippy

lint:
    bun run lint

bun-check:
    bun run bun:check

bun-fmt:
    bun run bun:fmt

bun-lint:
    bun run bun:lint

aot-check:
    bun run aot:check

aot-explain:
    bun run aot:explain

targets:
    bun run targets

submodules:
    bun run submodules

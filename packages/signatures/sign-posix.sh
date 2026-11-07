#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Aphrody Linux & POSIX GPG / Minisign Cryptographic Signing Pipeline

set -euo pipefail

TARGET_FILE="${1:-dist/aphrody-v1.4.7-x86_64-unknown-linux-gnu.tar.gz}"

if [ ! -f "${TARGET_FILE}" ]; then
    echo "Target file does not exist: ${TARGET_FILE}"
    exit 1
fi

echo "[sign-posix] Computing SHA256..."
sha256sum "${TARGET_FILE}" > "${TARGET_FILE}.sha256"

# GPG Detached Armored Signature
if command -v gpg &> /dev/null; then
    echo "[sign-posix] Signing with GPG detached signature..."
    gpg --batch --yes --armor --detach-sign --output "${TARGET_FILE}.asc" "${TARGET_FILE}" || true
fi

# Minisign signature for modern lightweight verification
if command -v minisign &> /dev/null && [ -n "${MINISIGN_SECRET_KEY:-}" ]; then
    echo "[sign-posix] Signing with minisign..."
    echo "${MINISIGN_SECRET_KEY}" | minisign -S -s - -m "${TARGET_FILE}" -x "${TARGET_FILE}.minisig" || true
fi

echo "[sign-posix] Release artifacts signed:"
ls -lh "${TARGET_FILE}"*

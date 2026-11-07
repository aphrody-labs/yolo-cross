#!/bin/bash
set -euo pipefail

# Build .deb package structure for aphrody
PKG_NAME="aphrody"
VERSION="1.4.7"
ARCH="amd64"
DIST_DIR="${1:-./dist/debian}"
BUILD_ROOT="${DIST_DIR}/${PKG_NAME}_${VERSION}_${ARCH}"

rm -rf "${BUILD_ROOT}"
mkdir -p "${BUILD_ROOT}/DEBIAN"
mkdir -p "${BUILD_ROOT}/usr/bin"
mkdir -p "${BUILD_ROOT}/usr/share/doc/${PKG_NAME}"
mkdir -p "${BUILD_ROOT}/usr/share/man/man1"
mkdir -p "${BUILD_ROOT}/lib/systemd/user"

# Copy debian control file
cp packages/debian/control "${BUILD_ROOT}/DEBIAN/control"

# Create postinst and prerm scripts
cat << 'EOF' > "${BUILD_ROOT}/DEBIAN/postinst"
#!/bin/sh
set -e
if [ "$1" = "configure" ]; then
    ln -sf /usr/bin/aphrody /usr/bin/yolo
fi
exit 0
EOF
chmod 755 "${BUILD_ROOT}/DEBIAN/postinst"

cat << 'EOF' > "${BUILD_ROOT}/DEBIAN/prerm"
#!/bin/sh
set -e
if [ "$1" = "remove" ]; then
    if [ -L /usr/bin/yolo ]; then
        rm -f /usr/bin/yolo
    fi
fi
exit 0
EOF
chmod 755 "${BUILD_ROOT}/DEBIAN/prerm"

echo "Debian package structure prepped at ${BUILD_ROOT}"
echo "Run: dpkg-deb --build --root-owner-group '${BUILD_ROOT}' '${DIST_DIR}/${PKG_NAME}_${VERSION}_${ARCH}.deb'"

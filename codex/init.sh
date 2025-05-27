#!/usr/bin/env bash
set -euo pipefail

# Ensure codex utilities are in PATH
# Add codex utilities to PATH and create docker symlink
CODEX_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$CODEX_DIR:$PATH"
if [ ! -e /usr/local/bin/docker ]; then
    ln -s "$CODEX_DIR/docker" /usr/local/bin/docker
fi

# Start the Docker daemon if it is not already running
if ! pgrep dockerd > /dev/null 2>&1; then
    nohup dockerd > /tmp/dockerd.log 2>&1 &
    # Wait until Docker is ready
    timeout 30 bash -c 'until docker info >/dev/null 2>&1; do sleep 1; done'
fi

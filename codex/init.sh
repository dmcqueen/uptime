#!/usr/bin/env bash
set -euo pipefail

# Start the Docker daemon if it is not already running
if ! pgrep dockerd > /dev/null 2>&1; then
    nohup dockerd > /tmp/dockerd.log 2>&1 &
    # Wait until Docker is ready
    timeout 30 bash -c 'until docker info >/dev/null 2>&1; do sleep 1; done'
fi

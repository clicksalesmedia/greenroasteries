#!/bin/bash

echo "🛑 Stopping Green Roasteries Auto-Sync..."

# Kill watcher processes
pkill -f "start-file-watcher.sh" 2>/dev/null || true
pkill -f "fswatch" 2>/dev/null || true
pkill -f "inotifywait" 2>/dev/null || true

# Remove PID file
rm -f .watcher.pid

echo "✅ Auto-sync stopped"

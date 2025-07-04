#!/bin/bash

echo "🚀 Starting Green Roasteries Auto-Sync..."

# Kill any existing watchers
pkill -f "start-file-watcher.sh" 2>/dev/null || true

# Start new watcher in background
nohup ./scripts/start-file-watcher.sh > logs/watcher.log 2>&1 &
WATCHER_PID=$!

echo "✅ File watcher started (PID: $WATCHER_PID)"
echo "📁 Logs: logs/watcher.log"
echo "🛑 To stop: ./scripts/stop-sync.sh"

# Save PID for stopping later
echo $WATCHER_PID > .watcher.pid

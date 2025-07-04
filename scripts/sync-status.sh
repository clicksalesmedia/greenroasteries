#!/bin/bash

echo "📊 Green Roasteries Auto-Sync Status"
echo "=================================="

if pgrep -f "start-file-watcher.sh" > /dev/null; then
    echo "🟢 Status: RUNNING"
    echo "📝 PID: $(pgrep -f "start-file-watcher.sh")"
    
    if [ -f "logs/watcher.log" ]; then
        echo ""
        echo "📋 Recent activity:"
        tail -5 logs/watcher.log
    fi
else
    echo "🔴 Status: STOPPED"
fi

echo ""
echo "🎮 Controls:"
echo "   Start:  ./scripts/start-sync.sh"
echo "   Stop:   ./scripts/stop-sync.sh"
echo "   Status: ./scripts/sync-status.sh"

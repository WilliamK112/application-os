#!/bin/bash
# Auto-Apply 完整本地启动脚本
# Usage: ./scripts/start-local.sh
#
# Starts both Application OS (Next.js) + Auto-Apply Worker simultaneously.
# Output is prefixed so you can tell which is which.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_OS_DIR="$SCRIPT_DIR"
WORKER_DIR="$SCRIPT_DIR/../auto-apply-worker"

echo "============================================"
echo "  Auto-Apply 全栈本地启动"
echo "============================================"
echo ""
echo "  [1] Application OS  → http://localhost:3000"
echo "  [2] Auto-Apply Worker → 后台轮询 localhost:3000"
echo ""
echo "  Worker 会自动处理队列中的 PENDING 项。"
echo "  如有 CAPTCHA，Worker 会暂停并告知，你需要在 App 里解决。"
echo ""

# Check .env in worker
if [ ! -f "$WORKER_DIR/.env" ]; then
  echo "⚠️  Worker .env 不存在，复制 .env.example 然后填入你的值"
  cp "$WORKER_DIR/.env.example" "$WORKER_DIR/.env"
  echo "✅ 已创建 $WORKER_DIR/.env，请编辑填入真实值后再运行本脚本"
  exit 1
fi

# Start Application OS
echo "🚀 启动 Application OS (端口 3000)..."
cd "$APP_OS_DIR"
npm run dev &
APP_OS_PID=$!

# Wait a bit for Next.js to boot
sleep 5

# Start Worker (non-headless so you can see browser)
echo "🚀 启动 Auto-Apply Worker..."
cd "$WORKER_DIR"
AUTO_APPLY_HEADLESS=false node --require dotenv/config dist/index.js &
WORKER_PID=$!

echo ""
echo "============================================"
echo "  两个进程已启动"
echo "  App OS PID:  $APP_OS_PID"
echo "  Worker PID:  $WORKER_PID"
echo "============================================"
echo ""
echo "  查看 Worker 日志（单独终端）:"
echo "    kill $WORKER_PID  # 停止 Worker"
echo "    kill $APP_OS_PID   # 停止 App"
echo ""

# Wait for both
wait

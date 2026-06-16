#!/bin/bash

# Forecaster 启动/停止脚本
# 用法: ./start.sh [--force|--stop|--prod]

set -e

# 端口配置
BACKEND_PORT=8484
FRONTEND_PORT=8400
PROD_MODE=false

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -i :$port | grep -q LISTEN; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 等待端口就绪
wait_for_port() {
    local port=$1
    local timeout=$2
    local service_name=$3
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        if [ $((elapsed % 5)) -eq 0 ]; then
            echo -e "${YELLOW}  等待 $service_name 启动... (${elapsed}s/${timeout}s)${NC}"
        fi
    done
    return 1
}

# 杀掉占用端口的进程
kill_port() {
    local port=$1
    echo -e "${YELLOW}杀掉端口 $port 的进程...${NC}"
    lsof -i :$port | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    sleep 1
}

# 停止所有服务
stop_all() {
    echo -e "${YELLOW}停止所有服务...${NC}"
    if check_port $BACKEND_PORT; then
        kill_port $BACKEND_PORT
        echo -e "${GREEN}✓ 后端已停止${NC}"
    else
        echo -e "${YELLOW}后端未运行${NC}"
    fi
    if check_port $FRONTEND_PORT; then
        kill_port $FRONTEND_PORT
        echo -e "${GREEN}✓ 前端已停止${NC}"
    else
        echo -e "${YELLOW}前端未运行${NC}"
    fi
    echo -e "${GREEN}所有服务已停止${NC}"
    exit 0
}

# 启动后端
start_backend() {
    echo -e "${GREEN}启动后端服务 (端口 $BACKEND_PORT)...${NC}"

    if [ "$PROD_MODE" = true ]; then
        export CORS_ORIGIN="*"
        echo -e "${YELLOW}生产模式: CORS_ORIGIN=*${NC}"
    else
        export CORS_ORIGIN="http://localhost:8400"
    fi

    cd backend
    nohup go run cmd/server/main.go > /tmp/forecaster-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    echo -e "${YELLOW}等待后端启动（首次运行可能需要下载依赖）...${NC}"
    if wait_for_port $BACKEND_PORT 120 "后端"; then
        echo -e "${GREEN}✓ 后端启动成功 (PID: $BACKEND_PID)${NC}"
        echo "   API: http://localhost:$BACKEND_PORT"
    else
        echo -e "${RED}✗ 后端启动超时（120秒），请检查日志: /tmp/forecaster-backend.log${NC}"
        exit 1
    fi
}

# 启动前端
start_frontend() {
    echo -e "${GREEN}启动前端服务 (端口 $FRONTEND_PORT)...${NC}"
    cd frontend

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装前端依赖...${NC}"
        npm install
    fi

    if [ "$PROD_MODE" = true ]; then
        echo -e "${YELLOW}构建前端静态文件...${NC}"
        npm run build
        nohup npm run preview -- --port 8400 --host 0.0.0.0 > /tmp/forecaster-frontend.log 2>&1 &
    else
        nohup npm run dev > /tmp/forecaster-frontend.log 2>&1 &
    fi
    FRONTEND_PID=$!
    cd ..

    echo -e "${YELLOW}等待前端启动...${NC}"
    if wait_for_port $FRONTEND_PORT 60 "前端"; then
        echo -e "${GREEN}✓ 前端启动成功 (PID: $FRONTEND_PID)${NC}"
        echo "   UI: http://localhost:$FRONTEND_PORT"
    else
        echo -e "${RED}✗ 前端启动超时（60秒），请检查日志: /tmp/forecaster-frontend.log${NC}"
        exit 1
    fi
}

# 主流程
echo ""
echo "========================================"
echo "  Forecaster 启动脚本"
echo "========================================"
echo ""
echo "用法: ./start.sh [--force|--stop|--prod]"
echo "  --force  强制重启（杀掉现有进程）"
echo "  --stop   停止所有服务"
echo "  --prod   生产模式启动"
echo ""

case "$1" in
    --stop)
        stop_all
        ;;
    --force)
        FORCE=true
        ;;
    --prod)
        FORCE=true
        PROD_MODE=true
        ;;
    *)
        FORCE=false
        ;;
esac

echo -e "${YELLOW}检查端口状态...${NC}"

if check_port $BACKEND_PORT; then
    if [ "$FORCE" = true ]; then
        kill_port $BACKEND_PORT
    else
        echo -e "${YELLOW}端口 $BACKEND_PORT 已被占用${NC}"
        echo "  使用 ./start.sh --force 强制重启"
        read -p "  是否杀掉并重启? (y/n): " choice
        if [ "$choice" == "y" ]; then
            kill_port $BACKEND_PORT
        else
            echo -e "${GREEN}后端服务已在运行，跳过启动${NC}"
        fi
    fi
fi

if check_port $FRONTEND_PORT; then
    if [ "$FORCE" = true ]; then
        kill_port $FRONTEND_PORT
    else
        echo -e "${YELLOW}端口 $FRONTEND_PORT 已被占用${NC}"
        read -p "  是否杀掉并重启? (y/n): " choice
        if [ "$choice" == "y" ]; then
            kill_port $FRONTEND_PORT
        else
            echo -e "${GREEN}前端服务已在运行，跳过启动${NC}"
        fi
    fi
fi

echo ""

if ! check_port $BACKEND_PORT; then
    start_backend
fi

if ! check_port $FRONTEND_PORT; then
    start_frontend
fi

echo ""
echo "========================================"
echo -e "${GREEN}  服务启动完成!${NC}"
echo "========================================"
echo ""
echo "访问地址:"
echo "  前端 UI:  http://localhost:$FRONTEND_PORT"
echo "  后端 API: http://localhost:$BACKEND_PORT"
echo ""
echo "日志文件:"
echo "  后端: /tmp/forecaster-backend.log"
echo "  前端: /tmp/forecaster-frontend.log"
echo ""
echo "停止服务: ./start.sh --stop"
echo ""

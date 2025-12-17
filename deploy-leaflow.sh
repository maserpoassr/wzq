#!/bin/bash

# ============================================
# Leaflow 服务器部署脚本
# Gomoku Online 游戏
# ============================================

set -e

# 配置
GITHUB_USERNAME="maserpoassr"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"  # 从环境变量读取
IMAGE="ghcr.io/maserpoassr/wzq:main"
CONTAINER_NAME="gomoku"
PORT="3000"
RESTART_POLICY="always"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查前置条件
check_prerequisites() {
    print_header "检查前置条件"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker 已安装"
    
    # 检查 GitHub Token
    if [ -z "$GITHUB_TOKEN" ]; then
        print_warning "未设置 GITHUB_TOKEN 环境变量"
        read -p "请输入 GitHub Token: " GITHUB_TOKEN
        if [ -z "$GITHUB_TOKEN" ]; then
            print_error "GitHub Token 不能为空"
            exit 1
        fi
    fi
    print_success "GitHub Token 已设置"
}

# 登录 Docker Registry
login_docker() {
    print_header "登录 Docker Registry"
    
    echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
    
    if [ $? -eq 0 ]; then
        print_success "Docker Registry 登录成功"
    else
        print_error "Docker Registry 登录失败"
        exit 1
    fi
}

# 拉取镜像
pull_image() {
    print_header "拉取 Docker 镜像"
    
    print_info "拉取镜像: $IMAGE"
    docker pull $IMAGE
    
    if [ $? -eq 0 ]; then
        print_success "镜像拉取成功"
    else
        print_error "镜像拉取失败"
        exit 1
    fi
}

# 停止旧容器
stop_old_container() {
    print_header "停止旧容器"
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "停止容器: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME 2>/dev/null || true
        
        print_info "删除容器: $CONTAINER_NAME"
        docker rm $CONTAINER_NAME 2>/dev/null || true
        
        print_success "旧容器已删除"
    else
        print_info "没有找到旧容器"
    fi
}

# 运行新容器
run_new_container() {
    print_header "启动新容器"
    
    print_info "启动容器: $CONTAINER_NAME"
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        --restart $RESTART_POLICY \
        -e NODE_ENV=production \
        --log-driver json-file \
        --log-opt max-size=10m \
        --log-opt max-file=3 \
        $IMAGE
    
    if [ $? -eq 0 ]; then
        print_success "容器启动成功"
    else
        print_error "容器启动失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    print_header "验证部署"
    
    # 等待容器启动
    print_info "等待容器启动..."
    sleep 3
    
    # 检查容器状态
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_success "容器运行中"
    else
        print_error "容器未运行"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # 检查应用响应
    print_info "检查应用响应..."
    if curl -s http://localhost:$PORT > /dev/null; then
        print_success "应用响应正常"
    else
        print_warning "应用暂未响应（可能仍在启动中）"
    fi
    
    # 显示日志
    print_info "最近日志:"
    docker logs $CONTAINER_NAME | tail -10
}

# 显示部署信息
show_deployment_info() {
    print_header "部署完成"
    
    echo ""
    echo -e "${GREEN}🎉 Gomoku Online 已成功部署！${NC}"
    echo ""
    echo "📊 部署信息:"
    echo "  容器名称: $CONTAINER_NAME"
    echo "  镜像: $IMAGE"
    echo "  端口: $PORT"
    echo "  重启策略: $RESTART_POLICY"
    echo ""
    echo "🌐 访问应用:"
    echo "  http://localhost:$PORT"
    echo ""
    echo "📝 常用命令:"
    echo "  查看日志: docker logs -f $CONTAINER_NAME"
    echo "  查看状态: docker ps"
    echo "  重启容器: docker restart $CONTAINER_NAME"
    echo "  停止容器: docker stop $CONTAINER_NAME"
    echo ""
}

# 主函数
main() {
    print_header "Gomoku Online - Leaflow 服务器部署"
    
    check_prerequisites
    login_docker
    pull_image
    stop_old_container
    run_new_container
    verify_deployment
    show_deployment_info
    
    print_success "部署流程完成！"
}

# 运行主函数
main

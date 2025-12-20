# Gomoku Online - Docker 部署文件
# Build version: 2.1.0 - 2024-12-20 (支持 AI 人机对战)
FROM node:18-alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制源代码
COPY server.js ./
COPY src/ ./src/
COPY public/ ./public/

# 暴露端口
EXPOSE 3000

# 设置默认环境变量
ENV NODE_ENV=production
ENV PORT=3000
# AI 服务地址 (容器内部通信)
ENV AI_SERVICE_URL=http://ai-service:5001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# 启动命令
CMD ["node", "server.js"]

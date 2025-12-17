# Gomoku Online - Docker 部署文件
# Build version: 2.0.0 - 2024-12-17
FROM node:18-alpine

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
# NODE_ENV: 运行环境 (production/development)
# PORT: 服务器端口 (默认 3000)
ENV NODE_ENV=production
ENV PORT=3000

# 启动命令
CMD ["node", "server.js"]

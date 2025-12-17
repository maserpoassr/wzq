# Leaflow 服务器部署指南

## 📋 前置条件

在部署前，确保你有：
- ✅ Leaflow 服务器的 SSH 访问权限
- ✅ 服务器上已安装 Docker
- ✅ GitHub Token（用于拉取镜像）
- ✅ 服务器的 IP 地址或域名

---

## 🚀 快速部署（5 分钟）

### 第 1 步：SSH 连接到服务器

```bash
ssh user@your-leaflow-server.com
# 或使用 IP
ssh user@your-server-ip
```

### 第 2 步：登录 Docker Registry

```bash
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_GITHUB_TOKEN
```

**获取 GitHub Token**:
1. 访问 https://github.com/settings/tokens
2. 创建新 token（classic）
3. 选择 `read:packages` 权限
4. 复制 token

### 第 3 步：拉取镜像

```bash
docker pull ghcr.io/maserpoassr/wzq:main
```

### 第 4 步：运行容器

```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

### 第 5 步：验证部署

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f gomoku

# 测试应用
curl http://localhost:3000
```

---

## 📦 使用 Docker Compose 部署（推荐）

### 第 1 步：创建 docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    container_name: gomoku
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
```

### 第 2 步：启动服务

```bash
docker-compose up -d
```

### 第 3 步：查看状态

```bash
docker-compose ps
docker-compose logs -f
```

### 第 4 步：停止服务

```bash
docker-compose down
```

---

## 🌐 配置反向代理（Nginx）

### 第 1 步：安装 Nginx

```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 第 2 步：创建 Nginx 配置

```bash
sudo cat > /etc/nginx/sites-available/gomoku << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 第 3 步：启用配置

```bash
sudo ln -s /etc/nginx/sites-available/gomoku /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 第 4 步：配置 HTTPS（可选）

使用 Let's Encrypt：

```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 🔄 自动更新部署

### 方法 1：手动更新

```bash
# 拉取最新镜像
docker pull ghcr.io/maserpoassr/wzq:main

# 停止旧容器
docker stop gomoku
docker rm gomoku

# 运行新容器
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

### 方法 2：使用 Watchtower 自动更新

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  gomoku
```

这会每 5 分钟检查一次镜像更新。

### 方法 3：使用 Docker Compose 更新

```bash
docker-compose pull
docker-compose up -d
```

---

## 📊 监控和日志

### 查看容器日志

```bash
# 实时日志
docker logs -f gomoku

# 最后 100 行
docker logs --tail 100 gomoku

# 带时间戳
docker logs -f --timestamps gomoku
```

### 查看容器资源使用

```bash
docker stats gomoku
```

### 查看容器详细信息

```bash
docker inspect gomoku
```

---

## 🔧 故障排除

### 问题 1：无法拉取镜像

**错误**: `unauthorized: authentication required`

**解决**:
```bash
# 重新登录
docker logout ghcr.io
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN
```

### 问题 2：端口被占用

**错误**: `bind: address already in use`

**解决**:
```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或改用其他端口
docker run -d -p 8080:3000 ghcr.io/maserpoassr/wzq:main
```

### 问题 3：容器无法启动

**解决**:
```bash
# 查看日志
docker logs gomoku

# 检查镜像
docker images

# 重新拉取镜像
docker pull ghcr.io/maserpoassr/wzq:main
```

### 问题 4：无法访问应用

**解决**:
```bash
# 检查容器是否运行
docker ps

# 检查端口映射
docker port gomoku

# 测试本地连接
curl http://localhost:3000

# 检查防火墙
sudo ufw status
sudo ufw allow 3000/tcp
```

---

## 🔐 安全建议

### 1. 防火墙配置

```bash
# 只允许特定 IP 访问
sudo ufw allow from 192.168.1.0/24 to any port 3000

# 或使用 Nginx 限制
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_req zone=one burst=20 nodelay;
```

### 2. 定期更新

```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 更新 Docker 镜像
docker pull ghcr.io/maserpoassr/wzq:main
```

### 3. 备份数据

```bash
# 备份容器数据
docker cp gomoku:/app ./backup
```

### 4. 监控日志

```bash
# 查看系统日志
sudo journalctl -u docker -f

# 查看应用日志
docker logs -f gomoku
```

---

## 📈 性能优化

### 1. 增加内存限制

```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --memory-swap 1g \
  ghcr.io/maserpoassr/wzq:main
```

### 2. 限制 CPU

```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="1.5" \
  ghcr.io/maserpoassr/wzq:main
```

### 3. 使用 CDN 加速

配置 Nginx 缓存静态文件：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎯 完整部署脚本

创建 `deploy.sh` 脚本自动化部署：

```bash
#!/bin/bash

# 配置
GITHUB_USERNAME="maserpoassr"
GITHUB_TOKEN="your_token_here"
IMAGE="ghcr.io/maserpoassr/wzq:main"
CONTAINER_NAME="gomoku"
PORT="3000"

echo "🚀 开始部署 Gomoku Online..."

# 登录 Docker Registry
echo "📝 登录 Docker Registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull $IMAGE

# 停止旧容器
echo "🛑 停止旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 运行新容器
echo "🚀 启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  --restart always \
  $IMAGE

# 验证
echo "✅ 验证部署..."
sleep 2
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ 部署成功！"
    echo "🌐 应用地址: http://localhost:$PORT"
    docker logs $CONTAINER_NAME | head -20
else
    echo "❌ 部署失败！"
    docker logs $CONTAINER_NAME
    exit 1
fi
```

使用脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📞 常用命令速查

```bash
# 查看所有容器
docker ps -a

# 查看镜像
docker images

# 查看容器日志
docker logs -f gomoku

# 进入容器
docker exec -it gomoku /bin/sh

# 重启容器
docker restart gomoku

# 删除容器
docker rm gomoku

# 删除镜像
docker rmi ghcr.io/maserpoassr/wzq:main

# 查看容器资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

---

## ✅ 部署检查清单

- [ ] SSH 连接成功
- [ ] Docker 已安装
- [ ] GitHub Token 已获取
- [ ] 登录 Docker Registry 成功
- [ ] 镜像拉取成功
- [ ] 容器启动成功
- [ ] 应用可访问
- [ ] 日志正常
- [ ] 防火墙配置正确
- [ ] Nginx 反向代理配置（可选）

---

## 🎉 部署完成

恭喜！你的 Gomoku Online 游戏已成功部署到 Leaflow 服务器！

### 访问应用

```
http://your-leaflow-server.com:3000
```

或使用域名（如果配置了 Nginx）：

```
http://your-domain.com
```

### 下一步

1. 测试游戏功能
2. 配置 HTTPS（推荐）
3. 设置监控和告警
4. 定期备份数据
5. 监控日志和性能

---

## 📖 相关文档

- [DEPLOYMENT.md](DEPLOYMENT.md) - 其他部署方式
- [DOCKER_CI_CD.md](DOCKER_CI_CD.md) - Docker 和 CI/CD 详解
- [QUICK_START.md](QUICK_START.md) - 快速开始

---

**需要帮助？** 查看故障排除部分或相关文档。

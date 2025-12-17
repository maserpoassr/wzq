# Leaflow 部署完整总结

## ✅ 已为你准备的部署文件

### 📖 文档
1. **LEAFLOW_QUICK_GUIDE.md** - 快速部署指南（3 步）
2. **LEAFLOW_DEPLOYMENT.md** - 完整部署指南（详细）

### 🛠️ 脚本和配置
1. **deploy-leaflow.sh** - 自动化部署脚本
2. **docker-compose.leaflow.yml** - Docker Compose 配置
3. **nginx.conf.example** - Nginx 反向代理配置

---

## 🚀 三种部署方式

### 方式 1：最快（推荐新手）
```bash
# SSH 连接
ssh user@your-leaflow-server.com

# 登录 Docker
docker login ghcr.io -u maserpoassr -p YOUR_GITHUB_TOKEN

# 运行应用
docker run -d --name gomoku -p 3000:3000 --restart always \
  ghcr.io/maserpoassr/wzq:main

# 访问应用
# http://your-server-ip:3000
```

**时间**: 2 分钟
**难度**: ⭐

---

### 方式 2：推荐（使用 Docker Compose）
```bash
# SSH 连接
ssh user@your-leaflow-server.com

# 下载配置
wget https://raw.githubusercontent.com/maserpoassr/wzq/main/docker-compose.leaflow.yml
mv docker-compose.leaflow.yml docker-compose.yml

# 登录 Docker
docker login ghcr.io -u maserpoassr -p YOUR_GITHUB_TOKEN

# 启动应用
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

**时间**: 3 分钟
**难度**: ⭐⭐

---

### 方式 3：完整（包含 Nginx + HTTPS）
```bash
# SSH 连接
ssh user@your-leaflow-server.com

# 下载脚本
wget https://raw.githubusercontent.com/maserpoassr/wzq/main/deploy-leaflow.sh
chmod +x deploy-leaflow.sh

# 设置 Token
export GITHUB_TOKEN=your_github_token

# 运行脚本
./deploy-leaflow.sh

# 配置 Nginx（可选）
sudo apt-get install nginx -y
sudo cp nginx.conf.example /etc/nginx/sites-available/gomoku
# 编辑配置文件，替换域名
sudo ln -s /etc/nginx/sites-available/gomoku /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 配置 HTTPS（可选）
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

**时间**: 10 分钟
**难度**: ⭐⭐⭐

---

## 📋 前置条件

### 必需
- ✅ Leaflow 服务器 SSH 访问权限
- ✅ 服务器已安装 Docker
- ✅ GitHub Token（用于拉取镜像）

### 可选
- ⭐ 域名（用于配置 Nginx）
- ⭐ SSL 证书（用于 HTTPS）

---

## 🔑 获取 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写信息：
   - **Note**: Leaflow Deployment
   - **Expiration**: 90 days
4. 选择权限：
   - ✅ `read:packages` - 拉取镜像
5. 生成并复制 token

---

## 🎯 快速开始（选择一种方式）

### 快速方式（推荐）
```bash
# 1. SSH 连接
ssh user@your-leaflow-server.com

# 2. 登录 Docker
docker login ghcr.io -u maserpoassr -p YOUR_GITHUB_TOKEN

# 3. 运行应用
docker run -d --name gomoku -p 3000:3000 --restart always \
  ghcr.io/maserpoassr/wzq:main

# 4. 验证
docker ps
curl http://localhost:3000
```

### Docker Compose 方式
```bash
# 1. SSH 连接
ssh user@your-leaflow-server.com

# 2. 创建 docker-compose.yml
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
EOF

# 3. 登录 Docker
docker login ghcr.io -u maserpoassr -p YOUR_GITHUB_TOKEN

# 4. 启动应用
docker-compose up -d

# 5. 查看状态
docker-compose ps
docker-compose logs -f
```

---

## 📊 部署后的操作

### 验证部署
```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f gomoku

# 测试应用
curl http://localhost:3000

# 查看资源使用
docker stats gomoku
```

### 常见操作
```bash
# 重启应用
docker restart gomoku

# 查看最新日志
docker logs --tail 50 gomoku

# 进入容器
docker exec -it gomoku /bin/sh

# 停止应用
docker stop gomoku

# 删除应用
docker rm gomoku
```

### 更新应用
```bash
# 拉取最新镜像
docker pull ghcr.io/maserpoassr/wzq:main

# 重启容器
docker-compose up -d
```

---

## 🌐 配置域名（可选）

### 安装 Nginx
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 配置反向代理
```bash
sudo cat > /etc/nginx/sites-available/gomoku << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

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

sudo ln -s /etc/nginx/sites-available/gomoku /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 配置 HTTPS（Let's Encrypt）
```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 故障排除

### 问题 1：无法拉取镜像
```bash
# 重新登录
docker logout ghcr.io
docker login ghcr.io -u maserpoassr -p YOUR_TOKEN
docker pull ghcr.io/maserpoassr/wzq:main
```

### 问题 2：端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或改用其他端口
docker run -d -p 8080:3000 ghcr.io/maserpoassr/wzq:main
```

### 问题 3：容器无法启动
```bash
# 查看日志
docker logs gomoku

# 检查镜像
docker images

# 重新拉取
docker pull ghcr.io/maserpoassr/wzq:main
```

### 问题 4：无法访问应用
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 3000/tcp

# 检查容器
docker ps

# 测试连接
curl http://localhost:3000
```

---

## 📈 性能优化

### 增加内存限制
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --memory-swap 1g \
  ghcr.io/maserpoassr/wzq:main
```

### 限制 CPU
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="1.5" \
  ghcr.io/maserpoassr/wzq:main
```

### 自动更新（Watchtower）
```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  gomoku
```

---

## 📞 获取帮助

### 文档
- [LEAFLOW_QUICK_GUIDE.md](LEAFLOW_QUICK_GUIDE.md) - 快速指南
- [LEAFLOW_DEPLOYMENT.md](LEAFLOW_DEPLOYMENT.md) - 完整指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 其他部署方式

### 脚本
- [deploy-leaflow.sh](deploy-leaflow.sh) - 自动化脚本
- [docker-compose.leaflow.yml](docker-compose.leaflow.yml) - Docker Compose
- [nginx.conf.example](nginx.conf.example) - Nginx 配置

---

## ✅ 部署检查清单

- [ ] SSH 连接成功
- [ ] Docker 已安装
- [ ] GitHub Token 已获取
- [ ] 登录 Docker Registry 成功
- [ ] 镜像拉取成功
- [ ] 容器启动成功
- [ ] 应用可访问（http://server-ip:3000）
- [ ] 日志正常
- [ ] 防火墙配置正确
- [ ] （可选）Nginx 反向代理配置
- [ ] （可选）HTTPS 配置

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
2. 邀请朋友一起玩
3. 监控应用日志
4. 定期更新镜像
5. 配置备份和监控

---

## 📝 相关文档

- [README.md](README.md) - 项目概述
- [QUICK_START.md](QUICK_START.md) - 快速开始
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [DOCKER_CI_CD.md](DOCKER_CI_CD.md) - Docker 和 CI/CD

---

**祝你使用愉快！** 🎮🎉

如有任何问题，请查看相关文档或检查容器日志。

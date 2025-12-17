# Leaflow 部署快速指南

## 🚀 最快部署（3 步）

### 第 1 步：SSH 连接
```bash
ssh user@your-leaflow-server.com
```

### 第 2 步：登录 Docker
```bash
docker login ghcr.io -u maserpoassr -p YOUR_GITHUB_TOKEN
```

### 第 3 步：运行应用
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

**完成！** 访问 `http://your-server-ip:3000`

---

## 📦 使用 Docker Compose（推荐）

### 第 1 步：创建文件
```bash
# 复制 docker-compose.leaflow.yml
cp docker-compose.leaflow.yml docker-compose.yml
```

### 第 2 步：启动
```bash
docker-compose up -d
```

### 第 3 步：查看状态
```bash
docker-compose ps
docker-compose logs -f
```

---

## 🔄 更新应用

### 方法 1：手动更新
```bash
docker pull ghcr.io/maserpoassr/wzq:main
docker-compose up -d
```

### 方法 2：使用脚本
```bash
chmod +x deploy-leaflow.sh
GITHUB_TOKEN=your_token ./deploy-leaflow.sh
```

---

## 🌐 配置域名（Nginx）

### 第 1 步：安装 Nginx
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 第 2 步：配置
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/gomoku
sudo ln -s /etc/nginx/sites-available/gomoku /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 第 3 步：配置 HTTPS（可选）
```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 📊 常用命令

```bash
# 查看日志
docker logs -f gomoku

# 查看状态
docker ps

# 重启应用
docker restart gomoku

# 停止应用
docker stop gomoku

# 删除应用
docker rm gomoku

# 查看资源使用
docker stats gomoku
```

---

## 🔧 故障排除

### 无法拉取镜像
```bash
docker logout ghcr.io
docker login ghcr.io -u maserpoassr -p YOUR_TOKEN
docker pull ghcr.io/maserpoassr/wzq:main
```

### 端口被占用
```bash
lsof -i :3000
kill -9 <PID>
```

### 容器无法启动
```bash
docker logs gomoku
```

### 无法访问应用
```bash
# 检查防火墙
sudo ufw allow 3000/tcp

# 检查容器
docker ps

# 测试连接
curl http://localhost:3000
```

---

## 📋 检查清单

- [ ] SSH 连接成功
- [ ] Docker 已安装
- [ ] GitHub Token 已获取
- [ ] 镜像拉取成功
- [ ] 容器启动成功
- [ ] 应用可访问
- [ ] 日志正常

---

## 📞 获取帮助

- 详细指南: [LEAFLOW_DEPLOYMENT.md](LEAFLOW_DEPLOYMENT.md)
- 部署脚本: [deploy-leaflow.sh](deploy-leaflow.sh)
- Docker Compose: [docker-compose.leaflow.yml](docker-compose.leaflow.yml)
- Nginx 配置: [nginx.conf.example](nginx.conf.example)

---

## 🎉 部署完成

访问你的应用：
```
http://your-leaflow-server.com:3000
```

或使用域名（如果配置了 Nginx）：
```
http://your-domain.com
```

祝你使用愉快！🎮

# Leaflow 一键部署指南

## ✅ 镜像检查完成

你的 Docker 镜像已验证合格，包含：
- ✅ 完整的后端服务
- ✅ 完整的前端应用
- ✅ 完整的游戏逻辑
- ✅ 所有必需的依赖

**可以直接部署！**

---

## 🚀 部署步骤（3 步）

### 第 1 步：SSH 连接到 Leaflow
```bash
ssh user@your-leaflow-server.com
```

### 第 2 步：运行镜像
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

### 第 3 步：验证部署
```bash
# 查看容器状态
docker ps

# 查看日志
docker logs gomoku

# 测试应用
curl http://localhost:3000
```

---

## 🌐 访问应用

部署完成后，访问：
```
http://your-leaflow-server:3000
```

或使用 IP 地址：
```
http://leaflow-server-ip:3000
```

---

## 📊 常用命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f gomoku

# 重启容器
docker restart gomoku

# 停止容器
docker stop gomoku

# 删除容器
docker rm gomoku

# 查看资源使用
docker stats gomoku
```

---

## 🔧 故障排除

### 问题 1：无法访问应用
```bash
# 检查容器是否运行
docker ps

# 查看日志
docker logs gomoku

# 检查防火墙
sudo ufw allow 3000/tcp
```

### 问题 2：容器无法启动
```bash
# 查看详细日志
docker logs gomoku

# 重新拉取镜像
docker pull ghcr.io/maserpoassr/wzq:main

# 重新运行
docker run -d -p 3000:3000 ghcr.io/maserpoassr/wzq:main
```

### 问题 3：端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000

# 使用其他端口
docker run -d -p 8080:3000 ghcr.io/maserpoassr/wzq:main
```

---

## 📈 性能配置（可选）

### 限制内存和 CPU
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --cpus="1" \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

### 使用 Docker Compose
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    ports:
      - "3000:3000"
    restart: unless-stopped
EOF

docker-compose up -d
```

---

## ✨ 功能验证

部署后，你可以：

1. **进入大厅** - 输入昵称
2. **创建房间** - 开始游戏
3. **快速匹配** - 自动配对
4. **实时对战** - 与朋友对战
5. **聊天功能** - 房间内聊天
6. **悔棋功能** - 请求悔棋
7. **认输功能** - 认输结束游戏
8. **观战功能** - 观看其他房间

---

## 🎉 部署完成

恭喜！你的 Gomoku Online 游戏已成功部署到 Leaflow 服务器！

### 下一步
1. 访问应用：http://your-leaflow-server:3000
2. 邀请朋友一起玩
3. 享受游戏！

---

## 📞 需要帮助？

- 详细信息：[DOCKER_IMAGE_VERIFICATION.md](DOCKER_IMAGE_VERIFICATION.md)
- 资源配置：[RESOURCE_QUICK_REFERENCE.md](RESOURCE_QUICK_REFERENCE.md)
- 完整指南：[LEAFLOW_DEPLOYMENT.md](LEAFLOW_DEPLOYMENT.md)

---

**祝你使用愉快！** 🎮🎉

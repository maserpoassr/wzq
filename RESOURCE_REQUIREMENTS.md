# Gomoku Online - 资源需求分析

## 📊 应用特性分析

### 应用类型
- **后端**: Node.js + Express + Socket.io
- **前端**: HTML5 + Canvas（浏览器端）
- **通信**: WebSocket（实时）
- **存储**: 内存存储（无数据库）

### 性能特点
- ✅ 轻量级应用
- ✅ 内存占用低
- ✅ CPU 使用率低
- ✅ 无磁盘 I/O
- ✅ 实时通信（WebSocket）

---

## 💾 内存需求

### 基础需求
| 场景 | 内存 | 说明 |
|------|------|------|
| **最小** | 128MB | 1-5 个并发用户 |
| **推荐** | 256MB | 10-50 个并发用户 |
| **标准** | 512MB | 50-200 个并发用户 |
| **高性能** | 1GB | 200+ 个并发用户 |

### 内存使用分解
```
Node.js 基础: ~50MB
Express 框架: ~20MB
Socket.io: ~30MB
应用代码: ~10MB
房间数据: ~5MB（每个房间 ~50KB）
玩家连接: ~1MB（每个连接 ~10KB）
缓冲区: ~20MB

总计: ~135MB（基础）+ 动态数据
```

### 推荐配置

**小型服务器（个人/测试）**
```bash
# 内存: 256MB
# 用户: 10-50 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 256m \
  --memory-swap 512m \
  ghcr.io/maserpoassr/wzq:main
```

**中型服务器（小团队）**
```bash
# 内存: 512MB
# 用户: 50-200 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --memory-swap 1g \
  ghcr.io/maserpoassr/wzq:main
```

**大型服务器（公开服务）**
```bash
# 内存: 1GB
# 用户: 200+ 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 1g \
  --memory-swap 2g \
  ghcr.io/maserpoassr/wzq:main
```

---

## ⚙️ CPU 需求

### 基础需求
| 场景 | CPU | 说明 |
|------|-----|------|
| **最小** | 0.25 核 | 1-5 个并发用户 |
| **推荐** | 0.5 核 | 10-50 个并发用户 |
| **标准** | 1 核 | 50-200 个并发用户 |
| **高性能** | 2 核 | 200+ 个并发用户 |

### CPU 使用分解
```
空闲状态: ~1-2%
每个连接: ~0.1-0.2%
每个房间: ~0.5-1%
游戏运行中: ~2-5%
高并发: ~10-20%
```

### 推荐配置

**小型服务器**
```bash
# CPU: 0.5 核
# 用户: 10-50 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="0.5" \
  ghcr.io/maserpoassr/wzq:main
```

**中型服务器**
```bash
# CPU: 1 核
# 用户: 50-200 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="1" \
  ghcr.io/maserpoassr/wzq:main
```

**大型服务器**
```bash
# CPU: 2 核
# 用户: 200+ 人
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="2" \
  ghcr.io/maserpoassr/wzq:main
```

---

## 🎯 根据服务器类型推荐

### 1️⃣ 个人/测试服务器
```
配置: 1GB 内存, 1 核 CPU
推荐: 256MB 内存, 0.5 核 CPU
用户: 10-50 人
```

**Docker 命令**:
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 256m \
  --memory-swap 512m \
  --cpus="0.5" \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    ports:
      - "3000:3000"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

---

### 2️⃣ 小型生产服务器
```
配置: 2GB 内存, 2 核 CPU
推荐: 512MB 内存, 1 核 CPU
用户: 50-200 人
```

**Docker 命令**:
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --memory-swap 1g \
  --cpus="1" \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    ports:
      - "3000:3000"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

### 3️⃣ 中型生产服务器
```
配置: 4GB 内存, 4 核 CPU
推荐: 1GB 内存, 2 核 CPU
用户: 200-500 人
```

**Docker 命令**:
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 1g \
  --memory-swap 2g \
  --cpus="2" \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    ports:
      - "3000:3000"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

---

### 4️⃣ 大型生产服务器
```
配置: 8GB+ 内存, 8+ 核 CPU
推荐: 2GB 内存, 4 核 CPU
用户: 500+ 人
```

**Docker 命令**:
```bash
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 2g \
  --memory-swap 4g \
  --cpus="4" \
  --restart always \
  ghcr.io/maserpoassr/wzq:main
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    ports:
      - "3000:3000"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 2G
        reservations:
          cpus: '2'
          memory: 1G
```

---

## 📈 性能监控

### 查看实时资源使用
```bash
# 查看容器资源使用
docker stats gomoku

# 输出示例:
# CONTAINER   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
# gomoku      2.5%    85MB / 256MB        33%     1.2MB / 2.3MB
```

### 查看详细信息
```bash
# 查看容器详细信息
docker inspect gomoku

# 查看内存限制
docker inspect gomoku | grep -A 5 Memory

# 查看 CPU 限制
docker inspect gomoku | grep -A 5 CpuQuota
```

### 监控日志
```bash
# 查看应用日志
docker logs -f gomoku

# 查看系统日志
sudo journalctl -u docker -f
```

---

## 🔧 性能优化建议

### 1. 内存优化
```bash
# 启用内存交换（防止 OOM）
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  -m 512m \
  --memory-swap 1g \
  ghcr.io/maserpoassr/wzq:main
```

### 2. CPU 优化
```bash
# 限制 CPU 使用
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --cpus="1" \
  --cpu-shares 1024 \
  ghcr.io/maserpoassr/wzq:main
```

### 3. 网络优化
```bash
# 使用 host 网络模式（性能更好）
docker run -d \
  --name gomoku \
  --network host \
  ghcr.io/maserpoassr/wzq:main
```

### 4. 日志优化
```bash
# 限制日志大小
docker run -d \
  --name gomoku \
  -p 3000:3000 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ghcr.io/maserpoassr/wzq:main
```

---

## ⚠️ 常见问题

### Q: 内存不足怎么办？
A: 
1. 增加服务器内存
2. 增加 swap 空间
3. 限制并发连接数
4. 定期重启容器清理内存

### Q: CPU 使用率过高？
A:
1. 检查是否有大量并发连接
2. 增加 CPU 核心数
3. 使用负载均衡（多个容器）
4. 优化应用代码

### Q: 如何扩展到多个容器？
A:
```bash
# 使用 Docker Compose 运行多个实例
docker-compose up -d --scale gomoku=3

# 使用 Nginx 负载均衡
# 配置 upstream 指向多个容器
```

### Q: 如何监控内存泄漏？
A:
```bash
# 定期检查内存使用
watch -n 5 'docker stats gomoku'

# 如果内存持续增长，可能有泄漏
# 定期重启容器
docker restart gomoku
```

---

## 📋 推荐配置总结

| 场景 | 内存 | CPU | 用户数 | 命令 |
|------|------|-----|--------|------|
| 测试 | 256MB | 0.5 | 10-50 | `docker run -m 256m --cpus="0.5"` |
| 小型 | 512MB | 1 | 50-200 | `docker run -m 512m --cpus="1"` |
| 中型 | 1GB | 2 | 200-500 | `docker run -m 1g --cpus="2"` |
| 大型 | 2GB | 4 | 500+ | `docker run -m 2g --cpus="4"` |

---

## 🎯 快速决策

### 如果你的服务器是...

**1GB 内存, 1 核 CPU**
```bash
# 推荐配置
docker run -d --name gomoku -p 3000:3000 \
  -m 256m --memory-swap 512m --cpus="0.5" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

**2GB 内存, 2 核 CPU**
```bash
# 推荐配置
docker run -d --name gomoku -p 3000:3000 \
  -m 512m --memory-swap 1g --cpus="1" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

**4GB 内存, 4 核 CPU**
```bash
# 推荐配置
docker run -d --name gomoku -p 3000:3000 \
  -m 1g --memory-swap 2g --cpus="2" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

**8GB+ 内存, 8+ 核 CPU**
```bash
# 推荐配置
docker run -d --name gomoku -p 3000:3000 \
  -m 2g --memory-swap 4g --cpus="4" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

---

## 📞 需要帮助？

- 查看 [LEAFLOW_DEPLOYMENT.md](LEAFLOW_DEPLOYMENT.md) 了解部署
- 查看 [LEAFLOW_QUICK_GUIDE.md](LEAFLOW_QUICK_GUIDE.md) 快速开始
- 使用 `docker stats` 监控实时资源使用

---

**建议**: 从推荐配置开始，根据实际使用情况调整。

# 资源配置快速参考

## 🎯 一句话总结

**推荐**: 256MB 内存 + 0.5 核 CPU（小型）或 512MB 内存 + 1 核 CPU（中型）

---

## 📊 快速对照表

| 服务器规格 | 推荐内存 | 推荐 CPU | 支持用户 | 部署命令 |
|-----------|---------|---------|---------|---------|
| **1GB / 1核** | 256MB | 0.5 | 10-50 | 见下方 |
| **2GB / 2核** | 512MB | 1 | 50-200 | 见下方 |
| **4GB / 4核** | 1GB | 2 | 200-500 | 见下方 |
| **8GB+ / 8核+** | 2GB | 4 | 500+ | 见下方 |

---

## 🚀 一键部署命令

### 小型（256MB / 0.5核）
```bash
docker run -d --name gomoku -p 3000:3000 \
  -m 256m --memory-swap 512m --cpus="0.5" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

### 中型（512MB / 1核）
```bash
docker run -d --name gomoku -p 3000:3000 \
  -m 512m --memory-swap 1g --cpus="1" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

### 大型（1GB / 2核）
```bash
docker run -d --name gomoku -p 3000:3000 \
  -m 1g --memory-swap 2g --cpus="2" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

### 超大型（2GB / 4核）
```bash
docker run -d --name gomoku -p 3000:3000 \
  -m 2g --memory-swap 4g --cpus="4" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

---

## 📈 Docker Compose 配置

### 小型
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
```

### 中型
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
```

### 大型
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
```

---

## 🔍 监控命令

```bash
# 查看实时资源使用
docker stats gomoku

# 查看内存限制
docker inspect gomoku | grep -A 5 Memory

# 查看 CPU 限制
docker inspect gomoku | grep -A 5 CpuQuota

# 查看日志
docker logs -f gomoku
```

---

## ⚡ 性能指标

| 指标 | 空闲 | 正常 | 高负载 |
|------|------|------|--------|
| 内存 | 50-80MB | 100-150MB | 200-300MB |
| CPU | 1-2% | 5-10% | 20-30% |
| 连接数 | 0 | 10-50 | 100+ |

---

## 💡 选择建议

### 如果你不确定，选择这个：
```bash
# 中型配置（最平衡）
docker run -d --name gomoku -p 3000:3000 \
  -m 512m --memory-swap 1g --cpus="1" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

### 如果服务器资源紧张：
```bash
# 小型配置
docker run -d --name gomoku -p 3000:3000 \
  -m 256m --memory-swap 512m --cpus="0.5" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

### 如果需要高性能：
```bash
# 大型配置
docker run -d --name gomoku -p 3000:3000 \
  -m 1g --memory-swap 2g --cpus="2" \
  --restart always ghcr.io/maserpoassr/wzq:main
```

---

## 📞 常见问题

**Q: 内存不足会怎样？**
A: 容器会被杀死。使用 `--memory-swap` 增加交换空间。

**Q: CPU 不足会怎样？**
A: 应用变慢。增加 `--cpus` 值或升级服务器。

**Q: 如何知道配置是否合适？**
A: 运行 `docker stats gomoku` 查看实时使用情况。

**Q: 可以动态调整吗？**
A: 不能。需要重新创建容器。

---

## 🎯 Leaflow 服务器推荐

根据 Leaflow 的常见配置：

| Leaflow 套餐 | 推荐配置 | 命令 |
|-------------|---------|------|
| 1GB / 1核 | 256MB / 0.5核 | 小型 |
| 2GB / 2核 | 512MB / 1核 | 中型 |
| 4GB / 4核 | 1GB / 2核 | 大型 |

---

**快速开始**: 选择上面的一个命令，复制粘贴到服务器即可！

详细信息见: [RESOURCE_REQUIREMENTS.md](RESOURCE_REQUIREMENTS.md)

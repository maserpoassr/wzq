# 环境变量快速参考

## 🚀 在 Leaflow 中部署需要的环境变量

### 最小配置（推荐）

```
NODE_ENV=production
PORT=3000
```

**就这样！** 游戏会自动运行。

---

## 📋 所有可用的环境变量

| 变量名 | 值 | 必需 | 说明 |
|--------|-----|------|------|
| `NODE_ENV` | `production` | ✅ | 生产环境运行 |
| `PORT` | `3000` | ✅ | 服务器监听端口 |
| `LOG_LEVEL` | `info` | ❌ | 日志详细程度 |
| `CORS_ORIGIN` | `*` | ❌ | 跨域请求来源 |

---

## 🔧 在 Leaflow 中如何设置

### 步骤 1: 打开 docker-compose.yml

编辑 `docker-compose.leaflow.yml` 文件

### 步骤 2: 找到 environment 部分

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

### 步骤 3: 保存并重启容器

```bash
docker-compose -f docker-compose.leaflow.yml up -d
```

---

## ❓ 常见场景

### 场景 1: 使用默认配置（推荐）
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

### 场景 2: 使用自定义端口
```yaml
environment:
  - NODE_ENV=production
  - PORT=8080
ports:
  - "8080:8080"  # 记得更新端口映射
```

### 场景 3: 启用详细日志（调试）
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - LOG_LEVEL=debug
```

### 场景 4: 限制 CORS 来源（安全）
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - CORS_ORIGIN=https://yourdomain.com
```

---

## ✅ 部署前检查

- [ ] `NODE_ENV=production` ✓
- [ ] `PORT=3000` ✓
- [ ] Docker 镜像已构建 ✓
- [ ] 端口未被占用 ✓

---

## 🎮 游戏特性

✅ **无需配置的功能**
- 数据库 - 使用内存存储
- 认证 - 开放式多人游戏
- SSL/HTTPS - 在反向代理层配置
- 日志存储 - Docker 自动处理

---

## 📞 需要帮助？

查看完整文档: `ENVIRONMENT_VARIABLES.md`

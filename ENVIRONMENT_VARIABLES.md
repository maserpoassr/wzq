# 环境变量配置指南

## 概述

五子棋游戏的环境变量配置非常简单。游戏采用最小化配置原则，只需要配置必要的参数。

---

## 必需的环境变量

### 1. **PORT** - 服务器端口
- **默认值**: `3000`
- **说明**: 游戏服务器监听的端口号
- **示例**: `PORT=3000`
- **用途**: 指定 Express 服务器运行的端口
- **在 Leaflow 中**: 通常保持默认值 `3000`

### 2. **NODE_ENV** - 运行环境
- **默认值**: `production`
- **可选值**: 
  - `production` - 生产环境（推荐用于 Leaflow 部署）
  - `development` - 开发环境
- **说明**: 设置 Node.js 运行环境
- **示例**: `NODE_ENV=production`
- **用途**: 影响日志级别、性能优化等

---

## 可选的环境变量

### 3. **LOG_LEVEL** - 日志级别（可选）
- **默认值**: 无（使用默认日志）
- **可选值**: `debug`, `info`, `warn`, `error`
- **说明**: 控制日志输出详细程度
- **示例**: `LOG_LEVEL=info`
- **用途**: 调试和监控

### 4. **CORS_ORIGIN** - CORS 跨域配置（可选）
- **默认值**: `*`（允许所有来源）
- **说明**: 允许的跨域请求来源
- **示例**: `CORS_ORIGIN=https://yourdomain.com`
- **用途**: 安全性配置

---

## 在 Leaflow 中配置环境变量

### 方法 1: 使用 docker-compose.yml

编辑 `docker-compose.leaflow.yml` 文件中的 `environment` 部分：

```yaml
services:
  gomoku:
    image: ghcr.io/maserpoassr/wzq:main
    environment:
      - NODE_ENV=production
      - PORT=3000
      # 可选：添加其他环境变量
      # - LOG_LEVEL=info
      # - CORS_ORIGIN=https://yourdomain.com
```

### 方法 2: 在 Leaflow 控制面板中设置

1. 打开 Leaflow 控制面板
2. 找到 gomoku 容器配置
3. 在 "Environment Variables" 或 "环境变量" 部分添加：
   - `NODE_ENV=production`
   - `PORT=3000`

### 方法 3: 使用 .env 文件（本地开发）

在项目根目录创建 `.env` 文件：

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

然后使用 `dotenv` 包加载（需要在 server.js 中添加）。

---

## 完整配置示例

### 最小化配置（推荐用于 Leaflow）

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

### 完整配置（包含可选项）

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - LOG_LEVEL=info
  - CORS_ORIGIN=*
```

### 自定义端口配置

如果需要使用不同的端口（例如 8080）：

```yaml
environment:
  - NODE_ENV=production
  - PORT=8080
ports:
  - "8080:8080"  # 注意：需要同时更新端口映射
```

---

## 环境变量在代码中的使用

### 在 server.js 中

```javascript
// 读取环境变量
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 启动服务器
server.listen(PORT, () => {
  console.log(`[启动] 五子棋服务器运行在端口 ${PORT}`);
  console.log(`[启动] 环境: ${NODE_ENV}`);
});
```

### 在 Socket.io 中

```javascript
// CORS 配置
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});
```

---

## 常见问题

### Q: 我需要配置数据库吗？
**A**: 不需要。游戏使用内存存储，所有数据在服务器运行时保存。房间和游戏状态在服务器重启后会清空。

### Q: 我需要配置认证/授权吗？
**A**: 不需要。游戏是开放的多人游戏，任何人都可以加入。

### Q: 我需要配置 SSL/HTTPS 吗？
**A**: 不需要在游戏本身配置。如果需要 HTTPS，可以在 Leaflow 或 Nginx 反向代理层配置。

### Q: 我需要配置日志存储吗？
**A**: 不需要。日志输出到控制台。Docker 会自动处理日志收集。

### Q: 端口 3000 被占用了怎么办？
**A**: 修改 `PORT` 环境变量为其他端口（如 8080），并同时更新 docker-compose.yml 中的端口映射。

---

## 部署检查清单

在 Leaflow 中部署前，确保：

- [ ] `NODE_ENV` 设置为 `production`
- [ ] `PORT` 设置为 `3000`（或你选择的端口）
- [ ] Docker 镜像包含所有源代码
- [ ] 端口映射正确配置
- [ ] 容器可以访问互联网（用于 npm 依赖）

---

## 快速启动命令

### 本地开发

```bash
PORT=3000 NODE_ENV=development npm start
```

### 本地生产

```bash
PORT=3000 NODE_ENV=production npm start
```

### Docker 本地运行

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  ghcr.io/maserpoassr/wzq:main
```

### Docker Compose 运行

```bash
docker-compose -f docker-compose.leaflow.yml up -d
```

---

## 总结

五子棋游戏的环境变量配置非常简单：

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | 3000 | 服务器端口 |
| `NODE_ENV` | 否 | production | 运行环境 |
| `LOG_LEVEL` | 否 | 无 | 日志级别（可选） |
| `CORS_ORIGIN` | 否 | * | CORS 配置（可选） |

**在 Leaflow 中，通常只需要设置这两个变量：**
- `NODE_ENV=production`
- `PORT=3000`

其他所有功能都是开箱即用的！

# 部署指南

## GitHub 自动构建 Docker 镜像

### 前置条件
1. GitHub 账户
2. 项目已推送到 GitHub

### 自动构建流程

当你推送代码到 `main` 或 `master` 分支时，GitHub Actions 会自动：
1. 构建 Docker 镜像
2. 推送到 GitHub Container Registry (GHCR)

### 镜像地址

镜像会被推送到：
```
ghcr.io/YOUR_USERNAME/gomoku-online:latest
ghcr.io/YOUR_USERNAME/gomoku-online:main
```

替换 `YOUR_USERNAME` 为你的 GitHub 用户名。

### 使用自动构建的镜像

```bash
# 登录 GitHub Container Registry
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:latest

# 运行容器
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/gomoku-online:latest
```

### 获取 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择 `write:packages` 权限
4. 复制 token 并保存

### 标签发布

当你创建 Git 标签时，镜像会自动标记版本：

```bash
git tag v1.0.0
git push origin v1.0.0
```

镜像会被标记为：
- `ghcr.io/YOUR_USERNAME/gomoku-online:v1.0.0`
- `ghcr.io/YOUR_USERNAME/gomoku-online:1.0`
- `ghcr.io/YOUR_USERNAME/gomoku-online:latest`

---

## 本地构建 Docker 镜像

### 构建镜像

```bash
docker build -t gomoku-online:latest .
```

### 运行容器

```bash
docker run -d -p 3000:3000 --name gomoku gomoku-online:latest
```

### 查看日志

```bash
docker logs -f gomoku
```

### 停止容器

```bash
docker stop gomoku
docker rm gomoku
```

---

## Docker Compose 部署

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  gomoku:
    image: gomoku-online:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

---

## 云平台部署

### Heroku

```bash
# 登录 Heroku
heroku login

# 创建应用
heroku create your-app-name

# 推送 Docker 镜像
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name

# 打开应用
heroku open -a your-app-name
```

### Railway

1. 连接 GitHub 仓库到 Railway
2. 选择项目
3. Railway 会自动检测 Dockerfile 并部署

### Render

1. 访问 https://render.com
2. 连接 GitHub 账户
3. 创建新的 Web Service
4. 选择 Docker 作为运行时
5. 部署

---

## 性能优化

### 多阶段构建

当前 Dockerfile 已使用多阶段构建，只包含生产依赖。

### 镜像大小

```bash
# 查看镜像大小
docker images gomoku-online

# 优化建议
# 1. 使用 alpine 基础镜像（已配置）
# 2. 清理 npm 缓存（已配置）
# 3. 只复制必要文件（已配置）
```

---

## 故障排除

### 镜像构建失败

检查 GitHub Actions 日志：
1. 访问你的仓库
2. 点击 "Actions" 标签
3. 查看失败的工作流

### 容器无法启动

```bash
# 查看容器日志
docker logs container_id

# 检查端口是否被占用
lsof -i :3000
```

### 连接问题

确保：
1. 防火墙允许 3000 端口
2. 容器内部服务正常运行
3. 环境变量正确配置

---

## 安全建议

1. **不要提交敏感信息**到 GitHub
2. **使用 GitHub Secrets** 存储敏感数据
3. **定期更新依赖** 以修复安全漏洞
4. **使用 HTTPS** 部署到生产环境
5. **限制容器权限** 使用非 root 用户运行

---

## 监控和日志

### 查看实时日志

```bash
docker logs -f container_id
```

### 保存日志到文件

```bash
docker logs container_id > logs.txt
```

### 使用日志驱动

在 `docker-compose.yml` 中配置：

```yaml
services:
  gomoku:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

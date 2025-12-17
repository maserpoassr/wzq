# Docker 和 CI/CD 配置总结

## 已配置的内容

### 1. GitHub Actions 自动构建 ✅

**文件**: `.github/workflows/docker-build.yml`

**功能**:
- 自动监听 `main` 和 `master` 分支的推送
- 自动监听版本标签 (v*)
- 构建 Docker 镜像
- 推送到 GitHub Container Registry (GHCR)
- 使用 Docker 缓存加速构建

**触发条件**:
- 推送到 main/master 分支
- 创建版本标签 (v1.0.0 等)
- Pull Request（仅构建，不推送）

### 2. Docker 配置 ✅

**文件**: `Dockerfile`

**特点**:
- 基于 `node:18-alpine`（轻量级）
- 多阶段构建（仅包含生产依赖）
- 暴露 3000 端口
- 设置环境变量

**优化**:
- 使用 `npm ci` 确保依赖一致性
- 只复制必要文件
- 清理 npm 缓存

### 3. 构建优化 ✅

**文件**: `.dockerignore`

**排除内容**:
- node_modules（重新安装）
- 测试文件
- 开发配置
- 文档

**结果**: 镜像大小约 150-200MB

### 4. Git 配置 ✅

**文件**: `.gitignore`

**忽略内容**:
- node_modules
- 环境变量文件
- IDE 配置
- 系统文件

---

## 快速上手步骤

### 步骤 1: 准备代码

```bash
# 确保所有文件都已提交
git status

# 如果有未提交的文件
git add .
git commit -m "Prepare for GitHub deployment"
```

### 步骤 2: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建新仓库 `gomoku-online`
3. 选择 Public（这样镜像可以被公开访问）

### 步骤 3: 推送代码

```bash
git remote add origin https://github.com/YOUR_USERNAME/gomoku-online.git
git branch -M main
git push -u origin main
```

### 步骤 4: 验证自动构建

1. 访问 https://github.com/YOUR_USERNAME/gomoku-online
2. 点击 "Actions" 标签
3. 看到 "Build and Push Docker Image" 工作流运行
4. 等待完成（5-10 分钟）

### 步骤 5: 查看构建的镜像

```bash
# 访问包页面
https://github.com/YOUR_USERNAME?tab=packages

# 或使用 Docker CLI
docker search ghcr.io/YOUR_USERNAME/gomoku-online
```

---

## 镜像标签说明

GitHub Actions 会自动生成以下标签：

| 触发事件 | 生成的标签 |
|---------|----------|
| 推送到 main | `main`, `sha-xxxxx` |
| 推送到 master | `master`, `sha-xxxxx` |
| 创建标签 v1.0.0 | `v1.0.0`, `1.0`, `latest` |

**示例**:
```bash
# 推送到 main 分支后
ghcr.io/YOUR_USERNAME/gomoku-online:main
ghcr.io/YOUR_USERNAME/gomoku-online:sha-abc123

# 创建标签 v1.0.0 后
ghcr.io/YOUR_USERNAME/gomoku-online:v1.0.0
ghcr.io/YOUR_USERNAME/gomoku-online:1.0
ghcr.io/YOUR_USERNAME/gomoku-online:latest
```

---

## 使用构建的镜像

### 方式 1: 本地测试

```bash
# 登录 GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/gomoku-online:main

# 访问 http://localhost:3000
```

### 方式 2: 服务器部署

```bash
# SSH 到服务器
ssh user@your-server.com

# 登录 GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取并运行
docker run -d -p 3000:3000 --restart always \
  --name gomoku \
  ghcr.io/YOUR_USERNAME/gomoku-online:main

# 查看日志
docker logs -f gomoku
```

### 方式 3: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/YOUR_USERNAME/gomoku-online:main
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

运行:
```bash
docker-compose up -d
```

---

## 获取 GitHub Token

### 创建 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写信息:
   - **Note**: Docker Registry Access
   - **Expiration**: 90 days (或自定义)
4. 选择权限:
   - ✅ `write:packages` - 推送镜像
   - ✅ `read:packages` - 拉取镜像
   - ✅ `delete:packages` - 删除镜像（可选）
5. 点击 "Generate token"
6. 复制 token（只显示一次！）

### 使用 Token

```bash
# 登录 Docker
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN

# 或使用环境变量
export GITHUB_TOKEN=your_token
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

---

## 故障排除

### 问题 1: GitHub Actions 构建失败

**检查步骤**:
1. 访问 Actions 标签
2. 点击失败的工作流
3. 查看详细日志
4. 常见原因:
   - package.json 有语法错误
   - 依赖安装失败
   - Dockerfile 路径错误

**解决**:
```bash
# 本地测试构建
docker build -t gomoku-online .

# 如果失败，修复问题后重新推送
git add .
git commit -m "Fix build issue"
git push origin main
```

### 问题 2: 无法拉取镜像

**检查步骤**:
1. 确认 token 有效
2. 确认镜像名称正确
3. 确认仓库是 Public

**解决**:
```bash
# 重新登录
docker logout ghcr.io
docker login ghcr.io -u YOUR_USERNAME -p YOUR_NEW_TOKEN

# 重试拉取
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main
```

### 问题 3: 容器无法启动

**检查步骤**:
```bash
# 查看日志
docker logs container_id

# 检查端口
lsof -i :3000

# 检查镜像
docker images

# 手动运行测试
docker run -it ghcr.io/YOUR_USERNAME/gomoku-online:main /bin/sh
```

---

## 安全最佳实践

### 1. 保护 Token

- ❌ 不要在代码中硬编码 token
- ❌ 不要在 GitHub 上公开 token
- ✅ 使用 GitHub Secrets（自动处理）
- ✅ 定期轮换 token

### 2. 镜像安全

- ✅ 定期更新基础镜像
- ✅ 扫描镜像漏洞
- ✅ 使用最小权限运行容器

### 3. 仓库安全

- ✅ 启用分支保护
- ✅ 要求 PR 审查
- ✅ 启用 CODEOWNERS

---

## 性能优化

### 构建缓存

GitHub Actions 自动使用 Docker 缓存：
- 第一次构建: 5-10 分钟
- 后续构建: 1-3 分钟（如果依赖未变）

### 镜像大小

当前配置:
- 基础镜像: 150MB (node:18-alpine)
- 依赖: 50-100MB
- 应用代码: <1MB
- **总大小**: 约 150-200MB

### 优化建议

```dockerfile
# 使用更小的基础镜像
FROM node:18-alpine3.18

# 多阶段构建（已配置）
FROM node:18-alpine AS builder
# ... 构建阶段
FROM node:18-alpine
# ... 运行阶段
```

---

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 验证 GitHub Actions 构建
3. ✅ 拉取镜像并本地测试
4. ✅ 部署到服务器或云平台
5. ✅ 设置监控和日志

---

## 有用的链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

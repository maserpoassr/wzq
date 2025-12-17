# GitHub + Docker 自动构建完整指南

## 概述

你现在拥有一个完整的 CI/CD 流程，可以自动构建和部署 Docker 镜像。

### 工作流程

```
推送代码到 GitHub
        ↓
GitHub Actions 自动触发
        ↓
构建 Docker 镜像
        ↓
推送到 GitHub Container Registry
        ↓
可以从任何地方拉取和运行镜像
```

---

## 已配置的文件

### 1. GitHub Actions 工作流
**文件**: `.github/workflows/docker-build.yml`

自动执行以下操作：
- 监听 main/master 分支的推送
- 监听版本标签 (v*)
- 构建 Docker 镜像
- 推送到 GHCR
- 使用缓存加速构建

### 2. Docker 配置
**文件**: `Dockerfile`

- 基于 node:18-alpine（轻量级）
- 多阶段构建
- 优化的依赖安装
- 暴露 3000 端口

### 3. 构建优化
**文件**: `.dockerignore`

排除不必要的文件，减小镜像大小

### 4. Git 配置
**文件**: `.gitignore`

防止敏感文件被提交

---

## 快速开始（5 分钟）

### 第 1 步：创建 GitHub 仓库

```bash
# 访问 https://github.com/new
# 创建仓库名称: gomoku-online
# 选择 Public
# 点击 Create
```

### 第 2 步：推送代码

```bash
git remote add origin https://github.com/YOUR_USERNAME/gomoku-online.git
git branch -M main
git push -u origin main
```

### 第 3 步：等待构建

1. 访问 https://github.com/YOUR_USERNAME/gomoku-online
2. 点击 "Actions" 标签
3. 看到工作流运行（5-10 分钟）

### 第 4 步：验证镜像

```bash
# 访问包页面
https://github.com/YOUR_USERNAME?tab=packages

# 应该看到 gomoku-online 包
```

### 第 5 步：使用镜像

```bash
# 登录
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/gomoku-online:main

# 访问 http://localhost:3000
```

---

## 详细步骤

### 步骤 1: 获取 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写信息：
   - **Note**: Docker Registry
   - **Expiration**: 90 days
4. 选择权限：
   - ✅ write:packages
   - ✅ read:packages
5. 生成并复制 token

### 步骤 2: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写信息：
   - **Repository name**: gomoku-online
   - **Description**: Online Gomoku Game
   - **Public**: 选中
3. 点击 "Create repository"

### 步骤 3: 推送代码

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/gomoku-online.git

# 重命名分支
git branch -M main

# 推送代码
git push -u origin main
```

### 步骤 4: 验证 GitHub Actions

1. 访问 https://github.com/YOUR_USERNAME/gomoku-online
2. 点击 "Actions" 标签
3. 看到 "Build and Push Docker Image" 工作流
4. 等待完成（绿色对勾）

### 步骤 5: 查看构建的镜像

```bash
# 方式 1: 网页查看
https://github.com/YOUR_USERNAME?tab=packages

# 方式 2: Docker CLI
docker search ghcr.io/YOUR_USERNAME/gomoku-online
```

### 步骤 6: 本地测试镜像

```bash
# 登录 Docker Registry
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行容器
docker run -d -p 3000:3000 --name gomoku \
  ghcr.io/YOUR_USERNAME/gomoku-online:main

# 查看日志
docker logs -f gomoku

# 访问应用
# 打开浏览器访问 http://localhost:3000

# 停止容器
docker stop gomoku
docker rm gomoku
```

---

## 镜像标签

GitHub Actions 会自动生成以下标签：

### 推送到 main 分支
```
ghcr.io/YOUR_USERNAME/gomoku-online:main
ghcr.io/YOUR_USERNAME/gomoku-online:sha-abc123def456
```

### 推送到 master 分支
```
ghcr.io/YOUR_USERNAME/gomoku-online:master
ghcr.io/YOUR_USERNAME/gomoku-online:sha-abc123def456
```

### 创建版本标签
```bash
git tag v1.0.0
git push origin v1.0.0
```

生成的镜像标签：
```
ghcr.io/YOUR_USERNAME/gomoku-online:v1.0.0
ghcr.io/YOUR_USERNAME/gomoku-online:1.0
ghcr.io/YOUR_USERNAME/gomoku-online:latest
ghcr.io/YOUR_USERNAME/gomoku-online:sha-abc123def456
```

---

## 部署到服务器

### 方式 1: 直接 Docker

```bash
# SSH 到服务器
ssh user@your-server.com

# 登录 Docker Registry
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行容器
docker run -d -p 3000:3000 --restart always \
  --name gomoku \
  ghcr.io/YOUR_USERNAME/gomoku-online:main

# 查看日志
docker logs -f gomoku
```

### 方式 2: Docker Compose

创建 `docker-compose.yml`：

```yaml
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

运行：

```bash
docker-compose up -d
```

### 方式 3: 云平台

#### Heroku
```bash
heroku login
heroku create your-app-name
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name
```

#### Railway
1. 连接 GitHub 账户
2. 选择仓库
3. 自动部署

#### Render
1. 访问 https://render.com
2. 连接 GitHub
3. 创建 Web Service
4. 选择 Docker
5. 部署

---

## 常见问题

### Q: 如何更新镜像？

A: 只需推送新代码：
```bash
git add .
git commit -m "Update features"
git push origin main
```

GitHub Actions 会自动重新构建镜像。

### Q: 如何创建版本？

A: 创建 Git 标签：
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Q: 镜像在哪里？

A: 在 GitHub Container Registry (GHCR)：
```
ghcr.io/YOUR_USERNAME/gomoku-online
```

### Q: 如何让镜像私有？

A: 在包设置中改为 Private（需要 token 才能拉取）

### Q: 构建失败怎么办？

A: 
1. 检查 GitHub Actions 日志
2. 本地运行 `docker build -t gomoku-online .` 测试
3. 修复问题后重新推送

### Q: 如何加速构建？

A: GitHub Actions 自动使用缓存，后续构建会更快

### Q: 镜像大小多少？

A: 约 150-200MB（包括 Node.js 和依赖）

---

## 安全建议

1. **保护 Token**
   - 不要在代码中硬编码
   - 定期轮换 token
   - 使用 GitHub Secrets

2. **镜像安全**
   - 定期更新依赖
   - 扫描漏洞
   - 使用最小权限

3. **仓库安全**
   - 启用分支保护
   - 要求 PR 审查
   - 启用 CODEOWNERS

---

## 监控和维护

### 查看构建历史

```bash
# 访问 Actions 页面
https://github.com/YOUR_USERNAME/gomoku-online/actions
```

### 查看镜像信息

```bash
# 访问包页面
https://github.com/YOUR_USERNAME?tab=packages
```

### 定期更新

```bash
# 更新依赖
npm update
npm audit fix

# 推送更新
git add .
git commit -m "Update dependencies"
git push origin main
```

---

## 文档导航

- **[QUICK_START.md](QUICK_START.md)** - 快速开始
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - GitHub 详细设置
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 部署指南
- **[DOCKER_CI_CD.md](DOCKER_CI_CD.md)** - Docker 和 CI/CD 详解
- **[CHECKLIST.md](CHECKLIST.md)** - 部署检查清单

---

## 总结

✅ **已配置**:
- GitHub Actions 自动构建
- Docker 镜像优化
- 推送到 GHCR
- 版本管理
- 缓存加速

✅ **可以做**:
- 推送代码自动构建
- 创建版本标签
- 拉取镜像部署
- 部署到任何服务器
- 分享镜像链接

🚀 **下一步**:
1. 推送代码到 GitHub
2. 验证 GitHub Actions 构建
3. 拉取镜像本地测试
4. 部署到服务器或云平台
5. 分享项目链接

---

**需要帮助？** 查看相关文档或 GitHub Actions 日志。

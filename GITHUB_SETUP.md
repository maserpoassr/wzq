# GitHub 上传和自动构建指南

## 第一步：初始化 Git 仓库

```bash
# 如果还没有初始化
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Gomoku Online game"
```

## 第二步：在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写仓库名称（例如：`gomoku-online`）
3. 选择 Public 或 Private
4. 点击 "Create repository"

## 第三步：推送到 GitHub

```bash
# 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 重命名分支为 main（如果需要）
git branch -M main

# 推送代码
git push -u origin main
```

## 第四步：验证 GitHub Actions

1. 访问你的仓库
2. 点击 "Actions" 标签
3. 应该看到 "Build and Push Docker Image" 工作流正在运行
4. 等待完成（通常 5-10 分钟）

## 第五步：查看构建结果

### 成功标志
- ✅ 工作流显示绿色对勾
- ✅ 镜像已推送到 GitHub Container Registry

### 查看镜像

1. 访问 https://github.com/YOUR_USERNAME?tab=packages
2. 找到 `gomoku-online` 包
3. 查看镜像标签和版本

## 第六步：使用构建的镜像

### 方式 1：本地运行

```bash
# 登录 GitHub Container Registry
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/gomoku-online:main
```

### 方式 2：在服务器上运行

```bash
# SSH 到服务器
ssh user@your-server.com

# 登录 Docker Registry
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取并运行
docker run -d -p 3000:3000 --restart always \
  ghcr.io/YOUR_USERNAME/gomoku-online:main
```

### 方式 3：使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  gomoku:
    image: ghcr.io/YOUR_USERNAME/gomoku-online:main
    ports:
      - "3000:3000"
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

## 常见问题

### Q: 如何获取 GitHub Token？

A: 
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选 `write:packages` 和 `read:packages`
4. 生成并复制 token

### Q: 镜像构建失败怎么办？

A: 
1. 检查 GitHub Actions 日志
2. 常见原因：
   - package.json 有错误
   - 依赖安装失败
   - Dockerfile 路径错误
3. 修复后重新推送代码

### Q: 如何更新镜像？

A: 
只需推送新代码到 main 分支：

```bash
git add .
git commit -m "Update: new features"
git push origin main
```

GitHub Actions 会自动重新构建镜像。

### Q: 如何创建版本标签？

A:
```bash
# 创建标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

镜像会自动标记为 `v1.0.0`、`1.0` 和 `latest`。

### Q: 镜像是公开的吗？

A: 
默认是公开的。如果要设为私有：
1. 访问包设置
2. 改为 Private
3. 需要 token 才能拉取

## 下一步

- 📖 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解更多部署选项
- 🚀 部署到云平台（Heroku、Railway、Render 等）
- 📊 设置监控和日志
- 🔒 配置 HTTPS 和安全策略

## 有用的链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

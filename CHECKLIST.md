# GitHub 部署检查清单

## 本地准备 ✅

- [x] 项目代码完整
- [x] 所有测试通过 (51/51)
- [x] Dockerfile 已配置
- [x] .dockerignore 已配置
- [x] .gitignore 已配置
- [x] GitHub Actions 工作流已配置

## GitHub 设置

### 创建仓库
- [ ] 访问 https://github.com/new
- [ ] 创建仓库名称: `gomoku-online`
- [ ] 选择 Public（推荐）
- [ ] 点击 "Create repository"

### 本地配置
- [ ] 运行以下命令:
```bash
git remote add origin https://github.com/YOUR_USERNAME/gomoku-online.git
git branch -M main
git push -u origin main
```

### 验证推送
- [ ] 访问 https://github.com/YOUR_USERNAME/gomoku-online
- [ ] 确认所有文件都已上传
- [ ] 检查 `.github/workflows/docker-build.yml` 存在

## GitHub Actions 配置

### 验证工作流
- [ ] 点击 "Actions" 标签
- [ ] 看到 "Build and Push Docker Image" 工作流
- [ ] 工作流状态为 "running" 或 "completed"

### 等待构建完成
- [ ] 首次构建通常需要 5-10 分钟
- [ ] 查看工作流日志确认成功
- [ ] 所有步骤都应该显示绿色对勾

## 镜像验证

### 检查镜像是否已推送
- [ ] 访问 https://github.com/YOUR_USERNAME?tab=packages
- [ ] 找到 `gomoku-online` 包
- [ ] 查看镜像标签（应该有 `main` 和 `sha-xxxxx`）

### 获取镜像 URL
- [ ] 记下镜像完整 URL:
```
ghcr.io/YOUR_USERNAME/gomoku-online:main
```

## 本地测试

### 获取 GitHub Token
- [ ] 访问 https://github.com/settings/tokens
- [ ] 创建新 token（classic）
- [ ] 选择 `write:packages` 和 `read:packages` 权限
- [ ] 复制 token

### 登录 Docker Registry
- [ ] 运行:
```bash
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN
```
- [ ] 确认登录成功

### 拉取镜像
- [ ] 运行:
```bash
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main
```
- [ ] 确认镜像下载成功

### 运行容器
- [ ] 运行:
```bash
docker run -d -p 3000:3000 --name gomoku \
  ghcr.io/YOUR_USERNAME/gomoku-online:main
```
- [ ] 检查容器是否运行:
```bash
docker ps
```

### 测试应用
- [ ] 访问 http://localhost:3000
- [ ] 确认页面加载正常
- [ ] 测试基本功能（输入昵称、创建房间等）

### 清理
- [ ] 停止容器:
```bash
docker stop gomoku
docker rm gomoku
```

## 版本发布（可选）

### 创建版本标签
- [ ] 运行:
```bash
git tag v1.0.0
git push origin v1.0.0
```
- [ ] 等待 GitHub Actions 构建完成

### 验证版本镜像
- [ ] 检查包页面
- [ ] 应该看到 `v1.0.0`、`1.0` 和 `latest` 标签

## 服务器部署（可选）

### 准备服务器
- [ ] SSH 到服务器
- [ ] 安装 Docker
- [ ] 创建非 root 用户（推荐）

### 部署应用
- [ ] 登录 Docker Registry:
```bash
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN
```
- [ ] 拉取镜像:
```bash
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main
```
- [ ] 运行容器:
```bash
docker run -d -p 3000:3000 --restart always \
  --name gomoku \
  ghcr.io/YOUR_USERNAME/gomoku-online:main
```

### 验证部署
- [ ] 访问 http://your-server-ip:3000
- [ ] 确认应用正常运行
- [ ] 检查日志:
```bash
docker logs -f gomoku
```

## 文档和分享

### 更新文档
- [ ] 在 README.md 中添加 GitHub 仓库链接
- [ ] 在 README.md 中添加镜像 URL
- [ ] 更新部署说明

### 分享项目
- [ ] 在 GitHub 上 Star 项目
- [ ] 分享仓库链接
- [ ] 分享应用 URL

## 持续维护

### 定期更新
- [ ] 定期更新依赖:
```bash
npm update
npm audit fix
```
- [ ] 推送更新:
```bash
git add .
git commit -m "Update dependencies"
git push origin main
```

### 监控构建
- [ ] 定期检查 GitHub Actions 日志
- [ ] 确保构建始终成功
- [ ] 修复任何构建失败

### 安全检查
- [ ] 定期轮换 GitHub Token
- [ ] 检查依赖安全漏洞
- [ ] 更新基础镜像

## 故障排除

### 如果构建失败
- [ ] 检查 GitHub Actions 日志
- [ ] 本地运行 `docker build -t gomoku-online .` 测试
- [ ] 修复问题后重新推送

### 如果无法拉取镜像
- [ ] 确认 token 有效
- [ ] 确认镜像名称正确
- [ ] 重新登录 Docker Registry

### 如果容器无法启动
- [ ] 检查 `docker logs` 输出
- [ ] 确认端口 3000 未被占用
- [ ] 检查网络配置

## 完成标志 ✅

当以下条件都满足时，部署完成：

- ✅ 代码已推送到 GitHub
- ✅ GitHub Actions 工作流成功运行
- ✅ Docker 镜像已推送到 GHCR
- ✅ 本地可以拉取并运行镜像
- ✅ 应用在 http://localhost:3000 正常运行
- ✅ （可选）已部署到服务器

## 下一步

1. 📖 查看 [DOCKER_CI_CD.md](DOCKER_CI_CD.md) 了解详细信息
2. 🚀 考虑部署到云平台（Heroku、Railway、Render）
3. 📊 设置监控和日志
4. 🔒 配置 HTTPS 和安全策略
5. 📈 优化性能和用户体验

---

**需要帮助？** 查看相关文档：
- [QUICK_START.md](QUICK_START.md) - 快速开始
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub 设置详解
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [DOCKER_CI_CD.md](DOCKER_CI_CD.md) - Docker 和 CI/CD 详解

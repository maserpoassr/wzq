# 快速开始

## 本地开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 启动服务器
npm start

# 访问 http://localhost:3000
```

## Docker 本地构建

```bash
# 构建镜像
docker build -t gomoku-online .

# 运行容器
docker run -d -p 3000:3000 gomoku-online

# 查看日志
docker logs -f <container_id>
```

## GitHub 上传（3 步）

```bash
# 1. 初始化并提交
git add .
git commit -m "Initial commit"

# 2. 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/gomoku-online.git
git branch -M main

# 3. 推送
git push -u origin main
```

## 使用自动构建的镜像

```bash
# 登录
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# 拉取
docker pull ghcr.io/YOUR_USERNAME/gomoku-online:main

# 运行
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/gomoku-online:main
```

## 项目结构

```
gomoku-online/
├── src/                    # 后端逻辑
│   ├── gameLogic.js       # 游戏核心逻辑
│   ├── roomManager.js     # 房间管理
│   ├── gameActions.js     # 游戏操作
│   ├── serialization.js   # 序列化
│   └── utils.js           # 工具函数
├── public/                # 前端资源
│   └── index.html         # 单页应用
├── tests/                 # 测试
│   └── property/          # 属性测试
├── server.js              # 服务器入口
├── Dockerfile             # Docker 配置
├── package.json           # 依赖配置
└── README.md              # 项目文档
```

## 功能特性

- ✅ 15×15 棋盘
- ✅ 实时多人对战
- ✅ 房间系统
- ✅ 观战功能
- ✅ 聊天系统
- ✅ 悔棋机制
- ✅ 认输功能
- ✅ 响应式设计
- ✅ 51 个属性测试
- ✅ Docker 部署

## 技术栈

- **后端**: Node.js + Express + Socket.io
- **前端**: HTML5 + CSS3 + Vanilla JavaScript + Canvas
- **测试**: Jest + fast-check
- **部署**: Docker + GitHub Actions

## 文档

- [README.md](README.md) - 项目概述
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub 设置
- [.kiro/specs/gomoku-online/requirements.md](.kiro/specs/gomoku-online/requirements.md) - 需求文档
- [.kiro/specs/gomoku-online/design.md](.kiro/specs/gomoku-online/design.md) - 设计文档

## 常用命令

```bash
# 开发
npm start              # 启动服务器
npm test               # 运行测试
npm test -- --watch   # 监视模式

# Docker
docker build -t gomoku-online .
docker run -d -p 3000:3000 gomoku-online
docker ps
docker logs -f <id>
docker stop <id>

# Git
git add .
git commit -m "message"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

## 获取帮助

- 查看 [README.md](README.md) 了解更多
- 检查 [DEPLOYMENT.md](DEPLOYMENT.md) 的故障排除部分
- 查看 GitHub Actions 日志排查构建问题

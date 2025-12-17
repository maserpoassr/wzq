# 🎮 五子棋在线对战 (Gomoku Online)

一个支持多人在线对战的五子棋网页游戏，使用纯原生技术构建。

## ✨ 功能特性

- 🎯 标准 15×15 棋盘，先连成5子者胜
- 👥 多人同时在线，支持多个对战房间
- 👀 观战功能，可以观看他人对局
- 💬 房间内聊天，支持表情转换
- 🔄 悔棋请求，需对方同意
- 🏳️ 认输功能
- 📱 响应式设计，支持 PC/平板/手机
- 🐳 Docker 一键部署

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript + Canvas
- **后端**: Node.js + Express + Socket.io
- **测试**: Jest + fast-check (属性测试)

## 🚀 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问游戏
# 打开浏览器访问 http://localhost:3000
```

### Docker 部署

```bash
# 构建镜像
docker build -t gomoku-online .

# 运行容器
docker run -d -p 3000:3000 --name gomoku gomoku-online

# 访问游戏
# 打开浏览器访问 http://localhost:3000
```

## 📝 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务器监听端口 |

## 🎮 游戏玩法

1. 输入昵称进入大厅
2. 创建房间或加入现有房间
3. 等待对手加入后开始对战
4. 黑棋先行，轮流落子
5. 先连成5子者获胜

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:property
```

## 📁 项目结构

```
gomoku-online/
├── server.js           # 服务端入口
├── src/
│   ├── gameLogic.js    # 游戏核心逻辑
│   ├── roomManager.js  # 房间管理
│   ├── gameActions.js  # 游戏操作
│   ├── serialization.js # 状态序列化
│   └── utils.js        # 工具函数
├── public/
│   └── index.html      # 前端页面
├── tests/
│   ├── unit/           # 单元测试
│   └── property/       # 属性测试
├── Dockerfile          # Docker 配置
└── package.json
```

## 📄 License

MIT

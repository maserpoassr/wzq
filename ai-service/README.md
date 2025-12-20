# Gomoku AI Service

基于 [gomoku_rl](https://github.com/hesic73/gomoku_rl) 项目的五子棋 AI 服务。

## 特性

- 使用 PPO (Proximal Policy Optimization) 算法训练的模型
- 支持 15x15 棋盘
- 提供 REST API 接口
- 包含预训练模型

## API 接口

### 健康检查

```
GET /health
```

响应：
```json
{
  "status": "ok",
  "model": "gomoku_rl-ppo",
  "board_size": 15,
  "device": "cpu",
  "version": "2.0"
}
```

### 获取 AI 落子

```
POST /move
```

请求体：
```json
{
  "board": [[0,0,...], ...],  // 15x15, 0=空, 1=黑, -1=白
  "currentPlayer": 1,         // 1=黑, -1=白
  "difficulty": "medium"      // easy/medium/hard (目前未使用)
}
```

响应：
```json
{
  "x": 7,
  "y": 7
}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AI_MODEL_PATH` | `./models/0.pt` | 模型文件路径 |
| `AI_DEVICE` | `cpu` | 运行设备 (cpu/cuda) |
| `AI_HOST` | `0.0.0.0` | 服务监听地址 |
| `AI_PORT` | `5001` | 服务端口 |

## 本地运行

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

## Docker 运行

```bash
docker build -t gomoku-ai .
docker run -p 5001:5001 gomoku-ai
```

## 致谢

- [gomoku_rl](https://github.com/hesic73/gomoku_rl) - PPO 模型和训练代码

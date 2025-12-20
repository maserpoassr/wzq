# Gomoku AI Service

基于 AlphaZero 算法的五子棋 AI 服务，提供 REST API 接口供游戏服务器调用。

## 依赖安装

```bash
cd ai-service
pip install -r requirements.txt
```

## 配置

配置文件 `config.yaml` 包含以下设置：

- **server**: 服务器配置（端口、主机等）
- **model**: 模型配置（路径、棋盘大小）
- **network**: 神经网络参数
- **mcts**: MCTS 参数
- **difficulty**: 难度级别对应的 MCTS 模拟次数

### 环境变量覆盖

可以通过环境变量覆盖配置：

- `AI_CONFIG_PATH`: 配置文件路径（默认: config.yaml）
- `AI_MODEL_PATH`: 模型目录路径
- `AI_MODEL_FILE`: 模型文件名
- `AI_BOARD_SIZE`: 棋盘大小
- `AI_CUDA`: 是否使用 GPU（true/false）

## 模型文件

将预训练模型文件 `best.pth.tar` 放置在 `models/` 目录下。

## 启动服务

```bash
# 开发模式
python app.py

# 生产模式（使用 gunicorn）
gunicorn -w 1 -b 0.0.0.0:5001 app:app
```

## API 接口

### 健康检查

```
GET /health
```

响应：
```json
{
  "status": "ok",
  "model": "alphazero-15x15",
  "version": "1.0",
  "cuda": false
}
```

### 获取 AI 落子

```
POST /move
Content-Type: application/json

{
  "board": [[0,0,...], ...],  // 15x15 棋盘，0=空，1=黑，-1=白
  "currentPlayer": 1,          // 当前玩家（AI 执棋颜色）
  "difficulty": "medium"       // easy/medium/hard
}
```

响应：
```json
{
  "x": 7,
  "y": 7
}
```

## 难度级别

| 难度 | MCTS 模拟次数 | 预计响应时间 |
|------|--------------|-------------|
| easy | 100 | < 1秒 |
| medium | 400 | 2-3秒 |
| hard | 800 | 5-8秒 |

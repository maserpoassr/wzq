# Implementation Plan: AI vs Human Mode

## Overview

本实现计划将 AlphaZero 五子棋 AI 集成到现有项目中，分为 Python AI 服务和 Node.js 服务端两部分实现。

## Tasks

- [x] 1. 创建 Python AI 服务
  - [x] 1.1 创建 AI 服务目录结构和依赖配置
    - 创建 `ai-service/` 目录
    - 创建 `ai-service/requirements.txt` 包含 Flask, torch, numpy 等依赖
    - 复制 AlphaZero 核心代码（MCTS, NNet）
    - _Requirements: 6.3, 6.4_

  - [x] 1.2 实现 Flask REST API 服务
    - 创建 `ai-service/app.py`
    - 实现 `/health` 健康检查接口
    - 实现 `/move` AI 落子接口
    - 实现难度到 MCTS 模拟次数的映射
    - _Requirements: 3.2, 3.4, 3.6, 6.5_

  - [x] 1.3 实现棋盘格式转换
    - 项目格式 (0=空, 1=黑, 2=白) 转 AI 格式 (0=空, 1=黑, -1=白)
    - 处理 15x15 棋盘
    - _Requirements: 3.5_

  - [x] 1.4 配置模型加载
    - 支持从配置文件加载模型路径
    - 支持 CPU 和 GPU 运行
    - _Requirements: 6.4_

- [x] 2. 实现 Node.js AI 服务客户端
  - [x] 2.1 创建 AI 服务客户端模块
    - 创建 `src/aiServiceClient.js`
    - 实现 `checkHealth()` 方法
    - 实现 `getMove()` 方法
    - 实现棋盘格式转换函数
    - _Requirements: 3.1, 3.5, 6.1_

  - [x] 2.2 编写棋盘格式转换属性测试
    - **Property 5: Board State Conversion Round-Trip**
    - **Validates: Requirements 3.5**

  - [x] 2.3 实现超时和重试逻辑
    - 10秒超时
    - 失败后重试一次
    - 回退到随机落子
    - _Requirements: 3.2, 3.3_

- [x] 3. 实现 AI 房间数据结构
  - [x] 3.1 扩展房间管理器支持 AI 房间
    - 修改 `src/roomManager.js`
    - 添加 `createAIRoom()` 方法
    - 添加 `isAIRoom()` 检查方法
    - 从公开房间列表过滤 AI 房间
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 3.2 编写 AI 房间隐藏属性测试
    - **Property 2: AI Rooms Hidden from Public List**
    - **Validates: Requirements 1.4**

  - [x] 3.3 实现 AI 房间隔离
    - 禁止其他玩家加入 AI 房间
    - 禁止观战 AI 房间
    - _Requirements: 7.2, 7.4_

  - [x] 3.4 编写 AI 房间隔离属性测试
    - **Property 10: AI Room Join Rejection**
    - **Validates: Requirements 7.2, 7.4**

- [x] 4. 实现 AI 房间处理器
  - [x] 4.1 创建 AI 房间处理器模块
    - 创建 `src/aiRoomHandler.js`
    - 实现 `createAIRoom()` 创建 AI 房间
    - 实现 `handlePlayerMove()` 处理玩家落子后的 AI 响应
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [x] 4.2 编写 AI 房间创建属性测试
    - **Property 1: AI Room Creation Assigns AI Opponent**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 4.3 实现先后手选择逻辑
    - 玩家选择先手时，玩家执黑
    - 玩家选择后手时，AI 先落子
    - _Requirements: 5.2_

  - [x] 4.4 编写 AI 先手属性测试
    - **Property 8: AI First Move When Player Second**
    - **Validates: Requirements 5.2**

- [x] 5. 实现 AI 房间悔棋功能
  - [x] 5.1 实现 AI 房间悔棋逻辑
    - 一次撤销两步（玩家和 AI 的落子）
    - 只有一步时只撤销一步
    - 限制最多 3 次悔棋
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.2 编写悔棋属性测试
    - **Property 12: AI Undo Removes Two Moves**
    - **Property 13: Undo Count Limit Enforced**
    - **Validates: Requirements 8.1, 8.2, 8.4**

- [x] 6. 实现 AI 房间生命周期管理
  - [x] 6.1 实现玩家离开销毁房间
    - 玩家离开时立即销毁 AI 房间
    - 清理相关资源
    - _Requirements: 7.1_

  - [x] 6.2 编写房间销毁属性测试
    - **Property 9: AI Room Destroyed on Leave**
    - **Validates: Requirements 7.1**

  - [x] 6.3 实现再来一局功能
    - 重置棋盘
    - 交换玩家和 AI 的颜色
    - _Requirements: 7.3_

  - [x] 6.4 编写再来一局属性测试
    - **Property 11: AI Room Rematch Swaps Colors**
    - **Validates: Requirements 7.3**

- [x] 7. 集成到服务器主模块
  - [x] 7.1 添加 AI 服务状态检查
    - 启动时检查 AI 服务可用性
    - 广播 AI 服务状态给客户端
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 添加 Socket.io 事件处理
    - `create-ai-room` - 创建 AI 房间
    - `ai-place-stone` - 处理玩家落子和 AI 响应
    - `ai-undo` - AI 房间悔棋
    - `ai-rematch` - AI 房间再来一局
    - _Requirements: 1.1, 4.1, 8.1, 7.3_

  - [x] 7.3 实现 AI 思考状态广播
    - AI 计算时发送 `ai-thinking` 事件
    - AI 落子后发送 `ai-moved` 事件
    - _Requirements: 4.3, 4.4_

- [x] 8. Checkpoint - 后端功能验证
  - 确保所有测试通过
  - 手动测试 AI 服务通信
  - 如有问题请询问用户

- [x] 9. 前端界面更新
  - [x] 9.1 添加人机对战入口
    - 在大厅页面添加"人机对战"按钮
    - AI 服务不可用时禁用按钮
    - _Requirements: 1.1, 6.2_

  - [x] 9.2 实现难度和先后手选择界面
    - 难度选择：简单/中等/困难
    - 先后手选择：黑棋先手/白棋后手
    - _Requirements: 2.1, 5.1_

  - [x] 9.3 实现 AI 对战游戏界面
    - 显示 AI 对手标识
    - 显示 "AI 思考中..." 状态
    - 显示悔棋剩余次数
    - _Requirements: 1.3, 4.4, 8.2_

  - [x] 9.4 实现游戏结束和再来一局界面
    - 显示胜负结果
    - 提供再来一局按钮
    - _Requirements: 4.5, 7.3_

- [x] 10. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 完整流程测试
  - 如有问题请询问用户

## Notes

- 所有任务均为必需，包括属性测试
- Python AI 服务需要单独启动，默认端口 5001
- 需要预训练模型文件 `best.pth.tar`
- 棋盘大小固定为 15x15（与现有项目一致）

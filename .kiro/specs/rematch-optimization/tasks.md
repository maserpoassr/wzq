# Implementation Plan: Rematch Optimization

## Overview

本实现计划将"再来一局"功能从单方重置改为双方确认机制，并优化大厅弹窗交互。实现将分为服务端逻辑、前端逻辑和测试三个主要部分。

## Tasks

- [x] 1. 更新服务端再来一局逻辑
  - [x] 1.1 修改 server.js 中的 reset-room 事件处理
    - 移除当前的单方重置逻辑
    - 改为记录玩家的再来一局请求
    - 当双方都请求时才执行重置
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 添加再来一局超时处理
    - 添加 30 秒超时计时器
    - 超时后发送通知给请求方
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 更新离开房间逻辑
    - 玩家离开时取消其再来一局请求
    - 通知剩余玩家对方已离开
    - 房间状态重置为等待
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.4 实现颜色交换逻辑
    - 上局胜者在新局中执白
    - 确保双方角色正确更新
    - _Requirements: 1.5_

  - [x] 1.5 编写属性测试：再来一局请求记录
    - **Property 1: Rematch Request Recording**
    - **Validates: Requirements 1.1**

  - [x] 1.6 编写属性测试：双方确认触发重置
    - **Property 2: Both Players Rematch Triggers Reset**
    - **Validates: Requirements 1.2, 1.4**

- [x] 2. Checkpoint - 确保服务端逻辑测试通过
  - 运行所有测试，确保通过
  - 如有问题，询问用户

- [x] 3. 更新前端再来一局交互
  - [x] 3.1 修改游戏结束弹窗逻辑
    - 添加再来一局状态管理
    - 支持动态更新按钮状态
    - 显示等待状态和对方请求状态
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 添加 Socket 事件监听
    - 监听 rematch-waiting 事件
    - 监听 rematch-requested 事件
    - 监听 rematch-start 事件
    - 监听 opponent-left-rematch 事件
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 3.3 更新状态同步逻辑
    - 确保前端状态与服务端同步
    - 处理角色交换后的状态更新
    - _Requirements: 6.2, 6.3_

- [x] 4. 优化大厅弹窗交互
  - [x] 4.1 将"请先加入大厅"改为 toast 提示
    - 修改服务端错误响应类型
    - 前端使用 showToast 代替 showModal
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 优化未登录状态的 UI 引导
    - 自动聚焦到昵称输入框
    - _Requirements: 5.3_

- [x] 5. Checkpoint - 确保前端功能正常
  - 手动测试再来一局流程
  - 确保双方确认机制正常工作
  - 如有问题，询问用户

- [x] 6. 编写剩余属性测试
  - [x] 6.1 编写属性测试：单方请求显示等待
    - **Property 3: Single Player Rematch Shows Waiting**
    - **Validates: Requirements 1.3**

  - [x] 6.2 编写属性测试：颜色交换
    - **Property 4: Color Swap After Rematch**
    - **Validates: Requirements 1.5**

  - [x] 6.3 编写属性测试：离开更新房间
    - **Property 8: Leave During Rematch Updates Room**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 6.4 编写属性测试：状态广播一致性
    - **Property 9: State Broadcast Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 7. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件
  - 确保所有属性测试通过
  - 如有问题，询问用户

## Notes

- 所有任务都是必须完成的
- 核心功能是双方确认机制，确保先实现这部分
- 属性测试验证核心逻辑的正确性
- 前端弹窗更新需要支持动态状态变化

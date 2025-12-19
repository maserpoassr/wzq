# Requirements Document

## Introduction

本文档定义了五子棋游戏中"再来一局"功能和大厅弹窗交互的优化需求。当前实现存在以下问题：
1. "请先加入大厅"弹窗可能阻挡UI交互
2. "再来一局"功能中，先点击的玩家会独占房间，后点击或未点击的玩家会被踢出

优化目标是提供更流畅、公平的游戏体验。

## Glossary

- **Rematch_System**: 再来一局系统，负责处理游戏结束后双方玩家的重新开局请求
- **Modal_Manager**: 弹窗管理器，负责显示和关闭各类弹窗
- **Room_State**: 房间状态，包括 waiting（等待中）、playing（游戏中）、ended（已结束）
- **Rematch_Request**: 再来一局请求，玩家发起的重新开局意愿
- **Lobby_System**: 大厅系统，管理用户加入大厅和房间列表

## Requirements

### Requirement 1: 再来一局双方确认机制

**User Story:** As a player, I want both players to confirm before starting a new game, so that neither player is unexpectedly kicked from the room.

#### Acceptance Criteria

1. WHEN a player clicks "再来一局" button, THE Rematch_System SHALL record the player's rematch request and notify the opponent
2. WHEN both players have clicked "再来一局", THE Rematch_System SHALL reset the game board and start a new game with both players remaining in the room
3. WHEN only one player clicks "再来一局", THE Rematch_System SHALL display a waiting status to the requesting player
4. WHEN a player clicks "再来一局" and the opponent has already requested, THE Rematch_System SHALL immediately start the new game
5. WHEN a new game starts after rematch, THE Rematch_System SHALL swap the colors (previous winner becomes white/second player)

### Requirement 2: 再来一局超时处理

**User Story:** As a player, I want a timeout mechanism for rematch requests, so that I don't wait indefinitely for my opponent's response.

#### Acceptance Criteria

1. WHEN a rematch request is pending for more than 30 seconds, THE Rematch_System SHALL notify the requesting player that the opponent has not responded
2. WHEN the rematch timeout occurs, THE Rematch_System SHALL provide options to continue waiting or leave the room
3. IF the opponent disconnects during rematch waiting, THEN THE Rematch_System SHALL notify the waiting player and allow them to wait for a new opponent or leave

### Requirement 3: 离开房间确认

**User Story:** As a player, I want to be able to leave the room after a game ends, so that I can return to the lobby.

#### Acceptance Criteria

1. WHEN a player clicks "离开" button after game over, THE Room_State SHALL remove the player from the room and return them to the lobby
2. WHEN a player leaves during rematch waiting, THE Rematch_System SHALL notify the remaining player that the opponent has left
3. WHEN a player leaves, THE Room_State SHALL reset to waiting status if one player remains

### Requirement 4: 游戏结束弹窗优化

**User Story:** As a player, I want the game over modal to clearly show my options and the current rematch status, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN the game ends, THE Modal_Manager SHALL display the game result with "再来一局" and "离开" buttons
2. WHEN a player clicks "再来一局", THE Modal_Manager SHALL update the button to show waiting status (e.g., "等待对方...")
3. WHEN the opponent also requests rematch, THE Modal_Manager SHALL close automatically and show a toast notification
4. WHEN the opponent leaves, THE Modal_Manager SHALL update to show "对方已离开" with option to wait for new opponent or leave

### Requirement 5: 大厅弹窗交互优化

**User Story:** As a user, I want the "请先加入大厅" prompt to not block other UI interactions, so that I can still navigate the interface.

#### Acceptance Criteria

1. WHEN a user attempts an action requiring lobby membership, THE Lobby_System SHALL show a non-blocking toast notification instead of a modal
2. WHEN the toast is shown, THE Modal_Manager SHALL NOT prevent interaction with other UI elements
3. WHEN a user is not in the lobby, THE Lobby_System SHALL automatically redirect focus to the nickname input field

### Requirement 6: 房间状态同步

**User Story:** As a player, I want the room state to be synchronized between both players, so that we see consistent information.

#### Acceptance Criteria

1. WHEN a rematch request is made, THE Room_State SHALL broadcast the request status to all room participants
2. WHEN the game resets for a new match, THE Room_State SHALL synchronize the new board state to both players simultaneously
3. WHEN a player's connection status changes, THE Room_State SHALL update all participants about the change

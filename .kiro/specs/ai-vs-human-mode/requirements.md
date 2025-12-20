# Requirements Document

## Introduction

本功能为五子棋在线游戏添加人机对战模式，集成 AlphaZero 五子棋 AI，让玩家可以与 AI 进行对战。AI 基于 AlphaZero 算法实现，使用蒙特卡洛树搜索（MCTS）和神经网络进行决策。

## Glossary

- **AI_Service**: 运行 AlphaZero 五子棋 AI 的 Python 服务，负责计算 AI 落子
- **Game_Server**: Node.js 游戏服务器，处理游戏逻辑和客户端通信
- **AI_Room**: 人机对战房间，只有一个人类玩家与 AI 对战
- **AI_Difficulty**: AI 难度级别，通过 MCTS 模拟次数控制
- **Board_State**: 15x15 棋盘状态，0=空，1=黑，2=白
- **MCTS**: 蒙特卡洛树搜索算法，用于 AI 决策

## Requirements

### Requirement 1: 人机对战模式入口

**User Story:** As a player, I want to start a game against AI, so that I can practice and enjoy the game without waiting for other players.

#### Acceptance Criteria

1. WHEN a user clicks the "人机对战" button on the lobby page, THE Game_Server SHALL create an AI_Room with the user as the human player
2. WHEN an AI_Room is created, THE Game_Server SHALL automatically assign AI as the opponent
3. WHEN a user enters an AI_Room, THE Game_Server SHALL display the game board and indicate that the opponent is AI
4. THE Game_Server SHALL NOT show AI_Room in the public room list

### Requirement 2: AI 难度选择

**User Story:** As a player, I want to choose AI difficulty level, so that I can have an appropriate challenge.

#### Acceptance Criteria

1. WHEN a user starts a human-vs-AI game, THE Game_Server SHALL present difficulty options (简单/中等/困难)
2. WHEN "简单" difficulty is selected, THE AI_Service SHALL use 100 MCTS simulations per move
3. WHEN "中等" difficulty is selected, THE AI_Service SHALL use 400 MCTS simulations per move
4. WHEN "困难" difficulty is selected, THE AI_Service SHALL use 800 MCTS simulations per move
5. THE Game_Server SHALL store the selected difficulty in the AI_Room

### Requirement 3: AI 服务通信

**User Story:** As a system, I want to communicate with the AI service reliably, so that AI moves can be calculated correctly.

#### Acceptance Criteria

1. WHEN the Game_Server needs an AI move, THE Game_Server SHALL send the current Board_State to the AI_Service
2. WHEN the AI_Service receives a Board_State, THE AI_Service SHALL return the best move coordinates (x, y) within 10 seconds
3. IF the AI_Service fails to respond within 10 seconds, THEN THE Game_Server SHALL retry once before falling back to a random valid move
4. WHEN the AI_Service calculates a move, THE AI_Service SHALL only return valid empty positions
5. THE Game_Server SHALL serialize Board_State as JSON with format: `{"board": [[...]], "currentPlayer": 1|-1, "difficulty": "easy"|"medium"|"hard"}`
6. THE AI_Service SHALL respond with JSON format: `{"x": number, "y": number}`

### Requirement 4: 人机对战游戏流程

**User Story:** As a player, I want the AI to respond to my moves automatically, so that I can have a smooth gaming experience.

#### Acceptance Criteria

1. WHEN a human player places a stone in an AI_Room, THE Game_Server SHALL immediately request an AI move from the AI_Service
2. WHEN the AI_Service returns a move, THE Game_Server SHALL place the AI's stone on the board
3. WHEN the AI places a stone, THE Game_Server SHALL broadcast the move to the human player with a visual indicator that it's an AI move
4. WHILE waiting for AI move, THE Game_Server SHALL display a "AI 思考中..." indicator to the human player
5. WHEN the game ends (win/draw), THE Game_Server SHALL display the result and offer "再来一局" option
6. THE Game_Server SHALL apply the same win detection logic (5 in a row) for AI_Room as regular rooms

### Requirement 5: 先后手选择

**User Story:** As a player, I want to choose whether to play first or second, so that I can experience different game strategies.

#### Acceptance Criteria

1. WHEN starting a human-vs-AI game, THE Game_Server SHALL ask the player to choose first move (黑棋先手) or second move (白棋后手)
2. WHEN the player chooses to play second, THE AI_Service SHALL make the first move automatically
3. THE Game_Server SHALL clearly indicate which color the human player is playing

### Requirement 6: AI 服务启动与管理

**User Story:** As a system administrator, I want the AI service to be managed properly, so that it's available when needed.

#### Acceptance Criteria

1. WHEN the Game_Server starts, THE Game_Server SHALL attempt to connect to the AI_Service
2. IF the AI_Service is not available, THEN THE Game_Server SHALL disable the "人机对战" button and show "AI 服务不可用"
3. THE AI_Service SHALL run as a separate Python HTTP server on a configurable port (default: 5001)
4. THE AI_Service SHALL load the pre-trained model on startup
5. WHEN the AI_Service receives a health check request, THE AI_Service SHALL respond with status and model info

### Requirement 7: 人机对战房间管理

**User Story:** As a player, I want to leave and rejoin AI games freely, so that I have flexibility in my gaming session.

#### Acceptance Criteria

1. WHEN a player leaves an AI_Room, THE Game_Server SHALL immediately destroy the room
2. THE Game_Server SHALL NOT allow other players to join an AI_Room
3. WHEN a player requests "再来一局" in an AI_Room, THE Game_Server SHALL reset the board and swap colors
4. THE AI_Room SHALL NOT have spectators/watchers

### Requirement 8: 悔棋功能（人机模式）

**User Story:** As a player, I want to undo my moves when playing against AI, so that I can learn from mistakes.

#### Acceptance Criteria

1. WHEN a player requests undo in an AI_Room, THE Game_Server SHALL immediately undo the last two moves (player's move and AI's response)
2. THE Game_Server SHALL limit undo to 3 times per game in AI_Room
3. IF only one move exists (AI's first move), THEN THE Game_Server SHALL undo only that one move
4. WHEN undo is performed, THE Game_Server SHALL update the board and switch turn appropriately

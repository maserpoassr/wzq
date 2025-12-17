# Requirements Document

## Introduction

本文档定义了一个生产级别的在线多人五子棋（Gomoku Online）网页游戏的需求规格。该游戏支持多人同时在线对战、房间系统、观战、聊天等完整功能。技术栈采用纯原生技术（HTML5 + CSS3 + Vanilla JavaScript + Canvas + Socket.io），后端使用 Node.js + Express + Socket.io，支持 Docker 一键部署。

## Glossary

- **Gomoku System**: 在线五子棋游戏系统，包含前端界面和后端服务
- **Player**: 参与游戏的用户，可以是黑棋方或白棋方
- **Watcher**: 观战者，可以观看游戏但不能落子
- **Room**: 游戏房间，包含棋盘状态、玩家信息、聊天记录等
- **Board**: 15×15的棋盘，用于放置棋子
- **Stone**: 棋子，分为黑棋（Black）和白棋（White）
- **Lobby**: 游戏大厅，显示房间列表和在线人数
- **Turn**: 回合，表示当前应该落子的一方
- **Win Condition**: 胜利条件，任意方向连成5子

## Requirements

### Requirement 1: 玩家身份管理

**User Story:** As a player, I want to set my nickname and have it remembered, so that I can be identified in the game without re-entering it every time.

#### Acceptance Criteria

1. WHEN a player enters the Gomoku System for the first time THEN the Gomoku System SHALL display a nickname input field requiring the player to enter a nickname before accessing the lobby
2. WHEN a player submits a valid nickname (1-20 characters, supporting Chinese and English) THEN the Gomoku System SHALL store the nickname in localStorage and proceed to the lobby
3. WHEN a player with a previously stored nickname visits the Gomoku System THEN the Gomoku System SHALL auto-fill the nickname input field with the stored value
4. WHEN a player attempts to submit an empty or whitespace-only nickname THEN the Gomoku System SHALL display an error message and prevent lobby access

### Requirement 2: 游戏大厅功能

**User Story:** As a player, I want to see all available rooms and online players, so that I can choose how to join a game.

#### Acceptance Criteria

1. WHEN a player enters the lobby THEN the Gomoku System SHALL display the current online player count updated in real-time
2. WHEN a player views the room list THEN the Gomoku System SHALL display each room with: Room ID (4-6 digits), Room Name, Black Player nickname (or empty), White Player nickname (or empty), Status (waiting/playing/ended), Watcher count, and action buttons
3. WHEN a room has an empty player slot and status is "waiting" THEN the Gomoku System SHALL display a "Join" button for that room
4. WHEN a room is in any status THEN the Gomoku System SHALL display a "Watch" button allowing players to spectate
5. WHEN a player clicks "Create Room" THEN the Gomoku System SHALL display a modal for entering room name (default: "[nickname]的房间") and create the room with the player as Black
6. WHEN a player clicks "Quick Match" THEN the Gomoku System SHALL automatically join an available waiting room, or create a new room if none exists
7. WHEN a player clicks "Refresh List" THEN the Gomoku System SHALL fetch and display the latest room list from the server
8. WHEN room status changes (created/joined/left/ended) THEN the Gomoku System SHALL broadcast the update to all players in the lobby

### Requirement 3: 房间管理

**User Story:** As a player, I want to create and join game rooms, so that I can play against other players.

#### Acceptance Criteria

1. WHEN a player creates a room THEN the Gomoku System SHALL generate a unique 4-6 digit Room ID and initialize an empty 15×15 board
2. WHEN a player joins a room as the second player THEN the Gomoku System SHALL assign them as White and change room status to "playing"
3. WHEN a player joins as a watcher THEN the Gomoku System SHALL add them to the watcher list and allow them to view the game and chat
4. WHEN a player attempts to join a full room (both player slots occupied) THEN the Gomoku System SHALL reject the join request and display an error message
5. WHEN a player leaves a room THEN the Gomoku System SHALL remove them from the room and broadcast "[nickname] has left" to remaining participants
6. WHEN a room has no players or watchers for 5 minutes THEN the Gomoku System SHALL automatically delete the room

### Requirement 4: 棋盘渲染与交互

**User Story:** As a player, I want a beautiful and responsive game board, so that I can enjoy playing the game on any device.

#### Acceptance Criteria

1. WHEN the game room loads THEN the Gomoku System SHALL render a 15×15 Canvas board with wood-grain background texture
2. WHEN rendering stones THEN the Gomoku System SHALL display black and white stones with gradient shading and shadow effects for 3D appearance
3. WHEN a player clicks on the board THEN the Gomoku System SHALL snap the click position to the nearest grid intersection point
4. WHEN a stone is placed THEN the Gomoku System SHALL highlight the last placed stone with a visual indicator (e.g., red dot or glow)
5. WHEN the game is played on mobile devices THEN the Gomoku System SHALL support touch interactions and scale the board appropriately for the screen size
6. WHEN the viewport changes (resize/orientation change) THEN the Gomoku System SHALL re-render the board to fit the new dimensions while maintaining aspect ratio

### Requirement 5: 游戏核心逻辑

**User Story:** As a player, I want accurate game rules enforcement, so that the game is fair and follows standard Gomoku rules.

#### Acceptance Criteria

1. WHEN a player attempts to place a stone on an occupied intersection THEN the Gomoku System SHALL reject the move and display an error message
2. WHEN a player attempts to place a stone during the opponent's turn THEN the Gomoku System SHALL reject the move and display "Not your turn" message
3. WHEN a player places a stone THEN the Gomoku System SHALL check for win condition in all four directions (horizontal, vertical, diagonal-right, diagonal-left)
4. WHEN five or more consecutive stones of the same color are detected THEN the Gomoku System SHALL declare that player as winner, highlight the winning stones, and end the game
5. WHEN a game ends THEN the Gomoku System SHALL prevent any further stone placement until a new game starts

### Requirement 6: 悔棋与认输机制

**User Story:** As a player, I want to request undo moves or surrender, so that I have options when I make mistakes or want to end the game early.

#### Acceptance Criteria

1. WHEN a player clicks "Undo" button THEN the Gomoku System SHALL send an undo request to the opponent
2. WHEN an undo request is received THEN the Gomoku System SHALL display a confirmation dialog to the opponent with "Accept" and "Reject" options
3. WHEN the opponent accepts the undo request THEN the Gomoku System SHALL remove the last placed stone and switch the turn back
4. WHEN the opponent rejects the undo request THEN the Gomoku System SHALL notify the requester that undo was rejected
5. WHEN a player clicks "Surrender" button THEN the Gomoku System SHALL immediately end the game with the opponent as winner

### Requirement 7: 实时通信与同步

**User Story:** As a player, I want all game actions to be synchronized in real-time, so that all participants see the same game state.

#### Acceptance Criteria

1. WHEN a player places a stone THEN the Gomoku System SHALL broadcast the move to all room participants within 100ms
2. WHEN a player sends a chat message THEN the Gomoku System SHALL broadcast the message with timestamp and nickname to all room participants
3. WHEN a player disconnects THEN the Gomoku System SHALL notify other room participants and preserve the game state for potential reconnection
4. WHEN a disconnected player reconnects within 2 minutes THEN the Gomoku System SHALL restore their position in the room and sync the current game state
5. WHEN the room state changes (player join/leave, game start/end) THEN the Gomoku System SHALL broadcast the update to all room participants and lobby viewers

### Requirement 8: 聊天功能

**User Story:** As a player or watcher, I want to chat with others in the room, so that I can communicate during the game.

#### Acceptance Criteria

1. WHEN a participant sends a chat message THEN the Gomoku System SHALL display the message with timestamp, sender nickname, and message content
2. WHEN a participant presses Enter key in the chat input THEN the Gomoku System SHALL send the message (equivalent to clicking Send button)
3. WHEN a message contains emoji shortcuts (e.g., :) :D) THEN the Gomoku System SHALL convert them to corresponding emoji characters
4. WHEN the chat history exceeds the visible area THEN the Gomoku System SHALL enable scrolling and auto-scroll to the latest message

### Requirement 9: 游戏信息显示

**User Story:** As a player or watcher, I want to see game status and player information, so that I can understand the current game state.

#### Acceptance Criteria

1. WHEN viewing a game room THEN the Gomoku System SHALL display Room ID and Room Name prominently
2. WHEN viewing player information THEN the Gomoku System SHALL show both players' nicknames with their stone color indicators
3. WHEN it is a player's turn THEN the Gomoku System SHALL highlight that player's information panel
4. WHEN watchers are present THEN the Gomoku System SHALL display a scrollable list of watcher nicknames
5. WHEN a game ends THEN the Gomoku System SHALL display a result modal showing the winner

### Requirement 10: 响应式设计

**User Story:** As a player, I want to play the game on any device, so that I can enjoy the game on PC, tablet, or mobile phone.

#### Acceptance Criteria

1. WHEN the game is accessed on a desktop browser THEN the Gomoku System SHALL display the full layout with sidebar information panels
2. WHEN the game is accessed on a tablet or mobile device THEN the Gomoku System SHALL adapt the layout to fit the screen with collapsible panels
3. WHEN the device orientation changes THEN the Gomoku System SHALL re-layout the interface appropriately within 500ms
4. WHEN touch interactions occur on mobile THEN the Gomoku System SHALL respond to taps for stone placement and support pinch-to-zoom on the board

### Requirement 11: 部署与运维

**User Story:** As a developer, I want easy deployment options, so that I can quickly deploy and maintain the game server.

#### Acceptance Criteria

1. WHEN running "npm start" THEN the Gomoku System SHALL start the server on port 3000 (or PORT environment variable)
2. WHEN building with Docker THEN the Gomoku System SHALL create a container image that runs the complete application
3. WHEN the server starts THEN the Gomoku System SHALL log the listening port and ready status to console
4. WHEN an unhandled error occurs THEN the Gomoku System SHALL log the error details and continue running without crashing

### Requirement 12: 数据序列化与状态管理

**User Story:** As a system, I want to serialize and deserialize game state, so that game data can be transmitted and stored correctly.

#### Acceptance Criteria

1. WHEN transmitting room state over Socket.io THEN the Gomoku System SHALL serialize the state to JSON format
2. WHEN receiving room state from server THEN the Gomoku System SHALL deserialize JSON and reconstruct the game state object
3. WHEN storing room state in memory THEN the Gomoku System SHALL maintain a consistent data structure for all room properties
4. WHEN a client requests room state THEN the Gomoku System SHALL return a complete snapshot including board, players, watchers, history, and chat

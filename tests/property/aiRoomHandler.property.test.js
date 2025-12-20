/**
 * Property-Based Tests for AI Room Handler
 * 
 * Properties tested:
 * - Property 1: AI Room Creation Assigns AI Opponent
 * - Property 8: AI First Move When Player Second
 * - Property 9: AI Room Destroyed on Leave
 * - Property 11: AI Room Rematch Swaps Colors
 * - Property 12: AI Undo Removes Two Moves
 * - Property 13: Undo Count Limit Enforced
 * 
 * **Validates: Requirements 1.1, 1.2, 5.2, 7.1, 7.3, 8.1, 8.2, 8.4**
 */

const fc = require('fast-check');
const RoomManager = require('../../src/roomManager');
const AIServiceClient = require('../../src/aiServiceClient');
const AIRoomHandler = require('../../src/aiRoomHandler');
const GameLogic = require('../../src/gameLogic');

describe('AI Room Handler Properties', () => {
  // 生成有效昵称的 arbitrary
  const nicknameArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => s.trim().length > 0);
  
  // 生成 socket ID 的 arbitrary
  const socketIdArb = fc.uuid();
  
  // 生成玩家信息的 arbitrary
  const playerArb = fc.record({
    socketId: socketIdArb,
    nickname: nicknameArb
  });

  // 难度选项 arbitrary
  const difficultyArb = fc.constantFrom('easy', 'medium', 'hard');

  // Mock AI client that returns a valid move
  class MockAIClient {
    constructor() {
      this.moveCallCount = 0;
    }
    
    async getMove(board, currentPlayer, difficulty) {
      this.moveCallCount++;
      // Return center position (7, 7) as first move - common opening
      return { x: 7, y: 7 };
    }
  }

  /**
   * **Feature: ai-vs-human-mode, Property 1: AI Room Creation Assigns AI Opponent**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * *For any* AI room creation request with valid player info and difficulty, 
   * the created room should have exactly one human player and one AI player assigned.
   */
  describe('Property 1: AI Room Creation Assigns AI Opponent', () => {
    test('AI room has exactly one human player and one AI player', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new AIServiceClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 验证房间存在且是 AI 房间
            if (!room || !room.isAIRoom) return false;
            
            // 验证有两个玩家位置都被占用
            if (!room.players.black || !room.players.white) return false;
            
            // 计算人类玩家和 AI 玩家数量
            let humanCount = 0;
            let aiCount = 0;
            
            if (room.players.black.isAI) {
              aiCount++;
            } else {
              humanCount++;
            }
            
            if (room.players.white.isAI) {
              aiCount++;
            } else {
              humanCount++;
            }
            
            // 应该恰好有 1 个人类玩家和 1 个 AI 玩家
            return humanCount === 1 && aiCount === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('human player is assigned correct color based on playerFirst', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new AIServiceClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            if (playerFirst) {
              // 玩家先手，应该执黑
              // 黑棋应该是人类玩家
              if (room.players.black.isAI) return false;
              if (!room.players.white.isAI) return false;
              if (room.players.black.socketId !== player.socketId) return false;
              if (room.aiConfig.playerColor !== GameLogic.BLACK) return false;
              if (room.aiConfig.aiColor !== GameLogic.WHITE) return false;
            } else {
              // 玩家后手，应该执白
              // 白棋应该是人类玩家
              if (!room.players.black.isAI) return false;
              if (room.players.white.isAI) return false;
              if (room.players.white.socketId !== player.socketId) return false;
              if (room.aiConfig.playerColor !== GameLogic.WHITE) return false;
              if (room.aiConfig.aiColor !== GameLogic.BLACK) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('AI room has correct difficulty stored', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new AIServiceClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 验证难度配置正确
            return room.aiConfig.difficulty === difficulty;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('AI room status is playing immediately after creation', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new AIServiceClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // AI 房间创建后应该直接是 playing 状态
            return room.status === 'playing';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('needsAIFirstMove is true when player chooses second', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new AIServiceClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { needsAIFirstMove } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 如果玩家选择后手，needsAIFirstMove 应该为 true
            // 如果玩家选择先手，needsAIFirstMove 应该为 false
            return needsAIFirstMove === !playerFirst;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-vs-human-mode, Property 8: AI First Move When Player Second**
   * **Validates: Requirements 5.2**
   * 
   * *For any* AI room where the player chose to play second (white), 
   * the AI should automatically make the first move before the player's turn.
   */
  describe('Property 8: AI First Move When Player Second', () => {
    test('when player chooses second, AI should be black and go first', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家选择后手
            const { room, needsAIFirstMove } = handler.createAIRoom(player, difficulty, false);
            
            // 验证 AI 是黑棋（先手）
            if (room.aiConfig.aiColor !== GameLogic.BLACK) return false;
            
            // 验证玩家是白棋（后手）
            if (room.aiConfig.playerColor !== GameLogic.WHITE) return false;
            
            // 验证需要 AI 先手
            if (!needsAIFirstMove) return false;
            
            // 验证当前回合是黑棋（AI）
            if (room.currentTurn !== GameLogic.BLACK) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handleAIFirstMove places AI stone when player is second', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArb,
          difficultyArb,
          async (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家选择后手
            const { room } = handler.createAIRoom(player, difficulty, false);
            
            // 验证棋盘初始为空
            if (room.history.length !== 0) return false;
            
            // 执行 AI 先手
            const result = await handler.handleAIFirstMove(room.id);
            
            // 验证成功
            if (!result.success) return false;
            
            // 验证返回了落子位置
            if (result.move === undefined) return false;
            
            // 验证棋盘上有一个棋子
            if (room.history.length !== 1) return false;
            
            // 验证落子是 AI 的（黑棋）
            if (room.history[0].color !== GameLogic.BLACK) return false;
            if (!room.history[0].isAI) return false;
            
            // 验证当前回合切换到玩家（白棋）
            if (room.currentTurn !== GameLogic.WHITE) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handleAIFirstMove fails when player is first', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerArb,
          difficultyArb,
          async (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家选择先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 尝试执行 AI 先手（应该失败）
            const result = await handler.handleAIFirstMove(room.id);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== 'AI 不是先手') return false;
            
            // 验证棋盘仍然为空
            if (room.history.length !== 0) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('when player chooses first, needsAIFirstMove is false', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家选择先手
            const { room, needsAIFirstMove } = handler.createAIRoom(player, difficulty, true);
            
            // 验证不需要 AI 先手
            if (needsAIFirstMove) return false;
            
            // 验证玩家是黑棋（先手）
            if (room.aiConfig.playerColor !== GameLogic.BLACK) return false;
            
            // 验证 AI 是白棋（后手）
            if (room.aiConfig.aiColor !== GameLogic.WHITE) return false;
            
            // 验证当前回合是黑棋（玩家）
            if (room.currentTurn !== GameLogic.BLACK) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-vs-human-mode, Property 9: AI Room Destroyed on Leave**
   * **Validates: Requirements 7.1**
   * 
   * *For any* AI room, when the human player leaves, the room should be 
   * immediately destroyed and removed from the room manager.
   */
  describe('Property 9: AI Room Destroyed on Leave', () => {
    test('AI room is destroyed when player leaves', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            const roomId = room.id;
            
            // 验证房间存在
            if (!roomManager.getRoom(roomId)) return false;
            
            // 玩家离开
            const result = handler.handlePlayerLeave(roomId);
            
            // 验证离开成功且房间被销毁
            if (!result.success) return false;
            if (!result.destroyed) return false;
            
            // 验证房间不再存在
            if (roomManager.getRoom(roomId) !== null) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('AI room is removed from room manager after leave', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            const roomId = room.id;
            
            // 记录房间数量
            const roomCountBefore = roomManager.getRoomCount();
            
            // 玩家离开
            handler.handlePlayerLeave(roomId);
            
            // 验证房间数量减少
            const roomCountAfter = roomManager.getRoomCount();
            if (roomCountAfter !== roomCountBefore - 1) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handlePlayerLeave fails for non-existent room', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (fakeRoomId) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 尝试离开不存在的房间
            const result = handler.handlePlayerLeave(fakeRoomId);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== '房间不存在') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handlePlayerLeave fails for non-AI room', () => {
      fc.assert(
        fc.property(
          playerArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (player, roomName) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建普通房间（非 AI 房间）
            const room = roomManager.createRoom(roomName, player);
            
            // 尝试使用 AI 房间处理器离开
            const result = handler.handlePlayerLeave(room.id);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== '不是 AI 房间') return false;
            
            // 验证房间仍然存在
            if (!roomManager.getRoom(room.id)) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('AI thinking state is cleared on leave', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 模拟 AI 正在思考
            room.aiThinking = true;
            
            // 玩家离开
            const result = handler.handlePlayerLeave(room.id);
            
            // 验证成功
            if (!result.success) return false;
            if (!result.destroyed) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-vs-human-mode, Property 12: AI Undo Removes Two Moves**
   * **Validates: Requirements 8.1, 8.4**
   * 
   * *For any* AI room with at least 2 moves in history, executing undo should remove 
   * exactly 2 moves (player's move and AI's response), and the board state should 
   * match the state before those moves.
   */
  describe('Property 12: AI Undo Removes Two Moves', () => {
    // Helper to add moves to a room
    const addMoveToRoom = (room, x, y, color, isAI = false) => {
      GameLogic.placeStone(room.board, x, y, color);
      room.history.push({ x, y, color, timestamp: Date.now(), isAI });
      room.currentTurn = color === GameLogic.BLACK ? GameLogic.WHITE : GameLogic.BLACK;
    };

    test('undo removes exactly 2 moves when history has 2+ moves', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.integer({ min: 2, max: 10 }),
          (player, difficulty, numMoves) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加指定数量的落子（交替黑白）
            const positions = [];
            for (let i = 0; i < numMoves; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
              positions.push({ x, y, color });
            }
            
            const historyLengthBefore = room.history.length;
            
            // 执行悔棋
            const result = handler.executeAIUndo(room.id);
            
            // 验证成功
            if (!result.success) return false;
            
            // 验证移除了 2 步
            if (result.movesRemoved !== 2) return false;
            
            // 验证历史长度减少了 2
            if (room.history.length !== historyLengthBefore - 2) return false;
            
            // 验证被移除的位置现在是空的
            const lastPos = positions[positions.length - 1];
            const secondLastPos = positions[positions.length - 2];
            if (room.board[lastPos.x][lastPos.y] !== GameLogic.EMPTY) return false;
            if (room.board[secondLastPos.x][secondLastPos.y] !== GameLogic.EMPTY) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('undo removes only 1 move when history has exactly 1 move', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家后手（AI 先手）
            const { room } = handler.createAIRoom(player, difficulty, false);
            
            // 添加 1 步落子（AI 的第一步）
            addMoveToRoom(room, 7, 7, GameLogic.BLACK, true);
            
            // 执行悔棋
            const result = handler.executeAIUndo(room.id);
            
            // 验证成功
            if (!result.success) return false;
            
            // 验证只移除了 1 步
            if (result.movesRemoved !== 1) return false;
            
            // 验证历史为空
            if (room.history.length !== 0) return false;
            
            // 验证棋盘位置为空
            if (room.board[7][7] !== GameLogic.EMPTY) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('undo fails when history is empty', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 不添加任何落子，直接悔棋
            const result = handler.executeAIUndo(room.id);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== '没有可撤销的落子') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('board state matches state before undone moves', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.integer({ min: 4, max: 10 }),
          (player, difficulty, numMoves) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加落子
            for (let i = 0; i < numMoves; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 保存悔棋前的棋盘状态（去掉最后两步）
            const expectedBoard = GameLogic.createEmptyBoard();
            for (let i = 0; i < numMoves - 2; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              expectedBoard[x][y] = color;
            }
            
            // 执行悔棋
            handler.executeAIUndo(room.id);
            
            // 验证棋盘状态匹配
            for (let i = 0; i < 15; i++) {
              for (let j = 0; j < 15; j++) {
                if (room.board[i][j] !== expectedBoard[i][j]) return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-vs-human-mode, Property 13: Undo Count Limit Enforced**
   * **Validates: Requirements 8.2**
   * 
   * *For any* AI room, the undo count should never exceed 3, and undo requests 
   * beyond this limit should be rejected with an appropriate error.
   */
  describe('Property 13: Undo Count Limit Enforced', () => {
    // Helper to add moves to a room
    const addMoveToRoom = (room, x, y, color, isAI = false) => {
      GameLogic.placeStone(room.board, x, y, color);
      room.history.push({ x, y, color, timestamp: Date.now(), isAI });
      room.currentTurn = color === GameLogic.BLACK ? GameLogic.WHITE : GameLogic.BLACK;
    };

    test('undo count never exceeds maxUndo (3)', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.integer({ min: 4, max: 6 }),
          (player, difficulty, undoAttempts) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加足够多的落子以支持多次悔棋
            for (let i = 0; i < 20; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 尝试多次悔棋
            let successCount = 0;
            for (let i = 0; i < undoAttempts; i++) {
              const result = handler.executeAIUndo(room.id);
              if (result.success) {
                successCount++;
              }
            }
            
            // 验证成功次数不超过 3
            if (successCount > 3) return false;
            
            // 验证 undoCount 不超过 maxUndo
            if (room.undoCount > room.maxUndo) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('4th undo attempt is rejected with appropriate error', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加足够多的落子
            for (let i = 0; i < 20; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 执行 3 次悔棋（应该都成功）
            for (let i = 0; i < 3; i++) {
              const result = handler.executeAIUndo(room.id);
              if (!result.success) return false;
            }
            
            // 验证 undoCount 为 3
            if (room.undoCount !== 3) return false;
            
            // 第 4 次悔棋应该失败
            const result = handler.executeAIUndo(room.id);
            if (result.success) return false;
            if (result.error !== '悔棋次数已用完') return false;
            
            // 验证 undoCount 仍然是 3
            if (room.undoCount !== 3) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('remainingUndos decreases correctly after each undo', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加足够多的落子
            for (let i = 0; i < 20; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 验证初始剩余次数为 3
            if (handler.getRemainingUndos(room.id) !== 3) return false;
            
            // 执行悔棋并验证剩余次数
            for (let i = 0; i < 3; i++) {
              const result = handler.executeAIUndo(room.id);
              if (!result.success) return false;
              if (result.remainingUndos !== 2 - i) return false;
              if (handler.getRemainingUndos(room.id) !== 2 - i) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('canUndo returns false when undo limit reached', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          (player, difficulty) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间，玩家先手
            const { room } = handler.createAIRoom(player, difficulty, true);
            
            // 添加足够多的落子
            for (let i = 0; i < 20; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 初始应该可以悔棋
            let canUndoResult = handler.canUndo(room.id);
            if (!canUndoResult.canUndo) return false;
            
            // 执行 3 次悔棋
            for (let i = 0; i < 3; i++) {
              handler.executeAIUndo(room.id);
            }
            
            // 现在应该不能悔棋
            canUndoResult = handler.canUndo(room.id);
            if (canUndoResult.canUndo) return false;
            if (canUndoResult.reason !== '悔棋次数已用完') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-vs-human-mode, Property 11: AI Room Rematch Swaps Colors**
   * **Validates: Requirements 7.3**
   * 
   * *For any* AI room rematch request, the board should be reset to empty 
   * and the player/AI colors should be swapped.
   */
  describe('Property 11: AI Room Rematch Swaps Colors', () => {
    // Helper to add moves to a room
    const addMoveToRoom = (room, x, y, color, isAI = false) => {
      GameLogic.placeStone(room.board, x, y, color);
      room.history.push({ x, y, color, timestamp: Date.now(), isAI });
      room.currentTurn = color === GameLogic.BLACK ? GameLogic.WHITE : GameLogic.BLACK;
    };

    test('rematch swaps player and AI colors', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 记录原始颜色
            const originalPlayerColor = room.aiConfig.playerColor;
            const originalAIColor = room.aiConfig.aiColor;
            
            // 添加一些落子模拟游戏进行
            addMoveToRoom(room, 7, 7, GameLogic.BLACK, room.aiConfig.aiColor === GameLogic.BLACK);
            addMoveToRoom(room, 7, 8, GameLogic.WHITE, room.aiConfig.aiColor === GameLogic.WHITE);
            
            // 执行再来一局
            const result = handler.resetAIRoom(room.id);
            
            // 验证成功
            if (!result.success) return false;
            
            // 验证颜色交换
            if (result.newPlayerColor !== originalAIColor) return false;
            if (result.newAIColor !== originalPlayerColor) return false;
            if (room.aiConfig.playerColor !== originalAIColor) return false;
            if (room.aiConfig.aiColor !== originalPlayerColor) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch resets board to empty', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          fc.integer({ min: 2, max: 10 }),
          (player, difficulty, playerFirst, numMoves) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 添加一些落子
            for (let i = 0; i < numMoves; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 验证棋盘不为空
            let hasStones = false;
            for (let i = 0; i < 15 && !hasStones; i++) {
              for (let j = 0; j < 15 && !hasStones; j++) {
                if (room.board[i][j] !== GameLogic.EMPTY) {
                  hasStones = true;
                }
              }
            }
            if (!hasStones) return false;
            
            // 执行再来一局
            handler.resetAIRoom(room.id);
            
            // 验证棋盘为空
            for (let i = 0; i < 15; i++) {
              for (let j = 0; j < 15; j++) {
                if (room.board[i][j] !== GameLogic.EMPTY) return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch resets history to empty', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          fc.integer({ min: 2, max: 10 }),
          (player, difficulty, playerFirst, numMoves) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 添加一些落子
            for (let i = 0; i < numMoves; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            
            // 验证历史不为空
            if (room.history.length === 0) return false;
            
            // 执行再来一局
            handler.resetAIRoom(room.id);
            
            // 验证历史为空
            if (room.history.length !== 0) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch resets undo count to 0', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 添加一些落子并执行悔棋
            for (let i = 0; i < 6; i++) {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const color = i % 2 === 0 ? GameLogic.BLACK : GameLogic.WHITE;
              const isAI = color === room.aiConfig.aiColor;
              addMoveToRoom(room, x, y, color, isAI);
            }
            handler.executeAIUndo(room.id);
            
            // 验证悔棋次数不为 0
            if (room.undoCount === 0) return false;
            
            // 执行再来一局
            handler.resetAIRoom(room.id);
            
            // 验证悔棋次数重置为 0
            if (room.undoCount !== 0) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch sets status to playing', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 模拟游戏结束
            room.status = 'ended';
            room.winner = GameLogic.BLACK;
            
            // 执行再来一局
            handler.resetAIRoom(room.id);
            
            // 验证状态为 playing
            if (room.status !== 'playing') return false;
            if (room.winner !== null) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch returns needsAIFirstMove correctly', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 执行再来一局
            const result = handler.resetAIRoom(room.id);
            
            // 验证 needsAIFirstMove 正确
            // 如果新的 AI 颜色是黑棋，则需要 AI 先手
            const expectedNeedsAIFirstMove = result.newAIColor === GameLogic.BLACK;
            if (result.needsAIFirstMove !== expectedNeedsAIFirstMove) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch assigns players to correct positions after swap', () => {
      fc.assert(
        fc.property(
          playerArb,
          difficultyArb,
          fc.boolean(),
          (player, difficulty, playerFirst) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建 AI 房间
            const { room } = handler.createAIRoom(player, difficulty, playerFirst);
            
            // 执行再来一局
            const result = handler.resetAIRoom(room.id);
            
            // 验证玩家位置正确
            if (result.newPlayerColor === GameLogic.BLACK) {
              // 玩家应该在黑棋位置
              if (room.players.black.isAI) return false;
              if (room.players.black.socketId !== player.socketId) return false;
              // AI 应该在白棋位置
              if (!room.players.white.isAI) return false;
            } else {
              // 玩家应该在白棋位置
              if (room.players.white.isAI) return false;
              if (room.players.white.socketId !== player.socketId) return false;
              // AI 应该在黑棋位置
              if (!room.players.black.isAI) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch fails for non-existent room', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (fakeRoomId) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 尝试重置不存在的房间
            const result = handler.resetAIRoom(fakeRoomId);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== '房间不存在') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rematch fails for non-AI room', () => {
      fc.assert(
        fc.property(
          playerArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (player, roomName) => {
            const roomManager = new RoomManager();
            const aiClient = new MockAIClient();
            const handler = new AIRoomHandler(roomManager, aiClient);
            
            // 创建普通房间（非 AI 房间）
            const room = roomManager.createRoom(roomName, player);
            
            // 尝试使用 AI 房间处理器重置
            const result = handler.resetAIRoom(room.id);
            
            // 验证失败
            if (result.success) return false;
            if (result.error !== '不是 AI 房间') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

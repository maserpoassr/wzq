/**
 * Property-Based Tests for Move Validation
 * 
 * Properties tested:
 * - Property 5: Occupied Position Rejection
 * - Property 6: Turn Enforcement
 * - Property 8: Post-Game Move Prevention
 * 
 * **Validates: Requirements 5.1, 5.2, 5.6**
 */

const fc = require('fast-check');
const { placeStone } = require('../../src/gameActions');
const GameLogic = require('../../src/gameLogic');
const RoomManager = require('../../src/roomManager');

describe('Move Validation Properties', () => {
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

  // 生成有效坐标的 arbitrary
  const coordArb = fc.integer({ min: 0, max: 14 });

  /**
   * 创建一个有两个玩家的游戏房间
   */
  function createGameRoom(player1, player2) {
    const manager = new RoomManager();
    const room = manager.createRoom('Test Room', player1);
    manager.joinRoom(room.id, player2, false);
    return room;
  }

  /**
   * **Feature: gomoku-online, Property 5: Occupied Position Rejection**
   * **Validates: Requirements 5.1**
   */
  describe('Property 5: Occupied Position Rejection', () => {
    test('placing stone on occupied position is rejected', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            // 确保两个玩家不同
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 黑棋先落子
            const firstResult = placeStone(room, player1.socketId, x, y);
            if (!firstResult.success) return true; // 跳过无效情况
            
            // 记录棋盘状态
            const boardBefore = room.board[x][y];
            
            // 白棋尝试在同一位置落子
            const secondResult = placeStone(room, player2.socketId, x, y);
            
            // 应该被拒绝
            if (secondResult.success) return false;
            
            // 棋盘状态应该不变
            return room.board[x][y] === boardBefore;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('board state unchanged after rejected move', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 黑棋落子
            placeStone(room, player1.socketId, x, y);
            
            // 复制棋盘
            const boardCopy = room.board.map(row => [...row]);
            
            // 尝试在已占位置落子
            placeStone(room, player2.socketId, x, y);
            
            // 验证棋盘未改变
            for (let i = 0; i < 15; i++) {
              for (let j = 0; j < 15; j++) {
                if (room.board[i][j] !== boardCopy[i][j]) return false;
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
   * **Feature: gomoku-online, Property 6: Turn Enforcement**
   * **Validates: Requirements 5.2**
   */
  describe('Property 6: Turn Enforcement', () => {
    test('placing stone during opponent turn is rejected', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 初始是黑棋回合，白棋尝试落子
            const result = placeStone(room, player2.socketId, x, y);
            
            // 应该被拒绝
            return result.success === false && result.error === '不是您的回合';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('board state unchanged when wrong turn', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 复制初始棋盘
            const boardCopy = room.board.map(row => [...row]);
            
            // 白棋尝试在黑棋回合落子
            placeStone(room, player2.socketId, x, y);
            
            // 验证棋盘未改变
            for (let i = 0; i < 15; i++) {
              for (let j = 0; j < 15; j++) {
                if (room.board[i][j] !== boardCopy[i][j]) return false;
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
   * **Feature: gomoku-online, Property 8: Post-Game Move Prevention**
   * **Validates: Requirements 5.6**
   */
  describe('Property 8: Post-Game Move Prevention', () => {
    test('placing stone after game ended is rejected', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 手动结束游戏
            room.status = 'ended';
            room.winner = GameLogic.BLACK;
            
            // 尝试落子
            const result = placeStone(room, player1.socketId, x, y);
            
            // 应该被拒绝
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('placing stone when winner exists is rejected', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          coordArb,
          coordArb,
          (player1, player2, x, y) => {
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 设置胜者但保持 playing 状态（边界情况）
            room.winner = GameLogic.WHITE;
            
            // 尝试落子
            const result = placeStone(room, player1.socketId, x, y);
            
            // 应该被拒绝
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

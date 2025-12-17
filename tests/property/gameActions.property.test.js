/**
 * Property-Based Tests for Game Actions
 * 
 * Properties tested:
 * - Property 9: Undo Operation Correctness
 * - Property 10: Surrender Result
 * 
 * **Validates: Requirements 6.3, 6.5**
 */

const fc = require('fast-check');
const { executeUndo, surrender, placeStone } = require('../../src/gameActions');
const GameLogic = require('../../src/gameLogic');
const RoomManager = require('../../src/roomManager');

describe('Game Actions Properties', () => {
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
   * **Feature: gomoku-online, Property 9: Undo Operation Correctness**
   * **Validates: Requirements 6.3**
   */
  describe('Property 9: Undo Operation Correctness', () => {
    test('undo removes last move and restores board position', () => {
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
            
            // 黑棋落子
            const placeResult = placeStone(room, player1.socketId, x, y);
            if (!placeResult.success) return true; // 跳过无效落子
            
            // 记录落子后的状态
            const historyLengthBefore = room.history.length;
            const boardValueBefore = room.board[x][y];
            
            // 执行悔棋
            const undoResult = executeUndo(room);
            
            if (!undoResult.success) return false;
            
            // 验证：历史记录减少1
            if (room.history.length !== historyLengthBefore - 1) return false;
            
            // 验证：棋盘位置恢复为空
            if (room.board[x][y] !== GameLogic.EMPTY) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('undo switches turn back to the undone color', () => {
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
            
            // 黑棋落子
            const placeResult = placeStone(room, player1.socketId, x, y);
            if (!placeResult.success) return true;
            
            // 落子后应该是白棋回合
            if (room.currentTurn !== GameLogic.WHITE) return false;
            
            // 执行悔棋
            executeUndo(room);
            
            // 悔棋后应该回到黑棋回合
            return room.currentTurn === GameLogic.BLACK;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('undo on empty history fails', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (player1, player2) => {
            // 确保两个玩家不同
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 不落子，直接悔棋
            const undoResult = executeUndo(room);
            
            return undoResult.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 10: Surrender Result**
   * **Validates: Requirements 6.5**
   */
  describe('Property 10: Surrender Result', () => {
    test('surrender ends game with opponent as winner', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(),
          (player1, player2, blackSurrenders) => {
            // 确保两个玩家不同
            if (player1.socketId === player2.socketId) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 选择认输的玩家
            const surrenderer = blackSurrenders ? player1 : player2;
            const expectedWinner = blackSurrenders ? GameLogic.WHITE : GameLogic.BLACK;
            
            // 执行认输
            const result = surrender(room, surrenderer.socketId);
            
            if (!result.success) return false;
            
            // 验证：对方获胜
            if (result.winner !== expectedWinner) return false;
            
            // 验证：房间状态为已结束
            if (room.status !== 'ended') return false;
            
            // 验证：房间记录的胜者正确
            if (room.winner !== expectedWinner) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('surrender by non-player fails', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          playerArb,
          (player1, player2, watcher) => {
            // 确保三个玩家都不同
            const ids = [player1.socketId, player2.socketId, watcher.socketId];
            if (new Set(ids).size !== 3) return true;
            
            const room = createGameRoom(player1, player2);
            
            // 观战者尝试认输
            const result = surrender(room, watcher.socketId);
            
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('surrender on non-playing game fails', () => {
      fc.assert(
        fc.property(
          playerArb,
          (player1) => {
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', player1);
            
            // 房间状态是 waiting，不是 playing
            const result = surrender(room, player1.socketId);
            
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

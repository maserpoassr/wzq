/**
 * Property-Based Tests for Room Management
 * 
 * Properties tested:
 * - Property 3: Room ID Uniqueness and Format
 * - Property 11: Room Join Logic
 * - Property 12: Full Room Rejection
 * - Property 13: Player Leave Cleanup
 * - Property 18: Watcher Addition
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

const fc = require('fast-check');
const RoomManager = require('../../src/roomManager');
const GameLogic = require('../../src/gameLogic');

describe('Room Management Properties', () => {
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

  /**
   * **Feature: gomoku-online, Property 3: Room ID Uniqueness and Format**
   * **Validates: Requirements 3.1**
   */
  describe('Property 3: Room ID Uniqueness and Format', () => {
    test('generated room IDs are 4-6 digit strings', () => {
      fc.assert(
        fc.property(
          playerArb,
          nicknameArb,
          (creator, roomName) => {
            const manager = new RoomManager();
            const room = manager.createRoom(roomName, creator);
            
            // ID 应该是 4-6 位数字字符串
            const id = room.id;
            const isValidFormat = /^\d{4,6}$/.test(id);
            
            return isValidFormat;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple rooms have unique IDs', () => {
      fc.assert(
        fc.property(
          fc.array(playerArb, { minLength: 2, maxLength: 50 }),
          (creators) => {
            const manager = new RoomManager();
            const ids = new Set();
            
            for (const creator of creators) {
              const room = manager.createRoom('Test Room', creator);
              if (ids.has(room.id)) {
                return false; // 发现重复ID
              }
              ids.add(room.id);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('new room has empty 15x15 board', () => {
      fc.assert(
        fc.property(
          playerArb,
          (creator) => {
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            
            // 检查棋盘大小
            if (room.board.length !== 15) return false;
            
            // 检查每行
            for (const row of room.board) {
              if (row.length !== 15) return false;
              // 检查是否全为0
              for (const cell of row) {
                if (cell !== 0) return false;
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
   * **Feature: gomoku-online, Property 11: Room Join Logic**
   * **Validates: Requirements 3.2**
   */
  describe('Property 11: Room Join Logic', () => {
    test('second player joins as white and status changes to playing', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, joiner) => {
            // 确保两个玩家不同
            if (creator.socketId === joiner.socketId) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            
            // 初始状态应该是 waiting
            if (room.status !== 'waiting') return false;
            
            // 第二个玩家加入
            const result = manager.joinRoom(room.id, joiner, false);
            
            // 应该成功加入为白棋
            if (!result.success || result.role !== 'white') return false;
            
            // 状态应该变为 playing
            if (room.status !== 'playing') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 12: Full Room Rejection**
   * **Validates: Requirements 3.4**
   */
  describe('Property 12: Full Room Rejection', () => {
    test('third player cannot join as player when room is full', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          playerArb,
          (creator, player2, player3) => {
            // 确保三个玩家都不同
            const ids = [creator.socketId, player2.socketId, player3.socketId];
            if (new Set(ids).size !== 3) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            
            // 第二个玩家加入
            manager.joinRoom(room.id, player2, false);
            
            // 第三个玩家尝试作为玩家加入
            const result = manager.joinRoom(room.id, player3, false);
            
            // 应该被拒绝
            return result.success === false && result.error === '房间已满';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 13: Player Leave Cleanup**
   * **Validates: Requirements 3.5**
   */
  describe('Property 13: Player Leave Cleanup', () => {
    test('player leaving decreases participant count', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, player2) => {
            // 确保两个玩家不同
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            manager.joinRoom(room.id, player2, false);
            
            const countBefore = manager.getParticipantCount(room.id);
            
            // 玩家离开
            manager.leaveRoom(room.id, player2.socketId);
            
            const countAfter = manager.getParticipantCount(room.id);
            
            return countAfter === countBefore - 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('player is removed from room after leaving', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, player2) => {
            // 确保两个玩家不同
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            manager.joinRoom(room.id, player2, false);
            
            // 玩家离开
            manager.leaveRoom(room.id, player2.socketId);
            
            // 检查玩家是否被移除
            const role = manager.getPlayerRole(room.id, player2.socketId);
            
            return role === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 18: Watcher Addition**
   * **Validates: Requirements 3.3**
   */
  describe('Property 18: Watcher Addition', () => {
    test('watcher is added to watchers array', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, watcher) => {
            // 确保两个玩家不同
            if (creator.socketId === watcher.socketId) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            
            const watcherCountBefore = room.watchers.length;
            
            // 作为观战者加入
            const result = manager.joinRoom(room.id, watcher, true);
            
            // 应该成功
            if (!result.success || result.role !== 'watcher') return false;
            
            // 观战者数量应该增加1
            return room.watchers.length === watcherCountBefore + 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('watcher can join full room', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          playerArb,
          (creator, player2, watcher) => {
            // 确保三个玩家都不同
            const ids = [creator.socketId, player2.socketId, watcher.socketId];
            if (new Set(ids).size !== 3) return true;
            
            const manager = new RoomManager();
            const room = manager.createRoom('Test Room', creator);
            manager.joinRoom(room.id, player2, false);
            
            // 作为观战者加入满员房间
            const result = manager.joinRoom(room.id, watcher, true);
            
            return result.success === true && result.role === 'watcher';
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

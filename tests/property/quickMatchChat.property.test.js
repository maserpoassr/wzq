/**
 * Property-Based Tests for Quick Match and Chat
 * 
 * Properties tested:
 * - Property 14: Quick Match Behavior
 * - Property 15: Chat Message Format
 * 
 * **Validates: Requirements 2.6, 7.2, 8.1**
 */

const fc = require('fast-check');
const RoomManager = require('../../src/roomManager');
const { createChatMessage, formatTime } = require('../../src/utils');

describe('Quick Match and Chat Properties', () => {
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
   * **Feature: gomoku-online, Property 14: Quick Match Behavior**
   * **Validates: Requirements 2.6**
   */
  describe('Property 14: Quick Match Behavior', () => {
    test('findWaitingRoom returns waiting room when one exists', () => {
      fc.assert(
        fc.property(
          playerArb,
          (creator) => {
            const manager = new RoomManager();
            
            // 创建一个房间（状态为 waiting）
            const room = manager.createRoom('Test Room', creator);
            
            // 查找等待中的房间
            const found = manager.findWaitingRoom();
            
            // 应该找到这个房间
            return found !== null && found.id === room.id;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('findWaitingRoom returns null when no waiting rooms', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (player1, player2) => {
            if (player1.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            
            // 创建房间并让第二个玩家加入（状态变为 playing）
            const room = manager.createRoom('Test Room', player1);
            manager.joinRoom(room.id, player2, false);
            
            // 查找等待中的房间
            const found = manager.findWaitingRoom();
            
            // 不应该找到（因为房间状态是 playing）
            return found === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('quick match joins existing waiting room or creates new one', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(),
          (player1, player2, hasWaitingRoom) => {
            if (player1.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            
            if (hasWaitingRoom) {
              // 创建一个等待中的房间
              manager.createRoom('Waiting Room', player1);
            }
            
            const roomCountBefore = manager.getRoomCount();
            const waitingRoom = manager.findWaitingRoom();
            
            if (waitingRoom) {
              // 加入现有房间
              const result = manager.joinRoom(waitingRoom.id, player2, false);
              return result.success && manager.getRoomCount() === roomCountBefore;
            } else {
              // 创建新房间
              manager.createRoom('New Room', player2);
              return manager.getRoomCount() === roomCountBefore + 1;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 15: Chat Message Format**
   * **Validates: Requirements 7.2, 8.1**
   */
  describe('Property 15: Chat Message Format', () => {
    test('chat message contains timestamp, nickname, and message', () => {
      fc.assert(
        fc.property(
          nicknameArb,
          fc.string({ maxLength: 200 }),
          (nickname, message) => {
            const chatMessage = createChatMessage(nickname, message);
            
            // 应该包含时间戳
            if (typeof chatMessage.time !== 'string') return false;
            
            // 时间戳格式应该是 HH:MM
            if (!/^\d{2}:\d{2}$/.test(chatMessage.time)) return false;
            
            // 应该包含昵称
            if (chatMessage.nickname !== nickname) return false;
            
            // 应该包含消息（可能经过 emoji 转换）
            if (typeof chatMessage.message !== 'string') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('formatTime returns valid HH:MM format', () => {
      fc.assert(
        fc.property(
          fc.date(),
          (date) => {
            const time = formatTime(date);
            
            // 应该是 HH:MM 格式
            return /^\d{2}:\d{2}$/.test(time);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('chat message with emoji shortcuts gets converted', () => {
      const nickname = 'TestUser';
      const message = 'Hello :) how are you :D';
      
      const chatMessage = createChatMessage(nickname, message);
      
      // 消息应该包含 emoji
      expect(chatMessage.message).toContain('😊');
      expect(chatMessage.message).toContain('😄');
    });
  });
});

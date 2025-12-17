/**
 * Property-Based Tests for Serialization
 * **Feature: gomoku-online, Property 2: Room State Serialization Round-Trip**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 * 
 * For any valid Room object, serializing to JSON and then deserializing
 * SHALL produce an equivalent Room object with identical board state,
 * players, watchers, history, and chat.
 */

const fc = require('fast-check');
const { serializeRoom, deserializeRoom, roomsEqual } = require('../../src/serialization');
const GameLogic = require('../../src/gameLogic');

describe('Property 2: Room State Serialization Round-Trip', () => {
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
  
  // 生成可选玩家的 arbitrary
  const optionalPlayerArb = fc.option(playerArb, { nil: null });
  
  // 生成棋盘的 arbitrary (15x15, 值为 0, 1, 或 2)
  const boardArb = fc.array(
    fc.array(
      fc.constantFrom(0, 1, 2),
      { minLength: 15, maxLength: 15 }
    ),
    { minLength: 15, maxLength: 15 }
  );
  
  // 生成落子记录的 arbitrary
  const moveArb = fc.record({
    x: fc.integer({ min: 0, max: 14 }),
    y: fc.integer({ min: 0, max: 14 }),
    color: fc.constantFrom(1, 2),
    timestamp: fc.integer({ min: 0 })
  });
  
  // 生成聊天消息的 arbitrary
  const chatMessageArb = fc.record({
    time: fc.string({ minLength: 5, maxLength: 5 }).map(s => s.replace(/[^0-9:]/g, '0').slice(0, 5)),
    nickname: nicknameArb,
    message: fc.string({ maxLength: 200 })
  });
  
  // 生成完整房间的 arbitrary
  const roomArb = fc.record({
    id: fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 6 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    board: boardArb,
    players: fc.record({
      black: optionalPlayerArb,
      white: optionalPlayerArb
    }),
    watchers: fc.array(playerArb, { maxLength: 10 }),
    currentTurn: fc.constantFrom(1, 2),
    history: fc.array(moveArb, { maxLength: 50 }),
    chat: fc.array(chatMessageArb, { maxLength: 20 }),
    winner: fc.constantFrom(null, 1, 2),
    status: fc.constantFrom('waiting', 'playing', 'ended'),
    createdAt: fc.integer({ min: 0 }),
    lastActivity: fc.integer({ min: 0 })
  });

  test('serialize then deserialize produces equivalent room', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          // 序列化
          const serialized = serializeRoom(room);
          
          // 转换为 JSON 字符串再解析（模拟网络传输）
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          
          // 反序列化
          const deserialized = deserializeRoom(parsed);
          
          // 比较是否等价
          return roomsEqual(room, deserialized);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('serialization preserves board state', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          const serialized = serializeRoom(room);
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          const deserialized = deserializeRoom(parsed);
          
          // 检查棋盘每个位置
          for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
              if (room.board[i][j] !== deserialized.board[i][j]) {
                return false;
              }
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('serialization preserves players', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          const serialized = serializeRoom(room);
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          const deserialized = deserializeRoom(parsed);
          
          // 检查黑棋玩家
          if (room.players.black === null) {
            if (deserialized.players.black !== null) return false;
          } else {
            if (deserialized.players.black === null) return false;
            if (room.players.black.socketId !== deserialized.players.black.socketId) return false;
            if (room.players.black.nickname !== deserialized.players.black.nickname) return false;
          }
          
          // 检查白棋玩家
          if (room.players.white === null) {
            if (deserialized.players.white !== null) return false;
          } else {
            if (deserialized.players.white === null) return false;
            if (room.players.white.socketId !== deserialized.players.white.socketId) return false;
            if (room.players.white.nickname !== deserialized.players.white.nickname) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('serialization preserves watchers', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          const serialized = serializeRoom(room);
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          const deserialized = deserializeRoom(parsed);
          
          if (room.watchers.length !== deserialized.watchers.length) return false;
          
          for (let i = 0; i < room.watchers.length; i++) {
            if (room.watchers[i].socketId !== deserialized.watchers[i].socketId) return false;
            if (room.watchers[i].nickname !== deserialized.watchers[i].nickname) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('serialization preserves history', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          const serialized = serializeRoom(room);
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          const deserialized = deserializeRoom(parsed);
          
          if (room.history.length !== deserialized.history.length) return false;
          
          for (let i = 0; i < room.history.length; i++) {
            if (room.history[i].x !== deserialized.history[i].x) return false;
            if (room.history[i].y !== deserialized.history[i].y) return false;
            if (room.history[i].color !== deserialized.history[i].color) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('serialization preserves chat', () => {
    fc.assert(
      fc.property(
        roomArb,
        (room) => {
          const serialized = serializeRoom(room);
          const jsonString = JSON.stringify(serialized);
          const parsed = JSON.parse(jsonString);
          const deserialized = deserializeRoom(parsed);
          
          if (room.chat.length !== deserialized.chat.length) return false;
          
          for (let i = 0; i < room.chat.length; i++) {
            if (room.chat[i].time !== deserialized.chat[i].time) return false;
            if (room.chat[i].nickname !== deserialized.chat[i].nickname) return false;
            if (room.chat[i].message !== deserialized.chat[i].message) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

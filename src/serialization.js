/**
 * Serialization - 游戏状态序列化模块
 * 处理房间状态的序列化和反序列化
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

const GameLogic = require('./gameLogic');

/**
 * 序列化房间对象为 JSON 安全对象
 * Requirements: 12.1
 * @param {Room} room - 房间对象
 * @returns {object} JSON 安全的房间对象
 */
function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    board: room.board.map(row => [...row]),
    players: {
      black: room.players.black ? { ...room.players.black } : null,
      white: room.players.white ? { ...room.players.white } : null
    },
    watchers: room.watchers.map(w => ({ ...w })),
    currentTurn: room.currentTurn,
    history: room.history.map(m => ({ ...m })),
    chat: room.chat.map(c => ({ ...c })),
    winner: room.winner,
    status: room.status,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity
  };
}

/**
 * 反序列化 JSON 对象为房间对象
 * Requirements: 12.2
 * @param {object} json - JSON 对象
 * @returns {Room} 房间对象
 */
function deserializeRoom(json) {
  return {
    id: json.id,
    name: json.name,
    board: json.board.map(row => [...row]),
    players: {
      black: json.players.black ? { ...json.players.black } : null,
      white: json.players.white ? { ...json.players.white } : null
    },
    watchers: json.watchers.map(w => ({ ...w })),
    currentTurn: json.currentTurn,
    history: json.history.map(m => ({ ...m })),
    chat: json.chat.map(c => ({ ...c })),
    winner: json.winner,
    status: json.status,
    createdAt: json.createdAt,
    lastActivity: json.lastActivity
  };
}

/**
 * 序列化房间为客户端安全视图（隐藏敏感信息）
 * Requirements: 12.4
 * @param {Room} room - 房间对象
 * @param {string} socketId - 请求者的 socket ID
 * @returns {object} 客户端安全的房间视图
 */
function serializeForClient(room, socketId) {
  // 确定请求者的角色
  let myRole = null;
  if (room.players.black && room.players.black.socketId === socketId) {
    myRole = 'black';
  } else if (room.players.white && room.players.white.socketId === socketId) {
    myRole = 'white';
  } else if (room.watchers.some(w => w.socketId === socketId)) {
    myRole = 'watcher';
  }

  return {
    id: room.id,
    name: room.name,
    board: room.board.map(row => [...row]),
    players: {
      black: room.players.black ? { nickname: room.players.black.nickname } : null,
      white: room.players.white ? { nickname: room.players.white.nickname } : null
    },
    watchers: room.watchers.map(w => ({ nickname: w.nickname })),
    currentTurn: room.currentTurn,
    history: room.history.map(m => ({
      x: m.x,
      y: m.y,
      color: m.color
    })),
    chat: room.chat.map(c => ({ ...c })),
    winner: room.winner,
    status: room.status,
    myRole: myRole
  };
}

/**
 * 比较两个房间对象是否等价
 * @param {Room} room1 - 第一个房间
 * @param {Room} room2 - 第二个房间
 * @returns {boolean} 是否等价
 */
function roomsEqual(room1, room2) {
  // 比较基本属性
  if (room1.id !== room2.id) return false;
  if (room1.name !== room2.name) return false;
  if (room1.currentTurn !== room2.currentTurn) return false;
  if (room1.winner !== room2.winner) return false;
  if (room1.status !== room2.status) return false;
  if (room1.createdAt !== room2.createdAt) return false;
  if (room1.lastActivity !== room2.lastActivity) return false;

  // 比较棋盘
  for (let i = 0; i < GameLogic.BOARD_SIZE; i++) {
    for (let j = 0; j < GameLogic.BOARD_SIZE; j++) {
      if (room1.board[i][j] !== room2.board[i][j]) return false;
    }
  }

  // 比较玩家
  const comparePlayer = (p1, p2) => {
    if (p1 === null && p2 === null) return true;
    if (p1 === null || p2 === null) return false;
    return p1.socketId === p2.socketId && p1.nickname === p2.nickname;
  };
  if (!comparePlayer(room1.players.black, room2.players.black)) return false;
  if (!comparePlayer(room1.players.white, room2.players.white)) return false;

  // 比较观战者
  if (room1.watchers.length !== room2.watchers.length) return false;
  for (let i = 0; i < room1.watchers.length; i++) {
    if (!comparePlayer(room1.watchers[i], room2.watchers[i])) return false;
  }

  // 比较历史
  if (room1.history.length !== room2.history.length) return false;
  for (let i = 0; i < room1.history.length; i++) {
    const m1 = room1.history[i];
    const m2 = room2.history[i];
    if (m1.x !== m2.x || m1.y !== m2.y || m1.color !== m2.color) return false;
  }

  // 比较聊天
  if (room1.chat.length !== room2.chat.length) return false;
  for (let i = 0; i < room1.chat.length; i++) {
    const c1 = room1.chat[i];
    const c2 = room2.chat[i];
    if (c1.time !== c2.time || c1.nickname !== c2.nickname || c1.message !== c2.message) {
      return false;
    }
  }

  return true;
}

module.exports = {
  serializeRoom,
  deserializeRoom,
  serializeForClient,
  roomsEqual
};

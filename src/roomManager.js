/**
 * RoomManager - 房间管理模块
 * 处理房间的创建、加入、离开等操作
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 2.2
 */

const GameLogic = require('./gameLogic');

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    /** @type {Set<string>} 已使用的房间ID集合 */
    this.usedIds = new Set();
  }

  /**
   * 生成唯一的4-6位数字房间ID
   * Requirements: 3.1
   * @returns {string} 唯一的房间ID
   */
  generateRoomId() {
    let id;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      // 生成4-6位随机数字
      const length = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      id = String(Math.floor(Math.random() * (max - min + 1)) + min);
      attempts++;
    } while (this.usedIds.has(id) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique room ID');
    }
    
    this.usedIds.add(id);
    return id;
  }

  /**
   * 创建新房间
   * Requirements: 3.1
   * @param {string} name - 房间名称
   * @param {{socketId: string, nickname: string}} creator - 创建者信息
   * @returns {Room} 创建的房间对象
   */
  createRoom(name, creator) {
    const roomId = this.generateRoomId();
    const now = Date.now();
    
    /** @type {Room} */
    const room = {
      id: roomId,
      name: name || `${creator.nickname}的房间`,
      board: GameLogic.createEmptyBoard(),
      players: {
        black: {
          socketId: creator.socketId,
          nickname: creator.nickname
        },
        white: null
      },
      watchers: [],
      currentTurn: GameLogic.BLACK,
      history: [],
      chat: [],
      winner: null,
      status: 'waiting',
      createdAt: now,
      lastActivity: now
    };
    
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * 获取房间
   * @param {string} roomId - 房间ID
   * @returns {Room|null} 房间对象或null
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * 获取房间列表（用于大厅显示）
   * Requirements: 2.2
   * @returns {Array} 房间列表
   */
  getRoomList() {
    const list = [];
    for (const room of this.rooms.values()) {
      list.push({
        id: room.id,
        name: room.name,
        blackPlayer: room.players.black ? room.players.black.nickname : null,
        whitePlayer: room.players.white ? room.players.white.nickname : null,
        status: room.status,
        watcherCount: room.watchers.length
      });
    }
    return list;
  }

  /**
   * 删除房间
   * @param {string} roomId - 房间ID
   * @returns {boolean} 是否成功删除
   */
  deleteRoom(roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.delete(roomId);
      this.usedIds.delete(roomId);
      return true;
    }
    return false;
  }

  /**
   * 获取房间总数
   * @returns {number}
   */
  getRoomCount() {
    return this.rooms.size;
  }

  /**
   * 加入房间
   * Requirements: 3.2, 3.3, 3.4
   * @param {string} roomId - 房间ID
   * @param {{socketId: string, nickname: string}} player - 玩家信息
   * @param {boolean} asWatcher - 是否作为观战者加入
   * @returns {{success: boolean, role?: string, error?: string}} 加入结果
   */
  joinRoom(roomId, player, asWatcher = false) {
    const room = this.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    
    room.lastActivity = Date.now();
    
    // 作为观战者加入
    if (asWatcher) {
      // 检查是否已经是观战者
      const existingWatcher = room.watchers.find(w => w.socketId === player.socketId);
      if (!existingWatcher) {
        room.watchers.push({
          socketId: player.socketId,
          nickname: player.nickname
        });
      }
      return { success: true, role: 'watcher' };
    }
    
    // 作为玩家加入
    // 检查是否已经是玩家
    if (room.players.black && room.players.black.socketId === player.socketId) {
      return { success: true, role: 'black' };
    }
    if (room.players.white && room.players.white.socketId === player.socketId) {
      return { success: true, role: 'white' };
    }
    
    // 检查是否有空位
    if (!room.players.black) {
      room.players.black = {
        socketId: player.socketId,
        nickname: player.nickname
      };
      // 如果白棋已有玩家，开始游戏
      if (room.players.white) {
        room.status = 'playing';
      }
      return { success: true, role: 'black' };
    }
    
    if (!room.players.white) {
      room.players.white = {
        socketId: player.socketId,
        nickname: player.nickname
      };
      // 黑棋已有玩家，开始游戏
      if (room.players.black) {
        room.status = 'playing';
      }
      return { success: true, role: 'white' };
    }
    
    // 房间已满
    return { success: false, error: '房间已满' };
  }

  /**
   * 离开房间
   * Requirements: 3.5
   * @param {string} roomId - 房间ID
   * @param {string} socketId - 玩家的socket ID
   * @returns {{success: boolean, leftAs?: string, nickname?: string}} 离开结果
   */
  leaveRoom(roomId, socketId) {
    const room = this.getRoom(roomId);
    
    if (!room) {
      return { success: false };
    }
    
    room.lastActivity = Date.now();
    
    // 检查是否是黑棋玩家
    if (room.players.black && room.players.black.socketId === socketId) {
      const nickname = room.players.black.nickname;
      room.players.black = null;
      // 如果游戏进行中，对方获胜
      if (room.status === 'playing') {
        room.winner = GameLogic.WHITE;
        room.status = 'ended';
      } else {
        room.status = 'waiting';
      }
      return { success: true, leftAs: 'black', nickname };
    }
    
    // 检查是否是白棋玩家
    if (room.players.white && room.players.white.socketId === socketId) {
      const nickname = room.players.white.nickname;
      room.players.white = null;
      // 如果游戏进行中，对方获胜
      if (room.status === 'playing') {
        room.winner = GameLogic.BLACK;
        room.status = 'ended';
      } else {
        room.status = 'waiting';
      }
      return { success: true, leftAs: 'white', nickname };
    }
    
    // 检查是否是观战者
    const watcherIndex = room.watchers.findIndex(w => w.socketId === socketId);
    if (watcherIndex !== -1) {
      const nickname = room.watchers[watcherIndex].nickname;
      room.watchers.splice(watcherIndex, 1);
      return { success: true, leftAs: 'watcher', nickname };
    }
    
    return { success: false };
  }

  /**
   * 清理空房间（无人超过指定时间）
   * Requirements: 3.6
   * @param {number} maxIdleTime - 最大空闲时间（毫秒），默认5分钟
   * @returns {string[]} 被删除的房间ID列表
   */
  cleanupEmptyRooms(maxIdleTime = 5 * 60 * 1000) {
    const now = Date.now();
    const deletedRooms = [];
    
    for (const [roomId, room] of this.rooms.entries()) {
      // 检查房间是否为空（无玩家和观战者）
      const isEmpty = !room.players.black && !room.players.white && room.watchers.length === 0;
      // 检查是否超时
      const isIdle = (now - room.lastActivity) > maxIdleTime;
      
      if (isEmpty && isIdle) {
        this.deleteRoom(roomId);
        deletedRooms.push(roomId);
      }
    }
    
    return deletedRooms;
  }

  /**
   * 获取玩家在房间中的角色
   * @param {string} roomId - 房间ID
   * @param {string} socketId - 玩家的socket ID
   * @returns {string|null} 角色: 'black', 'white', 'watcher', 或 null
   */
  getPlayerRole(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    
    if (room.players.black && room.players.black.socketId === socketId) {
      return 'black';
    }
    if (room.players.white && room.players.white.socketId === socketId) {
      return 'white';
    }
    if (room.watchers.some(w => w.socketId === socketId)) {
      return 'watcher';
    }
    return null;
  }

  /**
   * 获取房间参与者总数
   * @param {string} roomId - 房间ID
   * @returns {number} 参与者数量
   */
  getParticipantCount(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return 0;
    
    let count = room.watchers.length;
    if (room.players.black) count++;
    if (room.players.white) count++;
    return count;
  }

  /**
   * 查找等待中的房间（用于快速匹配）
   * Requirements: 2.6
   * @returns {Room|null} 等待中的房间或null
   */
  findWaitingRoom() {
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting') {
        return room;
      }
    }
    return null;
  }
}

module.exports = RoomManager;

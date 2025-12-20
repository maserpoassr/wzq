/**
 * AIRoomHandler - AI 房间处理器模块
 * 处理 AI 对战房间的创建、玩家落子后的 AI 响应等逻辑
 * 
 * Requirements: 1.1, 1.2, 4.1, 4.2, 5.2, 7.1, 7.3, 8.1, 8.2, 8.3, 8.4
 */

const GameLogic = require('./gameLogic');

class AIRoomHandler {
  /**
   * 创建 AI 房间处理器
   * @param {RoomManager} roomManager - 房间管理器实例
   * @param {AIServiceClient} aiClient - AI 服务客户端实例
   */
  constructor(roomManager, aiClient) {
    this.roomManager = roomManager;
    this.aiClient = aiClient;
  }

  /**
   * 创建 AI 对战房间
   * Requirements: 1.1, 1.2
   * @param {{socketId: string, nickname: string}} player - 玩家信息
   * @param {string} difficulty - 难度 ('easy'|'medium'|'hard')
   * @param {boolean} playerFirst - 玩家是否先手（执黑）
   * @returns {{room: Room, needsAIFirstMove: boolean}} 创建的房间和是否需要 AI 先手
   */
  createAIRoom(player, difficulty = 'medium', playerFirst = true) {
    // 使用 roomManager 创建 AI 房间
    const room = this.roomManager.createAIRoom(player, difficulty, playerFirst);
    
    // 如果玩家选择后手（白棋），AI 需要先落子
    const needsAIFirstMove = !playerFirst;
    
    return { room, needsAIFirstMove };
  }

  /**
   * 处理玩家落子后的 AI 响应
   * Requirements: 4.1, 4.2
   * @param {string} roomId - 房间ID
   * @returns {Promise<{success: boolean, move?: {x: number, y: number}, winner?: number, error?: string}>}
   */
  async handlePlayerMove(roomId) {
    const room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    
    if (!room.isAIRoom) {
      return { success: false, error: '不是 AI 房间' };
    }
    
    // 检查游戏是否已结束
    if (room.status === 'ended' || room.winner !== null) {
      return { success: false, error: '游戏已结束' };
    }
    
    // 检查是否轮到 AI
    if (room.currentTurn !== room.aiConfig.aiColor) {
      return { success: false, error: '不是 AI 的回合' };
    }
    
    // 标记 AI 正在思考
    room.aiThinking = true;
    
    try {
      // 请求 AI 落子
      const aiMove = await this.aiClient.getMove(
        room.board,
        room.aiConfig.aiColor,
        room.aiConfig.difficulty
      );
      
      // 验证 AI 返回的落子位置
      if (!GameLogic.isValidMove(room.board, aiMove.x, aiMove.y)) {
        room.aiThinking = false;
        return { success: false, error: 'AI 返回了无效的落子位置' };
      }
      
      // 放置 AI 的棋子
      GameLogic.placeStone(room.board, aiMove.x, aiMove.y, room.aiConfig.aiColor);
      
      // 记录历史
      room.history.push({
        x: aiMove.x,
        y: aiMove.y,
        color: room.aiConfig.aiColor,
        timestamp: Date.now(),
        isAI: true
      });
      
      // 检查 AI 是否获胜
      const aiWon = GameLogic.checkWin(room.board, aiMove.x, aiMove.y, room.aiConfig.aiColor);
      
      if (aiWon) {
        room.winner = room.aiConfig.aiColor;
        room.status = 'ended';
        room.aiThinking = false;
        return { 
          success: true, 
          move: aiMove, 
          winner: room.aiConfig.aiColor,
          isRandom: aiMove.isRandom 
        };
      }
      
      // 检查是否平局（棋盘已满）
      const isBoardFull = this._isBoardFull(room.board);
      if (isBoardFull) {
        room.status = 'ended';
        room.winner = 0; // 0 表示平局
        room.aiThinking = false;
        return { success: true, move: aiMove, winner: 0, isRandom: aiMove.isRandom };
      }
      
      // 切换回合到玩家
      room.currentTurn = room.aiConfig.playerColor;
      room.aiThinking = false;
      room.lastActivity = Date.now();
      
      return { success: true, move: aiMove, isRandom: aiMove.isRandom };
    } catch (error) {
      room.aiThinking = false;
      return { success: false, error: `AI 服务错误: ${error.message}` };
    }
  }

  /**
   * 处理 AI 先手落子（玩家选择后手时）
   * Requirements: 5.2
   * @param {string} roomId - 房间ID
   * @returns {Promise<{success: boolean, move?: {x: number, y: number}, error?: string}>}
   */
  async handleAIFirstMove(roomId) {
    const room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    
    if (!room.isAIRoom) {
      return { success: false, error: '不是 AI 房间' };
    }
    
    // 确认 AI 是黑棋（先手）
    if (room.aiConfig.aiColor !== GameLogic.BLACK) {
      return { success: false, error: 'AI 不是先手' };
    }
    
    // 确认棋盘为空（第一步）
    if (room.history.length > 0) {
      return { success: false, error: '不是第一步' };
    }
    
    // 调用 handlePlayerMove 来处理 AI 落子
    return await this.handlePlayerMove(roomId);
  }

  /**
   * 检查棋盘是否已满
   * @param {number[][]} board - 棋盘状态
   * @returns {boolean} 是否已满
   */
  _isBoardFull(board) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === GameLogic.EMPTY) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 获取 AI 房间信息
   * @param {string} roomId - 房间ID
   * @returns {Room|null} 房间对象或 null
   */
  getAIRoom(roomId) {
    const room = this.roomManager.getRoom(roomId);
    if (room && room.isAIRoom) {
      return room;
    }
    return null;
  }

  /**
   * 检查是否是 AI 的回合
   * @param {string} roomId - 房间ID
   * @returns {boolean} 是否是 AI 的回合
   */
  isAITurn(roomId) {
    const room = this.getAIRoom(roomId);
    if (!room) return false;
    return room.currentTurn === room.aiConfig.aiColor;
  }

  /**
   * 获取玩家在 AI 房间中的颜色
   * @param {string} roomId - 房间ID
   * @returns {number|null} 玩家颜色 (1=黑, 2=白) 或 null
   */
  getPlayerColor(roomId) {
    const room = this.getAIRoom(roomId);
    if (!room) return null;
    return room.aiConfig.playerColor;
  }

  /**
   * 执行 AI 房间悔棋（撤销两步：玩家的落子和 AI 的响应）
   * Requirements: 8.1, 8.2, 8.3, 8.4
   * @param {string} roomId - 房间ID
   * @returns {{success: boolean, undoCount?: number, movesRemoved?: number, error?: string}}
   */
  executeAIUndo(roomId) {
    const room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    
    if (!room.isAIRoom) {
      return { success: false, error: '不是 AI 房间' };
    }
    
    // 检查游戏是否已结束
    if (room.status === 'ended') {
      return { success: false, error: '游戏已结束' };
    }
    
    // 检查是否还有悔棋次数
    // Requirements: 8.2 - 限制最多 3 次悔棋
    if (room.undoCount >= room.maxUndo) {
      return { success: false, error: '悔棋次数已用完' };
    }
    
    // 检查是否有落子可以撤销
    if (room.history.length === 0) {
      return { success: false, error: '没有可撤销的落子' };
    }
    
    // 检查 AI 是否正在思考
    if (room.aiThinking) {
      return { success: false, error: 'AI 正在思考中，请稍后' };
    }
    
    let movesRemoved = 0;
    
    // Requirements: 8.1 - 一次撤销两步（玩家和 AI 的落子）
    // Requirements: 8.3 - 只有一步时只撤销一步
    
    // 确定需要撤销的步数
    // 如果只有一步，只撤销一步
    // 如果有两步或更多，撤销两步
    const movesToUndo = Math.min(2, room.history.length);
    
    for (let i = 0; i < movesToUndo; i++) {
      const lastMove = room.history.pop();
      if (lastMove) {
        // 从棋盘上移除棋子
        GameLogic.removeStone(room.board, lastMove.x, lastMove.y);
        movesRemoved++;
      }
    }
    
    // 更新当前回合
    // 悔棋后应该轮到玩家
    room.currentTurn = room.aiConfig.playerColor;
    
    // 如果历史为空且 AI 是先手，则轮到 AI
    if (room.history.length === 0 && room.aiConfig.aiColor === GameLogic.BLACK) {
      room.currentTurn = GameLogic.BLACK;
    }
    
    // 增加悔棋计数
    room.undoCount++;
    
    // 更新最后活动时间
    room.lastActivity = Date.now();
    
    return { 
      success: true, 
      undoCount: room.undoCount,
      movesRemoved: movesRemoved,
      remainingUndos: room.maxUndo - room.undoCount
    };
  }

  /**
   * 获取 AI 房间剩余悔棋次数
   * @param {string} roomId - 房间ID
   * @returns {number} 剩余悔棋次数，房间不存在返回 0
   */
  getRemainingUndos(roomId) {
    const room = this.getAIRoom(roomId);
    if (!room) return 0;
    return room.maxUndo - room.undoCount;
  }

  /**
   * 检查是否可以悔棋
   * @param {string} roomId - 房间ID
   * @returns {{canUndo: boolean, reason?: string}}
   */
  canUndo(roomId) {
    const room = this.getAIRoom(roomId);
    
    if (!room) {
      return { canUndo: false, reason: '房间不存在' };
    }
    
    if (room.status === 'ended') {
      return { canUndo: false, reason: '游戏已结束' };
    }
    
    if (room.undoCount >= room.maxUndo) {
      return { canUndo: false, reason: '悔棋次数已用完' };
    }
    
    if (room.history.length === 0) {
      return { canUndo: false, reason: '没有可撤销的落子' };
    }
    
    if (room.aiThinking) {
      return { canUndo: false, reason: 'AI 正在思考中' };
    }
    
    return { canUndo: true };
  }

  /**
   * 处理玩家离开 AI 房间
   * Requirements: 7.1
   * 玩家离开时立即销毁 AI 房间并清理相关资源
   * @param {string} roomId - 房间ID
   * @returns {{success: boolean, destroyed: boolean, error?: string}}
   */
  handlePlayerLeave(roomId) {
    const room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      return { success: false, destroyed: false, error: '房间不存在' };
    }
    
    if (!room.isAIRoom) {
      return { success: false, destroyed: false, error: '不是 AI 房间' };
    }
    
    // 清理 AI 思考状态
    room.aiThinking = false;
    
    // 立即销毁 AI 房间
    const deleted = this.roomManager.deleteRoom(roomId);
    
    if (deleted) {
      return { success: true, destroyed: true };
    }
    
    return { success: false, destroyed: false, error: '删除房间失败' };
  }

  /**
   * 重置 AI 房间（再来一局）
   * Requirements: 7.3
   * 重置棋盘并交换玩家和 AI 的颜色
   * @param {string} roomId - 房间ID
   * @returns {{success: boolean, newPlayerColor?: number, newAIColor?: number, error?: string}}
   */
  resetAIRoom(roomId) {
    const room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    
    if (!room.isAIRoom) {
      return { success: false, error: '不是 AI 房间' };
    }
    
    // 保存当前颜色配置用于交换
    const oldPlayerColor = room.aiConfig.playerColor;
    const oldAIColor = room.aiConfig.aiColor;
    
    // 交换颜色
    const newPlayerColor = oldAIColor;
    const newAIColor = oldPlayerColor;
    
    // 获取人类玩家信息
    let humanPlayer = null;
    if (room.players.black && !room.players.black.isAI) {
      humanPlayer = room.players.black;
    } else if (room.players.white && !room.players.white.isAI) {
      humanPlayer = room.players.white;
    }
    
    if (!humanPlayer) {
      return { success: false, error: '找不到人类玩家' };
    }
    
    const aiPlayer = { isAI: true, nickname: 'AI' };
    
    // 根据新颜色分配玩家位置
    if (newPlayerColor === GameLogic.BLACK) {
      room.players.black = humanPlayer;
      room.players.white = aiPlayer;
    } else {
      room.players.black = aiPlayer;
      room.players.white = humanPlayer;
    }
    
    // 更新 AI 配置
    room.aiConfig.playerColor = newPlayerColor;
    room.aiConfig.aiColor = newAIColor;
    
    // 重置棋盘
    room.board = GameLogic.createEmptyBoard();
    room.currentTurn = GameLogic.BLACK;
    room.history = [];
    room.winner = null;
    room.status = 'playing';
    room.undoCount = 0;
    room.aiThinking = false;
    room.lastActivity = Date.now();
    room.rematchRequests = { black: false, white: false };
    
    // 返回是否需要 AI 先手
    const needsAIFirstMove = newAIColor === GameLogic.BLACK;
    
    return { 
      success: true, 
      newPlayerColor, 
      newAIColor,
      needsAIFirstMove
    };
  }
}

module.exports = AIRoomHandler;

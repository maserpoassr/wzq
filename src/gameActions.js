/**
 * GameActions - 游戏操作模块
 * 处理悔棋、认输等游戏操作
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

const GameLogic = require('./gameLogic');

/**
 * 请求悔棋
 * Requirements: 6.1
 * @param {Room} room - 房间对象
 * @param {string} socketId - 请求者的 socket ID
 * @returns {{success: boolean, error?: string, targetSocketId?: string}} 结果
 */
function requestUndo(room, socketId) {
  // 检查游戏是否进行中
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未在进行中' };
  }

  // 检查是否有历史记录
  if (room.history.length === 0) {
    return { success: false, error: '没有可悔棋的步骤' };
  }

  // 确定请求者是哪方
  let requesterColor = null;
  if (room.players.black && room.players.black.socketId === socketId) {
    requesterColor = 'black';
  } else if (room.players.white && room.players.white.socketId === socketId) {
    requesterColor = 'white';
  }

  if (!requesterColor) {
    return { success: false, error: '您不是游戏玩家' };
  }

  // 获取对手的 socket ID
  const opponentColor = requesterColor === 'black' ? 'white' : 'black';
  const opponent = room.players[opponentColor];
  
  if (!opponent) {
    return { success: false, error: '对手不在房间中' };
  }

  return { 
    success: true, 
    targetSocketId: opponent.socketId,
    requesterNickname: room.players[requesterColor].nickname
  };
}

/**
 * 响应悔棋请求
 * Requirements: 6.2, 6.3, 6.4
 * @param {Room} room - 房间对象
 * @param {string} socketId - 响应者的 socket ID
 * @param {boolean} accept - 是否接受
 * @returns {{success: boolean, accepted: boolean, error?: string}} 结果
 */
function respondUndo(room, socketId, accept) {
  // 检查游戏是否进行中
  if (room.status !== 'playing') {
    return { success: false, accepted: false, error: '游戏未在进行中' };
  }

  // 检查是否有历史记录
  if (room.history.length === 0) {
    return { success: false, accepted: false, error: '没有可悔棋的步骤' };
  }

  // 确定响应者是哪方
  let responderColor = null;
  if (room.players.black && room.players.black.socketId === socketId) {
    responderColor = 'black';
  } else if (room.players.white && room.players.white.socketId === socketId) {
    responderColor = 'white';
  }

  if (!responderColor) {
    return { success: false, accepted: false, error: '您不是游戏玩家' };
  }

  if (!accept) {
    return { success: true, accepted: false };
  }

  // 执行悔棋
  return executeUndo(room);
}

/**
 * 执行悔棋操作
 * Requirements: 6.3
 * @param {Room} room - 房间对象
 * @returns {{success: boolean, accepted: boolean, error?: string}} 结果
 */
function executeUndo(room) {
  if (room.history.length === 0) {
    return { success: false, accepted: false, error: '没有可悔棋的步骤' };
  }

  // 移除最后一步
  const lastMove = room.history.pop();
  
  // 恢复棋盘位置为空
  room.board[lastMove.x][lastMove.y] = GameLogic.EMPTY;
  
  // 切换回合到被悔棋的一方
  room.currentTurn = lastMove.color;
  
  // 更新最后活动时间
  room.lastActivity = Date.now();

  return { success: true, accepted: true };
}

/**
 * 认输
 * Requirements: 6.5
 * @param {Room} room - 房间对象
 * @param {string} socketId - 认输者的 socket ID
 * @returns {{success: boolean, winner?: number, error?: string}} 结果
 */
function surrender(room, socketId) {
  // 检查游戏是否进行中
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未在进行中' };
  }

  // 确定认输者是哪方
  let surrendererColor = null;
  if (room.players.black && room.players.black.socketId === socketId) {
    surrendererColor = GameLogic.BLACK;
  } else if (room.players.white && room.players.white.socketId === socketId) {
    surrendererColor = GameLogic.WHITE;
  }

  if (surrendererColor === null) {
    return { success: false, error: '您不是游戏玩家' };
  }

  // 对方获胜
  const winner = surrendererColor === GameLogic.BLACK ? GameLogic.WHITE : GameLogic.BLACK;
  
  room.winner = winner;
  room.status = 'ended';
  room.lastActivity = Date.now();

  return { success: true, winner };
}

/**
 * 落子
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * @param {Room} room - 房间对象
 * @param {string} socketId - 落子者的 socket ID
 * @param {number} x - 横坐标
 * @param {number} y - 纵坐标
 * @returns {{success: boolean, winner?: number, winningStones?: Array, error?: string}} 结果
 */
function placeStone(room, socketId, x, y) {
  // 检查游戏是否进行中
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未在进行中' };
  }

  // 检查游戏是否已结束
  if (room.winner !== null) {
    return { success: false, error: '游戏已结束' };
  }

  // 确定落子者是哪方
  let playerColor = null;
  if (room.players.black && room.players.black.socketId === socketId) {
    playerColor = GameLogic.BLACK;
  } else if (room.players.white && room.players.white.socketId === socketId) {
    playerColor = GameLogic.WHITE;
  }

  if (playerColor === null) {
    return { success: false, error: '您是观战者，无法落子' };
  }

  // 检查是否是当前回合
  if (room.currentTurn !== playerColor) {
    return { success: false, error: '不是您的回合' };
  }

  // 检查落子是否合法
  if (!GameLogic.isValidMove(room.board, x, y)) {
    return { success: false, error: '无效的落子位置' };
  }

  // 放置棋子
  room.board[x][y] = playerColor;
  
  // 记录历史
  room.history.push({
    x,
    y,
    color: playerColor,
    timestamp: Date.now()
  });

  // 更新最后活动时间
  room.lastActivity = Date.now();

  // 检查是否获胜
  if (GameLogic.checkWin(room.board, x, y, playerColor)) {
    const winningStones = GameLogic.getWinningStones(room.board, x, y, playerColor);
    room.winner = playerColor;
    room.status = 'ended';
    return { success: true, winner: playerColor, winningStones };
  }

  // 切换回合
  room.currentTurn = playerColor === GameLogic.BLACK ? GameLogic.WHITE : GameLogic.BLACK;

  return { success: true };
}

module.exports = {
  requestUndo,
  respondUndo,
  executeUndo,
  surrender,
  placeStone
};

/**
 * GameLogic - 五子棋游戏核心逻辑模块
 * 处理棋盘验证、胜利检测等核心游戏规则
 * 
 * Requirements: 5.1, 5.3, 5.4, 3.1
 */

class GameLogic {
  // 棋盘大小常量
  static BOARD_SIZE = 15;
  static EMPTY = 0;
  static BLACK = 1;
  static WHITE = 2;
  static WIN_COUNT = 5;

  /**
   * 创建空棋盘 - 15x15 的二维数组，全部填充 0
   * Requirements: 3.1
   * @returns {number[][]} 15x15 的空棋盘
   */
  static createEmptyBoard() {
    const board = [];
    for (let i = 0; i < GameLogic.BOARD_SIZE; i++) {
      board.push(new Array(GameLogic.BOARD_SIZE).fill(GameLogic.EMPTY));
    }
    return board;
  }

  /**
   * 验证坐标是否在棋盘范围内
   * @param {number} x - 横坐标
   * @param {number} y - 纵坐标
   * @returns {boolean} 是否在范围内
   */
  static isInBounds(x, y) {
    return x >= 0 && x < GameLogic.BOARD_SIZE && 
           y >= 0 && y < GameLogic.BOARD_SIZE;
  }

  /**
   * 验证落子是否合法 - 检查位置是否为空
   * Requirements: 5.1
   * @param {number[][]} board - 当前棋盘状态
   * @param {number} x - 横坐标 (0-14)
   * @param {number} y - 纵坐标 (0-14)
   * @returns {boolean} 是否可以落子
   */
  static isValidMove(board, x, y) {
    // 检查坐标是否在范围内
    if (!GameLogic.isInBounds(x, y)) {
      return false;
    }
    // 检查位置是否为空
    return board[x][y] === GameLogic.EMPTY;
  }

  /**
   * 在棋盘上放置棋子
   * @param {number[][]} board - 当前棋盘状态
   * @param {number} x - 横坐标
   * @param {number} y - 纵坐标
   * @param {number} color - 棋子颜色 (1=黑, 2=白)
   * @returns {boolean} 是否成功放置
   */
  static placeStone(board, x, y, color) {
    if (!GameLogic.isValidMove(board, x, y)) {
      return false;
    }
    board[x][y] = color;
    return true;
  }

  /**
   * 移除棋子（用于悔棋）
   * @param {number[][]} board - 当前棋盘状态
   * @param {number} x - 横坐标
   * @param {number} y - 纵坐标
   */
  static removeStone(board, x, y) {
    if (GameLogic.isInBounds(x, y)) {
      board[x][y] = GameLogic.EMPTY;
    }
  }

  /**
   * 复制棋盘
   * @param {number[][]} board - 原棋盘
   * @returns {number[][]} 棋盘副本
   */
  static copyBoard(board) {
    return board.map(row => [...row]);
  }

  /**
   * 四个方向的偏移量：水平、垂直、正斜线、反斜线
   */
  static DIRECTIONS = [
    { dx: 1, dy: 0 },   // 水平 →
    { dx: 0, dy: 1 },   // 垂直 ↓
    { dx: 1, dy: 1 },   // 正斜线 ↘
    { dx: 1, dy: -1 }   // 反斜线 ↗
  ];

  /**
   * 在指定方向上计算连续同色棋子
   * @param {number[][]} board - 棋盘状态
   * @param {number} x - 起始横坐标
   * @param {number} y - 起始纵坐标
   * @param {number} dx - x方向增量
   * @param {number} dy - y方向增量
   * @param {number} color - 棋子颜色
   * @returns {Array<{x: number, y: number}>} 连续棋子的坐标数组
   */
  static countInDirection(board, x, y, dx, dy, color) {
    const stones = [];
    let cx = x + dx;
    let cy = y + dy;
    
    while (GameLogic.isInBounds(cx, cy) && board[cx][cy] === color) {
      stones.push({ x: cx, y: cy });
      cx += dx;
      cy += dy;
    }
    
    return stones;
  }

  /**
   * 检查是否获胜 - 在四个方向检测是否有5子连珠
   * Requirements: 5.3, 5.4
   * @param {number[][]} board - 当前棋盘状态
   * @param {number} x - 最后落子的横坐标
   * @param {number} y - 最后落子的纵坐标
   * @param {number} color - 棋子颜色
   * @returns {boolean} 是否获胜
   */
  static checkWin(board, x, y, color) {
    // 检查坐标有效性
    if (!GameLogic.isInBounds(x, y)) {
      return false;
    }
    
    // 检查该位置是否是指定颜色
    if (board[x][y] !== color) {
      return false;
    }

    // 检查四个方向
    for (const { dx, dy } of GameLogic.DIRECTIONS) {
      // 正向计数
      const forward = GameLogic.countInDirection(board, x, y, dx, dy, color);
      // 反向计数
      const backward = GameLogic.countInDirection(board, x, y, -dx, -dy, color);
      
      // 总数 = 正向 + 反向 + 当前位置(1)
      const total = forward.length + backward.length + 1;
      
      if (total >= GameLogic.WIN_COUNT) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取获胜的棋子位置
   * Requirements: 5.4
   * @param {number[][]} board - 当前棋盘状态
   * @param {number} x - 最后落子的横坐标
   * @param {number} y - 最后落子的纵坐标
   * @param {number} color - 棋子颜色
   * @returns {Array<{x: number, y: number}>|null} 获胜棋子坐标数组，未获胜返回null
   */
  static getWinningStones(board, x, y, color) {
    // 检查坐标有效性
    if (!GameLogic.isInBounds(x, y)) {
      return null;
    }
    
    // 检查该位置是否是指定颜色
    if (board[x][y] !== color) {
      return null;
    }

    // 检查四个方向
    for (const { dx, dy } of GameLogic.DIRECTIONS) {
      // 正向计数
      const forward = GameLogic.countInDirection(board, x, y, dx, dy, color);
      // 反向计数
      const backward = GameLogic.countInDirection(board, x, y, -dx, -dy, color);
      
      // 总数 = 正向 + 反向 + 当前位置(1)
      const total = forward.length + backward.length + 1;
      
      if (total >= GameLogic.WIN_COUNT) {
        // 返回所有获胜棋子的位置
        return [
          ...backward.reverse(),  // 反向的棋子（按顺序排列）
          { x, y },               // 当前位置
          ...forward              // 正向的棋子
        ];
      }
    }
    
    return null;
  }
}

module.exports = GameLogic;

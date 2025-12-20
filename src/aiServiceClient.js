/**
 * AIServiceClient - AI 服务客户端模块
 * 与 Python AI 服务通信，获取 AI 落子
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5, 6.1
 */

// 默认超时时间 10 秒
const DEFAULT_TIMEOUT = 10000;

class AIServiceClient {
  /**
   * 创建 AI 服务客户端
   * @param {string} baseUrl - AI 服务基础 URL，默认 http://localhost:5001
   * @param {number} timeout - 请求超时时间（毫秒），默认 10000
   */
  constructor(baseUrl = 'http://localhost:5001', timeout = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * 检查 AI 服务是否可用
   * Requirements: 6.1
   * @returns {Promise<{available: boolean, info?: object, error?: string}>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        return { available: false, error: `HTTP ${response.status}` };
      }
      
      const info = await response.json();
      return { available: true, info };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * 请求 AI 落子（内部方法，不带重试）
   * @param {number[][]} board - 棋盘状态 (15x15)，项目格式 (0=空, 1=黑, 2=白)
   * @param {number} currentPlayer - 当前玩家 (1=黑, 2=白)
   * @param {string} difficulty - 难度 ('easy'|'medium'|'hard')
   * @returns {Promise<{x: number, y: number}>}
   */
  async _getMoveInternal(board, currentPlayer, difficulty) {
    // 转换棋盘格式为 AI 服务格式
    const aiBoard = this.convertBoardToAIFormat(board);
    // 转换当前玩家：1=黑 -> 1, 2=白 -> -1
    const aiCurrentPlayer = currentPlayer === 1 ? 1 : -1;
    
    const requestBody = {
      board: aiBoard,
      currentPlayer: aiCurrentPlayer,
      difficulty: difficulty
    };
    
    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`AI service error: HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return { x: result.x, y: result.y };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('timeout');
      }
      throw error;
    }
  }

  /**
   * 请求 AI 落子（带超时和重试逻辑）
   * Requirements: 3.1, 3.2, 3.3
   * @param {number[][]} board - 棋盘状态 (15x15)，项目格式 (0=空, 1=黑, 2=白)
   * @param {number} currentPlayer - 当前玩家 (1=黑, 2=白)
   * @param {string} difficulty - 难度 ('easy'|'medium'|'hard')
   * @returns {Promise<{x: number, y: number, isRandom?: boolean}>}
   */
  async getMove(board, currentPlayer, difficulty) {
    try {
      // 第一次尝试
      return await this._getMoveInternal(board, currentPlayer, difficulty);
    } catch (error) {
      // 如果超时或失败，重试一次
      try {
        return await this._getMoveInternal(board, currentPlayer, difficulty);
      } catch (retryError) {
        // 重试也失败，回退到随机落子
        const randomMove = this.getRandomValidMove(board);
        return { ...randomMove, isRandom: true };
      }
    }
  }

  /**
   * 获取随机有效落子位置
   * Requirements: 3.3
   * @param {number[][]} board - 棋盘状态
   * @returns {{x: number, y: number}} 随机有效位置
   */
  getRandomValidMove(board) {
    const emptyPositions = [];
    
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          emptyPositions.push({ x: i, y: j });
        }
      }
    }
    
    if (emptyPositions.length === 0) {
      throw new Error('No valid moves available');
    }
    
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIndex];
  }

  /**
   * 转换棋盘格式：项目格式 -> AI 服务格式
   * Requirements: 3.5
   * 项目: 0=空, 1=黑, 2=白
   * AI服务: 0=空, 1=黑(先手), -1=白(后手)
   * @param {number[][]} board - 项目格式棋盘
   * @returns {number[][]} AI 服务格式棋盘
   */
  convertBoardToAIFormat(board) {
    return board.map(row => 
      row.map(cell => cell === 2 ? -1 : cell)
    );
  }

  /**
   * 转换棋盘格式：AI 服务格式 -> 项目格式
   * Requirements: 3.5
   * AI服务: 0=空, 1=黑(先手), -1=白(后手)
   * 项目: 0=空, 1=黑, 2=白
   * @param {number[][]} board - AI 服务格式棋盘
   * @returns {number[][]} 项目格式棋盘
   */
  convertBoardFromAIFormat(board) {
    return board.map(row => 
      row.map(cell => cell === -1 ? 2 : cell)
    );
  }
}

module.exports = AIServiceClient;

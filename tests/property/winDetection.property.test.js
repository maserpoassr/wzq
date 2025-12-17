/**
 * Property-Based Tests for Win Detection
 * **Feature: gomoku-online, Property 7: Win Detection Correctness**
 * **Validates: Requirements 5.3, 5.4**
 * 
 * For any board state where a stone is placed at (x, y) with color C,
 * if there exist 5 or more consecutive stones of color C in any of the
 * four directions, then checkWin SHALL return true and getWinningStones
 * SHALL return the winning stone positions.
 */

const fc = require('fast-check');
const GameLogic = require('../../src/gameLogic');

describe('Property 7: Win Detection Correctness', () => {
  // 生成有效坐标的 arbitrary
  const coordArb = fc.integer({ min: 0, max: 14 });
  const colorArb = fc.constantFrom(GameLogic.BLACK, GameLogic.WHITE);
  
  // 生成方向的 arbitrary
  const directionArb = fc.constantFrom(
    { dx: 1, dy: 0, name: 'horizontal' },
    { dx: 0, dy: 1, name: 'vertical' },
    { dx: 1, dy: 1, name: 'diagonal-right' },
    { dx: 1, dy: -1, name: 'diagonal-left' }
  );

  /**
   * 辅助函数：在棋盘上放置一条连续的棋子线
   */
  function placeLine(board, startX, startY, dx, dy, color, length) {
    const positions = [];
    for (let i = 0; i < length; i++) {
      const x = startX + i * dx;
      const y = startY + i * dy;
      if (GameLogic.isInBounds(x, y)) {
        board[x][y] = color;
        positions.push({ x, y });
      }
    }
    return positions;
  }

  /**
   * 辅助函数：计算在给定方向上可以放置的最大长度
   */
  function maxLineLength(startX, startY, dx, dy) {
    let length = 0;
    let x = startX;
    let y = startY;
    while (GameLogic.isInBounds(x, y)) {
      length++;
      x += dx;
      y += dy;
    }
    return length;
  }

  test('checkWin returns true when 5 consecutive stones exist', () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        colorArb,
        directionArb,
        (startX, startY, color, direction) => {
          const { dx, dy } = direction;
          
          // 计算可放置的最大长度
          const maxLen = maxLineLength(startX, startY, dx, dy);
          
          // 如果空间不足5个，跳过此测试用例
          if (maxLen < 5) {
            return true;
          }
          
          // 创建空棋盘并放置5个连续棋子
          const board = GameLogic.createEmptyBoard();
          const positions = placeLine(board, startX, startY, dx, dy, color, 5);
          
          // 检查中间位置是否检测到胜利
          const midIndex = 2;
          const midPos = positions[midIndex];
          
          const result = GameLogic.checkWin(board, midPos.x, midPos.y, color);
          
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkWin returns false when less than 5 consecutive stones', () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        colorArb,
        directionArb,
        fc.integer({ min: 1, max: 4 }),
        (startX, startY, color, direction, lineLength) => {
          const { dx, dy } = direction;
          
          // 计算可放置的最大长度
          const maxLen = maxLineLength(startX, startY, dx, dy);
          
          // 如果空间不足，跳过
          if (maxLen < lineLength) {
            return true;
          }
          
          // 创建空棋盘并放置少于5个连续棋子
          const board = GameLogic.createEmptyBoard();
          const positions = placeLine(board, startX, startY, dx, dy, color, lineLength);
          
          // 检查任意位置是否检测到胜利（应该返回false）
          const midIndex = Math.floor(lineLength / 2);
          const midPos = positions[midIndex];
          
          const result = GameLogic.checkWin(board, midPos.x, midPos.y, color);
          
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('getWinningStones returns correct positions when winning', () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        colorArb,
        directionArb,
        (startX, startY, color, direction) => {
          const { dx, dy } = direction;
          
          // 计算可放置的最大长度
          const maxLen = maxLineLength(startX, startY, dx, dy);
          
          // 如果空间不足5个，跳过
          if (maxLen < 5) {
            return true;
          }
          
          // 创建空棋盘并放置5个连续棋子
          const board = GameLogic.createEmptyBoard();
          const positions = placeLine(board, startX, startY, dx, dy, color, 5);
          
          // 检查中间位置
          const midIndex = 2;
          const midPos = positions[midIndex];
          
          const winningStones = GameLogic.getWinningStones(board, midPos.x, midPos.y, color);
          
          // 应该返回非空数组
          if (!winningStones || winningStones.length < 5) {
            return false;
          }
          
          // 所有返回的位置应该都是同色棋子
          for (const stone of winningStones) {
            if (board[stone.x][stone.y] !== color) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('getWinningStones returns null when not winning', () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        colorArb,
        directionArb,
        fc.integer({ min: 1, max: 4 }),
        (startX, startY, color, direction, lineLength) => {
          const { dx, dy } = direction;
          
          // 计算可放置的最大长度
          const maxLen = maxLineLength(startX, startY, dx, dy);
          
          // 如果空间不足，跳过
          if (maxLen < lineLength) {
            return true;
          }
          
          // 创建空棋盘并放置少于5个连续棋子
          const board = GameLogic.createEmptyBoard();
          const positions = placeLine(board, startX, startY, dx, dy, color, lineLength);
          
          // 检查任意位置
          const midIndex = Math.floor(lineLength / 2);
          const midPos = positions[midIndex];
          
          const winningStones = GameLogic.getWinningStones(board, midPos.x, midPos.y, color);
          
          return winningStones === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('win detection works for more than 5 consecutive stones', () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        colorArb,
        directionArb,
        fc.integer({ min: 6, max: 10 }),
        (startX, startY, color, direction, lineLength) => {
          const { dx, dy } = direction;
          
          // 计算可放置的最大长度
          const maxLen = maxLineLength(startX, startY, dx, dy);
          
          // 如果空间不足，跳过
          if (maxLen < lineLength) {
            return true;
          }
          
          // 创建空棋盘并放置超过5个连续棋子
          const board = GameLogic.createEmptyBoard();
          const positions = placeLine(board, startX, startY, dx, dy, color, lineLength);
          
          // 检查中间位置
          const midIndex = Math.floor(lineLength / 2);
          const midPos = positions[midIndex];
          
          const result = GameLogic.checkWin(board, midPos.x, midPos.y, color);
          
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

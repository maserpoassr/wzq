/**
 * Property-Based Tests for AI Service Client
 * **Feature: ai-vs-human-mode, Property 5: Board State Conversion Round-Trip**
 * **Validates: Requirements 3.5**
 * 
 * For any valid board state in project format, converting to AI format
 * and back should produce an equivalent board state.
 */

const fc = require('fast-check');
const AIServiceClient = require('../../src/aiServiceClient');

describe('Property 5: Board State Conversion Round-Trip', () => {
  const client = new AIServiceClient();
  
  // 生成棋盘的 arbitrary (15x15, 值为 0, 1, 或 2)
  const boardArb = fc.array(
    fc.array(
      fc.constantFrom(0, 1, 2),
      { minLength: 15, maxLength: 15 }
    ),
    { minLength: 15, maxLength: 15 }
  );

  test('convertBoardToAIFormat then convertBoardFromAIFormat produces equivalent board', () => {
    fc.assert(
      fc.property(
        boardArb,
        (board) => {
          // 转换到 AI 格式
          const aiBoard = client.convertBoardToAIFormat(board);
          
          // 转换回项目格式
          const roundTripped = client.convertBoardFromAIFormat(aiBoard);
          
          // 检查每个位置是否相等
          for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
              if (board[i][j] !== roundTripped[i][j]) {
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

  test('convertBoardToAIFormat correctly maps values', () => {
    fc.assert(
      fc.property(
        boardArb,
        (board) => {
          const aiBoard = client.convertBoardToAIFormat(board);
          
          // 检查每个位置的映射是否正确
          for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
              const original = board[i][j];
              const converted = aiBoard[i][j];
              
              // 0 -> 0 (空)
              if (original === 0 && converted !== 0) return false;
              // 1 -> 1 (黑)
              if (original === 1 && converted !== 1) return false;
              // 2 -> -1 (白)
              if (original === 2 && converted !== -1) return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('convertBoardFromAIFormat correctly maps values', () => {
    // 生成 AI 格式棋盘 (0, 1, -1)
    const aiBoardArb = fc.array(
      fc.array(
        fc.constantFrom(0, 1, -1),
        { minLength: 15, maxLength: 15 }
      ),
      { minLength: 15, maxLength: 15 }
    );

    fc.assert(
      fc.property(
        aiBoardArb,
        (aiBoard) => {
          const projectBoard = client.convertBoardFromAIFormat(aiBoard);
          
          // 检查每个位置的映射是否正确
          for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
              const original = aiBoard[i][j];
              const converted = projectBoard[i][j];
              
              // 0 -> 0 (空)
              if (original === 0 && converted !== 0) return false;
              // 1 -> 1 (黑)
              if (original === 1 && converted !== 1) return false;
              // -1 -> 2 (白)
              if (original === -1 && converted !== 2) return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('board dimensions are preserved after conversion', () => {
    fc.assert(
      fc.property(
        boardArb,
        (board) => {
          const aiBoard = client.convertBoardToAIFormat(board);
          const roundTripped = client.convertBoardFromAIFormat(aiBoard);
          
          // 检查维度
          if (aiBoard.length !== 15) return false;
          if (roundTripped.length !== 15) return false;
          
          for (let i = 0; i < 15; i++) {
            if (aiBoard[i].length !== 15) return false;
            if (roundTripped[i].length !== 15) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

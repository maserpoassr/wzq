/**
 * Property-Based Tests for Utility Functions
 * 
 * Properties tested:
 * - Property 1: Nickname Validation
 * - Property 4: Click-to-Intersection Snapping
 * - Property 16: Emoji Conversion
 * 
 * **Validates: Requirements 1.2, 1.4, 4.3, 8.3**
 */

const fc = require('fast-check');
const { validateNickname, convertEmoji, getIntersection, EMOJI_MAP } = require('../../src/utils');

describe('Utility Functions Properties', () => {
  /**
   * **Feature: gomoku-online, Property 1: Nickname Validation**
   * **Validates: Requirements 1.2, 1.4**
   */
  describe('Property 1: Nickname Validation', () => {
    test('valid nicknames (1-20 chars, non-whitespace) are accepted', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          (nickname) => {
            const result = validateNickname(nickname);
            return result.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty strings are rejected', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
    });

    test('whitespace-only strings are rejected', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 }),
          (whitespace) => {
            const result = validateNickname(whitespace);
            return result.valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('strings longer than 20 chars are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 21, maxLength: 100 }).filter(s => s.trim().length > 20),
          (longString) => {
            const result = validateNickname(longString);
            return result.valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('non-string inputs are rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.anything())
          ),
          (nonString) => {
            const result = validateNickname(nonString);
            return result.valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 4: Click-to-Intersection Snapping**
   * **Validates: Requirements 4.3**
   */
  describe('Property 4: Click-to-Intersection Snapping', () => {
    const PADDING = 30;
    const CELL_SIZE = 30;

    test('clicks near valid intersections snap to correct coordinates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 14 }),
          fc.integer({ min: 0, max: 14 }),
          fc.integer({ min: -10, max: 10 }),
          fc.integer({ min: -10, max: 10 }),
          (targetX, targetY, offsetX, offsetY) => {
            // 计算目标交点的像素位置
            const exactX = PADDING + targetX * CELL_SIZE;
            const exactY = PADDING + targetY * CELL_SIZE;
            
            // 添加小偏移（在半个格子范围内）
            const clickX = exactX + Math.min(Math.max(offsetX, -CELL_SIZE/2 + 1), CELL_SIZE/2 - 1);
            const clickY = exactY + Math.min(Math.max(offsetY, -CELL_SIZE/2 + 1), CELL_SIZE/2 - 1);
            
            const result = getIntersection(clickX, clickY, PADDING, CELL_SIZE);
            
            if (!result) return false;
            
            return result.x === targetX && result.y === targetY;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('returned coordinates are always in valid range (0-14)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          (clientX, clientY) => {
            const result = getIntersection(clientX, clientY, PADDING, CELL_SIZE);
            
            if (result === null) {
              return true; // 超出范围返回 null 是正确的
            }
            
            return result.x >= 0 && result.x <= 14 && 
                   result.y >= 0 && result.y <= 14;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('clicks outside board return null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          fc.integer({ min: -100, max: -1 }),
          (negX, negY) => {
            const result = getIntersection(negX, negY, PADDING, CELL_SIZE);
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: gomoku-online, Property 16: Emoji Conversion**
   * **Validates: Requirements 8.3**
   */
  describe('Property 16: Emoji Conversion', () => {
    test('all defined shortcuts are converted to emojis', () => {
      for (const [shortcut, emoji] of Object.entries(EMOJI_MAP)) {
        const result = convertEmoji(shortcut);
        expect(result).toBe(emoji);
      }
    });

    test('shortcuts in text are replaced with emojis', () => {
      // 生成不包含任何 emoji 快捷方式的安全字符串
      const safeString = fc.string({ maxLength: 50 }).filter(s => {
        return !Object.keys(EMOJI_MAP).some(shortcut => s.includes(shortcut));
      });
      
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(EMOJI_MAP)),
          safeString,
          safeString,
          (shortcut, prefix, suffix) => {
            const text = prefix + shortcut + suffix;
            const result = convertEmoji(text);
            
            // 结果应该包含对应的 emoji
            return result.includes(EMOJI_MAP[shortcut]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('text without shortcuts remains unchanged', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }).filter(s => {
            // 过滤掉包含任何快捷方式的字符串
            return !Object.keys(EMOJI_MAP).some(shortcut => s.includes(shortcut));
          }),
          (text) => {
            const result = convertEmoji(text);
            return result === text;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple shortcuts in same text are all converted', () => {
      const text = 'Hello :) how are you :D';
      const result = convertEmoji(text);
      
      expect(result).toContain('😊');
      expect(result).toContain('😄');
      expect(result).not.toContain(':)');
      expect(result).not.toContain(':D');
    });

    test('non-string inputs are returned unchanged', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (nonString) => {
            const result = convertEmoji(nonString);
            return result === nonString;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

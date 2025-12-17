/**
 * Utils - 工具函数模块
 * 包含昵称验证、表情转换、坐标计算等工具函数
 * 
 * Requirements: 1.2, 1.4, 4.3, 8.3
 */

/**
 * 验证昵称是否有效
 * Requirements: 1.2, 1.4
 * @param {string} nickname - 昵称
 * @returns {{valid: boolean, error?: string}} 验证结果
 */
function validateNickname(nickname) {
  // 检查是否为字符串
  if (typeof nickname !== 'string') {
    return { valid: false, error: '昵称必须是字符串' };
  }

  // 检查是否为空或仅包含空白字符
  const trimmed = nickname.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: '昵称不能为空' };
  }

  // 检查长度（1-20字符）
  if (trimmed.length > 20) {
    return { valid: false, error: '昵称长度不能超过20个字符' };
  }

  return { valid: true };
}

/**
 * 表情快捷方式映射表
 */
const EMOJI_MAP = {
  ':)': '😊',
  ':-)': '😊',
  ':(': '😢',
  ':-(': '😢',
  ':D': '😄',
  ':-D': '😄',
  ';)': '😉',
  ';-)': '😉',
  ':P': '😛',
  ':-P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ':O': '😮',
  ':-O': '😮',
  ':o': '😮',
  ':-o': '😮',
  '<3': '❤️',
  ':*': '😘',
  ':-*': '😘',
  'XD': '😆',
  'xD': '😆',
  ':\'(': '😭',
  ':\'-(': '😭',
  ':/': '😕',
  ':-/': '😕',
  ':3': '😺',
  'O:)': '😇',
  'O:-)': '😇',
  '>:(': '😠',
  '>:-(': '😠',
  ':@': '😡',
  '8)': '😎',
  '8-)': '😎',
  'B)': '😎',
  'B-)': '😎'
};

/**
 * 转换表情快捷方式为 emoji
 * Requirements: 8.3
 * @param {string} text - 原始文本
 * @returns {string} 转换后的文本
 */
function convertEmoji(text) {
  if (typeof text !== 'string') {
    return text;
  }

  let result = text;
  
  // 按长度降序排列键，确保较长的匹配优先
  const sortedKeys = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length);
  
  for (const shortcut of sortedKeys) {
    // 使用全局替换
    const escaped = shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, EMOJI_MAP[shortcut]);
  }
  
  return result;
}

/**
 * 获取点击位置对应的棋盘交点坐标
 * Requirements: 4.3
 * @param {number} clientX - 点击的 X 坐标（相对于画布）
 * @param {number} clientY - 点击的 Y 坐标（相对于画布）
 * @param {number} padding - 棋盘边距
 * @param {number} cellSize - 格子大小
 * @returns {{x: number, y: number}|null} 交点坐标，如果超出范围返回 null
 */
function getIntersection(clientX, clientY, padding, cellSize) {
  // 计算相对于棋盘的位置
  const relX = clientX - padding;
  const relY = clientY - padding;
  
  // 计算最近的交点
  const x = Math.round(relX / cellSize);
  const y = Math.round(relY / cellSize);
  
  // 检查是否在有效范围内 (0-14)
  if (x < 0 || x > 14 || y < 0 || y > 14) {
    return null;
  }
  
  return { x, y };
}

/**
 * 格式化时间为 HH:MM 格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的时间字符串
 */
function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 创建聊天消息对象
 * @param {string} nickname - 发送者昵称
 * @param {string} message - 消息内容
 * @returns {ChatMessage} 聊天消息对象
 */
function createChatMessage(nickname, message) {
  return {
    time: formatTime(),
    nickname,
    message: convertEmoji(message)
  };
}

module.exports = {
  validateNickname,
  convertEmoji,
  getIntersection,
  formatTime,
  createChatMessage,
  EMOJI_MAP
};

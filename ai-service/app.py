"""
Flask REST API for Gomoku AI Service
简化版 - 使用基于规则的 AI
"""

import os
import logging
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 棋盘大小
BOARD_SIZE = 15


def get_valid_moves(board):
    """获取所有有效落子位置"""
    valid = []
    for i in range(BOARD_SIZE):
        for j in range(BOARD_SIZE):
            if board[i][j] == 0:
                valid.append((i, j))
    return valid


def count_consecutive(board, x, y, dx, dy, player):
    """计算某方向上连续棋子数"""
    count = 0
    nx, ny = x + dx, y + dy
    while 0 <= nx < BOARD_SIZE and 0 <= ny < BOARD_SIZE and board[nx][ny] == player:
        count += 1
        nx += dx
        ny += dy
    return count


def evaluate_position(board, x, y, player):
    """评估某位置的分数"""
    if board[x][y] != 0:
        return 0
    
    directions = [(1, 0), (0, 1), (1, 1), (1, -1)]
    score = 0
    opponent = -player
    
    for dx, dy in directions:
        # 计算己方连子
        my_count = 1 + count_consecutive(board, x, y, dx, dy, player) + \
                   count_consecutive(board, x, y, -dx, -dy, player)
        
        # 计算对方连子（如果我下这里能阻挡）
        board[x][y] = opponent
        opp_count = 1 + count_consecutive(board, x, y, dx, dy, opponent) + \
                    count_consecutive(board, x, y, -dx, -dy, opponent)
        board[x][y] = 0
        
        # 评分
        if my_count >= 5:
            score += 100000  # 赢了
        elif my_count == 4:
            score += 10000   # 活四
        elif my_count == 3:
            score += 1000    # 活三
        elif my_count == 2:
            score += 100     # 活二
        
        if opp_count >= 5:
            score += 50000   # 必须阻挡
        elif opp_count == 4:
            score += 5000    # 阻挡活四
        elif opp_count == 3:
            score += 500     # 阻挡活三
    
    return score


def get_ai_move(board_data, current_player, difficulty='medium'):
    """获取 AI 落子"""
    board = np.array(board_data)
    valid_moves = get_valid_moves(board)
    
    if not valid_moves:
        return None
    
    # 如果是第一步，下中心
    if np.sum(board != 0) == 0:
        return BOARD_SIZE // 2, BOARD_SIZE // 2
    
    # 评估所有位置
    best_score = -1
    best_moves = []
    
    for x, y in valid_moves:
        score = evaluate_position(board, x, y, current_player)
        
        # 添加一些随机性（根据难度）
        if difficulty == 'easy':
            score += np.random.randint(0, 1000)
        elif difficulty == 'medium':
            score += np.random.randint(0, 100)
        # hard 模式不添加随机性
        
        if score > best_score:
            best_score = score
            best_moves = [(x, y)]
        elif score == best_score:
            best_moves.append((x, y))
    
    # 从最佳位置中随机选一个
    if best_moves:
        idx = np.random.randint(len(best_moves))
        return int(best_moves[idx][0]), int(best_moves[idx][1])
    
    # 随机选择
    idx = np.random.randint(len(valid_moves))
    return int(valid_moves[idx][0]), int(valid_moves[idx][1])


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'model': 'rule-based',
        'board_size': BOARD_SIZE,
        'version': '2.1'
    })


@app.route('/move', methods=['POST'])
def get_move():
    """计算 AI 落子"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        board_data = data.get('board')
        current_player = data.get('currentPlayer', 1)
        difficulty = data.get('difficulty', 'medium')
        
        if board_data is None:
            return jsonify({'error': 'Board state is required'}), 400
        
        # 验证棋盘尺寸
        if len(board_data) != BOARD_SIZE or any(len(row) != BOARD_SIZE for row in board_data):
            return jsonify({'error': f'Invalid board size, expected {BOARD_SIZE}x{BOARD_SIZE}'}), 400
        
        # 获取 AI 落子
        result = get_ai_move(board_data, current_player, difficulty)
        
        if result is None:
            return jsonify({'error': 'No valid moves available'}), 400
        
        x, y = result
        log.info(f"AI move: ({x}, {y}), player: {current_player}, difficulty: {difficulty}")
        
        return jsonify({'x': x, 'y': y})
        
    except Exception as e:
        log.error(f"Error in /move: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    host = os.environ.get('AI_HOST', '0.0.0.0')
    port = int(os.environ.get('AI_PORT', 5001))
    debug = os.environ.get('AI_DEBUG', 'false').lower() == 'true'
    
    log.info(f"Starting AI service on {host}:{port}")
    app.run(host=host, port=port, debug=debug)

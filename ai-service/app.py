"""
Flask REST API for Gomoku AI Service
基于 gomoku_rl 项目的 PPO 模型
"""

import os
import sys
import logging
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS

# 添加 gomoku_rl 到路径
GOMOKU_RL_PATH = os.path.join(os.path.dirname(__file__), 'gomoku_rl')
if GOMOKU_RL_PATH not in sys.path:
    sys.path.insert(0, GOMOKU_RL_PATH)

from tensordict import TensorDict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
model = None
board_size = 15
device = "cpu"


def load_model():
    """Load the pretrained PPO model"""
    global model, device
    
    model_path = os.environ.get('AI_MODEL_PATH', './models/0.pt')
    device = os.environ.get('AI_DEVICE', 'cpu')
    
    try:
        # 尝试加载 JIT 模型
        if model_path.endswith('.jit.pt'):
            model = torch.jit.load(model_path, map_location=device)
            log.info(f"Loaded JIT model from {model_path}")
        else:
            # 加载普通 PyTorch 模型
            from gomoku_rl.policy import get_policy
            from torchrl.data.tensor_specs import (
                DiscreteTensorSpec,
                CompositeSpec,
                UnboundedContinuousTensorSpec,
                BinaryDiscreteTensorSpec,
            )
            from omegaconf import OmegaConf
            
            # 创建配置
            cfg = OmegaConf.create({
                'name': 'ppo',
                'ppo_epochs': 3,
                'clip_param': 0.2,
                'entropy_coef': 0.01,
                'gae_lambda': 0.95,
                'gamma': 0.99,
                'max_grad_norm': 0.5,
                'batch_size': 4096,
                'normalize_advantage': True,
                'average_gae': False,
                'share_network': True,
                'optimizer': {'name': 'adam', 'kwargs': {'lr': 1e-4}},
                'num_channels': 64,
                'num_residual_blocks': 4,
            })
            
            action_spec = DiscreteTensorSpec(
                board_size * board_size,
                shape=[1],
                device=device,
            )
            observation_spec = CompositeSpec(
                {
                    "observation": UnboundedContinuousTensorSpec(
                        device=device,
                        shape=[1, 3, board_size, board_size],
                    ),
                    "action_mask": BinaryDiscreteTensorSpec(
                        n=board_size * board_size,
                        device=device,
                        shape=[1, board_size * board_size],
                        dtype=torch.bool,
                    ),
                },
                shape=[1],
                device=device,
            )
            
            model = get_policy(
                name='ppo',
                cfg=cfg,
                action_spec=action_spec,
                observation_spec=observation_spec,
                device=device,
            )
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()
            log.info(f"Loaded PPO model from {model_path}")
            
    except FileNotFoundError:
        log.warning(f"Model file not found: {model_path}")
        log.warning("AI service will use random policy")
        model = None
    except Exception as e:
        log.error(f"Error loading model: {e}")
        log.warning("AI service will use random policy")
        model = None


def encode_board(board_data, current_player):
    """
    将棋盘状态编码为模型输入格式
    
    Args:
        board_data: 2D list, 0=空, 1=黑, -1=白
        current_player: 1=黑, -1=白
        
    Returns:
        observation tensor (1, 3, 15, 15)
        action_mask tensor (1, 225)
    """
    board = np.array(board_data, dtype=np.float32)
    
    # Layer 1: 当前玩家的棋子
    layer1 = (board == current_player).astype(np.float32)
    # Layer 2: 对手的棋子
    layer2 = (board == -current_player).astype(np.float32)
    # Layer 3: 最后一步（简化处理，设为全0）
    layer3 = np.zeros_like(board)
    
    observation = np.stack([layer1, layer2, layer3], axis=0)
    observation = torch.tensor(observation, dtype=torch.float32, device=device).unsqueeze(0)
    
    # Action mask: 空位为 True
    action_mask = (board == 0).flatten()
    action_mask = torch.tensor(action_mask, dtype=torch.bool, device=device).unsqueeze(0)
    
    return observation, action_mask


def get_random_move(board_data):
    """获取随机有效落子"""
    board = np.array(board_data)
    empty_positions = np.argwhere(board == 0)
    if len(empty_positions) == 0:
        return None
    idx = np.random.randint(len(empty_positions))
    x, y = empty_positions[idx]
    return int(x), int(y)


def get_ai_move(board_data, current_player, difficulty='medium'):
    """
    获取 AI 落子
    
    Args:
        board_data: 2D list, 0=空, 1=黑, -1=白
        current_player: 1=黑, -1=白
        difficulty: 'easy', 'medium', 'hard'
        
    Returns:
        (x, y) 落子坐标
    """
    global model
    
    if model is None:
        # 没有模型，使用随机落子
        return get_random_move(board_data)
    
    try:
        observation, action_mask = encode_board(board_data, current_player)
        
        tensordict = TensorDict(
            {
                "observation": observation,
                "action_mask": action_mask,
            },
            batch_size=[1],
        )
        
        with torch.no_grad():
            output = model(tensordict)
        
        action = output["action"].item()
        x = action // board_size
        y = action % board_size
        
        # 验证落子有效性
        if board_data[x][y] != 0:
            log.warning(f"Model returned invalid move ({x}, {y}), using random")
            return get_random_move(board_data)
        
        return int(x), int(y)
        
    except Exception as e:
        log.error(f"Error getting AI move: {e}")
        return get_random_move(board_data)


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'model': 'gomoku_rl-ppo' if model else 'random',
        'board_size': board_size,
        'device': device,
        'version': '2.0'
    })


@app.route('/move', methods=['POST'])
def get_move():
    """
    计算 AI 落子
    
    Request Body:
        {
            "board": [[...]], // 15x15, 0=空, 1=黑, -1=白
            "currentPlayer": 1 | -1,
            "difficulty": "easy" | "medium" | "hard"
        }
        
    Response:
        {"x": number, "y": number}
    """
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
        if len(board_data) != board_size or any(len(row) != board_size for row in board_data):
            return jsonify({'error': f'Invalid board size, expected {board_size}x{board_size}'}), 400
        
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


# 初始化
load_model()


if __name__ == '__main__':
    host = os.environ.get('AI_HOST', '0.0.0.0')
    port = int(os.environ.get('AI_PORT', 5001))
    debug = os.environ.get('AI_DEBUG', 'false').lower() == 'true'
    
    log.info(f"Starting AI service on {host}:{port}")
    app.run(host=host, port=port, debug=debug)

"""
Flask REST API for Gomoku AI Service
Provides endpoints for AI move calculation
"""

import os
import logging
import yaml
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS

from game import GomokuGame
from nnet import NNetWrapper
from mcts import MCTS
from board_converter import project_to_ai_format, validate_board

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for AI components
game = None
nnet = None
config = None


class dotdict(dict):
    """Dictionary with attribute access"""
    def __getattr__(self, name):
        return self[name]


def load_config(config_path='config.yaml'):
    """Load configuration from YAML file"""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def get_mcts_sims(difficulty):
    """
    Map difficulty level to MCTS simulation count
    
    Args:
        difficulty: 'easy', 'medium', or 'hard'
        
    Returns:
        Number of MCTS simulations
    """
    difficulty_map = config['difficulty']
    return difficulty_map.get(difficulty, difficulty_map['medium'])


def convert_board_from_request(board_data, current_player):
    """
    Convert board from request format to AI format
    
    Request format: 0=empty, 1=black, -1=white (already in AI format)
    AI internal: 0=empty, 1=current player, -1=opponent
    
    Args:
        board_data: 2D list of board state
        current_player: 1 (black) or -1 (white)
        
    Returns:
        numpy array in canonical form for AI
    """
    board = np.array(board_data, dtype=np.float32)
    # Board is already in AI format (1=black, -1=white)
    # Convert to canonical form (current player = 1)
    return game.getCanonicalForm(board, current_player)


def get_best_move(board, current_player, difficulty):
    """
    Calculate best move using MCTS
    
    Args:
        board: 2D numpy array of board state
        current_player: 1 (black) or -1 (white)
        difficulty: 'easy', 'medium', or 'hard'
        
    Returns:
        tuple (x, y) of best move coordinates
    """
    num_sims = get_mcts_sims(difficulty)
    
    args = dotdict({
        'numMCTSSims': num_sims,
        'cpuct': config['mcts']['cpuct']
    })
    
    mcts = MCTS(game, nnet, args)
    canonical_board = game.getCanonicalForm(board, current_player)
    
    # Get action probabilities (temp=0 for greedy selection)
    probs = mcts.getActionProb(canonical_board, temp=0)
    
    # Select best action
    action = np.argmax(probs)
    
    # Convert action to coordinates
    board_size = config['model']['board_size']
    x = action // board_size
    y = action % board_size
    
    log.info(f"AI move: ({x}, {y}) with {num_sims} MCTS simulations")
    return x, y


def get_random_valid_move(board):
    """
    Get a random valid move (fallback)
    
    Args:
        board: 2D numpy array of board state
        
    Returns:
        tuple (x, y) of random valid move
    """
    board_size = len(board)
    valid_moves = []
    
    for x in range(board_size):
        for y in range(board_size):
            if board[x][y] == 0:
                valid_moves.append((x, y))
    
    if valid_moves:
        idx = np.random.randint(len(valid_moves))
        return valid_moves[idx]
    
    return None


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Returns:
        JSON with service status and model info
    """
    return jsonify({
        'status': 'ok',
        'model': f'alphazero-{config["model"]["board_size"]}x{config["model"]["board_size"]}',
        'version': '1.0',
        'cuda': torch.cuda.is_available() and config['system']['cuda']
    })


@app.route('/move', methods=['POST'])
def get_move():
    """
    Calculate AI move endpoint
    
    Request Body:
        {
            "board": [[...]], // 15x15 board, 0=empty, 1=black, -1=white
            "currentPlayer": 1 | -1,
            "difficulty": "easy" | "medium" | "hard"
        }
        
    Response:
        {
            "x": number,
            "y": number
        }
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
        
        # Validate board dimensions
        board_size = config['model']['board_size']
        is_valid, error_msg = validate_board(board_data, board_size)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Validate difficulty
        if difficulty not in config['difficulty']:
            return jsonify({'error': f'Invalid difficulty: {difficulty}'}), 400
        
        # Convert board to numpy array
        board = np.array(board_data, dtype=np.float32)
        
        # Calculate best move
        x, y = get_best_move(board, current_player, difficulty)
        
        # Validate move is valid (empty position)
        if board[x][y] != 0:
            log.warning(f"AI returned invalid move ({x}, {y}), falling back to random")
            move = get_random_valid_move(board)
            if move:
                x, y = move
            else:
                return jsonify({'error': 'No valid moves available'}), 400
        
        return jsonify({'x': int(x), 'y': int(y)})
        
    except Exception as e:
        log.error(f"Error calculating move: {e}")
        return jsonify({'error': str(e)}), 500


def initialize_ai():
    """Initialize AI components on startup"""
    global game, nnet, config
    
    # Load configuration
    config_path = os.environ.get('AI_CONFIG_PATH', 'config.yaml')
    config = load_config(config_path)
    
    # Allow environment variable overrides
    if os.environ.get('AI_MODEL_PATH'):
        config['model']['path'] = os.environ.get('AI_MODEL_PATH')
    if os.environ.get('AI_MODEL_FILE'):
        config['model']['filename'] = os.environ.get('AI_MODEL_FILE')
    if os.environ.get('AI_BOARD_SIZE'):
        config['model']['board_size'] = int(os.environ.get('AI_BOARD_SIZE'))
    if os.environ.get('AI_CUDA'):
        config['system']['cuda'] = os.environ.get('AI_CUDA').lower() == 'true'
    
    board_size = config['model']['board_size']
    use_cuda = config['system']['cuda'] and torch.cuda.is_available()
    
    log.info(f"Initializing AI service for {board_size}x{board_size} board")
    log.info(f"CUDA available: {torch.cuda.is_available()}, Using CUDA: {use_cuda}")
    
    # Initialize game
    game = GomokuGame(board_size)
    
    # Initialize neural network
    args = dotdict({
        'num_channels': config['network']['num_channels'],
        'dropout': config['network']['dropout'],
        'cuda': use_cuda
    })
    
    nnet = NNetWrapper(game, args)
    
    # Load pre-trained model
    model_path = config['model']['path']
    model_file = config['model']['filename']
    
    try:
        nnet.load_checkpoint(model_path, model_file)
        log.info(f"Model loaded successfully from {model_path}/{model_file}")
    except FileNotFoundError:
        log.warning(f"Model file not found: {model_path}/{model_file}")
        log.warning("AI service will use random initialization (for testing only)")
    except Exception as e:
        log.warning(f"Could not load model: {e}")
        log.warning("AI service will use random initialization (for testing only)")
    
    log.info(f"AI service initialized successfully")


# Initialize on module load
initialize_ai()


if __name__ == '__main__':
    host = config['server']['host']
    port = config['server']['port']
    debug = config['server']['debug']
    
    log.info(f"Starting AI service on {host}:{port}")
    app.run(host=host, port=port, debug=debug)

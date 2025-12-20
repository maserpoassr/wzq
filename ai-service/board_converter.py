"""
Board Format Conversion Utilities

Handles conversion between project format and AI service format:
- Project format: 0=empty, 1=black, 2=white
- AI format: 0=empty, 1=black, -1=white
"""

import numpy as np


def project_to_ai_format(board):
    """
    Convert board from project format to AI format
    
    Project format: 0=empty, 1=black, 2=white
    AI format: 0=empty, 1=black, -1=white
    
    Args:
        board: 2D list or numpy array in project format
        
    Returns:
        numpy array in AI format
    """
    board = np.array(board, dtype=np.float32)
    # Convert white pieces: 2 -> -1
    board = np.where(board == 2, -1, board)
    return board


def ai_to_project_format(board):
    """
    Convert board from AI format to project format
    
    AI format: 0=empty, 1=black, -1=white
    Project format: 0=empty, 1=black, 2=white
    
    Args:
        board: 2D list or numpy array in AI format
        
    Returns:
        numpy array in project format
    """
    board = np.array(board, dtype=np.int32)
    # Convert white pieces: -1 -> 2
    board = np.where(board == -1, 2, board)
    return board


def convert_player_to_ai(player):
    """
    Convert player identifier from project format to AI format
    
    Project format: 1=black, 2=white
    AI format: 1=black, -1=white
    
    Args:
        player: 1 or 2 in project format
        
    Returns:
        1 or -1 in AI format
    """
    return 1 if player == 1 else -1


def convert_player_to_project(player):
    """
    Convert player identifier from AI format to project format
    
    AI format: 1=black, -1=white
    Project format: 1=black, 2=white
    
    Args:
        player: 1 or -1 in AI format
        
    Returns:
        1 or 2 in project format
    """
    return 1 if player == 1 else 2


def validate_board(board, expected_size=15):
    """
    Validate board dimensions and values
    
    Args:
        board: 2D list or numpy array
        expected_size: expected board dimension (default 15)
        
    Returns:
        tuple (is_valid, error_message)
    """
    try:
        board = np.array(board)
        
        if board.ndim != 2:
            return False, "Board must be 2-dimensional"
        
        if board.shape[0] != expected_size or board.shape[1] != expected_size:
            return False, f"Board must be {expected_size}x{expected_size}"
        
        # Check for valid values (0, 1, 2 for project format or 0, 1, -1 for AI format)
        unique_values = set(board.flatten())
        valid_project = unique_values.issubset({0, 1, 2})
        valid_ai = unique_values.issubset({0, 1, -1})
        
        if not (valid_project or valid_ai):
            return False, "Board contains invalid values"
        
        return True, None
        
    except Exception as e:
        return False, str(e)

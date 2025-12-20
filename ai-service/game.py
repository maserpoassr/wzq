"""
Gomoku Game Logic for AI Service
Adapted from AlphaZero Gomoku implementation
"""

import numpy as np


class Board:
    """
    Gomoku board class
    Board data: 1=black(first), -1=white(second), 0=empty
    """

    def __init__(self, n=15):
        self.n = n
        self.pieces = [[0] * n for _ in range(n)]

    def __getitem__(self, index):
        return self.pieces[index]

    def get_legal_moves(self, color):
        """Return all legal move positions"""
        moves = []
        for y in range(self.n):
            for x in range(self.n):
                if self[x][y] == 0:
                    moves.append((x, y))
        return moves

    def has_legal_moves(self):
        """Check if there are any legal moves"""
        for y in range(self.n):
            for x in range(self.n):
                if self[x][y] == 0:
                    return True
        return False

    def execute_move(self, move, color):
        """Place a piece on the specified position"""
        x, y = move
        self[x][y] = color

    def is_win(self, color):
        """Check if there is a win (5 in a row)"""
        directions = [(1, 0), (0, 1), (1, 1), (1, -1)]

        for y in range(self.n):
            for x in range(self.n):
                if self[x][y] == color:
                    for dx, dy in directions:
                        count = 1
                        # Check forward
                        tx, ty = x + dx, y + dy
                        while (0 <= tx < self.n and 0 <= ty < self.n 
                               and self[tx][ty] == color):
                            count += 1
                            tx += dx
                            ty += dy
                        # Check backward
                        tx, ty = x - dx, y - dy
                        while (0 <= tx < self.n and 0 <= ty < self.n 
                               and self[tx][ty] == color):
                            count += 1
                            tx -= dx
                            ty -= dy
                        if count >= 5:
                            return True
        return False



class GomokuGame:
    """
    Gomoku Game class for AI inference
    """

    def __init__(self, n=15):
        self.n = n

    def getInitBoard(self):
        """Return initial empty board"""
        b = Board(self.n)
        return np.array(b.pieces)

    def getBoardSize(self):
        """Return board dimensions"""
        return (self.n, self.n)

    def getActionSize(self):
        """Return total number of possible actions"""
        return self.n * self.n

    def getNextState(self, board, player, action):
        """Execute action and return new state"""
        b = Board(self.n)
        b.pieces = np.copy(board)
        move = (action // self.n, action % self.n)
        b.execute_move(move, player)
        return (b.pieces, -player)

    def getValidMoves(self, board, player):
        """Return valid moves as binary array"""
        b = Board(self.n)
        b.pieces = np.copy(board)
        valids = [0] * self.getActionSize()
        legalMoves = b.get_legal_moves(player)
        for x, y in legalMoves:
            valids[self.n * x + y] = 1
        return np.array(valids)

    def getGameEnded(self, board, player):
        """
        Return game result:
        1 if player won, -1 if player lost, 0 if draw, None if not ended
        """
        b = Board(self.n)
        b.pieces = np.copy(board)

        if b.is_win(player):
            return 1
        if b.is_win(-player):
            return -1
        if not b.has_legal_moves():
            return 0
        return None

    def getCanonicalForm(self, board, player):
        """Return board from player's perspective"""
        return player * board

    def stringRepresentation(self, board):
        """Return string representation for hashing"""
        return board.tostring()

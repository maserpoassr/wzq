"""
Monte Carlo Tree Search for Gomoku AI
Adapted from AlphaZero Gomoku implementation
"""

import math
import numpy as np
import logging

log = logging.getLogger(__name__)


class MCTS:
    """
    Monte Carlo Tree Search implementation
    """

    def __init__(self, game, nnet, args):
        self.game = game
        self.nnet = nnet
        self.args = args
        self.Qsa = {}  # Q values for (state, action)
        self.Nsa = {}  # Visit count for (state, action)
        self.Ns = {}   # Visit count for state
        self.Ps = {}   # Policy from neural network
        self.Es = {}   # Game ended status
        self.Vs = {}   # Valid moves

    def getActionProb(self, canonicalBoard, temp=1):
        """
        Perform MCTS simulations and return action probabilities
        
        Args:
            canonicalBoard: board state from current player's perspective
            temp: temperature for exploration (0 = greedy, 1 = proportional)
            
        Returns:
            probs: probability distribution over actions
        """
        for _ in range(self.args.numMCTSSims):
            self.search(canonicalBoard)

        s = self.game.stringRepresentation(canonicalBoard)
        counts = [
            self.Nsa[(s, a)] if (s, a) in self.Nsa else 0
            for a in range(self.game.getActionSize())
        ]

        if temp == 0:
            # Greedy selection
            bestAs = np.array(np.argwhere(counts == np.max(counts))).flatten()
            bestA = np.random.choice(bestAs)
            probs = [0] * len(counts)
            probs[bestA] = 1
            return probs

        # Proportional selection with temperature
        counts = [x ** (1.0 / temp) for x in counts]
        counts_sum = float(sum(counts))
        probs = [x / counts_sum for x in counts]
        return probs


    def search(self, canonicalBoard):
        """
        Perform one iteration of MCTS
        
        Recursively searches until a leaf node is found, then uses neural network
        to evaluate and backpropagate the value.
        
        Args:
            canonicalBoard: board state from current player's perspective
            
        Returns:
            v: value of the current state
        """
        s = self.game.stringRepresentation(canonicalBoard)

        # Check if terminal state
        if s not in self.Es:
            self.Es[s] = self.game.getGameEnded(canonicalBoard, 1)
        if self.Es[s] is not None:
            return self.Es[s]

        # Leaf node - expand using neural network
        if s not in self.Ps:
            self.Ps[s], v = self.nnet.predict(canonicalBoard)
            valids = self.game.getValidMoves(canonicalBoard, 1)
            self.Ps[s] = self.Ps[s] * valids  # Mask invalid moves
            sum_Ps_s = np.sum(self.Ps[s])
            
            if sum_Ps_s > 0:
                self.Ps[s] /= sum_Ps_s  # Renormalize
            else:
                # Fallback: make all valid moves equally probable
                log.warning("All valid moves were masked, using uniform distribution")
                self.Ps[s] = self.Ps[s] + valids
                self.Ps[s] /= np.sum(self.Ps[s])

            self.Vs[s] = valids
            self.Ns[s] = 0
            return v

        # Select action with highest UCB
        valids = self.Vs[s]
        cur_best = -float("inf")
        best_act = -1

        for a in range(self.game.getActionSize()):
            if valids[a]:
                u = self.Qsa.get((s, a), 0) + self.args.cpuct * self.Ps[s][a] * \
                    math.sqrt(self.Ns[s]) / (1 + self.Nsa.get((s, a), 0))

                if u > cur_best:
                    cur_best = u
                    best_act = a

        a = best_act
        next_s, next_player = self.game.getNextState(canonicalBoard, 1, a)
        next_s = self.game.getCanonicalForm(next_s, next_player)

        v = -self.search(next_s)

        # Update statistics
        if (s, a) in self.Qsa:
            self.Qsa[(s, a)] = (self.Nsa[(s, a)] * self.Qsa[(s, a)] + v) / (self.Nsa[(s, a)] + 1)
            self.Nsa[(s, a)] += 1
        else:
            self.Qsa[(s, a)] = v
            self.Nsa[(s, a)] = 1

        self.Ns[s] += 1
        return v

    def reset(self):
        """Clear all cached data for new game"""
        self.Qsa = {}
        self.Nsa = {}
        self.Ns = {}
        self.Ps = {}
        self.Es = {}
        self.Vs = {}

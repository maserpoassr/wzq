"""
Neural Network for Gomoku AI
Adapted from AlphaZero Gomoku implementation
"""

import os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class GomokuNNet(nn.Module):
    """
    Neural Network architecture for Gomoku
    """

    def __init__(self, game, args):
        self.board_x, self.board_y = game.getBoardSize()
        self.action_size = game.getActionSize()
        self.args = args

        super(GomokuNNet, self).__init__()
        
        self.conv1 = nn.Conv2d(1, args.num_channels, 3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(args.num_channels, args.num_channels, 3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(args.num_channels, args.num_channels, 3, stride=1)
        self.conv4 = nn.Conv2d(args.num_channels, args.num_channels, 3, stride=1)

        self.bn1 = nn.BatchNorm2d(args.num_channels)
        self.bn2 = nn.BatchNorm2d(args.num_channels)
        self.bn3 = nn.BatchNorm2d(args.num_channels)
        self.bn4 = nn.BatchNorm2d(args.num_channels)

        self.fc1 = nn.Linear(
            args.num_channels * (self.board_x - 4) * (self.board_y - 4), 1024
        )
        self.fc_bn1 = nn.BatchNorm1d(1024)

        self.fc2 = nn.Linear(1024, 512)
        self.fc_bn2 = nn.BatchNorm1d(512)

        self.fc3 = nn.Linear(512, self.action_size)
        self.fc4 = nn.Linear(512, 1)

    def forward(self, s):
        s = s.view(-1, 1, self.board_x, self.board_y)
        s = F.relu(self.bn1(self.conv1(s)))
        s = F.relu(self.bn2(self.conv2(s)))
        s = F.relu(self.bn3(self.conv3(s)))
        s = F.relu(self.bn4(self.conv4(s)))
        s = s.view(-1, self.args.num_channels * (self.board_x - 4) * (self.board_y - 4))

        s = F.dropout(
            F.relu(self.fc_bn1(self.fc1(s))),
            p=self.args.dropout,
            training=self.training,
        )
        s = F.dropout(
            F.relu(self.fc_bn2(self.fc2(s))),
            p=self.args.dropout,
            training=self.training,
        )

        pi = self.fc3(s)
        v = self.fc4(s)

        return F.log_softmax(pi, dim=1), torch.tanh(v)



class NNetWrapper:
    """
    Wrapper class for neural network inference
    """

    def __init__(self, game, args):
        self.nnet = GomokuNNet(game, args)
        self.board_x, self.board_y = game.getBoardSize()
        self.action_size = game.getActionSize()
        self.args = args

        if args.cuda:
            self.nnet.cuda()

    def predict(self, board):
        """
        Predict policy and value for given board state
        
        Args:
            board: numpy array of board state
            
        Returns:
            pi: policy vector (probabilities for each action)
            v: value estimate
        """
        board = torch.FloatTensor(board.astype(np.float32))
        if self.args.cuda:
            board = board.cuda()
        board = board.view(1, self.board_x, self.board_y)
        
        self.nnet.eval()
        with torch.no_grad():
            pi, v = self.nnet(board)

        return torch.exp(pi).data.cpu().numpy()[0], v.data.cpu().numpy()[0]

    def load_checkpoint(self, folder, filename):
        """
        Load model weights from checkpoint file
        
        Args:
            folder: directory containing checkpoint
            filename: checkpoint filename
        """
        folder = folder.rstrip('/')
        filepath = os.path.join(folder, filename)
        
        if not os.path.exists(filepath):
            raise ValueError(f"No model found at {filepath}")
        
        map_location = None if self.args.cuda else "cpu"
        checkpoint = torch.load(filepath, map_location=map_location, weights_only=True)
        self.nnet.load_state_dict(checkpoint["state_dict"])
        print(f"[AI] Model loaded from {filepath}")

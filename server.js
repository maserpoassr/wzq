/**
 * Gomoku Online - 在线多人五子棋服务端
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const RoomManager = require('./src/roomManager');
const { placeStone, requestUndo, respondUndo, surrender } = require('./src/gameActions');
const { serializeForClient } = require('./src/serialization');
const { validateNickname, createChatMessage } = require('./src/utils');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 创建 Socket.io 服务器
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 房间管理器
const roomManager = new RoomManager();

// 在线用户映射 (socketId -> { nickname, currentRoom })
const onlineUsers = new Map();

// 大厅用户集合
const lobbyUsers = new Set();

// 房间计时器映射 (roomId -> { timer, startTime })
const roomTimers = new Map();

// 回合时间限制（毫秒）
const TURN_TIME_LIMIT = 30000; // 30秒

// 再来一局超时时间（毫秒）
const REMATCH_TIMEOUT = 30000; // 30秒

// 再来一局超时计时器映射 (roomId -> { timer, requesterId })
const rematchTimers = new Map();

/**
 * 广播房间列表给所有大厅用户
 */
function broadcastRoomList() {
  const roomList = roomManager.getRoomList();
  for (const socketId of lobbyUsers) {
    io.to(socketId).emit('room-list', roomList);
  }
}

/**
 * 广播在线人数
 */
function broadcastOnlineCount() {
  io.emit('online-count', { count: onlineUsers.size });
}

/**
 * 广播房间更新给房间内所有人
 */
function broadcastRoomUpdate(roomId) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;
  
  // 获取房间内所有人的 socketId
  const participants = [];
  if (room.players.black) participants.push(room.players.black.socketId);
  if (room.players.white) participants.push(room.players.white.socketId);
  room.watchers.forEach(w => participants.push(w.socketId));
  
  // 给每个人发送他们视角的房间状态
  for (const socketId of participants) {
    const clientView = serializeForClient(room, socketId);
    io.to(socketId).emit('room-updated', clientView);
  }
}

/**
 * 启动回合计时器
 */
function startTurnTimer(roomId) {
  // 清除旧计时器
  clearTurnTimer(roomId);
  
  const room = roomManager.getRoom(roomId);
  if (!room || room.status !== 'playing' || room.winner) return;
  
  const startTime = Date.now();
  
  // 广播计时开始
  io.to(roomId).emit('turn-timer-start', { 
    timeLimit: TURN_TIME_LIMIT,
    currentTurn: room.currentTurn
  });
  
  // 设置超时计时器
  const timer = setTimeout(() => {
    handleTurnTimeout(roomId);
  }, TURN_TIME_LIMIT);
  
  roomTimers.set(roomId, { timer, startTime });
}

/**
 * 清除回合计时器
 */
function clearTurnTimer(roomId) {
  const timerData = roomTimers.get(roomId);
  if (timerData) {
    clearTimeout(timerData.timer);
    roomTimers.delete(roomId);
  }
}

/**
 * 处理回合超时 - 随机落子
 */
function handleTurnTimeout(roomId) {
  const room = roomManager.getRoom(roomId);
  if (!room || room.status !== 'playing' || room.winner) return;
  
  // 找到所有空位
  const emptyPositions = [];
  for (let x = 0; x < 15; x++) {
    for (let y = 0; y < 15; y++) {
      if (room.board[x][y] === 0) {
        emptyPositions.push({ x, y });
      }
    }
  }
  
  if (emptyPositions.length === 0) return;
  
  // 随机选择一个空位
  const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  
  // 获取当前回合玩家的 socketId
  const currentPlayer = room.currentTurn === 1 ? room.players.black : room.players.white;
  if (!currentPlayer) return;
  
  // 执行落子
  const result = placeStone(room, currentPlayer.socketId, randomPos.x, randomPos.y);
  
  if (result.success) {
    // 广播超时自动落子
    io.to(roomId).emit('timeout-auto-place', { 
      x: randomPos.x, 
      y: randomPos.y, 
      color: room.board[randomPos.x][randomPos.y] 
    });
    
    // 广播落子
    io.to(roomId).emit('stone-placed', { 
      x: randomPos.x, 
      y: randomPos.y, 
      color: room.board[randomPos.x][randomPos.y] 
    });
    
    // 如果游戏结束
    if (result.winner) {
      clearTurnTimer(roomId);
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        winningStones: result.winningStones
      });
      broadcastRoomList();
    } else {
      // 启动下一回合计时器
      startTurnTimer(roomId);
    }
    
    broadcastRoomUpdate(roomId);
    console.log(`[超时] 房间 ${roomId} 自动落子 (${randomPos.x}, ${randomPos.y})`);
  }
}

/**
 * 启动再来一局超时计时器
 * Requirements: 2.1, 2.2
 * @param {string} roomId - 房间ID
 * @param {string} requesterId - 请求者的 socket ID
 */
function startRematchTimeout(roomId, requesterId) {
  // 清除旧计时器
  clearRematchTimeout(roomId);
  
  const timer = setTimeout(() => {
    handleRematchTimeout(roomId, requesterId);
  }, REMATCH_TIMEOUT);
  
  rematchTimers.set(roomId, { timer, requesterId, startTime: Date.now() });
}

/**
 * 清除再来一局超时计时器
 * @param {string} roomId - 房间ID
 */
function clearRematchTimeout(roomId) {
  const timerData = rematchTimers.get(roomId);
  if (timerData) {
    clearTimeout(timerData.timer);
    rematchTimers.delete(roomId);
  }
}

/**
 * 处理再来一局超时
 * Requirements: 2.1, 2.2
 * @param {string} roomId - 房间ID
 * @param {string} requesterId - 请求者的 socket ID
 */
function handleRematchTimeout(roomId, requesterId) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;
  
  // 通知请求者超时
  io.to(requesterId).emit('rematch-timeout', {
    message: '对方未响应再来一局请求',
    canContinueWaiting: true,
    canLeave: true
  });
  
  console.log(`[再来一局] 房间 ${roomId} 再来一局请求超时`);
}

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`[连接] 用户连接: ${socket.id}`);
  
  // 加入大厅
  socket.on('join-lobby', ({ nickname }) => {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }
    
    onlineUsers.set(socket.id, { nickname, currentRoom: null });
    lobbyUsers.add(socket.id);
    
    broadcastOnlineCount();
    socket.emit('room-list', roomManager.getRoomList());
    
    console.log(`[大厅] ${nickname} 加入大厅`);
  });
  
  // 创建房间
  socket.on('create-room', ({ name }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) {
      // Requirements: 5.1, 5.2 - 使用 toast 类型的错误，不阻挡 UI 交互
      socket.emit('lobby-required', { message: '请先加入大厅' });
      return;
    }
    
    const room = roomManager.createRoom(name, {
      socketId: socket.id,
      nickname: user.nickname
    });
    
    // 离开大厅，加入房间
    lobbyUsers.delete(socket.id);
    user.currentRoom = room.id;
    socket.join(room.id);
    
    socket.emit('room-joined', {
      room: serializeForClient(room, socket.id),
      role: 'black'
    });
    
    broadcastRoomList();
    console.log(`[房间] ${user.nickname} 创建房间 ${room.id}`);
  });
  
  // 快速匹配
  socket.on('quick-match', () => {
    const user = onlineUsers.get(socket.id);
    if (!user) {
      // Requirements: 5.1, 5.2 - 使用 toast 类型的错误，不阻挡 UI 交互
      socket.emit('lobby-required', { message: '请先加入大厅' });
      return;
    }
    
    // 查找等待中的房间
    const waitingRoom = roomManager.findWaitingRoom();
    
    if (waitingRoom) {
      // 加入现有房间
      const result = roomManager.joinRoom(waitingRoom.id, {
        socketId: socket.id,
        nickname: user.nickname
      }, false);
      
      if (result.success) {
        lobbyUsers.delete(socket.id);
        user.currentRoom = waitingRoom.id;
        socket.join(waitingRoom.id);
        
        const room = roomManager.getRoom(waitingRoom.id);
        
        socket.emit('room-joined', {
          room: serializeForClient(room, socket.id),
          role: result.role
        });
        
        // 游戏开始，启动计时器
        if (room.status === 'playing') {
          startTurnTimer(waitingRoom.id);
        }
        
        broadcastRoomUpdate(waitingRoom.id);
        broadcastRoomList();
        console.log(`[快速匹配] ${user.nickname} 加入房间 ${waitingRoom.id}`);
      }
    } else {
      // 创建新房间
      const room = roomManager.createRoom(`${user.nickname}的房间`, {
        socketId: socket.id,
        nickname: user.nickname
      });
      
      lobbyUsers.delete(socket.id);
      user.currentRoom = room.id;
      socket.join(room.id);
      
      socket.emit('room-joined', {
        room: serializeForClient(room, socket.id),
        role: 'black'
      });
      
      broadcastRoomList();
      console.log(`[快速匹配] ${user.nickname} 创建新房间 ${room.id}`);
    }
  });
  
  // 加入房间
  socket.on('join-room', ({ roomId, asWatcher }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) {
      // Requirements: 5.1, 5.2 - 使用 toast 类型的错误，不阻挡 UI 交互
      socket.emit('lobby-required', { message: '请先加入大厅' });
      return;
    }
    
    const roomBefore = roomManager.getRoom(roomId);
    const wasWaiting = roomBefore && roomBefore.status === 'waiting';
    
    const result = roomManager.joinRoom(roomId, {
      socketId: socket.id,
      nickname: user.nickname
    }, asWatcher);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    const room = roomManager.getRoom(roomId);
    lobbyUsers.delete(socket.id);
    user.currentRoom = roomId;
    socket.join(roomId);
    
    socket.emit('room-joined', {
      room: serializeForClient(room, socket.id),
      role: result.role
    });
    
    // 通知房间内其他人
    socket.to(roomId).emit('player-joined', { nickname: user.nickname, role: result.role });
    
    // 如果游戏刚开始（从等待变为进行中），启动计时器
    if (wasWaiting && room.status === 'playing') {
      startTurnTimer(roomId);
    }
    
    broadcastRoomUpdate(roomId);
    broadcastRoomList();
    console.log(`[房间] ${user.nickname} 加入房间 ${roomId} 作为 ${result.role}`);
  });
  
  // 离开房间
  // Requirements: 3.1, 3.2, 3.3
  socket.on('leave-room', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const room = roomManager.getRoom(roomId);
    
    // 检查是否在再来一局等待状态
    let wasInRematchWaiting = false;
    let playerColor = null;
    if (room) {
      if (room.players.black && room.players.black.socketId === socket.id) {
        playerColor = 'black';
      } else if (room.players.white && room.players.white.socketId === socket.id) {
        playerColor = 'white';
      }
      
      // 检查是否有任何再来一局请求
      if (room.rematchRequests && (room.rematchRequests.black || room.rematchRequests.white)) {
        wasInRematchWaiting = true;
      }
    }
    
    const result = roomManager.leaveRoom(roomId, socket.id);
    
    if (result.success) {
      socket.leave(roomId);
      user.currentRoom = null;
      lobbyUsers.add(socket.id);
      
      // 清除计时器
      const roomAfter = roomManager.getRoom(roomId);
      if (!roomAfter || roomAfter.status !== 'playing') {
        clearTurnTimer(roomId);
      }
      
      // 清除再来一局超时计时器
      clearRematchTimeout(roomId);
      
      // 如果在再来一局等待期间离开，通知对方
      if (wasInRematchWaiting && playerColor) {
        const opponentColor = playerColor === 'black' ? 'white' : 'black';
        const opponent = roomAfter?.players[opponentColor];
        if (opponent) {
          io.to(opponent.socketId).emit('opponent-left-rematch', {
            canWaitNewOpponent: true,
            roomStatus: roomAfter.status,
            message: '对方已离开房间'
          });
        }
        
        // 重置房间的再来一局请求状态
        if (roomAfter && roomAfter.rematchRequests) {
          roomAfter.rematchRequests = { black: false, white: false };
        }
      }
      
      // 通知房间内其他人
      socket.to(roomId).emit('player-left', { nickname: result.nickname });
      
      broadcastRoomUpdate(roomId);
      broadcastRoomList();
      socket.emit('room-list', roomManager.getRoomList());
      
      console.log(`[房间] ${result.nickname} 离开房间 ${roomId}`);
    }
  });
  
  // 落子
  socket.on('place-stone', ({ roomId, x, y }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const result = placeStone(room, socket.id, x, y);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // 广播落子
    io.to(roomId).emit('stone-placed', { x, y, color: room.board[x][y] });
    
    // 如果游戏结束
    if (result.winner) {
      clearTurnTimer(roomId);
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        winningStones: result.winningStones
      });
      broadcastRoomList();
    } else {
      // 启动下一回合计时器
      startTurnTimer(roomId);
    }
    
    broadcastRoomUpdate(roomId);
  });
  
  // 请求换方
  socket.on('request-swap', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 检查游戏是否进行中
    if (room.status !== 'playing') {
      socket.emit('error', { message: '游戏未在进行中' });
      return;
    }
    
    // 检查是否已有落子（只有开局时才能换方）
    if (room.history.length > 0) {
      socket.emit('error', { message: '已有落子，无法换方' });
      return;
    }
    
    // 确定请求者是哪方
    let requesterColor = null;
    if (room.players.black && room.players.black.socketId === socket.id) {
      requesterColor = 'black';
    } else if (room.players.white && room.players.white.socketId === socket.id) {
      requesterColor = 'white';
    }
    
    if (!requesterColor) {
      socket.emit('error', { message: '您不是游戏玩家' });
      return;
    }
    
    // 获取对手
    const opponentColor = requesterColor === 'black' ? 'white' : 'black';
    const opponent = room.players[opponentColor];
    
    if (!opponent) {
      socket.emit('error', { message: '对手不在房间中' });
      return;
    }
    
    // 发送换方请求给对手
    io.to(opponent.socketId).emit('swap-requested', {
      from: user.nickname
    });
    
    showToast && console.log(`[换方] ${user.nickname} 请求换方`);
  });
  
  // 响应换方请求
  socket.on('respond-swap', ({ roomId, accept }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 检查游戏是否进行中
    if (room.status !== 'playing') {
      socket.emit('error', { message: '游戏未在进行中' });
      return;
    }
    
    // 检查是否已有落子
    if (room.history.length > 0) {
      socket.emit('error', { message: '已有落子，无法换方' });
      return;
    }
    
    if (!accept) {
      io.to(roomId).emit('swap-result', { accepted: false });
      return;
    }
    
    // 执行换方：交换黑白棋玩家
    const tempBlack = room.players.black;
    room.players.black = room.players.white;
    room.players.white = tempBlack;
    
    // 广播换方结果
    io.to(roomId).emit('swap-result', { accepted: true });
    
    // 重新启动计时器（因为先手变了）
    startTurnTimer(roomId);
    
    broadcastRoomUpdate(roomId);
    console.log(`[换方] 房间 ${roomId} 换方成功`);
  });

  // 请求悔棋
  // 存储待处理的悔棋请求（用于传递请求者颜色）
  const pendingUndoRequests = new Map();
  
  socket.on('request-undo', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const result = requestUndo(room, socket.id);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // 存储请求者颜色，用于响应时更新悔棋计数
    pendingUndoRequests.set(roomId, result.requesterColor);
    
    // 发送悔棋请求给对手
    io.to(result.targetSocketId).emit('undo-requested', {
      from: result.requesterNickname,
      remainingUndos: result.remainingUndos
    });
  });
  
  // 响应悔棋
  socket.on('respond-undo', ({ roomId, accept }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 获取请求者颜色
    const requesterColor = pendingUndoRequests.get(roomId);
    pendingUndoRequests.delete(roomId);
    
    const result = respondUndo(room, socket.id, accept, requesterColor);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // 广播悔棋结果
    io.to(roomId).emit('undo-result', { 
      accepted: result.accepted,
      remainingUndos: result.remainingUndos
    });
    
    if (result.accepted) {
      broadcastRoomUpdate(roomId);
    }
  });
  
  // 认输
  socket.on('surrender', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const result = surrender(room, socket.id);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    clearTurnTimer(roomId);
    
    io.to(roomId).emit('game-over', {
      winner: result.winner,
      winningStones: null,
      surrender: true
    });
    
    broadcastRoomUpdate(roomId);
    broadcastRoomList();
  });
  
  // 发送聊天消息
  socket.on('chat-message', ({ roomId, message }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    const chatMessage = createChatMessage(user.nickname, message);
    room.chat.push(chatMessage);
    
    io.to(roomId).emit('chat-received', chatMessage);
  });
  
  // 请求再来一局（双方确认机制）
  // Requirements: 1.1, 1.2, 1.3, 1.4
  socket.on('request-rematch', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 确定请求者是哪方
    let playerColor = null;
    if (room.players.black && room.players.black.socketId === socket.id) {
      playerColor = 'black';
    } else if (room.players.white && room.players.white.socketId === socket.id) {
      playerColor = 'white';
    }
    
    if (!playerColor) {
      socket.emit('error', { message: '您不是游戏玩家' });
      return;
    }
    
    // 获取对手信息
    const opponentColor = playerColor === 'black' ? 'white' : 'black';
    const opponent = room.players[opponentColor];
    
    // 初始化 rematchRequests 如果不存在
    if (!room.rematchRequests || typeof room.rematchRequests !== 'object') {
      room.rematchRequests = { black: false, white: false };
    }
    
    // 记录该玩家的再来一局请求
    room.rematchRequests[playerColor] = true;
    room.lastActivity = Date.now();
    
    // 检查对方是否已经请求
    const opponentRequested = room.rematchRequests[opponentColor];
    
    // 检查双方是否都请求了再来一局
    const bothReady = room.rematchRequests.black && room.rematchRequests.white;
    
    if (bothReady) {
      // 清除再来一局超时计时器
      clearRematchTimeout(roomId);
      
      // 根据上局胜负决定是否交换黑白棋（胜者变为后手/白棋）
      const shouldSwap = room.winner !== null;
      
      // 记录交换前的角色，用于通知各玩家新角色
      const blackSocketId = room.players.black.socketId;
      const whiteSocketId = room.players.white.socketId;
      
      // 重置房间
      roomManager.resetRoom(roomId, shouldSwap);
      
      // 清除回合计时器
      clearTurnTimer(roomId);
      
      // 通知双方游戏开始
      const roomAfter = roomManager.getRoom(roomId);
      
      // 给黑棋玩家发送其新角色
      io.to(blackSocketId).emit('rematch-start', { 
        swapped: shouldSwap,
        newRole: shouldSwap ? 'white' : 'black',
        message: shouldSwap ? '黑白棋已交换！' : '新游戏开始！'
      });
      
      // 给白棋玩家发送其新角色
      io.to(whiteSocketId).emit('rematch-start', { 
        swapped: shouldSwap,
        newRole: shouldSwap ? 'black' : 'white',
        message: shouldSwap ? '黑白棋已交换！' : '新游戏开始！'
      });
      
      // 启动回合计时器
      startTurnTimer(roomId);
      
      broadcastRoomUpdate(roomId);
      broadcastRoomList();
      console.log(`[再来一局] 房间 ${roomId} 双方确认，开始新游戏${shouldSwap ? '（已交换黑白棋）' : ''}`);
    } else {
      // 只有一方请求，显示等待状态
      // 启动再来一局超时计时器
      startRematchTimeout(roomId, socket.id);
      
      // 通知请求者正在等待
      socket.emit('rematch-waiting', { 
        timeout: REMATCH_TIMEOUT,
        opponentRequested: opponentRequested
      });
      
      // 通知对方有人请求再来一局
      if (opponent) {
        io.to(opponent.socketId).emit('rematch-requested', {
          from: user.nickname
        });
      }
      
      console.log(`[再来一局] ${user.nickname} 请求再来一局，等待对方确认`);
    }
  });
  
  // 取消再来一局请求
  socket.on('cancel-rematch', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    // 确定请求者是哪方
    let playerColor = null;
    if (room.players.black && room.players.black.socketId === socket.id) {
      playerColor = 'black';
    } else if (room.players.white && room.players.white.socketId === socket.id) {
      playerColor = 'white';
    }
    
    if (!playerColor) return;
    
    // 取消请求
    if (room.rematchRequests) {
      room.rematchRequests[playerColor] = false;
    }
    
    // 清除超时计时器
    clearRematchTimeout(roomId);
    
    // 通知对方请求已取消
    const opponentColor = playerColor === 'black' ? 'white' : 'black';
    const opponent = room.players[opponentColor];
    if (opponent) {
      io.to(opponent.socketId).emit('rematch-cancelled', {
        from: user.nickname
      });
    }
    
    console.log(`[再来一局] ${user.nickname} 取消了再来一局请求`);
  });
  
  // 刷新房间列表
  socket.on('refresh-rooms', () => {
    socket.emit('room-list', roomManager.getRoomList());
  });
  
  // 搜索房间
  socket.on('search-room', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('search-result', { found: false });
      return;
    }
    
    // 返回房间信息
    socket.emit('search-result', {
      found: true,
      room: {
        id: room.id,
        name: room.name,
        blackPlayer: room.players.black ? room.players.black.nickname : null,
        whitePlayer: room.players.white ? room.players.white.nickname : null,
        status: room.status,
        watcherCount: room.watchers.length
      }
    });
    
    console.log(`[搜索] 用户搜索房间 ${roomId}: ${room ? '找到' : '未找到'}`);
  });
  
  // 断开连接
  // Requirements: 2.3, 3.2, 3.3
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    
    if (user) {
      // 如果在房间中，离开房间
      if (user.currentRoom) {
        const roomId = user.currentRoom;
        const room = roomManager.getRoom(roomId);
        
        // 检查是否在再来一局等待状态
        let wasInRematchWaiting = false;
        let playerColor = null;
        if (room) {
          if (room.players.black && room.players.black.socketId === socket.id) {
            playerColor = 'black';
          } else if (room.players.white && room.players.white.socketId === socket.id) {
            playerColor = 'white';
          }
          
          if (room.rematchRequests && (room.rematchRequests.black || room.rematchRequests.white)) {
            wasInRematchWaiting = true;
          }
        }
        
        const result = roomManager.leaveRoom(roomId, socket.id);
        if (result.success) {
          // 清除再来一局超时计时器
          clearRematchTimeout(roomId);
          
          const roomAfter = roomManager.getRoom(roomId);
          
          // 如果在再来一局等待期间断开，通知对方
          if (wasInRematchWaiting && playerColor) {
            const opponentColor = playerColor === 'black' ? 'white' : 'black';
            const opponent = roomAfter?.players[opponentColor];
            if (opponent) {
              io.to(opponent.socketId).emit('opponent-left-rematch', {
                canWaitNewOpponent: true,
                roomStatus: roomAfter?.status || 'waiting',
                message: '对方已断开连接'
              });
            }
            
            // 重置房间的再来一局请求状态
            if (roomAfter && roomAfter.rematchRequests) {
              roomAfter.rematchRequests = { black: false, white: false };
            }
          }
          
          socket.to(roomId).emit('player-left', { nickname: result.nickname });
          broadcastRoomUpdate(roomId);
          broadcastRoomList();
        }
      }
      
      lobbyUsers.delete(socket.id);
      onlineUsers.delete(socket.id);
      broadcastOnlineCount();
      
      console.log(`[断开] ${user.nickname} 断开连接`);
    }
  });
});

// 定期清理空房间（每分钟）
setInterval(() => {
  const deleted = roomManager.cleanupEmptyRooms();
  if (deleted.length > 0) {
    console.log(`[清理] 删除空房间: ${deleted.join(', ')}`);
    broadcastRoomList();
  }
}, 60000);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[启动] 五子棋服务器运行在端口 ${PORT}`);
  console.log(`[启动] 访问 http://localhost:${PORT} 开始游戏`);
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('[错误] 未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[错误] 未处理的 Promise 拒绝:', reason);
});

module.exports = { app, server, io, roomManager };

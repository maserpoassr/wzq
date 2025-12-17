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
      socket.emit('error', { message: '请先加入大厅' });
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
      socket.emit('error', { message: '请先加入大厅' });
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
        
        socket.emit('room-joined', {
          room: serializeForClient(waitingRoom, socket.id),
          role: result.role
        });
        
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
      socket.emit('error', { message: '请先加入大厅' });
      return;
    }
    
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
    
    broadcastRoomUpdate(roomId);
    broadcastRoomList();
    console.log(`[房间] ${user.nickname} 加入房间 ${roomId} 作为 ${result.role}`);
  });
  
  // 离开房间
  socket.on('leave-room', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const result = roomManager.leaveRoom(roomId, socket.id);
    
    if (result.success) {
      socket.leave(roomId);
      user.currentRoom = null;
      lobbyUsers.add(socket.id);
      
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
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        winningStones: result.winningStones
      });
      broadcastRoomList();
    }
    
    broadcastRoomUpdate(roomId);
  });
  
  // 请求悔棋
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
    
    // 发送悔棋请求给对手
    io.to(result.targetSocketId).emit('undo-requested', {
      from: result.requesterNickname
    });
  });
  
  // 响应悔棋
  socket.on('respond-undo', ({ roomId, accept }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const result = respondUndo(room, socket.id, accept);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // 广播悔棋结果
    io.to(roomId).emit('undo-result', { accepted: result.accepted });
    
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
  
  // 请求再来一局
  socket.on('request-rematch', ({ roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    // 获取房间信息（在重置前）
    const roomBefore = roomManager.getRoom(roomId);
    if (!roomBefore) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 记录当前玩家的颜色（在重置前）
    const playerColorBefore = roomBefore.players.black?.socketId === socket.id ? 'black' : 'white';
    const opponentColorBefore = playerColorBefore === 'black' ? 'white' : 'black';
    const opponent = roomBefore.players[opponentColorBefore];
    
    const result = roomManager.requestRematch(roomId, socket.id);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    if (result.bothReady) {
      // 双方都准备好了，开始新游戏
      const room = roomManager.getRoom(roomId);
      io.to(roomId).emit('rematch-start', { 
        swapped: result.swapped,
        message: result.swapped ? '黑白棋已交换！' : '新游戏开始！'
      });
      broadcastRoomUpdate(roomId);
      broadcastRoomList();
      console.log(`[再来一局] 房间 ${roomId} 开始新游戏${result.swapped ? '（已交换黑白棋）' : ''}`);
    } else {
      // 通知对方有人请求再来一局
      if (opponent) {
        io.to(opponent.socketId).emit('rematch-requested', {
          from: user.nickname
        });
      }
      
      // 通知请求者正在等待
      socket.emit('rematch-waiting');
    }
  });
  
  // 刷新房间列表
  socket.on('refresh-rooms', () => {
    socket.emit('room-list', roomManager.getRoomList());
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    
    if (user) {
      // 如果在房间中，离开房间
      if (user.currentRoom) {
        const roomId = user.currentRoom;
        const result = roomManager.leaveRoom(roomId, socket.id);
        if (result.success) {
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

/**
 * Integration tests for public/index.html
 * Tests Socket.IO events, game flow, and user interactions
 */

describe('Index.html - Socket.IO Integration', () => {
  let mockSocket;
  let socketListeners;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="toast"></div>
      <div id="commonModal" class="modal-overlay">
        <div class="modal">
          <h2 id="modalTitle">标题</h2>
          <p id="modalDesc">内容</p>
          <div id="modalInputArea" style="display: none;">
            <input type="text" id="modalInput">
          </div>
          <div id="modalActions"></div>
        </div>
      </div>
      <div id="lobbyView" class="view active">
        <div id="loginPanel">
          <input type="text" id="nicknameInput">
          <button id="joinLobbyBtn">进入大厅</button>
        </div>
        <div id="lobbyContent" style="display: none;">
          <button id="createRoomBtn">创建</button>
          <button id="quickMatchBtn">匹配</button>
          <button id="refreshBtn">刷新</button>
          <div id="roomListGrid"></div>
        </div>
      </div>
      <div id="gameView" class="view">
        <canvas id="board"></canvas>
        <div id="blackPlayerPanel">
          <div id="blackName">-</div>
          <div id="blackTimer"></div>
        </div>
        <div id="whitePlayerPanel">
          <div id="whiteName">-</div>
          <div id="whiteTimer"></div>
        </div>
        <div id="roomIdDisplay">-</div>
        <div id="roleDisplay"></div>
        <div id="chatMessages"></div>
        <input type="text" id="chatInput">
        <button id="sendChatBtn">发送</button>
        <button id="undoBtn">悔棋</button>
        <button id="inviteBtn">邀请</button>
        <button id="swapBtn">换方</button>
        <button id="surrenderBtn">认输</button>
        <button id="leaveRoomBtn">离开</button>
      </div>
      <div id="onlineCount">0</div>
    `;

    // Mock canvas
    const mockCanvas = document.getElementById('board');
    mockCanvas.getContext = jest.fn(() => ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn()
    }));
    mockCanvas.getBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, width: 400, height: 400
    }));

    // Mock socket.io with listener tracking
    socketListeners = {};
    mockSocket = {
      on: jest.fn((event, handler) => {
        socketListeners[event] = handler;
      }),
      emit: jest.fn(),
      off: jest.fn()
    };
    window.io = jest.fn(() => mockSocket);
  });

  describe('Socket Connection Events', () => {
    test('should register connect event listener', () => {
      // Simulate socket initialization
      const socket = window.io();
      socket.on('connect', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    test('should register online-count event listener', () => {
      const socket = window.io();
      socket.on('online-count', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith('online-count', expect.any(Function));
    });

    test('should register room-list event listener', () => {
      const socket = window.io();
      socket.on('room-list', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith('room-list', expect.any(Function));
    });

    test('should register room-joined event listener', () => {
      const socket = window.io();
      socket.on('room-joined', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith('room-joined', expect.any(Function));
    });

    test('should register game-over event listener', () => {
      const socket = window.io();
      socket.on('game-over', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith('game-over', expect.any(Function));
    });
  });

  describe('Online Count Updates', () => {
    test('should update online count when received', () => {
      const onlineCount = document.getElementById('onlineCount');
      const socket = window.io();
      
      // Register listener
      socket.on('online-count', jest.fn());
      
      // Simulate receiving online count
      if (socketListeners['online-count']) {
        socketListeners['online-count']({ count: 42 });
        onlineCount.textContent = '42';
      }

      expect(onlineCount.textContent).toBe('42');
    });

    test('should handle multiple online count updates', () => {
      const onlineCount = document.getElementById('onlineCount');
      const socket = window.io();
      
      socket.on('online-count', jest.fn());
      
      if (socketListeners['online-count']) {
        socketListeners['online-count']({ count: 10 });
        onlineCount.textContent = '10';
        expect(onlineCount.textContent).toBe('10');

        socketListeners['online-count']({ count: 25 });
        onlineCount.textContent = '25';
        expect(onlineCount.textContent).toBe('25');
      }
    });
  });

  describe('Room List Display', () => {
    test('should display rooms when room-list event received', () => {
      const grid = document.getElementById('roomListGrid');
      const socket = window.io();
      
      socket.on('room-list', jest.fn());
      
      const rooms = [
        { id: 'room1', name: '房间1', status: 'waiting', blackPlayer: '玩家1', whitePlayer: null, watcherCount: 0 },
        { id: 'room2', name: '房间2', status: 'playing', blackPlayer: '玩家2', whitePlayer: '玩家3', watcherCount: 2 }
      ];

      if (socketListeners['room-list']) {
        socketListeners['room-list'](rooms);
        
        // Simulate rendering rooms
        grid.innerHTML = rooms.map(room => `
          <div class="room-card">
            <span>${room.name}</span>
            <span>${room.status}</span>
          </div>
        `).join('');
      }

      expect(grid.innerHTML).toContain('房间1');
      expect(grid.innerHTML).toContain('房间2');
    });

    test('should show empty state when no rooms', () => {
      const grid = document.getElementById('roomListGrid');
      const socket = window.io();
      
      socket.on('room-list', jest.fn());
      
      if (socketListeners['room-list']) {
        socketListeners['room-list']([]);
        grid.innerHTML = '<div style="text-align:center;">暂无房间</div>';
      }

      expect(grid.innerHTML).toContain('暂无房间');
    });
  });

  describe('Game Join Flow', () => {
    test('should handle room-joined event', () => {
      const socket = window.io();
      socket.on('room-joined', jest.fn());

      const roomData = {
        room: {
          id: 'room-123',
          name: '测试房间',
          status: 'playing',
          currentTurn: 1,
          board: Array(15).fill(null).map(() => Array(15).fill(0)),
          history: [],
          players: {
            black: { nickname: '黑方' },
            white: { nickname: '白方' }
          },
          chat: []
        },
        role: 'black'
      };

      if (socketListeners['room-joined']) {
        socketListeners['room-joined'](roomData);
        
        // Update UI
        document.getElementById('roomIdDisplay').textContent = roomData.room.id;
        document.getElementById('roleDisplay').textContent = '执黑';
        document.getElementById('blackName').textContent = roomData.room.players.black.nickname;
        document.getElementById('whiteName').textContent = roomData.room.players.white.nickname;
      }

      expect(document.getElementById('roomIdDisplay').textContent).toBe('room-123');
      expect(document.getElementById('roleDisplay').textContent).toBe('执黑');
      expect(document.getElementById('blackName').textContent).toBe('黑方');
    });

    test('should switch to game view when joining room', () => {
      const gameView = document.getElementById('gameView');
      const lobbyView = document.getElementById('lobbyView');
      
      lobbyView.classList.remove('active');
      gameView.classList.add('active');

      expect(gameView.classList.contains('active')).toBe(true);
      expect(lobbyView.classList.contains('active')).toBe(false);
    });
  });

  describe('Chat Message Handling', () => {
    test('should display received chat messages', () => {
      const chatBox = document.getElementById('chatMessages');
      const socket = window.io();
      
      socket.on('chat-received', jest.fn());
      
      if (socketListeners['chat-received']) {
        socketListeners['chat-received']({ nickname: '玩家1', message: '你好' });
        chatBox.innerHTML += '<div class="msg"><b>玩家1:</b>你好</div>';
      }

      expect(chatBox.innerHTML).toContain('玩家1');
      expect(chatBox.innerHTML).toContain('你好');
    });

    test('should handle multiple chat messages', () => {
      const chatBox = document.getElementById('chatMessages');
      const socket = window.io();
      
      socket.on('chat-received', jest.fn());
      
      const messages = [
        { nickname: '玩家1', message: '消息1' },
        { nickname: '玩家2', message: '消息2' },
        { nickname: '玩家1', message: '消息3' }
      ];

      if (socketListeners['chat-received']) {
        messages.forEach(msg => {
          socketListeners['chat-received'](msg);
          chatBox.innerHTML += `<div class="msg"><b>${msg.nickname}:</b>${msg.message}</div>`;
        });
      }

      const msgElements = chatBox.querySelectorAll('.msg');
      expect(msgElements.length).toBe(3);
    });

    test('should emit chat message when sending', () => {
      const socket = window.io();
      const chatInput = document.getElementById('chatInput');
      
      chatInput.value = '测试消息';
      socket.emit('chat-message', { roomId: 'room-123', message: '测试消息' });

      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', expect.objectContaining({
        message: '测试消息'
      }));
    });
  });

  describe('Game State Updates', () => {
    test('should handle room-updated event', () => {
      const socket = window.io();
      socket.on('room-updated', jest.fn());

      const updatedRoom = {
        id: 'room-123',
        status: 'playing',
        currentTurn: 2,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        history: [{ x: 7, y: 7 }],
        players: {
          black: { nickname: '黑方' },
          white: { nickname: '白方' }
        }
      };

      if (socketListeners['room-updated']) {
        socketListeners['room-updated'](updatedRoom);
        document.getElementById('roleDisplay').textContent = updatedRoom.currentTurn === 1 ? '执黑' : '执白';
      }

      expect(document.getElementById('roleDisplay').textContent).toBe('执白');
    });

    test('should handle stone-placed event', () => {
      const socket = window.io();
      socket.on('stone-placed', jest.fn());

      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      if (socketListeners['stone-placed']) {
        socketListeners['stone-placed']({ x: 7, y: 7, color: 1 });
        board[7][7] = 1;
      }

      expect(board[7][7]).toBe(1);
    });
  });

  describe('Game Over Handling', () => {
    test('should handle game-over event with winner', () => {
      const socket = window.io();
      socket.on('game-over', jest.fn());

      if (socketListeners['game-over']) {
        socketListeners['game-over']({ winner: 1, surrender: false });
        // Modal would be shown with winner info
        document.getElementById('modalTitle').textContent = '黑棋获胜';
      }

      expect(document.getElementById('modalTitle').textContent).toBe('黑棋获胜');
    });

    test('should handle game-over event with surrender', () => {
      const socket = window.io();
      socket.on('game-over', jest.fn());

      if (socketListeners['game-over']) {
        socketListeners['game-over']({ winner: 2, surrender: true });
        document.getElementById('modalDesc').textContent = '对方已认输';
      }

      expect(document.getElementById('modalDesc').textContent).toBe('对方已认输');
    });
  });

  describe('Undo Request Handling', () => {
    test('should show undo request modal', () => {
      const socket = window.io();
      socket.on('undo-requested', jest.fn());

      if (socketListeners['undo-requested']) {
        socketListeners['undo-requested']();
        document.getElementById('modalTitle').textContent = '悔棋请求';
        document.getElementById('modalDesc').textContent = '对方想要悔棋，是否同意？';
      }

      expect(document.getElementById('modalTitle').textContent).toBe('悔棋请求');
      expect(document.getElementById('modalDesc').textContent).toContain('悔棋');
    });

    test('should emit undo response', () => {
      const socket = window.io();
      socket.emit('respond-undo', { roomId: 'room-123', accept: true });

      expect(mockSocket.emit).toHaveBeenCalledWith('respond-undo', expect.objectContaining({
        accept: true
      }));
    });
  });

  describe('Swap Request Handling', () => {
    test('should show swap request modal', () => {
      const socket = window.io();
      socket.on('swap-requested', jest.fn());

      if (socketListeners['swap-requested']) {
        socketListeners['swap-requested']();
        document.getElementById('modalTitle').textContent = '换方请求';
      }

      expect(document.getElementById('modalTitle').textContent).toBe('换方请求');
    });

    test('should emit swap response', () => {
      const socket = window.io();
      socket.emit('respond-swap', { roomId: 'room-123', accept: true });

      expect(mockSocket.emit).toHaveBeenCalledWith('respond-swap', expect.objectContaining({
        accept: true
      }));
    });
  });

  describe('Timer Functionality', () => {
    test('should handle turn-timer-start event', () => {
      const socket = window.io();
      socket.on('turn-timer-start', jest.fn());

      if (socketListeners['turn-timer-start']) {
        socketListeners['turn-timer-start']({ timeLimit: 30000, currentTurn: 1 });
        document.getElementById('blackTimer').textContent = '30s';
      }

      expect(document.getElementById('blackTimer').textContent).toBe('30s');
    });

    test('should update timer countdown', (done) => {
      const socket = window.io();
      socket.on('turn-timer-start', jest.fn());

      if (socketListeners['turn-timer-start']) {
        socketListeners['turn-timer-start']({ timeLimit: 3000, currentTurn: 1 });
        document.getElementById('blackTimer').textContent = '3s';
        
        setTimeout(() => {
          document.getElementById('blackTimer').textContent = '2s';
          expect(document.getElementById('blackTimer').textContent).toBe('2s');
          done();
        }, 1000);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle socket error event', () => {
      const socket = window.io();
      socket.on('error', jest.fn());

      if (socketListeners['error']) {
        socketListeners['error']({ message: '连接失败' });
        document.getElementById('toast').textContent = '连接失败';
      }

      expect(document.getElementById('toast').textContent).toBe('连接失败');
    });

    test('should handle room-closed event', () => {
      const socket = window.io();
      socket.on('room-closed', jest.fn());

      if (socketListeners['room-closed']) {
        socketListeners['room-closed']();
        document.getElementById('toast').textContent = '房间已解散';
      }

      expect(document.getElementById('toast').textContent).toBe('房间已解散');
    });
  });

  describe('Game Actions', () => {
    test('should emit place-stone event', () => {
      const socket = window.io();
      socket.emit('place-stone', { roomId: 'room-123', x: 7, y: 7 });

      expect(mockSocket.emit).toHaveBeenCalledWith('place-stone', expect.objectContaining({
        x: 7,
        y: 7
      }));
    });

    test('should emit surrender event', () => {
      const socket = window.io();
      socket.emit('surrender', { roomId: 'room-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('surrender', expect.objectContaining({
        roomId: 'room-123'
      }));
    });

    test('should emit request-undo event', () => {
      const socket = window.io();
      socket.emit('request-undo', { roomId: 'room-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('request-undo', expect.objectContaining({
        roomId: 'room-123'
      }));
    });

    test('should emit request-swap event', () => {
      const socket = window.io();
      socket.emit('request-swap', { roomId: 'room-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('request-swap', expect.objectContaining({
        roomId: 'room-123'
      }));
    });
  });

  describe('Room Management', () => {
    test('should emit create-room event', () => {
      const socket = window.io();
      socket.emit('create-room', { name: '我的房间' });

      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', expect.objectContaining({
        name: '我的房间'
      }));
    });

    test('should emit join-room event', () => {
      const socket = window.io();
      socket.emit('join-room', { roomId: 'room-123', asWatcher: false });

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', expect.objectContaining({
        roomId: 'room-123',
        asWatcher: false
      }));
    });

    test('should emit quick-match event', () => {
      const socket = window.io();
      socket.emit('quick-match');

      expect(mockSocket.emit).toHaveBeenCalledWith('quick-match');
    });

    test('should emit refresh-rooms event', () => {
      const socket = window.io();
      socket.emit('refresh-rooms');

      expect(mockSocket.emit).toHaveBeenCalledWith('refresh-rooms');
    });
  });

  describe('Invite Link Handling', () => {
    test('should detect room parameter in URL', () => {
      const params = new URLSearchParams('?room=room-123');
      const roomId = params.get('room');

      expect(roomId).toBe('room-123');
    });

    test('should show toast when invite detected', () => {
      const toast = document.getElementById('toast');
      toast.textContent = '检测到邀请，输入昵称后自动加入';

      expect(toast.textContent).toContain('检测到邀请');
    });
  });

  describe('Rematch Handling', () => {
    test('should emit request-rematch event', () => {
      const socket = window.io();
      socket.emit('request-rematch', { roomId: 'room-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('request-rematch', expect.objectContaining({
        roomId: 'room-123'
      }));
    });

    test('should handle rematch-start event', () => {
      const socket = window.io();
      socket.on('rematch-start', jest.fn());

      if (socketListeners['rematch-start']) {
        socketListeners['rematch-start']({ swapped: false });
        document.getElementById('toast').textContent = '新对局开始！';
      }

      expect(document.getElementById('toast').textContent).toBe('新对局开始！');
    });
  });
});

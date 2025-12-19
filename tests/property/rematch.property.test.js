/**
 * Property-Based Tests for Rematch Functionality
 * 
 * Properties tested:
 * - Property 1: Rematch Request Recording
 * - Property 2: Both Players Rematch Triggers Reset
 * 
 * **Validates: Requirements 1.1, 1.2, 1.4**
 */

const fc = require('fast-check');
const RoomManager = require('../../src/roomManager');
const GameLogic = require('../../src/gameLogic');

describe('Rematch Properties', () => {
  // 生成有效昵称的 arbitrary
  const nicknameArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => s.trim().length > 0);
  
  // 生成 socket ID 的 arbitrary
  const socketIdArb = fc.uuid();
  
  // 生成玩家信息的 arbitrary
  const playerArb = fc.record({
    socketId: socketIdArb,
    nickname: nicknameArb
  });

  /**
   * Helper function to create a room with two players and simulate a game end
   */
  function createEndedGameRoom(manager, creator, player2, winner = null) {
    const room = manager.createRoom('Test Room', creator);
    manager.joinRoom(room.id, player2, false);
    
    // Simulate game end
    room.status = 'ended';
    room.winner = winner; // null, GameLogic.BLACK (1), or GameLogic.WHITE (2)
    room.rematchRequests = { black: false, white: false };
    
    return room;
  }

  /**
   * **Feature: rematch-optimization, Property 1: Rematch Request Recording**
   * 
   * *For any* player who clicks "再来一局", the room's rematch state SHALL contain 
   * that player's request as true.
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: Rematch Request Recording', () => {
    test('rematch request is recorded for the requesting player', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests (true = black, false = white)
          (creator, player2, blackRequests) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, GameLogic.BLACK);
            
            // Determine which player requests rematch
            const requesterSocketId = blackRequests 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            const requesterColor = blackRequests ? 'black' : 'white';
            
            // Request rematch
            const result = manager.requestRematch(room.id, requesterSocketId);
            
            // Verify: request should succeed
            if (!result.success) return false;
            
            // Verify: the player's request should be recorded as true
            if (!room.rematchRequests[requesterColor]) return false;
            
            // Verify: the other player's request should still be false
            const otherColor = requesterColor === 'black' ? 'white' : 'black';
            if (room.rematchRequests[otherColor]) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('non-player cannot request rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          playerArb, // non-player
          (creator, player2, nonPlayer) => {
            // Ensure all three are different
            const ids = [creator.socketId, player2.socketId, nonPlayer.socketId];
            if (new Set(ids).size !== 3) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, GameLogic.BLACK);
            
            // Non-player tries to request rematch
            const result = manager.requestRematch(room.id, nonPlayer.socketId);
            
            // Should fail
            return result.success === false && result.error === '您不是游戏玩家';
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: rematch-optimization, Property 2: Both Players Rematch Triggers Reset**
   * 
   * *For any* room where both players have requested rematch, the game board SHALL be 
   * reset to empty, both players SHALL remain in the room, and the room status SHALL be "playing".
   * 
   * **Validates: Requirements 1.2, 1.4**
   */
  describe('Property 2: Both Players Rematch Triggers Reset', () => {
    test('both players requesting rematch triggers game reset', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // First player requests rematch
            const result1 = manager.requestRematch(room.id, room.players.black.socketId);
            if (!result1.success) return false;
            if (result1.bothReady) return false; // Should not be ready yet
            
            // Second player requests rematch
            const result2 = manager.requestRematch(room.id, room.players.white.socketId);
            if (!result2.success) return false;
            
            // Verify: bothReady should be true
            if (!result2.bothReady) return false;
            
            // Verify: room status should be 'playing'
            if (room.status !== 'playing') return false;
            
            // Verify: board should be empty (all zeros)
            for (let x = 0; x < 15; x++) {
              for (let y = 0; y < 15; y++) {
                if (room.board[x][y] !== 0) return false;
              }
            }
            
            // Verify: both players should still be in the room
            if (!room.players.black || !room.players.white) return false;
            
            // Verify: winner should be reset to null
            if (room.winner !== null) return false;
            
            // Verify: rematch requests should be reset
            if (room.rematchRequests.black || room.rematchRequests.white) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('color swap occurs when black wins to make winner white', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, player2) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            // Black wins - swap should occur
            const room = createEndedGameRoom(manager, creator, player2, GameLogic.BLACK);
            
            // Record original players
            const originalBlackSocketId = room.players.black.socketId;
            const originalWhiteSocketId = room.players.white.socketId;
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            const result = manager.requestRematch(room.id, room.players.white.socketId);
            
            // Verify: swapped should be true (black won, needs swap to make winner white)
            if (!result.swapped) return false;
            
            // Verify: players should be swapped
            if (room.players.black.socketId !== originalWhiteSocketId) return false;
            if (room.players.white.socketId !== originalBlackSocketId) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('no color swap when white wins (winner already white)', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, player2) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            // White wins - no swap needed (winner already white)
            const room = createEndedGameRoom(manager, creator, player2, GameLogic.WHITE);
            
            // Record original players
            const originalBlackSocketId = room.players.black.socketId;
            const originalWhiteSocketId = room.players.white.socketId;
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            const result = manager.requestRematch(room.id, room.players.white.socketId);
            
            // Verify: swapped should be false (white won, already in white position)
            if (result.swapped) return false;
            
            // Verify: players should NOT be swapped
            if (room.players.black.socketId !== originalBlackSocketId) return false;
            if (room.players.white.socketId !== originalWhiteSocketId) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('no color swap when there was no winner (draw)', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          (creator, player2) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, null); // No winner (draw)
            
            // Record original players
            const originalBlackSocketId = room.players.black.socketId;
            const originalWhiteSocketId = room.players.white.socketId;
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            const result = manager.requestRematch(room.id, room.players.white.socketId);
            
            // Verify: swapped should be false (no winner)
            if (result.swapped) return false;
            
            // Verify: players should NOT be swapped
            if (room.players.black.socketId !== originalBlackSocketId) return false;
            if (room.players.white.socketId !== originalWhiteSocketId) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: rematch-optimization, Property 3: Single Player Rematch Shows Waiting**
   * 
   * *For any* room where only one player has requested rematch, that player's rematch state 
   * SHALL show "waiting" status, and the room SHALL NOT reset.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Single Player Rematch Shows Waiting', () => {
    test('single player rematch request shows waiting and room does not reset', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests (true = black, false = white)
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, blackRequests, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Record original state
            const originalStatus = room.status;
            const originalBoard = JSON.stringify(room.board);
            
            // Determine which player requests rematch
            const requesterSocketId = blackRequests 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            const requesterColor = blackRequests ? 'black' : 'white';
            const otherColor = blackRequests ? 'white' : 'black';
            
            // Single player requests rematch
            const result = manager.requestRematch(room.id, requesterSocketId);
            
            // Verify: request should succeed
            if (!result.success) return false;
            
            // Verify: bothReady should be false (only one player requested)
            if (result.bothReady) return false;
            
            // Verify: the requester's request should be recorded
            if (!room.rematchRequests[requesterColor]) return false;
            
            // Verify: the other player's request should still be false
            if (room.rematchRequests[otherColor]) return false;
            
            // Verify: room status should NOT change (still 'ended')
            if (room.status !== originalStatus) return false;
            
            // Verify: board should NOT be reset
            if (JSON.stringify(room.board) !== originalBoard) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: rematch-optimization, Property 4: Color Swap After Rematch**
   * 
   * *For any* rematch where there was a winner in the previous game, the previous winner 
   * SHALL become the white player (second to move) in the new game.
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: Color Swap After Rematch', () => {
    test('winner becomes white player after rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.constantFrom(GameLogic.BLACK, GameLogic.WHITE), // winner (must have a winner)
          (creator, player2, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Record the winner's socket ID before rematch
            const winnerSocketId = winner === GameLogic.BLACK 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            const result = manager.requestRematch(room.id, room.players.white.socketId);
            
            // Verify: rematch should succeed
            if (!result.success || !result.bothReady) return false;
            
            // Verify: swapped should be true only when black won (needs swap to make winner white)
            // When white won, no swap needed (winner already white)
            const expectedSwapped = winner === GameLogic.BLACK;
            if (result.swapped !== expectedSwapped) return false;
            
            // Verify: the previous winner should now be white (second to move)
            if (room.players.white.socketId !== winnerSocketId) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('loser becomes black player (first to move) after rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.constantFrom(GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Record the loser's socket ID before rematch
            const loserSocketId = winner === GameLogic.BLACK 
              ? room.players.white.socketId 
              : room.players.black.socketId;
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            manager.requestRematch(room.id, room.players.white.socketId);
            
            // Verify: the previous loser should now be black (first to move)
            if (room.players.black.socketId !== loserSocketId) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: rematch-optimization, Property 8: Leave During Rematch Updates Room**
   * 
   * *For any* player who leaves during rematch waiting, the remaining player SHALL receive 
   * a notification, and the room status SHALL become "waiting".
   * 
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property 8: Leave During Rematch Updates Room', () => {
    test('player leaving during rematch waiting resets room to waiting status', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests rematch first (true = black, false = white)
          fc.boolean(), // which player leaves (true = requester, false = other)
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, blackRequests, requesterLeaves, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Determine which player requests rematch
            const requesterSocketId = blackRequests 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            const otherSocketId = blackRequests 
              ? room.players.white.socketId 
              : room.players.black.socketId;
            
            // One player requests rematch
            manager.requestRematch(room.id, requesterSocketId);
            
            // Determine who leaves
            const leaverSocketId = requesterLeaves ? requesterSocketId : otherSocketId;
            
            // Player leaves during rematch waiting
            const leaveResult = manager.leaveRoom(room.id, leaverSocketId);
            
            // Verify: leave should succeed
            if (!leaveResult.success) return false;
            
            // Verify: room status should be 'waiting'
            if (room.status !== 'waiting') return false;
            
            // Verify: rematch requests should be reset
            if (room.rematchRequests.black || room.rematchRequests.white) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('remaining player stays in room after opponent leaves during rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests rematch (true = black, false = white)
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, blackRequests, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Record the players
            const blackSocketId = room.players.black.socketId;
            const whiteSocketId = room.players.white.socketId;
            
            // One player requests rematch
            const requesterSocketId = blackRequests ? blackSocketId : whiteSocketId;
            manager.requestRematch(room.id, requesterSocketId);
            
            // The OTHER player (non-requester) leaves
            const leaverSocketId = blackRequests ? whiteSocketId : blackSocketId;
            const remainingSocketId = blackRequests ? blackSocketId : whiteSocketId;
            
            manager.leaveRoom(room.id, leaverSocketId);
            
            // Verify: remaining player should still be in the room
            const hasRemainingPlayer = 
              (room.players.black && room.players.black.socketId === remainingSocketId) ||
              (room.players.white && room.players.white.socketId === remainingSocketId);
            
            if (!hasRemainingPlayer) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: rematch-optimization, Property 9: State Broadcast Consistency**
   * 
   * *For any* rematch-related state change, all participants in the room SHALL receive 
   * the same state update simultaneously.
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3**
   */
  describe('Property 9: State Broadcast Consistency', () => {
    test('room state is consistent for all participants after rematch request', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests (true = black, false = white)
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, blackRequests, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Determine which player requests rematch
            const requesterSocketId = blackRequests 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            
            // Request rematch
            manager.requestRematch(room.id, requesterSocketId);
            
            // Get room state that would be broadcast to both players
            const roomState = manager.getRoom(room.id);
            
            // Verify: room state is consistent (single source of truth)
            // Both players would see the same rematchRequests state
            const blackSees = roomState.rematchRequests.black;
            const whiteSees = roomState.rematchRequests.white;
            
            // The requester's request should be true
            const expectedBlack = blackRequests;
            const expectedWhite = !blackRequests;
            
            if (blackSees !== expectedBlack) return false;
            if (whiteSees !== expectedWhite) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('room state is consistent after both players request rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // Both players request rematch
            manager.requestRematch(room.id, room.players.black.socketId);
            manager.requestRematch(room.id, room.players.white.socketId);
            
            // Get room state that would be broadcast to both players
            const roomState = manager.getRoom(room.id);
            
            // Verify: both players see the same game state
            // Board should be empty (all zeros)
            for (let x = 0; x < 15; x++) {
              for (let y = 0; y < 15; y++) {
                if (roomState.board[x][y] !== 0) return false;
              }
            }
            
            // Status should be 'playing'
            if (roomState.status !== 'playing') return false;
            
            // Current turn should be BLACK (first player)
            if (roomState.currentTurn !== GameLogic.BLACK) return false;
            
            // Winner should be null
            if (roomState.winner !== null) return false;
            
            // Rematch requests should be reset
            if (roomState.rematchRequests.black || roomState.rematchRequests.white) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('room state is consistent after player leaves during rematch', () => {
      fc.assert(
        fc.property(
          playerArb,
          playerArb,
          fc.boolean(), // which player requests rematch (true = black, false = white)
          fc.constantFrom(null, GameLogic.BLACK, GameLogic.WHITE), // winner
          (creator, player2, blackRequests, winner) => {
            // Ensure two players are different
            if (creator.socketId === player2.socketId) return true;
            
            const manager = new RoomManager();
            const room = createEndedGameRoom(manager, creator, player2, winner);
            
            // One player requests rematch
            const requesterSocketId = blackRequests 
              ? room.players.black.socketId 
              : room.players.white.socketId;
            manager.requestRematch(room.id, requesterSocketId);
            
            // The other player leaves
            const leaverSocketId = blackRequests 
              ? room.players.white.socketId 
              : room.players.black.socketId;
            manager.leaveRoom(room.id, leaverSocketId);
            
            // Get room state
            const roomState = manager.getRoom(room.id);
            
            // Verify: room state is consistent
            // Status should be 'waiting'
            if (roomState.status !== 'waiting') return false;
            
            // Rematch requests should be reset
            if (roomState.rematchRequests.black || roomState.rematchRequests.white) return false;
            
            // Board should be empty
            for (let x = 0; x < 15; x++) {
              for (let y = 0; y < 15; y++) {
                if (roomState.board[x][y] !== 0) return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

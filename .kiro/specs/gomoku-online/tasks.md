# Implementation Plan

- [x] 1. Set up project structure and dependencies



  - Create package.json with express, socket.io dependencies
  - Create basic directory structure (public/, tests/)
  - Set up Jest and fast-check for testing
  - _Requirements: 11.1, 11.2_

- [x] 2. Implement core game logic module

  - [x] 2.1 Create GameLogic class with board validation


    - Implement `isValidMove(board, x, y)` - check if position is empty
    - Implement `createEmptyBoard()` - create 15x15 array of zeros
    - _Requirements: 5.1, 3.1_
  - [x] 2.2 Implement win detection algorithm


    - Implement `checkWin(board, x, y, color)` - check four directions
    - Implement `getWinningStones(board, x, y, color)` - return winning positions

    - _Requirements: 5.3, 5.4, 5.5_
  - [x] 2.3 Write property test for win detection


    - **Property 7: Win Detection Correctness**
    - **Validates: Requirements 5.3, 5.4**


- [x] 3. Implement room management module

  - [x] 3.1 Create RoomManager class with room CRUD operations


    - Implement `createRoom(name, creatorSocket)` - generate unique ID, initialize room
    - Implement `getRoom(roomId)` - retrieve room by ID
    - Implement `getRoomList()` - get all rooms for lobby display
    - Implement `deleteRoom(roomId)` - remove room from memory
    - _Requirements: 3.1, 2.2_
  - [x] 3.2 Implement room join/leave logic


    - Implement `joinRoom(roomId, socket, asWatcher)` - handle player/watcher join
    - Implement `leaveRoom(roomId, socket)` - handle player/watcher leave
    - Implement `cleanupEmptyRooms()` - remove inactive rooms after 5 minutes
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 3.3 Write property tests for room management


    - **Property 3: Room ID Uniqueness and Format**
    - **Property 11: Room Join Logic**
    - **Property 12: Full Room Rejection**
    - **Property 13: Player Leave Cleanup**
    - **Property 18: Watcher Addition**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 4. Implement game state serialization

  - [x] 4.1 Create serialization/deserialization functions


    - Implement `serializeRoom(room)` - convert Room to JSON-safe object
    - Implement `deserializeRoom(json)` - reconstruct Room from JSON
    - Implement `serializeForClient(room, socketId)` - create client-safe view
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [x] 4.2 Write property test for serialization round-trip


    - **Property 2: Room State Serialization Round-Trip**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 5. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement game actions (undo, surrender, draw)

  - [x] 6.1 Implement undo operation


    - Implement `requestUndo(room, socketId)` - initiate undo request
    - Implement `respondUndo(room, socketId, accept)` - handle undo response
    - Implement `executeUndo(room)` - remove last move, switch turn
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.2 Implement surrender and draw operations

    - Implement `surrender(room, socketId)` - end game with opponent as winner

    - _Requirements: 6.5_
  - [x] 6.3 Write property tests for game actions


    - **Property 9: Undo Operation Correctness**
    - **Property 10: Surrender Result**

    - **Validates: Requirements 6.3, 6.5**

- [x] 7. Implement utility functions

  - [x] 7.1 Create nickname validation


    - Implement `validateNickname(nickname)` - check length and content
    - _Requirements: 1.2, 1.4_

  - [x] 7.2 Create emoji conversion
    - Implement `convertEmoji(text)` - replace shortcuts with emoji
    - _Requirements: 8.3_

  - [x] 7.3 Create coordinate utilities
    - Implement `getIntersection(clientX, clientY, canvasRect, cellSize)` - snap to grid
    - _Requirements: 4.3_

  - [x] 7.4 Write property tests for utilities

    - **Property 1: Nickname Validation**
    - **Property 4: Click-to-Intersection Snapping**
    - **Property 16: Emoji Conversion**
    - **Validates: Requirements 1.2, 1.4, 4.3, 8.3**

- [x] 8. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Socket.io server

  - [x] 9.1 Set up Express and Socket.io server


    - Create server.js with Express static file serving
    - Initialize Socket.io with CORS configuration
    - Implement connection/disconnection handlers
    - _Requirements: 11.1, 11.3_
  - [x] 9.2 Implement lobby events

    - Handle `join-lobby` - add to lobby, send room list
    - Handle `create-room` - create room, broadcast update
    - Handle `quick-match` - find or create room
    - Handle `refresh-rooms` - send current room list
    - _Requirements: 2.1, 2.5, 2.6, 2.7, 2.8_

  - [x] 9.3 Implement room events
    - Handle `join-room` - join as player or watcher
    - Handle `leave-room` - leave room, cleanup
    - Handle `place-stone` - validate and place stone, check win

    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 9.4 Implement game action events
    - Handle `request-undo`, `respond-undo` - undo flow
    - Handle `surrender` - immediate game end

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.5 Implement chat events
    - Handle `chat-message` - broadcast with timestamp and emoji conversion
    - _Requirements: 7.2, 8.1, 8.2, 8.3_
  - [x] 9.6 Write property tests for move validation


    - **Property 5: Occupied Position Rejection**
    - **Property 6: Turn Enforcement**
    - **Property 8: Post-Game Move Prevention**
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [x] 9.7 Write property tests for quick match and chat
    - **Property 14: Quick Match Behavior**
    - **Property 15: Chat Message Format**
    - **Validates: Requirements 2.6, 7.2, 8.1**

- [x] 10. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement frontend HTML structure

  - [x] 11.1 Create index.html with lobby view


    - Nickname input section
    - Online count display
    - Room list table/cards
    - Create room modal
    - Quick match and refresh buttons
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 11.2 Create game room view structure
    - Canvas container for board
    - Player info panels (black/white)
    - Watcher list panel
    - Action buttons (undo, surrender, leave)
    - Chat area with input
    - _Requirements: 4.1, 9.1, 9.2, 9.3, 9.4, 8.1, 8.2_

- [x] 12. Implement frontend CSS styling

  - [x] 12.1 Create base styles and layout

    - CSS reset and variables
    - Flexbox/Grid layout for responsive design
    - View switching (lobby/game)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 12.2 Style lobby components
    - Nickname input styling
    - Room list table/card styling
    - Modal styling
    - Button styling

    - _Requirements: 2.2_
  - [x] 12.3 Style game room components
    - Player info panel styling
    - Chat area styling
    - Action button styling

    - Result modal styling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


- [x] 13. Implement Canvas board renderer
  - [x] 13.1 Create BoardRenderer module
    - Initialize canvas with proper sizing

    - Draw wood-grain background
    - Draw grid lines (15x15)
    - _Requirements: 4.1_
  - [x] 13.2 Implement stone rendering
    - Draw black stones with gradient and shadow

    - Draw white stones with gradient and shadow
    - Highlight last placed stone
    - Highlight winning stones
    - _Requirements: 4.2, 4.4_

  - [x] 13.3 Implement click handling
    - Convert click/touch to grid coordinates
    - Snap to nearest intersection

    - Handle touch events for mobile
    - _Requirements: 4.3, 4.5_
  - [x] 13.4 Implement responsive resizing

    - Handle window resize events
    - Maintain aspect ratio
    - Re-render on orientation change
    - _Requirements: 4.6, 10.3, 10.4_


- [x] 14. Implement frontend Socket.io client
  - [x] 14.1 Create SocketManager module
    - Connect to server

    - Handle connection/disconnection
    - Implement reconnection logic
    - _Requirements: 7.3, 7.4_
  - [x] 14.2 Implement lobby event handlers
    - Handle `room-list` - update room display

    - Handle `online-count` - update count display
    - Handle `room-joined` - switch to game view
    - _Requirements: 2.1, 2.2, 2.8_

  - [x] 14.3 Implement game event handlers
    - Handle `room-updated` - update game state
    - Handle `stone-placed` - render new stone
    - Handle `game-over` - show result modal

    - Handle `player-left` - show notification
    - _Requirements: 7.1, 7.5, 5.4, 3.5_
  - [x] 14.4 Implement action event handlers
    - Handle `undo-requested` - show confirmation dialog
    - Handle `undo-result` - update board if accepted


    - Handle `chat-received` - add message to chat
    - _Requirements: 6.2, 6.3, 6.4, 8.1_

- [x] 15. Implement frontend view controllers
  - [x] 15.1 Create LobbyView controller

    - Show/hide lobby
    - Update room list display
    - Handle create room modal
    - Handle button clicks (create, quick match, refresh, join, watch)


    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 15.2 Create GameView controller
    - Show/hide game view
    - Update player info display


    - Update watcher list
    - Highlight current turn
    - Show result modal
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 15.3 Create ChatManager controller

    - Add messages to chat display
    - Handle send button and Enter key
    - Auto-scroll to bottom
    - _Requirements: 8.1, 8.2, 8.4_
  - [x] 15.4 Write property test for room list display


    - **Property 17: Room List Display Completeness**
    - **Validates: Requirements 2.2**

- [x] 16. Implement localStorage persistence
  - [x] 16.1 Create storage utilities
    - Save/load nickname
    - Save/load current room ID for reconnection
    - _Requirements: 1.2, 1.3, 7.4_

- [x] 17. Implement error handling
  - [x] 17.1 Add client-side error handling
    - Display error messages in UI
    - Handle connection errors
    - Handle invalid actions
    - _Requirements: 1.4, 3.4, 5.1, 5.2_
  - [x] 17.2 Add server-side error handling
    - Validate all incoming events
    - Return appropriate error events
    - Log errors to console
    - _Requirements: 11.4_

- [x] 18. Create Docker deployment files

  - [x] 18.1 Create Dockerfile

    - Use Node.js base image
    - Copy package files and install dependencies
    - Copy source files
    - Expose port and set start command
    - _Requirements: 11.2_
  - [x] 18.2 Create README.md

    - Local development instructions
    - Docker deployment instructions
    - Environment variables documentation



    - _Requirements: 11.1, 11.2_

- [x] 19. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

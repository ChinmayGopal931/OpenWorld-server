// src/services/MultiplayerClient.ts
import { io, Socket } from 'socket.io-client';
import { 
  Position, 
  Direction, 
  Tree, 
  Bush, 
  Flower,
  WorldChunk,
  GameConfig 
} from '../utils/game';

// Event types for multiplayer communication
export enum GameEventType {
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_MOVE = 'player_move',
  WORLD_SYNC = 'world_sync',
  CHAT_MESSAGE = 'chat_message'
}

// Player data received from server
export interface RemotePlayer {
  id: string;
  username: string;
  position: Position;
  direction: Direction;
  isMoving: boolean;
  lastUpdate: number;
  animationFrame?: number;
}

// Event handler types
export type PlayerJoinHandler = (player: RemotePlayer) => void;
export type PlayerLeaveHandler = (playerId: string) => void;
export type PlayerMoveHandler = (playerId: string, position: Position, direction: Direction, isMoving: boolean) => void;
export type ChatMessageHandler = (playerId: string, username: string, message: string) => void;
export type ChunkUpdateHandler = (chunks: WorldChunk[]) => void;
export type ErrorHandler = (message: string) => void;

/**
 * Handles multiplayer connectivity and event dispatching for the Forest Explorer game
 */
class MultiplayerClient {
  private socket: Socket | null = null;
  private playerId: string = '';
  private username: string = '';
  private worldId: string = '';
  private isConnected: boolean = false;
  private config: GameConfig | null = null;
  
  // For development/testing, use a mock mode that doesn't try real connections
  private mockMode: boolean = true;
  
  // Event handlers
  private playerJoinHandlers: Set<PlayerJoinHandler> = new Set();
  private playerLeaveHandlers: Set<PlayerLeaveHandler> = new Set();
  private playerMoveHandlers: Set<PlayerMoveHandler> = new Set();
  private chatMessageHandlers: Set<ChatMessageHandler> = new Set();
  private chunkUpdateHandlers: Set<ChunkUpdateHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  
  /**
   * Connect to the multiplayer server
   */
  public connect(username: string, worldId: string = 'default', serverUrl: string = 'http://localhost:3001'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }
      
      try {
        this.username = username;
        this.worldId = worldId;
        
        console.log(`Connecting to server at ${serverUrl}...`);
        
        // For development/testing without a real server
        if (this.mockMode) {
          console.log('🔧 Mock mode: Simulating successful connection');
          this.isConnected = true;
          this.playerId = 'mock-' + Math.random().toString(36).substring(2, 15);
          
          // Simulate receiving a player join event for self
          setTimeout(() => {
            this.handlePlayerJoin({
              id: this.playerId,
              username: this.username,
              position: { x: 2500, y: 2500 },
              direction: 'down',
              isMoving: false,
              lastUpdate: Date.now()
            });
            
            // Generate some fake chunks
            if (this.config) {
              this.handleChunkUpdate(this.generateMockChunks(2500, 2500));
            }
            
            // // Simulate other players
            // this.simulateOtherPlayers();
          }, 500);
          
          resolve(true);
          return;
        }
        
        this.socket = io(serverUrl);
        
        // Set up connection handlers
        this.socket.on('connect', () => {
          console.log('Connected to server, sending join request');
          
          this.socket!.emit('player:join', {
            username: this.username,
            worldId: this.worldId
          });
        });
        
        // Handle successful join
        this.socket.on('player:joined', (data) => {
          if (data.player.username === this.username && !this.playerId) {
            this.playerId = data.player.id;
            this.isConnected = true;
            console.log(`Joined as player ${this.playerId}`);
            resolve(true);
          }
          
          // Always notify handlers about the player join
          this.handlePlayerJoin(data.player);
        });
        
        // Handle player leave
        this.socket.on('player:left', (data) => {
          this.handlePlayerLeave(data.playerId);
        });
        
        // Handle player movement
        this.socket.on('player:move', (event) => {
          const { playerId, position, direction, isMoving } = event.data;
          this.handlePlayerMove(playerId, position, direction, isMoving);
        });
        
        // Handle chat messages
        this.socket.on('chat:message', (event) => {
          const { playerId, username, message } = event.data;
          this.handleChatMessage(playerId, username, message);
        });
        
        // Handle chunk updates
        this.socket.on('world:chunks', (data) => {
          this.handleChunkUpdate(data.chunks);
        });
        
        // Handle existing players data
        this.socket.on('world:players', (data) => {
          data.players.forEach((player: RemotePlayer) => {
            this.handlePlayerJoin(player);
          });
        });
        
        // Handle errors
        this.socket.on('error', (data) => {
          console.error('Server error:', data.message);
          this.handleError(data.message);
          reject(new Error(data.message));
        });
        
        // Handle disconnect
        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnected = false;
        });
        
        // Handle server shutdown
        this.socket.on('server:shutdown', (data) => {
          console.log('Server is shutting down:', data.message);
          this.isConnected = false;
        });
        
      } catch (error) {
        console.error('Error connecting to server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.mockMode) {
      this.isConnected = false;
      return;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  /**
   * Send player position update
   */
  public updatePosition(position: Position, direction: Direction, isMoving: boolean): void {
    if (!this.isConnected) return;
    
    if (this.mockMode) {
      // Simulate notifying other "players" about our movement
      return;
    }
    
    if (this.socket) {
      this.socket.emit('player:move', {
        position,
        direction,
        isMoving
      });
    }
  }
  
  /**
   * Send chat message
   */
  public sendChatMessage(message: string): void {
    if (!this.isConnected) return;
    
    if (this.mockMode) {
      // Simulate chat message in mock mode
      setTimeout(() => {
        this.handleChatMessage(this.playerId, this.username, message);
      }, 100);
      return;
    }
    
    if (this.socket) {
      this.socket.emit('chat:message', message);
    }
  }
  
  /**
   * Set game configuration
   */
  public setConfig(config: GameConfig): void {
    this.config = config;
  }
  
  /**
   * Handler for player join events
   */
  private handlePlayerJoin(player: RemotePlayer): void {
    this.playerJoinHandlers.forEach(handler => handler(player));
  }
  
  /**
   * Handler for player leave events
   */
  private handlePlayerLeave(playerId: string): void {
    this.playerLeaveHandlers.forEach(handler => handler(playerId));
  }
  
  /**
   * Handler for player movement events
   */
  private handlePlayerMove(playerId: string, position: Position, direction: Direction, isMoving: boolean): void {
    this.playerMoveHandlers.forEach(handler => 
      handler(playerId, position, direction, isMoving)
    );
  }
  
  /**
   * Handler for chat message events
   */
  private handleChatMessage(playerId: string, username: string, message: string): void {
    this.chatMessageHandlers.forEach(handler => 
      handler(playerId, username, message)
    );
  }
  
  /**
   * Handler for chunk update events
   */
  private handleChunkUpdate(chunks: WorldChunk[]): void {
    this.chunkUpdateHandlers.forEach(handler => handler(chunks));
  }
  
  /**
   * Handler for error events
   */
  private handleError(message: string): void {
    this.errorHandlers.forEach(handler => handler(message));
  }
  
  /**
   * Generates mock chunks for development/testing
   */
  private generateMockChunks(centerX: number, centerY: number): WorldChunk[] {
    if (!this.config) return [];
    
    const chunks: WorldChunk[] = [];
    const chunkSize = this.config.chunkSize;
    
    // Calculate chunk coordinates for center position
    const centerChunkX = Math.floor(centerX / chunkSize);
    const centerChunkY = Math.floor(centerY / chunkSize);
    
    // Generate a 3x3 grid of chunks around center
    for (let x = centerChunkX - 1; x <= centerChunkX + 1; x++) {
      for (let y = centerChunkY - 1; y <= centerChunkY + 1; y++) {
        // Skip if out of world bounds
        if (x < 0 || y < 0 || 
            x * chunkSize >= this.config.worldWidth || 
            y * chunkSize >= this.config.worldHeight) {
          continue;
        }
        
        // Use chunk coordinates as seed for consistent generation
        const seed = x * 10000 + y;
        const random = this.createSeededRandom(seed);
        
        // Create trees
        const trees: Tree[] = [];
        const treeCount = 5 + Math.floor(random() * 10);
        
        for (let i = 0; i < treeCount; i++) {
          const size = 80 + Math.floor(random() * 40);
          const treeX = x * chunkSize + Math.floor(random() * (chunkSize - size));
          const treeY = y * chunkSize + Math.floor(random() * (chunkSize - size));
          
          trees.push({
            id: 1000000 + seed * 100 + i,
            x: treeX,
            y: treeY,
            size,
            color: `hsl(${110 + random() * 30}, ${70 + random() * 10}%, ${35 + random() * 15}%)`,
            variant: Math.floor(random() * 3)
          });
        }
        
        // Create bushes
        const bushes: Bush[] = [];
        const bushCount = 8 + Math.floor(random() * 7);
        
        for (let i = 0; i < bushCount; i++) {
          const size = 40 + Math.floor(random() * 20);
          const bushX = x * chunkSize + Math.floor(random() * (chunkSize - size));
          const bushY = y * chunkSize + Math.floor(random() * (chunkSize - size));
          
          bushes.push({
            id: 2000000 + seed * 100 + i,
            x: bushX,
            y: bushY,
            size,
            color: `hsl(${100 + random() * 50}, ${65 + random() * 15}%, ${30 + random() * 15}%)`,
            variant: Math.floor(random() * 3)
          });
        }
        
        // Create flowers
        const flowers: Flower[] = [];
        const flowerCount = 15 + Math.floor(random() * 20);
        const flowerColors = [
          '#FF5733', '#DAF7A6', '#FFC300', '#C70039', 
          '#900C3F', '#581845', '#FFFFFF', '#FFC0CB', '#3D85C6'
        ];
        
        for (let i = 0; i < flowerCount; i++) {
          const flowerX = x * chunkSize + Math.floor(random() * chunkSize);
          const flowerY = y * chunkSize + Math.floor(random() * chunkSize);
          
          flowers.push({
            id: 3000000 + seed * 100 + i,
            x: flowerX,
            y: flowerY,
            color: flowerColors[Math.floor(random() * flowerColors.length)]
          });
        }
        
        // Add chunk to result
        chunks.push({
          x,
          y,
          trees,
          bushes,
          flowers,
          isLoaded: true
        });
      }
    }
    
    return chunks;
  }
  
  /**
   * Creates seeded random number generator
   */
  private createSeededRandom(seed: number) {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
  
  /**
   * For mock mode: simulates other players joining and moving
   */
  // private simulateOtherPlayers(): void {
  //   if (!this.mockMode) return;
    
  //   // Create 1-3 mock players
  //   const mockPlayerCount = 1 + Math.floor(Math.random() * 3);
    
  //   for (let i = 0; i < mockPlayerCount; i++) {
  //     const playerId = `mock-player-${i}`;
  //     const playerName = `Player${i + 1}`;
      
  //     // Create player with offset from center
  //     const offsetX = (Math.random() - 0.5) * 400;
  //     const offsetY = (Math.random() - 0.5) * 400;
      
  //     const player: RemotePlayer = {
  //       id: playerId,
  //       username: playerName,
  //       position: { 
  //         x: 2500 + offsetX, 
  //         y: 2500 + offsetY 
  //       },
  //       direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
  //       isMoving: false,
  //       lastUpdate: Date.now(),
  //       animationFrame: 0
  //     };
      
  //     // Add a delay before player joins
  //     setTimeout(() => {
  //       this.handlePlayerJoin(player);
        
  //       // Simulate player movement
  //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //       let lastMoveTime = Date.now();
        
  //       // Move the player randomly every 3-8 seconds
  //       const moveInterval = setInterval(() => {
  //         if (!this.isConnected) {
  //           clearInterval(moveInterval);
  //           return;
  //         }
          
  //         const now = Date.now();
  //         const shouldMove = Math.random() > 0.3;  // 70% chance to move
          
  //         if (shouldMove) {
  //           // Pick a random direction
  //           const directions: Direction[] = ['up', 'down', 'left', 'right'];
  //           const newDirection = directions[Math.floor(Math.random() * 4)];
            
  //           // Calculate new position
  //           let newX = player.position.x;
  //           let newY = player.position.y;
  //           const moveDistance = 80 + Math.floor(Math.random() * 120);
            
  //           switch (newDirection) {
  //             case 'up':
  //               newY -= moveDistance;
  //               break;
  //             case 'down':
  //               newY += moveDistance;
  //               break;
  //             case 'left':
  //               newX -= moveDistance;
  //               break;
  //             case 'right':
  //               newX += moveDistance;
  //               break;
  //           }
            
  //           // Keep within world bounds
  //           if (this.config) {
  //             newX = Math.max(0, Math.min(newX, this.config.worldWidth));
  //             newY = Math.max(0, Math.min(newY, this.config.worldHeight));
  //           }
            
  //           // Start moving
  //           player.isMoving = true;
  //           player.direction = newDirection;
  //           this.handlePlayerMove(player.id, player.position, player.direction, player.isMoving);
            
  //           // Move for 1-3 seconds
  //           const moveDuration = 1000 + Math.floor(Math.random() * 2000);
            
  //           // Update position periodically during movement
  //           const updateInterval = setInterval(() => {
  //             const progress = Math.min(1, (Date.now() - now) / moveDuration);
              
  //             // Linear interpolation
  //             player.position = {
  //               x: player.position.x + (newX - player.position.x) * 0.2,
  //               y: player.position.y + (newY - player.position.y) * 0.2
  //             };
              
  //             this.handlePlayerMove(player.id, player.position, player.direction, player.isMoving);
              
  //             // Check if we've reached the destination
  //             if (progress >= 1) {
  //               clearInterval(updateInterval);
  //               player.isMoving = false;
  //               this.handlePlayerMove(player.id, player.position, player.direction, player.isMoving);
  //             }
  //           }, 100);
            
  //           // Stop after the move duration
  //           setTimeout(() => {
  //             clearInterval(updateInterval);
  //             player.isMoving = false;
  //             this.handlePlayerMove(player.id, player.position, player.direction, player.isMoving);
  //           }, moveDuration);
  //         }
          
  //         lastMoveTime = now;
  //       }, 3000 + Math.floor(Math.random() * 5000));
        
  //       // Simulate chat messages occasionally
  //       setTimeout(() => {
  //         if (this.isConnected) {
  //           const messages = [
  //             "Hello there!",
  //             "This world is beautiful!",
  //             "Nice to meet you!",
  //             "How's it going?",
  //             "Look at those trees!",
  //             "I found some nice flowers over here",
  //             "This is so cool",
  //             "I like exploring this forest"
  //           ];
            
  //           this.handleChatMessage(
  //             player.id, 
  //             player.username, 
  //             messages[Math.floor(Math.random() * messages.length)]
  //           );
  //         }
  //       }, 5000 + Math.floor(Math.random() * 15000));
        
  //     }, 2000 + i * 1000);
  //   }
  // }
  
  /**
   * Add event handlers
   */
  public onPlayerJoin(handler: PlayerJoinHandler): void {
    this.playerJoinHandlers.add(handler);
  }
  
  public onPlayerLeave(handler: PlayerLeaveHandler): void {
    this.playerLeaveHandlers.add(handler);
  }
  
  public onPlayerMove(handler: PlayerMoveHandler): void {
    this.playerMoveHandlers.add(handler);
  }
  
  public onChatMessage(handler: ChatMessageHandler): void {
    this.chatMessageHandlers.add(handler);
  }
  
  public onChunkUpdate(handler: ChunkUpdateHandler): void {
    this.chunkUpdateHandlers.add(handler);
  }
  
  public onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }
  
  /**
   * Remove event handlers
   */
  public offPlayerJoin(handler: PlayerJoinHandler): void {
    this.playerJoinHandlers.delete(handler);
  }
  
  public offPlayerLeave(handler: PlayerLeaveHandler): void {
    this.playerLeaveHandlers.delete(handler);
  }
  
  public offPlayerMove(handler: PlayerMoveHandler): void {
    this.playerMoveHandlers.delete(handler);
  }
  
  public offChatMessage(handler: ChatMessageHandler): void {
    this.chatMessageHandlers.delete(handler);
  }
  
  public offChunkUpdate(handler: ChunkUpdateHandler): void {
    this.chunkUpdateHandlers.delete(handler);
  }
  
  public offError(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }
  
  /**
   * Check connection status
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get current player ID
   */
  public getPlayerId(): string {
    return this.playerId;
  }
}

// Create singleton instance
const multiplayerClient = new MultiplayerClient();
export default multiplayerClient;
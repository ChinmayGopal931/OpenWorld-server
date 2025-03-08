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
        
        console.log(`[MultiplayerClient] Connecting to server at ${serverUrl} as ${username}`);
        
        this.socket = io(serverUrl);
        
        // Set up connection handlers
        this.socket.on('connect', () => {
          console.log('[MultiplayerClient] Connected to server, sending join request');
          
          this.socket!.emit('player:join', {
            username: this.username,
            worldId: this.worldId
          });
        });
        
        // Handle successful join
        this.socket.on('player:joined', (data) => {
          console.log('[MultiplayerClient] Received player:joined event:', data);
          
          // Add detailed player info log
          console.log(`[DEBUG] Processing join for ${data.player.username} (${data.player.id}) - current client ID: ${this.playerId}`);
          
          if (data.player.username === this.username && !this.playerId) {
            this.playerId = data.player.id;
            this.isConnected = true;
            console.log(`[MultiplayerClient] Joined as player ${this.playerId}`);
            resolve(true);
            return;
          }
          
          if (data.player.id !== this.playerId) {
            console.log(`[MultiplayerClient] Another player joined: ${data.player.username} (${data.player.id})`);
            this.handlePlayerJoin(data.player);
          } else {
            console.log('[DEBUG] Ignoring self-join event');
          }
        });
        
        // Handle player leave
        this.socket.on('player:left', (data) => {
          console.log(`[MultiplayerClient] Player left: ${data.playerId}`);
          this.handlePlayerLeave(data.playerId);
        });
        
        // Handle player movement
        this.socket.on('player:move', (event) => {
          try {
            console.log("🔄 Raw movement event:", event);
            const { playerId, position, direction, isMoving } = event.data;
            
            // Skip our own movements (server already echoed them back)
            if (playerId === this.playerId) {
              console.log("Skipping own movement event");
              return;
            }
            
            console.log(`Remote movement: ${playerId} to (${position.x}, ${position.y})`);
            this.handlePlayerMove(playerId, position, direction, isMoving);
          } catch (error) {
            console.error("Error processing movement event:", error);
          }
        });
        // Handle chat messages
        this.socket.on('chat:message', (event) => {
          console.log('[MultiplayerClient] Received chat message:', event.data);
          const { playerId, username, message } = event.data;
          this.handleChatMessage(playerId, username, message);
        });
        
        // Handle chunk updates
        this.socket.on('world:chunks', (data) => {
          console.log(`[MultiplayerClient] Received ${data.chunks.length} world chunks`);
          this.handleChunkUpdate(data.chunks);
        });
        
        // Handle existing players data
        this.socket.on('world:players', (data) => {
          console.log('[MultiplayerClient] Received existing players:', data.players);
          data.players.forEach((player: RemotePlayer) => {
            console.log(`[DEBUG] Processing existing player ${player.username} (${player.id}) - current client ID: ${this.playerId}`);
            
            if (player.id !== this.playerId) {
              console.log(`[MultiplayerClient] Adding existing player: ${player.username}`);
              this.handlePlayerJoin(player);
            } else {
              console.log('[DEBUG] Skipping self in existing players');
            }
          });
        });
        
        
        // Handle errors
        this.socket.on('error', (data) => {
          console.error('[MultiplayerClient] Server error:', data.message);
          this.handleError(data.message);
          reject(new Error(data.message));
        });
        
        // Handle disconnect
        this.socket.on('disconnect', () => {
          console.log('[MultiplayerClient] Disconnected from server');
          this.isConnected = false;
        });
        
        // Handle connect_error - important for debugging
        this.socket.on('connect_error', (error) => {
          console.error('[MultiplayerClient] Connection error:', error);
          this.handleError(`Connection error: ${error.message}`);
          reject(error);
        });
        
      } catch (error) {
        console.error('[MultiplayerClient] Error connecting to server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Send chat message
   */
  public sendChatMessage(message: string): void {
    if (!this.isConnected || !this.socket) {
      console.error('[MultiplayerClient] Cannot send message: not connected');
      return;
    }
    
    console.log(`[MultiplayerClient] Sending chat message: "${message}"`);
    this.socket.emit('chat:message', message);
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
    console.log(`🔄 RECEIVED MOVEMENT: Player ${playerId} to position (${position.x}, ${position.y}), isMoving: ${isMoving}`);
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

  // Add this method to the MultiplayerClient class
public simulatePlayerMovement(playerId: string): void {
  console.log("Simulating movement for player:", playerId);
  
  // Get the current player data
  const players = Array.from(document.querySelectorAll('[data-player-id]'))
    .map(el => ({
      id: el.getAttribute('data-player-id'),
      position: {
        x: parseFloat(el.getAttribute('data-pos-x') || '0'),
        y: parseFloat(el.getAttribute('data-pos-y') || '0')
      }
    }));
    
  const playerToMove = players.find(p => p.id === playerId);
  
  if (!playerToMove) {
    console.warn("Could not find player to move:", playerId);
    return;
  }
  
  // Create a random movement within a 50px radius
  const newPosition = {
    x: playerToMove.position.x + (Math.random() * 100 - 50),
    y: playerToMove.position.y + (Math.random() * 100 - 50)
  };
  
  // Simulate receiving a movement update
  this.handlePlayerMove(
    playerId, 
    newPosition, 
    ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction, 
    true
  );
  
  // After a moment, stop moving
  setTimeout(() => {
    this.handlePlayerMove(
      playerId, 
      newPosition, 
      ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction, 
      false
    );
  }, 1000);
}
}

// Create singleton instance
const multiplayerClient = new MultiplayerClient();
export default multiplayerClient;
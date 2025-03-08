// file: src/services/MultiplayerService.ts
import { 
  Position, 
  Direction, 
  GameEvent,
  GameEventType,
  PlayerJoinEvent,
  PlayerMoveEvent,
  ChatMessageEvent
} from '../utils/game';

/**
 * MultiplayerService handles all real-time communication for the multiplayer game
 * It uses WebSockets to connect to a game server.
 */
class MultiplayerService {
  private socket: WebSocket | null = null;
  private playerId: string = '';
  private username: string = '';
  private gameId: string = '';
  private isConnected: boolean = false;
  private eventHandlers: Map<GameEventType, ((event: GameEvent) => void)[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;
  
  // For development/testing, use a mock mode that doesn't try real connections
  private mockMode: boolean = true;
  
  // Server URL would typically come from environment config
  private serverUrl: string = 'wss://your-game-server.com';
  
  // Connect to the game server
  public connect(username: string, gameId: string = 'default'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }
      
      this.username = username;
      this.gameId = gameId;
      
      // For development/testing without a real server
      if (this.mockMode) {
        console.log('🔧 Mock mode: Simulating successful connection');
        this.isConnected = true;
        this.playerId = 'mock-' + Math.random().toString(36).substring(2, 15);
        
        // Simulate receiving a player join event
        setTimeout(() => {
          this.handleGameEvent({
            type: GameEventType.PLAYER_JOIN,
            timestamp: Date.now(),
            data: {
              player: {
                id: this.playerId,
                username: this.username,
                position: { x: 2500, y: 2500 },
                direction: 'down',
                isMoving: false,
                animationFrame: 0,
                lastUpdate: Date.now()
              }
            }
          });
        }, 100);
        
        resolve(true);
        return;
      }
      
      try {
        // Include game ID and username in connection URL
        this.socket = new WebSocket(`${this.serverUrl}/game/${gameId}?username=${encodeURIComponent(username)}`);
        
        // Set up event handlers
        this.socket.onopen = () => {
          console.log('Connected to game server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };
        
        this.socket.onclose = (event) => {
          console.log('Disconnected from game server:', event.code, event.reason);
          this.isConnected = false;
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(new Error('Failed to connect to game server'));
          }
        };
        
        this.socket.onmessage = (event) => {
          try {
            const gameEvent: GameEvent = JSON.parse(event.data);
            this.handleGameEvent(gameEvent);
          } catch (error) {
            console.error('Error parsing game event:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to game server:', error);
        reject(error);
      }
    });
  }
  
  // Attempt to reconnect after disconnection
  private attemptReconnect(): void {
    if (this.mockMode) return; // No reconnection in mock mode
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = window.setTimeout(() => {
      if (!this.isConnected) {
        this.connect(this.username, this.gameId)
          .catch(() => {
            this.attemptReconnect();
          });
      }
    }, delay);
  }
  
  // Disconnect from the game server
  public disconnect(): void {
    if (this.mockMode) {
      this.isConnected = false;
      return;
    }
    
    if (this.socket && this.isConnected) {
      this.socket.close();
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnected = false;
  }
  
  // Send player position update to server
  public updatePosition(position: Position, direction: Direction, isMoving: boolean): void {
    if (!this.isConnected) return;
    
    if (this.mockMode) {
      // Mock mode - simulate receiving our own update
      return;
    }
    
    const event: PlayerMoveEvent = {
      type: GameEventType.PLAYER_MOVE,
      timestamp: Date.now(),
      data: {
        playerId: this.playerId,
        position,
        direction,
        isMoving
      }
    };
    
    if (this.socket) {
      this.socket.send(JSON.stringify(event));
    }
  }
  
  // Send chat message
  public sendChatMessage(message: string): void {
    if (!this.isConnected) return;
    
    if (this.mockMode) {
      // Mock mode - simulate receiving our own message
      setTimeout(() => {
        this.handleGameEvent({
          type: GameEventType.CHAT_MESSAGE,
          timestamp: Date.now(),
          data: {
            playerId: this.playerId,
            message
          }
        });
      }, 100);
      return;
    }
    
    const event: ChatMessageEvent = {
      type: GameEventType.CHAT_MESSAGE,
      timestamp: Date.now(),
      data: {
        playerId: this.playerId,
        message
      }
    };
    
    if (this.socket) {
      this.socket.send(JSON.stringify(event));
    }
  }
  
  // Handle incoming game events
  private handleGameEvent(event: GameEvent): void {
    // Set player ID on initial join response
    if (event.type === GameEventType.PLAYER_JOIN) {
      const joinEvent = event as PlayerJoinEvent;
      if (joinEvent.data.player.username === this.username && !this.playerId) {
        this.playerId = joinEvent.data.player.id;
        console.log('Received player ID:', this.playerId);
      }
    }
    
    // Dispatch event to registered handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }
  
  // Subscribe to game events
  public on(eventType: GameEventType, handler: (event: GameEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    this.eventHandlers.set(eventType, [...handlers, handler]);
  }
  
  // Unsubscribe from game events
  public off(eventType: GameEventType, handler: (event: GameEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    this.eventHandlers.set(
      eventType,
      handlers.filter(h => h !== handler)
    );
  }
  
  // Get connection status
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  // Get current player ID
  public getPlayerId(): string {
    return this.playerId;
  }
}

// Create singleton instance
const multiplayerService = new MultiplayerService();
export default multiplayerService;
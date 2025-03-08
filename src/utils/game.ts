// file: src/types/game.ts
export interface Position {
    x: number;
    y: number;
  }
  
  export type Direction = 'up' | 'down' | 'left' | 'right';
  
  export interface WorldElement {
    id: number;
    x: number;
    y: number;
    size?: number;
  }
  
  export interface Tree extends WorldElement {
    size: number;
    color: string;
    variant: number;
  }
  
  export interface Bush extends WorldElement {
    size: number;
    color: string;
    variant: number;
  }
  
  export interface Flower extends WorldElement {
    color: string;
  }
  
  export interface Hitbox {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }
  
  export interface KeysPressed {
    [key: string]: boolean;
  }
  
  export interface GameConfig {
    viewportWidth: number;
    viewportHeight: number;
    characterSize: number;
    movementSpeed: number;
    worldWidth: number;
    worldHeight: number;
    chunkSize: number;
    renderDistance: number;
    timeScale: number;
  }
  
  export interface WorldChunk {
    x: number;
    y: number;
    trees: Tree[];
    bushes: Bush[];
    flowers: Flower[];
    isLoaded: boolean;
  }
  
  // Player types for multiplayer
  export interface Player {
    id: string;
    username: string;
    position: Position;
    direction: Direction;
    isMoving: boolean;
    animationFrame: number;
    lastUpdate: number;
  }
  
  // Game event types for multiplayer
  export enum GameEventType {
    PLAYER_JOIN = 'player_join',
    PLAYER_LEAVE = 'player_leave',
    PLAYER_MOVE = 'player_move',
    WORLD_SYNC = 'world_sync',
    CHAT_MESSAGE = 'chat_message'
  }
  
  export interface GameEvent {
    type: GameEventType;
    timestamp: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  }
  
  export interface PlayerJoinEvent extends GameEvent {
    type: GameEventType.PLAYER_JOIN;
    data: {
      player: Player;
    };
  }
  
  export interface PlayerLeaveEvent extends GameEvent {
    type: GameEventType.PLAYER_LEAVE;
    data: {
      playerId: string;
    };
  }
  
  export interface PlayerMoveEvent extends GameEvent {
    type: GameEventType.PLAYER_MOVE;
    data: {
      playerId: string;
      position: Position;
      direction: Direction;
      isMoving: boolean;
    };
  }
  
  export interface WorldSyncEvent extends GameEvent {
    type: GameEventType.WORLD_SYNC;
    data: {
      chunkX: number;
      chunkY: number;
      trees: Tree[];
      bushes: Bush[];
      flowers: Flower[];
    };
  }
  
  export interface ChatMessageEvent extends GameEvent {
    type: GameEventType.CHAT_MESSAGE;
    data: {
      playerId: string;
      message: string;
    };
  }
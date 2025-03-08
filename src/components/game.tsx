// file: src/components/game/Game.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useWorldState } from '../hooks/useWorldState';
import Character from './Character';
import World from './World';
import {MiniMap} from './MiniMap';
import StatusBar from './StatusBar';
import { GameConfig, Position, WorldChunk } from '../utils/game';
import LoginScreen from './LoginScreen';
import multiplayerClient from '../services/MultiPlayerClient';
import ChatSystem from './ChatSystem';
import RemotePlayers from './RemovePlayers';


// Game configuration - centralized to make it easier to adjust
const GAME_CONFIG: GameConfig = {
  viewportWidth: 1024,
  viewportHeight: 768,
  characterSize: 64,
  movementSpeed: 2.5, // Reduced for smoother movement
  worldWidth: 5000,
  worldHeight: 5000,
  chunkSize: 500,
  renderDistance: 2,
  timeScale: 0.1
};

export const Game: React.FC = () => {
  // Game login state
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [serverStatusMessage, setServerStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [serverUrl, setServerUrl] = useState<string>('http://localhost:3001');
  
  // State for server-provided chunks
  const [serverChunks, setServerChunks] = useState<WorldChunk[]>([]);
  
  // Game viewport - what the player sees
  const viewportRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks for game state management
  const { 
    playerPosition, 
    playerDirection, 
    isMoving,
    animationFrame,
    keysPressed,
    handleKeyDown,
    handleKeyUp,
    updatePlayerMovement
  } = useGameEngine(GAME_CONFIG);
  
  // For client-side world generation
  const {
    timeOfDay,
    gameTime,
    worldElements,
    loadChunks,
    getVisibleElements,
    updateWithServerChunks
  } = useWorldState(GAME_CONFIG, playerPosition);
  
  // Camera position (viewport center)
  const [cameraPosition, setCameraPosition] = useState<Position>({
    x: playerPosition.x - GAME_CONFIG.viewportWidth / 2,
    y: playerPosition.y - GAME_CONFIG.viewportHeight / 2
  });
  
  // Position update throttling for network efficiency
  const lastPositionUpdate = useRef<number>(0);
  const positionUpdateInterval = 100; // ms
  
  // Handle user login and connect to multiplayer server
  const handleLogin = async (username: string, serverAddress: string = serverUrl) => {
    try {
      setIsConnecting(true);
      setServerStatusMessage('Connecting to server...');
      
      // Store server URL and username
      setUsername(username);
      setServerUrl(serverAddress);
      
      // Configure client with game config
      multiplayerClient.setConfig(GAME_CONFIG);
      
      // Connect to server
      const connected = await multiplayerClient.connect(username, 'default', serverAddress);
      
      if (connected) {
        setLoggedIn(true);
        setServerStatusMessage('Connected to multiplayer server');
        setErrorMessage('');
        
        // Setup chunk update handler
        multiplayerClient.onChunkUpdate((chunks) => {
          console.log(`Received ${chunks.length} chunks from server`);
          setServerChunks(prevChunks => [...prevChunks, ...chunks]);
          updateWithServerChunks(chunks);
        });
        
        // Setup error handler
        multiplayerClient.onError((message) => {
          setErrorMessage(`Server error: ${message}`);
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage(`Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Update camera to follow player
  const updateCamera = useCallback(() => {
    setCameraPosition({
      x: Math.max(0, Math.min(playerPosition.x - GAME_CONFIG.viewportWidth / 2, 
         GAME_CONFIG.worldWidth - GAME_CONFIG.viewportWidth)),
      y: Math.max(0, Math.min(playerPosition.y - GAME_CONFIG.viewportHeight / 2, 
         GAME_CONFIG.worldHeight - GAME_CONFIG.viewportHeight))
    });
  }, [playerPosition, GAME_CONFIG.viewportWidth, GAME_CONFIG.viewportHeight, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight]);
  
  // Update camera position when player moves
  useEffect(() => {
    updateCamera();
  }, [playerPosition, updateCamera]);
  
  // Load chunks around player - separate effect to avoid circular dependencies
  useEffect(() => {
    loadChunks(playerPosition);
  }, [playerPosition, loadChunks]);
  
  // Send position updates to server (throttled)
  useEffect(() => {
    if (!loggedIn) return;
    
    const now = Date.now();
    if (now - lastPositionUpdate.current > positionUpdateInterval) {
      if (multiplayerClient.isConnectedToServer()) {
        multiplayerClient.updatePosition(playerPosition, playerDirection, isMoving);
      }
      lastPositionUpdate.current = now;
    }
  }, [playerPosition, playerDirection, isMoving, loggedIn]);
  
  // Key event listeners (only active when logged in)
  useEffect(() => {
    if (!loggedIn) return;
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [loggedIn, handleKeyDown, handleKeyUp]);
  
  // Game animation loop
  useEffect(() => {
    if (!loggedIn) return;
    
    let animationFrameId: number;
    
    const gameLoop = (time: number) => {
      // Pass the timestamp directly to updatePlayerMovement
      updatePlayerMovement(time);
      
      // Request the next frame
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [loggedIn, updatePlayerMovement]);
  
  // Disconnect from server when component unmounts
  useEffect(() => {
    return () => {
      multiplayerClient.disconnect();
    };
  }, []);
  
  // Get elements visible in the current viewport
  const visibleElements = getVisibleElements(cameraPosition, GAME_CONFIG.viewportWidth, GAME_CONFIG.viewportHeight);
  
  // Format game time as a 12-hour clock
  const formatGameTime = () => {
    const hours = Math.floor(gameTime);
    const minutes = Math.floor((gameTime % 1) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };
  
  // Show login screen if not logged in
  if (!loggedIn) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        isConnecting={isConnecting}
        serverUrl={serverUrl}
        errorMessage={errorMessage}
        defaultUsername={username}
      />
    );
  }
  
  return (
    <div style={gameStyles.container}>
      <h1 style={gameStyles.title}>Forest Explorer</h1>
      <p style={gameStyles.subtitle}>
        Use arrow keys or WASD to move
        {serverStatusMessage && (
          <span style={gameStyles.serverStatus}> • {serverStatusMessage}</span>
        )}
      </p>
      
      <div 
        ref={viewportRef}
        style={{
          ...gameStyles.gameArea,
          width: `${GAME_CONFIG.viewportWidth}px`, 
          height: `${GAME_CONFIG.viewportHeight}px`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <World 
          visibleElements={visibleElements}
          cameraPosition={cameraPosition}
          timeOfDay={timeOfDay}
        />
        
        {/* Remote players */}
        <RemotePlayers cameraPosition={cameraPosition} />
        
        {/* Main player character */}
        <Character
          position={{
            x: playerPosition.x - cameraPosition.x,
            y: playerPosition.y - cameraPosition.y
          }}
          direction={playerDirection}
          isMoving={isMoving}
          animationFrame={animationFrame}
          size={GAME_CONFIG.characterSize}
        />
        
        {/* Chat system */}
        <ChatSystem />
        
        {/* Time of day display */}
        <div style={gameStyles.timeDisplay}>
          {formatGameTime()} ({timeOfDay})
        </div>
        
        {/* Mini map overlay */}
        <MiniMap 
          playerPosition={playerPosition} 
          worldSize={{ width: GAME_CONFIG.worldWidth, height: GAME_CONFIG.worldHeight }}
          worldElements={worldElements}
        />
        
        {/* Player connection info */}
        <div style={gameStyles.playerInfo}>
          Playing as: <strong>{username}</strong> (ID: {multiplayerClient.getPlayerId().substring(0, 8)})
        </div>
      </div>
      
      <StatusBar 
        position={playerPosition}
        direction={playerDirection}
        isMoving={isMoving}
      />
    </div>
  );
};

const gameStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#1a1c29',
    width: '100%',
    height: '100%',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#f0f6fc',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(50,150,255,0.4)',
  },
  subtitle: {
    marginBottom: '16px',
    color: '#bdc3c7',
    fontSize: '14px',
  },
  serverStatus: {
    color: '#4ade80',
    fontSize: '12px',
  },
  gameArea: {
    position: 'relative' as const,
    overflow: 'hidden',
    border: '8px solid #2c3e50',
    borderRadius: '8px',
    backgroundColor: '#7bae58',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  statusBar: {
    marginTop: '16px',
    backgroundColor: '#2c3e50',
    padding: '16px',
    borderRadius: '8px',
    color: '#ecf0f1',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '800px',
  },
  statusFlex: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
  },
  timeDisplay: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    zIndex: 1000,
  },
  playerInfo: {
    position: 'absolute' as const,
    top: '16px',
    left: '16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    zIndex: 1000,
  },
};
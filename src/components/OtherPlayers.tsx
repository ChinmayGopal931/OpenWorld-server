import React, { useState, useEffect, useRef } from 'react';
import multiplayerService from '../services/MultiplayerService';
import { Player, GameEventType } from '../utils/game';


interface OtherPlayersProps {
  cameraPosition: {
    x: number;
    y: number;
  };
}

const OtherPlayers: React.FC<OtherPlayersProps> = ({ cameraPosition }) => {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  
  // Use refs to avoid dependency cycles in useEffect
  const animationIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Handle player join events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePlayerJoin = (event: any) => {
      const { player } = event.data;
      if (player.id !== multiplayerService.getPlayerId()) {
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers);
          newPlayers.set(player.id, player);
          return newPlayers;
        });
      }
    };
    
    // Handle player leave events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePlayerLeave = (event: any) => {
      const { playerId } = event.data;
      setPlayers(prevPlayers => {
        const newPlayers = new Map(prevPlayers);
        newPlayers.delete(playerId);
        return newPlayers;
      });
    };
    
    // Handle player movement updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePlayerMove = (event: any) => {
      const { playerId, position, direction, isMoving } = event.data;
      
      if (playerId !== multiplayerService.getPlayerId()) {
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers);
          const player = newPlayers.get(playerId);
          
          if (player) {
            newPlayers.set(playerId, {
              ...player,
              position,
              direction,
              isMoving,
              lastUpdate: Date.now(),
              animationFrame: player.animationFrame
            });
          }
          
          return newPlayers;
        });
      }
    };
    
    // Register event handlers
    multiplayerService.on(GameEventType.PLAYER_JOIN, handlePlayerJoin);
    multiplayerService.on(GameEventType.PLAYER_LEAVE, handlePlayerLeave);
    multiplayerService.on(GameEventType.PLAYER_MOVE, handlePlayerMove);
    
    // Animation for other players - using setInterval stored in a ref
    animationIntervalRef.current = window.setInterval(() => {
      setPlayers(prevPlayers => {
        // Only update if we have players
        if (prevPlayers.size === 0) return prevPlayers;
        
        const newPlayers = new Map(prevPlayers);
        let hasMovingPlayers = false;
        
        newPlayers.forEach((player, id) => {
          if (player.isMoving) {
            hasMovingPlayers = true;
            const newAnimationFrame = (player.animationFrame + 1) % 6;
            newPlayers.set(id, { ...player, animationFrame: newAnimationFrame });
          }
        });
        
        // Only trigger a state update if there are actually moving players
        return hasMovingPlayers ? newPlayers : prevPlayers;
      });
    }, 120); // Match the animation timing in the character
    
    return () => {
      // Cleanup event handlers
      multiplayerService.off(GameEventType.PLAYER_JOIN, handlePlayerJoin);
      multiplayerService.off(GameEventType.PLAYER_LEAVE, handlePlayerLeave);
      multiplayerService.off(GameEventType.PLAYER_MOVE, handlePlayerMove);
      
      // Clear the animation interval
      if (animationIntervalRef.current !== null) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - this effect runs once on mount
  
  // Render each player character
  const renderPlayerCharacter = (player: Player) => {
    // Similar character rendering as your main character but simplified
    // Apply camera offset to position
    const screenX = player.position.x - cameraPosition.x;
    const screenY = player.position.y - cameraPosition.y;
    
    // Only render if within viewport (with some padding)
    if (screenX < -100 || screenY < -100 || screenX > 1124 || screenY > 868) {
      return null;
    }
    
    // Animation offsets - simplified version of your character animations
    const bodyOffset = player.isMoving ? [0, -2, -1, 0, -1, -2][player.animationFrame] : 0;
    
    return (
      <div
        key={player.id}
        style={{
          position: 'absolute',
          width: '64px',
          height: '64px',
          left: `${screenX}px`,
          top: `${screenY}px`,
          zIndex: Math.floor(player.position.y)
        }}
      >
        {/* Basic player representation */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}>
          {/* Shadow */}
          <div 
            style={{
              position: 'absolute',
              width: '40px',
              height: '12px',
              left: '12px',
              bottom: '0px',
              backgroundColor: 'black',
              borderRadius: '50%',
              opacity: 0.3,
              filter: 'blur(3px)'
            }}
          />
          
          {/* Player username */}
          <div style={{
            position: 'absolute',
            width: '100px',
            left: '-18px',
            top: '-20px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 3px black, 0 0 3px black, 0 0 3px black, 0 0 3px black',
            pointerEvents: 'none'
          }}>
            {player.username}
          </div>
          
          {/* Character Body - simplified version */}
          <div 
            style={{
              position: 'absolute',
              width: '32px',
              height: '36px',
              left: '16px',
              bottom: `${10 + bodyOffset}px`,
              backgroundColor: '#3b82f6',
              borderRadius: '8px 8px 0 0',
              borderBottom: '2px solid #1e40af',
              borderLeft: '2px solid #1e40af',
              borderRight: '2px solid #1e40af',
              zIndex: 2
            }}
          />
          
          {/* Head - simplified */}
          <div 
            style={{
              position: 'absolute',
              width: '38px',
              height: '38px',
              left: '13px',
              bottom: `${42 + bodyOffset}px`,
              backgroundColor: '#fde68a',
              borderRadius: '50%',
              border: '2px solid #92400e',
              zIndex: 2
            }}
          />
        </div>
      </div>
    );
  };
  
  return (
    <>
      {Array.from(players.values()).map(player => renderPlayerCharacter(player))}
    </>
  );
};

export default OtherPlayers;
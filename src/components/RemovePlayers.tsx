// src/components/game/RemotePlayers.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Position, Direction } from '../utils/game';
import multiplayerClient, { RemotePlayer } from '../services/MultiPlayerClient';

interface RemotePlayersProps {
  cameraPosition: Position;
}

const RemotePlayers: React.FC<RemotePlayersProps> = ({ cameraPosition }) => {
  const [players, setPlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const animationIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Handler for new players joining
    const handlePlayerJoin = (player: RemotePlayer) => {
      setPlayers(prevPlayers => {
        const newPlayers = new Map(prevPlayers);
        // Add animation frame if not present
        if (player.animationFrame === undefined) {
          player.animationFrame = 0;
        }
        newPlayers.set(player.id, player);
        return newPlayers;
      });
      console.log(`Player joined: ${player.username} (${player.id})`);
    };
    
    // Handler for players leaving
    const handlePlayerLeave = (playerId: string) => {
      setPlayers(prevPlayers => {
        const newPlayers = new Map(prevPlayers);
        newPlayers.delete(playerId);
        return newPlayers;
      });
      console.log(`Player left: ${playerId}`);
    };
    
    // Handler for player movement
    const handlePlayerMove = (
      playerId: string, 
      position: Position, 
      direction: Direction, 
      isMoving: boolean
    ) => {
      setPlayers(prevPlayers => {
        const newPlayers = new Map(prevPlayers);
        const player = newPlayers.get(playerId);
        
        if (player) {
          newPlayers.set(playerId, {
            ...player,
            position,
            direction,
            isMoving,
            lastUpdate: Date.now()
          });
        }
        
        return newPlayers;
      });
    };
    
    // Register event handlers
    multiplayerClient.onPlayerJoin(handlePlayerJoin);
    multiplayerClient.onPlayerLeave(handlePlayerLeave);
    multiplayerClient.onPlayerMove(handlePlayerMove);
    
    // Animation for other players
    animationIntervalRef.current = window.setInterval(() => {
      setPlayers(prevPlayers => {
        // Only update if we have players
        if (prevPlayers.size === 0) return prevPlayers;
        
        const newPlayers = new Map(prevPlayers);
        let hasMovingPlayers = false;
        
        newPlayers.forEach((player, id) => {
          if (player.isMoving) {
            hasMovingPlayers = true;
            const newAnimationFrame = ((player.animationFrame || 0) + 1) % 6;
            newPlayers.set(id, { 
              ...player, 
              animationFrame: newAnimationFrame 
            });
          }
        });
        
        // Only trigger a state update if there are actually moving players
        return hasMovingPlayers ? newPlayers : prevPlayers;
      });
    }, 120); // Match animation timing with local player
    
    // Cleanup handlers
    return () => {
      multiplayerClient.offPlayerJoin(handlePlayerJoin);
      multiplayerClient.offPlayerLeave(handlePlayerLeave);
      multiplayerClient.offPlayerMove(handlePlayerMove);
      
      if (animationIntervalRef.current !== null) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);
  
  // Render remote player character
  const renderPlayerCharacter = (player: RemotePlayer) => {
    // Calculate screen position by applying camera offset
    const screenX = player.position.x - cameraPosition.x;
    const screenY = player.position.y - cameraPosition.y;
    
    // Skip rendering if outside viewport (with padding)
    if (screenX < -100 || screenY < -100 || screenX > 1124 || screenY > 868) {
      return null;
    }
    
    // Animation offsets
    const animationFrame = player.animationFrame || 0;
    const bodyOffset = player.isMoving ? [0, -2, -1, 0, -1, -2][animationFrame] : 0;
    const walkCycle = player.isMoving ? [0, 1, 2, 3, 2, 1][animationFrame] : 0;
    
    return (
      <div
        key={player.id}
        style={{
          position: 'absolute',
          width: '64px',
          height: '64px',
          left: `${screenX}px`,
          top: `${screenY}px`,
          zIndex: Math.floor(player.position.y + 32)
        }}
      >
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
          
          {/* Character Body */}
          <div 
            style={{
              position: 'absolute',
              width: '32px',
              height: '36px',
              left: '16px',
              bottom: `${10 + bodyOffset}px`,
              backgroundColor: '#f59e0b', // Different color to distinguish from local player
              borderRadius: '8px 8px 0 0',
              borderBottom: '2px solid #d97706',
              borderLeft: '2px solid #d97706',
              borderRight: '2px solid #d97706',
              zIndex: 2
            }}
          />

          {/* Character Outfit Details */}
          <div 
            style={{
              position: 'absolute',
              width: '28px',
              height: '10px',
              left: '18px',
              bottom: `${16 + bodyOffset}px`,
              backgroundColor: '#d97706',
              borderRadius: '4px',
              zIndex: 3
            }}
          />
          
          {/* Backpack */}
          {(player.direction === 'right' || player.direction === 'down') && (
            <div 
              style={{
                position: 'absolute',
                width: '16px',
                height: '22px',
                left: '6px',
                bottom: `${22 + bodyOffset}px`,
                backgroundColor: '#ef4444',
                borderRadius: '4px',
                border: '2px solid #b91c1c',
                zIndex: 1
              }}
            />
          )}
          
          {/* Head */}
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
          
          {/* Hair - different style for remote players */}
          <div 
            style={{
              position: 'absolute',
              width: '42px',
              height: '16px',
              left: '11px',
              bottom: `${64 + bodyOffset}px`,
              backgroundColor: '#57534e',
              borderRadius: '8px 8px 0 0',
              zIndex: 3
            }}
          />
          
          {/* Cap - different color */}
          <div 
            style={{
              position: 'absolute',
              width: '44px',
              height: '12px',
              left: '10px',
              bottom: `${58 + bodyOffset}px`,
              backgroundColor: '#0369a1',
              borderRadius: '8px 8px 0 0',
              zIndex: 4
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: '20px',
              height: '8px',
              left: '22px',
              bottom: `${70 + bodyOffset}px`,
              backgroundColor: '#0369a1',
              borderRadius: '4px',
              zIndex: 4,
              border: '1px solid #075985',
              transform: 'rotate(-10deg)'
            }}
          />
          
          {/* Face elements based on direction */}
          {player.direction === 'down' && (
            <>
              <div style={{ position: 'absolute', width: '5px', height: '5px', left: '21px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
              <div style={{ position: 'absolute', width: '5px', height: '5px', left: '38px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
              <div style={{ position: 'absolute', width: '14px', height: '3px', left: '25px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
            </>
          )}
          
          {player.direction === 'up' && (
            <>
              <div style={{ position: 'absolute', width: '14px', height: '3px', left: '25px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
              <div style={{ position: 'absolute', width: '6px', height: '6px', left: '30px', bottom: `${46 + bodyOffset}px`, backgroundColor: '#fde68a', borderRadius: '50%', border: '1px solid #92400e', zIndex: 4 }} />
            </>
          )}
          
          {player.direction === 'left' && (
            <>
              <div style={{ position: 'absolute', width: '5px', height: '5px', left: '18px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
              <div style={{ position: 'absolute', width: '8px', height: '3px', left: '15px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
            </>
          )}
          
          {player.direction === 'right' && (
            <>
              <div style={{ position: 'absolute', width: '5px', height: '5px', left: '41px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
              <div style={{ position: 'absolute', width: '8px', height: '3px', left: '41px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
            </>
          )}
          
          {/* Arms */}
          <div 
            style={{
              position: 'absolute',
              width: '8px',
              height: '20px',
              left: '8px',
              bottom: `${22 + bodyOffset}px`,
              backgroundColor: '#f59e0b',
              border: '2px solid #d97706',
              borderRadius: '4px',
              transform: player.isMoving ? `rotate(${[10, 20, 30, 20, 10, 0][walkCycle]}deg)` : 'rotate(0deg)',
              transformOrigin: 'top center',
              zIndex: player.direction === 'left' ? 3 : 1
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: '8px',
              height: '20px',
              right: '8px',
              bottom: `${22 + bodyOffset}px`,
              backgroundColor: '#f59e0b',
              border: '2px solid #d97706',
              borderRadius: '4px',
              transform: player.isMoving ? `rotate(${[0, 10, 20, 30, 20, 10][walkCycle]}deg)` : 'rotate(0deg)',
              transformOrigin: 'top center',
              zIndex: player.direction === 'right' ? 3 : 1
            }}
          />
          
          {/* Legs */}
          <div 
            style={{
              position: 'absolute',
              width: '12px',
              height: '16px',
              left: '18px',
              bottom: '0px',
              backgroundColor: '#0c4a6e',
              borderRadius: '4px',
              transform: player.isMoving ? `translateY(${[0, -4, -6, -4, -2, 0][walkCycle]}px)` : 'none',
              zIndex: 2
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: '12px',
              height: '16px',
              right: '18px',
              bottom: '0px',
              backgroundColor: '#0c4a6e',
              borderRadius: '4px',
              transform: player.isMoving ? `translateY(${[0, -2, -4, -6, -4, -2][walkCycle]}px)` : 'none',
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

export default RemotePlayers;
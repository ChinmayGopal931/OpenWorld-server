import React, { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

type Direction = 'north' | 'south' | 'east' | 'west';

const ISO_TILE_SIZE = 64;
const WORLD_SIZE = 16;
const GAME_WIDTH = ISO_TILE_SIZE * WORLD_SIZE;
const GAME_HEIGHT = ISO_TILE_SIZE * WORLD_SIZE * 0.5;

const isometricToScreen = (x: number, y: number) => {
  return {
    x: (x - y) * ISO_TILE_SIZE * 0.5,
    y: (x + y) * ISO_TILE_SIZE * 0.25
  };
};

const Game: React.FC = () => {
  const [playerPos, setPlayerPos] = useState({ x: 8, y: 8 });
  const [direction, setDirection] = useState<Direction>('south');
  const [movementTimer, setMovementTimer] = useState(0);
  const animationRef = useRef<number>();
  const lastUpdate = useRef(Date.now());

  // Generate world map
  const worldMap = useRef(Array(WORLD_SIZE).fill(0).map(() => 
    Array(WORLD_SIZE).fill(0).map(() => 
      Math.random() > 0.7 ? 'tree' : Math.random() > 0.8 ? 'bush' : 'grass'
    )
  ));

  // Animation states
  const [treeAnimations, setTreeAnimations] = useState<{x: number, y: number, frame: number}[]>([]);
  const [bushAnimations, setBushAnimations] = useState<{x: number, y: number, frame: number}[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newPos = { ...playerPos };
      let newDirection = direction;
      
      switch(e.key) {
        case 'ArrowUp':
          newPos.y = Math.max(0, playerPos.y - 1);
          newDirection = 'north';
          break;
        case 'ArrowDown':
          newPos.y = Math.min(WORLD_SIZE - 1, playerPos.y + 1);
          newDirection = 'south';
          break;
        case 'ArrowLeft':
          newPos.x = Math.max(0, playerPos.x - 1);
          newDirection = 'west';
          break;
        case 'ArrowRight':
          newPos.x = Math.min(WORLD_SIZE - 1, playerPos.x + 1);
          newDirection = 'east';
          break;
      }

      if (worldMap.current[newPos.y][newPos.x] !== 'tree') {
        setPlayerPos(newPos);
        setDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, direction]);

  // Game loop for animations
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = now - lastUpdate.current;
      lastUpdate.current = now;

      // Animate trees
      setTreeAnimations(prev => {
        const nearbyTrees = prev.filter(t => 
          Math.abs(t.x - playerPos.x) < 4 && 
          Math.abs(t.y - playerPos.y) < 4
        );
        
        return [
          ...nearbyTrees.map(t => ({
            ...t,
            frame: (t.frame + delta * 0.02) % 8
          })),
          ...(Math.random() > 0.98 ? [{
            x: playerPos.x + Math.round(Math.random() * 4 - 2),
            y: playerPos.y + Math.round(Math.random() * 4 - 2),
            frame: 0
          }] : [])
        ].filter(t => t.frame < 8);
      });

      // Animate bushes
      setBushAnimations(prev => {
        return prev.map(b => ({
          ...b,
          frame: (b.frame + delta * 0.05) % 6
        })).filter(b => b.frame < 6);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [playerPos]);

  const renderTile = (tile: string, x: number, y: number) => {
    const screenPos = isometricToScreen(x, y);
    const isActiveBush = bushAnimations.some(b => b.x === x && b.y === y);
    const treeAnim = treeAnimations.find(t => t.x === x && t.y === y);

    return (
      <div key={`${x}-${y}`} style={{
        position: 'absolute',
        left: `${screenPos.x + GAME_WIDTH/2}px`,
        top: `${screenPos.y + GAME_HEIGHT/2}px`,
        zIndex: x + y
      }}>
        {/* Ground */}
        <div style={{
          width: ISO_TILE_SIZE,
          height: ISO_TILE_SIZE/2,
          background: `hsl(${120 + (x+y)*2}, 60%, ${40 + (x % 2 + y % 2)*5}%)`,
          clipPath: 'polygon(50% 0%, 100% 25%, 50% 50%, 0% 25%)'
        }} />

        {/* Objects */}
        {tile === 'tree' && (
          <div style={{
            position: 'absolute',
            top: -ISO_TILE_SIZE,
            left: 0,
            width: ISO_TILE_SIZE,
            height: ISO_TILE_SIZE*1.5,
            transformOrigin: 'bottom center',
            transform: `rotateX(60deg) rotateZ(${Math.sin(treeAnim?.frame || 0)*2}deg)`,
            transition: 'transform 0.3s'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: `hsl(120, 50%, ${30 + x % 10}%)`,
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
              filter: 'brightness(1.2)'
            }} />
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
              background: `hsl(120, 50%, ${25 + x % 10}%)`,
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)'
            }} />
          </div>
        )}

        {tile === 'bush' && (
          <div style={{
            position: 'absolute',
            top: -ISO_TILE_SIZE/2,
            left: ISO_TILE_SIZE*0.25,
            transform: `scale(${1 + Math.sin(isActiveBush ? movementTimer : 0)*0.1})`,
            transition: 'transform 0.2s'
          }}>
            <div style={{
              width: ISO_TILE_SIZE/2,
              height: ISO_TILE_SIZE/2,
              background: `hsl(140, 60%, ${40 + y % 10}%)`,
              borderRadius: '30%',
              transform: 'skewX(-10deg) rotateZ(-5deg)'
            }} />
            <div style={{
              position: 'absolute',
              top: -10,
              left: 10,
              width: ISO_TILE_SIZE/2,
              height: ISO_TILE_SIZE/2,
              background: `hsl(140, 60%, ${35 + y % 10}%)`,
              borderRadius: '30%',
              transform: 'skewX(10deg) rotateZ(5deg)'
            }} />
          </div>
        )}
      </div>
    );
  };

  const playerScreenPos = isometricToScreen(playerPos.x, playerPos.y);

  return (
    <div style={{
      background: 'linear-gradient(#87CEEB, #E0F6FF)',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        position: 'relative',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        perspective: 1000
      }}>
        {/* World tiles */}
        {worldMap.current.map((row, y) => 
          row.map((tile, x) => renderTile(tile, x, y))
        )}

        {/* Player character */}
        <div style={{
          position: 'absolute',
          left: playerScreenPos.x + GAME_WIDTH/2 - ISO_TILE_SIZE/2,
          top: playerScreenPos.y + GAME_HEIGHT/2 - ISO_TILE_SIZE*0.75,
          width: ISO_TILE_SIZE,
          height: ISO_TILE_SIZE*1.5,
          transformOrigin: 'bottom center',
          zIndex: playerPos.x + playerPos.y + 1
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: '#369',
            transform: 'rotateX(60deg)',
            clipPath: 'polygon(0% 15%, 100% 0%, 100% 85%, 0% 100%)'
          }}>
            {/* Walking animation */}
            <div style={{
              position: 'absolute',
              bottom: `${Math.sin(movementTimer * 0.1) * 10}px`,
              width: '100%',
              height: '100%',
              background: '#47a',
              transform: `translateX(${direction === 'west' ? -5 : direction === 'east' ? 5 : 0}px)`
            }} />
          </div>
        </div>

        {/* Ambient particles */}
        {treeAnimations.map((t, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: isometricToScreen(t.x, t.y).x + GAME_WIDTH/2 + ISO_TILE_SIZE*0.3,
            top: isometricToScreen(t.x, t.y).y + GAME_HEIGHT/2 - ISO_TILE_SIZE*0.5,
            width: 8,
            height: 8,
            background: `hsl(${100 + t.frame*30}, 60%, 50%)`,
            borderRadius: '50%',
            transform: `translate(${Math.sin(t.frame)*10}px, ${t.frame*5}px)`,
            opacity: 1 - t.frame/8
          }} />
        ))}
      </div>
    </div>
  );
};

export default Game;
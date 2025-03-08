// file: src/components/game/Character.tsx
import React from 'react';
import { Position, Direction } from '../utils/game';

interface CharacterProps {
  position: Position;
  direction: Direction;
  isMoving: boolean;
  animationFrame: number;
  size: number;
}

const Character: React.FC<CharacterProps> = ({ 
  position, 
  direction, 
  isMoving, 
  animationFrame,
  size 
}) => {
  // Calculate animation offsets
  const bodyOffset = isMoving ? [0, -2, -1, 0, -1, -2][animationFrame] : 0;
  const walkCycle = isMoving ? [0, 1, 2, 3, 2, 1][animationFrame] : 0;
  
  return (
    <div 
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000 // Always render character on top
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
        
        {/* Character Body */}
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

        {/* Character Outfit Details */}
        <div 
          style={{
            position: 'absolute',
            width: '28px',
            height: '10px',
            left: '18px',
            bottom: `${16 + bodyOffset}px`,
            backgroundColor: '#1e40af',
            borderRadius: '4px',
            zIndex: 3
          }}
        />
        
        {/* Backpack */}
        {(direction === 'right' || direction === 'down') && (
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
        
        {/* Hair */}
        <div 
          style={{
            position: 'absolute',
            width: '42px',
            height: '20px',
            left: '11px',
            bottom: `${60 + bodyOffset}px`,
            backgroundColor: '#0f172a',
            borderRadius: '8px 8px 0 0',
            zIndex: 3
          }}
        />
        
        {/* Cap */}
        <div 
          style={{
            position: 'absolute',
            width: '44px',
            height: '12px',
            left: '10px',
            bottom: `${58 + bodyOffset}px`,
            backgroundColor: '#ef4444',
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
            backgroundColor: '#ef4444',
            borderRadius: '4px',
            zIndex: 4,
            border: '1px solid #b91c1c',
            transform: 'rotate(-10deg)'
          }}
        />
        
        {/* Face elements based on direction */}
        {direction === 'down' && (
          <>
            <div style={{ position: 'absolute', width: '5px', height: '5px', left: '21px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
            <div style={{ position: 'absolute', width: '5px', height: '5px', left: '38px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
            <div style={{ position: 'absolute', width: '14px', height: '3px', left: '25px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
          </>
        )}
        
        {direction === 'up' && (
          <>
            <div style={{ position: 'absolute', width: '14px', height: '3px', left: '25px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
            <div style={{ position: 'absolute', width: '6px', height: '6px', left: '30px', bottom: `${46 + bodyOffset}px`, backgroundColor: '#fde68a', borderRadius: '50%', border: '1px solid #92400e', zIndex: 4 }} />
          </>
        )}
        
        {direction === 'left' && (
          <>
            <div style={{ position: 'absolute', width: '5px', height: '5px', left: '18px', bottom: `${52 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%', zIndex: 5 }} />
            <div style={{ position: 'absolute', width: '8px', height: '3px', left: '15px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '4px', zIndex: 5 }} />
          </>
        )}
        
        {direction === 'right' && (
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
            backgroundColor: '#3b82f6',
            border: '2px solid #1e40af',
            borderRadius: '4px',
            transform: isMoving ? `rotate(${[10, 20, 30, 20, 10, 0][walkCycle]}deg)` : 'rotate(0deg)',
            transformOrigin: 'top center',
            zIndex: direction === 'left' ? 3 : 1
          }}
        />
        <div 
          style={{
            position: 'absolute',
            width: '8px',
            height: '20px',
            right: '8px',
            bottom: `${22 + bodyOffset}px`,
            backgroundColor: '#3b82f6',
            border: '2px solid #1e40af',
            borderRadius: '4px',
            transform: isMoving ? `rotate(${[0, 10, 20, 30, 20, 10][walkCycle]}deg)` : 'rotate(0deg)',
            transformOrigin: 'top center',
            zIndex: direction === 'right' ? 3 : 1
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
            backgroundColor: '#1e3a8a',
            borderRadius: '4px',
            transform: isMoving ? `translateY(${[0, -4, -6, -4, -2, 0][walkCycle]}px)` : 'none',
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
            backgroundColor: '#1e3a8a',
            borderRadius: '4px',
            transform: isMoving ? `translateY(${[0, -2, -4, -6, -4, -2][walkCycle]}px)` : 'none',
            zIndex: 2
          }}
        />
      </div>
    </div>
  );
};

export default Character;
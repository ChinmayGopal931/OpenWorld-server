import React from 'react';
import { Position, Direction } from '../utils/game'; // Assuming these types are defined elsewhere

interface CharacterProps {
  position: Position; // { x: number, y: number }
  direction: Direction; // 'up' | 'down' | 'left' | 'right'
  isMoving: boolean; // Whether the character is moving
  animationFrame: number; // 0 to 5, for animation cycling
  size?: number; // Size of the character container in pixels
}

const Character: React.FC<CharacterProps> = ({
  position,
  direction = 'down',
  isMoving = false,
  animationFrame = 0,
  size = 64,
}) => {
  // Animation offsets and rotations
  const bodyOffset = isMoving ? [0, -4, -2, 0, -2, -4][animationFrame] : 0;
  const leftLegOffset = isMoving ? [0, -8, -12, -8, -4, 0][animationFrame] : 0;
  const rightLegOffset = isMoving ? [0, -4, -8, -12, -8, -4][animationFrame] : 0;
  const leftArmRotation = isMoving ? [0, 30, 45, 30, 15, 0][animationFrame] : 0;
  const rightArmRotation = isMoving ? [0, -15, -30, -45, -30, -15][animationFrame] : 0;

  // Directional adjustments for face
  const eyeOffsetX = direction === 'left' ? -4 : direction === 'right' ? 4 : 0;
  const eyeOffsetY = direction === 'up' ? -4 : direction === 'down' ? 4 : 0;
  const pupilOffsetX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  const pupilOffsetY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  const mouthOffsetX = direction === 'left' ? -2 : direction === 'right' ? 2 : 0;
  const mouthOffsetY = direction === 'up' ? -2 : direction === 'down' ? 2 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: position.x,
        top: position.y,
        imageRendering: 'pixelated',
        transform: 'scale(0.65)', // Adjust scale as needed
        zIndex: 1000,
      }}
    >
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          width: '64px',
          height: '16px',
          left: '-8px',
          bottom: '-12px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '50%',
          filter: 'blur(6px)',
          transform: 'scale(1.2, 0.4)',
        }}
      />

      {/* Body (Torso) */}
      <div
        style={{
          position: 'absolute',
          width: '48px',
          height: '64px',
          left: '-8px',
          bottom: `${16 + bodyOffset}px`,
          background: 'linear-gradient(180deg, #A0D8EF 0%, #5FB3D4 100%)',
          border: '3px solid #3B82F6',
          borderRadius: '12px 12px 0 0',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)',
        }}
      />

      {/* Shirt */}
      <div
        style={{
          position: 'absolute',
          width: '42px',
          height: '24px',
          left: '-5px',
          bottom: `${36 + bodyOffset}px`,
          background: '#FFD700',
          borderRadius: '8px',
          border: '2px solid #E5C200',
          boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)',
        }}
      />

      {/* Belt */}
      <div
        style={{
          position: 'absolute',
          width: '42px',
          height: '4px',
          left: '-5px',
          bottom: `${32 + bodyOffset}px`,
          background: '#333',
          borderRadius: '2px',
        }}
      />

      {/* Backpack */}
      <div
        style={{
          position: 'absolute',
          width: '32px',
          height: '40px',
          left: '-16px',
          bottom: `${40 + bodyOffset}px`,
          background: '#EF4444',
          borderRadius: '8px',
          border: '3px solid #B91C1C',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1,
        }}
      />

      {/* Head */}
      <div
        style={{
          position: 'absolute',
          width: '64px',
          height: '64px',
          left: '-16px',
          bottom: `${72 + bodyOffset}px`,
          background: '#FDE68A',
          borderRadius: '50%',
          border: '3px solid #92400E',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)',
        }}
      />

      {/* Hair */}
      <div
        style={{
          position: 'absolute',
          width: '72px',
          height: '32px',
          left: '-20px',
          bottom: `${96 + bodyOffset}px`,
          background: '#0F172A',
          borderRadius: '50% 50% 0 0',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2)',
        }}
      />

      {/* Cap */}
      <div
        style={{
          position: 'absolute',
          width: '68px',
          height: '16px',
          left: '-18px',
          bottom: `${92 + bodyOffset}px`,
          background: '#EF4444',
          borderRadius: '50% 50% 0 0',
          border: '3px solid #B91C1C',
        }}
      />

      {/* Cap Logo */}
      <div
        style={{
          position: 'absolute',
          width: '12px',
          height: '12px',
          left: '26px',
          bottom: `${100 + bodyOffset}px`,
          background: '#FFF',
          borderRadius: '50%',
        }}
      />

      {/* Left Eye */}
      <div
        style={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          left: `${8 + eyeOffsetX}px`,
          bottom: `${80 + bodyOffset + eyeOffsetY}px`,
          background: 'white',
          borderRadius: '50%',
          border: '1px solid black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            left: `${2 + pupilOffsetX}px`,
            top: `${2 + pupilOffsetY}px`,
            background: 'black',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Right Eye */}
      <div
        style={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          left: `${24 + eyeOffsetX}px`,
          bottom: `${80 + bodyOffset + eyeOffsetY}px`,
          background: 'white',
          borderRadius: '50%',
          border: '1px solid black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            left: `${2 + pupilOffsetX}px`,
            top: `${2 + pupilOffsetY}px`,
            background: 'black',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Mouth */}
      <div
        style={{
          position: 'absolute',
          width: '24px',
          height: '4px',
          left: `${4 + mouthOffsetX}px`,
          bottom: `${72 + bodyOffset + mouthOffsetY}px`,
          background: 'black',
          borderRadius: '4px',
        }}
      />

      {/* Left Arm with Hand */}
      <div
        style={{
          position: 'absolute',
          left: '-12px',
          bottom: `${40 + bodyOffset}px`,
          width: '16px',
          height: '32px',
          transform: `rotate(${leftArmRotation}deg)`,
          transformOrigin: 'top center',
          zIndex: direction === 'left' ? 3 : 1,
        }}
      >
        <div
          style={{
            width: '16px',
            height: '32px',
            background: '#3B82F6',
            borderRadius: '8px',
            border: '3px solid #1E40AF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            left: '2px',
            bottom: '-6px',
            background: '#FDE68A',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Right Arm with Hand */}
      <div
        style={{
          position: 'absolute',
          right: '-12px',
          bottom: `${40 + bodyOffset}px`,
          width: '16px',
          height: '32px',
          transform: `rotate(${rightArmRotation}deg)`,
          transformOrigin: 'top center',
          zIndex: direction === 'right' ? 3 : 1,
        }}
      >
        <div
          style={{
            width: '16px',
            height: '32px',
            background: '#3B82F6',
            borderRadius: '8px',
            border: '3px solid #1E40AF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            left: '2px',
            bottom: '-6px',
            background: '#FDE68A',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Left Leg with Foot */}
      <div
        style={{
          position: 'absolute',
          left: '0px',
          bottom: '0px',
          width: '20px',
          height: '32px',
          transform: `translateY(${leftLegOffset}px)`,
        }}
      >
        <div
          style={{
            width: '20px',
            height: '32px',
            background: '#1E3A8A',
            borderRadius: '8px',
            border: '3px solid #1E40AF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '8px',
            left: '-2px',
            bottom: '-4px',
            background: '#333',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Right Leg with Foot */}
      <div
        style={{
          position: 'absolute',
          right: '0px',
          bottom: '0px',
          width: '20px',
          height: '32px',
          transform: `translateY(${rightLegOffset}px)`,
        }}
      >
        <div
          style={{
            width: '20px',
            height: '32px',
            background: '#1E3A8A',
            borderRadius: '8px',
            border: '3px solid #1E40AF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '8px',
            left: '-2px',
            bottom: '-4px',
            background: '#333',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
};

export default Character;
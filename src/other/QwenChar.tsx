import { Direction } from "./QwenGame";

export const Character: React.FC<{
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  animationFrame: number;
}> = ({ x, y, direction, isMoving, animationFrame }) => {
  const bodyOffset = isMoving ? [0, -2, 0, -2][animationFrame] : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 48, height: 48 }}>
      {/* Shadow */}
      <div 
        style={{
          position: 'absolute',
          width: '32px',
          height: '10px',
          left: '8px',
          bottom: '0px',
          backgroundColor: 'black',
          borderRadius: '50%',
          opacity: 0.3,
          filter: 'blur(2px)'
        }}
      />
      {/* Character Body */}
      <div 
        style={{
          position: 'absolute',
          width: '24px',
          height: '28px',
          left: '12px',
          bottom: `${10 + bodyOffset}px`,
          backgroundColor: '#2563EB',
          borderRadius: '8px 8px 0 0'
        }}
      />
      {/* Head */}
      <div 
        style={{
          position: 'absolute',
          width: '28px',
          height: '28px',
          left: '10px',
          bottom: `${34 + bodyOffset}px`,
          backgroundColor: '#FDE68A',
          borderRadius: '50%'
        }}
      />
      {/* Face elements based on direction */}
      {direction === 'down' && (
        <>
          <div style={{ position: 'absolute', width: '4px', height: '4px', left: '16px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', width: '4px', height: '4px', left: '28px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', width: '10px', height: '2px', left: '19px', bottom: `${38 + bodyOffset}px`, backgroundColor: 'black' }} />
        </>
      )}
      {direction === 'up' && (
        <div style={{ position: 'absolute', width: '10px', height: '2px', left: '19px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black' }} />
      )}
      {direction === 'left' && (
        <>
          <div style={{ position: 'absolute', width: '4px', height: '4px', left: '14px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', width: '6px', height: '2px', left: '12px', bottom: `${38 + bodyOffset}px`, backgroundColor: 'black' }} />
        </>
      )}
      {direction === 'right' && (
        <>
          <div style={{ position: 'absolute', width: '4px', height: '4px', left: '30px', bottom: `${44 + bodyOffset}px`, backgroundColor: 'black', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', width: '6px', height: '2px', left: '30px', bottom: `${38 + bodyOffset}px`, backgroundColor: 'black' }} />
        </>
      )}
      {/* Arms */}
      <div 
        style={{
          position: 'absolute',
          width: '6px',
          height: '16px',
          left: '6px',
          bottom: `${20 + bodyOffset}px`,
          backgroundColor: '#2563EB',
          borderRadius: '4px',
          transform: isMoving ? `rotate(${[20, 40, 20, 0][animationFrame]}deg)` : 'rotate(0deg)',
          transformOrigin: 'top center'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '6px',
          height: '16px',
          right: '6px',
          bottom: `${20 + bodyOffset}px`,
          backgroundColor: '#2563EB',
          borderRadius: '4px',
          transform: isMoving ? `rotate(${[0, 20, 40, 20][animationFrame]}deg)` : 'rotate(0deg)',
          transformOrigin: 'top center'
        }}
      />
      {/* Legs */}
      <div 
        style={{
          position: 'absolute',
          width: '10px',
          height: '14px',
          left: '12px',
          bottom: '0px',
          backgroundColor: '#1E40AF',
          borderRadius: '4px',
          transform: isMoving ? `translateY(${[0, -4, 0, -2][animationFrame]}px)` : 'none'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '10px',
          height: '14px',
          right: '12px',
          bottom: '0px',
          backgroundColor: '#1E40AF',
          borderRadius: '4px',
          transform: isMoving ? `translateY(${[0, -2, -4, 0][animationFrame]}px)` : 'none'
        }}
      />
    </div>
  );
};
import React from 'react';
import { Position, Tree, Bush, Flower } from '../utils/game';

interface MiniMapProps {
  playerPosition: Position;
  worldSize: {
    width: number;
    height: number;
  };
  worldElements: {
    trees: Tree[];
    bushes: Bush[];
    flowers: Flower[];
  };
}

export const MiniMap: React.FC<MiniMapProps> = ({ 
  playerPosition, 
  worldSize, 
  worldElements 
}) => {
  // Mini map size and scaling
  const mapWidth = 180;
  const mapHeight = 180;
  const scaleX = mapWidth / worldSize.width;
  const scaleY = mapHeight / worldSize.height;
  
  // Element sizing for the mini map
  const treeSize = 4;
  const bushSize = 3;
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: `${mapWidth}px`,
        height: `${mapHeight}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: 2000
      }}
    >
      {/* Trees representation on mini map */}
      {worldElements.trees.map(tree => (
        <div 
          key={`mini-tree-${tree.id}`}
          style={{
            position: 'absolute',
            left: `${tree.x * scaleX - treeSize/2}px`,
            top: `${tree.y * scaleY - treeSize/2}px`,
            width: `${treeSize}px`,
            height: `${treeSize}px`,
            backgroundColor: '#006400', // Dark green
            borderRadius: '50%'
          }}
        />
      ))}
      
      {/* Bushes representation on mini map */}
      {worldElements.bushes.map(bush => (
        <div 
          key={`mini-bush-${bush.id}`}
          style={{
            position: 'absolute',
            left: `${bush.x * scaleX - bushSize/2}px`,
            top: `${bush.y * scaleY - bushSize/2}px`,
            width: `${bushSize}px`,
            height: `${bushSize}px`,
            backgroundColor: '#32CD32', // Lime green
            borderRadius: '50%'
          }}
        />
      ))}
      
      {/* Player position indicator */}
      <div
        style={{
          position: 'absolute',
          left: `${playerPosition.x * scaleX - 4}px`,
          top: `${playerPosition.y * scaleY - 4}px`,
          width: '8px',
          height: '8px',
          backgroundColor: '#FF0000', // Red
          border: '1px solid white',
          borderRadius: '50%',
          zIndex: 10
        }}
      />
      
      {/* Viewing area rectangle */}
      <div
        style={{
          position: 'absolute',
          left: `${(playerPosition.x - 512) * scaleX}px`,
          top: `${(playerPosition.y - 384) * scaleY}px`,
          width: `${1024 * scaleX}px`,
          height: `${768 * scaleY}px`,
          border: '1px solid rgba(255, 255, 255, 0.7)',
          backgroundColor: 'transparent',
          zIndex: 9
        }}
      />
    </div>
  );
};
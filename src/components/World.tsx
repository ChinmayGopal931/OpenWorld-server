import React from 'react';
import { Position, Tree, Bush, Flower } from '../utils/game';


interface WorldProps {
  visibleElements: {
    trees: Tree[];
    bushes: Bush[];
    flowers: Flower[];
  };
  cameraPosition: Position;
  timeOfDay: string;
}

const World: React.FC<WorldProps> = ({ 
  visibleElements, 
  cameraPosition, 
  timeOfDay 
}) => {
  // Get time-of-day overlay style
  const getTimeOfDayStyle = () => {
    switch (timeOfDay) {
      case 'dawn':
        return {
          backgroundColor: 'rgba(255, 200, 150, 0.2)',
          boxShadow: 'inset 0 0 200px rgba(255, 180, 100, 0.5)'
        };
      case 'dusk':
        return {
          backgroundColor: 'rgba(255, 100, 100, 0.2)',
          boxShadow: 'inset 0 0 200px rgba(200, 100, 50, 0.5)'
        };
      case 'night':
        return {
          backgroundColor: 'rgba(0, 0, 50, 0.4)',
          boxShadow: 'inset 0 0 200px rgba(0, 0, 40, 0.6)'
        };
      default: // day
        return {
          backgroundColor: 'rgba(255, 255, 255, 0)',
        };
    }
  };
  
  // Rendering functions for trees, bushes, flowers
  const renderTree = (tree: Tree) => {
    const adjustedX = tree.x - cameraPosition.x;
    const adjustedY = tree.y - cameraPosition.y;
    
    // Don't render if completely outside viewport (with padding)
    if (adjustedX < -tree.size || 
        adjustedY < -tree.size || 
        adjustedX > 1024 + 100 || 
        adjustedY > 768 + 100) {
      return null;
    }
    
    // Different tree variants
    if (tree.variant === 0) {
      // Pine tree
      return (
        <div 
          key={`tree-${tree.id}`}
          style={{
            position: 'absolute',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            width: `${tree.size}px`,
            height: `${tree.size}px`,
            zIndex: Math.floor(tree.y + tree.size / 2)
          }}
        >
          {/* Tree trunk */}
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size / 4}px`,
              height: `${tree.size / 2}px`,
              left: `${tree.size * 3/8}px`,
              bottom: '0px',
              backgroundColor: '#8B4513',
              borderRadius: '4px',
              boxShadow: 'inset -4px 0 rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Tree foliage - pine tree shape */}
          <div 
            style={{
              position: 'absolute',
              width: '0',
              height: '0',
              left: `${tree.size / 6}px`,
              bottom: `${tree.size * 0.3}px`,
              borderLeft: `${tree.size * 1/3}px solid transparent`,
              borderRight: `${tree.size * 1/3}px solid transparent`,
              borderBottom: `${tree.size * 0.5}px solid ${tree.color}`,
              zIndex: 3
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: '0',
              height: '0',
              left: `${tree.size / 8}px`,
              bottom: `${tree.size * 0.5}px`,
              borderLeft: `${tree.size * 3/8}px solid transparent`,
              borderRight: `${tree.size * 3/8}px solid transparent`,
              borderBottom: `${tree.size * 0.4}px solid ${tree.color}`,
              zIndex: 2
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: '0',
              height: '0',
              left: '0px',
              bottom: `${tree.size * 0.65}px`,
              borderLeft: `${tree.size / 2}px solid transparent`,
              borderRight: `${tree.size / 2}px solid transparent`,
              borderBottom: `${tree.size * 0.3}px solid ${tree.color}`,
              zIndex: 1
            }}
          />
        </div>
      );
    } else if (tree.variant === 1) {
      // Oak tree
      return (
        <div 
          key={`tree-${tree.id}`}
          style={{
            position: 'absolute',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            width: `${tree.size}px`,
            height: `${tree.size}px`,
            zIndex: Math.floor(tree.y + tree.size / 2)
          }}
        >
          {/* Tree trunk */}
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size / 3}px`,
              height: `${tree.size / 1.8}px`,
              left: `${tree.size / 3}px`,
              bottom: '0px',
              backgroundColor: '#8B4513',
              borderRadius: '4px',
              boxShadow: 'inset -5px 0 rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Tree foliage - round oak shape */}
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size}px`,
              height: `${tree.size * 0.7}px`,
              bottom: `${tree.size * 0.4}px`,
              backgroundColor: tree.color,
              borderRadius: '50%',
              boxShadow: 'inset -10px -10px rgba(0,0,0,0.1)'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size * 0.85}px`,
              height: `${tree.size * 0.6}px`,
              bottom: `${tree.size * 0.5}px`,
              left: `${tree.size * 0.075}px`,
              backgroundColor: tree.color,
              borderRadius: '50%',
              boxShadow: 'inset -10px -10px rgba(0,0,0,0.1)'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size * 0.7}px`,
              height: `${tree.size * 0.5}px`,
              bottom: `${tree.size * 0.65}px`,
              left: `${tree.size * 0.15}px`,
              backgroundColor: tree.color,
              borderRadius: '50%',
              boxShadow: 'inset -10px -10px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      );
    } else {
      // Apple tree
      const hasApples = tree.id % 3 === 0; // Only some trees have apples
      
      return (
        <div 
          key={`tree-${tree.id}`}
          style={{
            position: 'absolute',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            width: `${tree.size}px`,
            height: `${tree.size}px`,
            zIndex: Math.floor(tree.y + tree.size / 2)
          }}
        >
          {/* Tree trunk */}
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size / 4}px`,
              height: `${tree.size / 2.2}px`,
              left: `${tree.size * 3/8}px`,
              bottom: '0px',
              backgroundColor: '#96603c',
              borderRadius: '3px',
              boxShadow: 'inset -3px 0 rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Tree foliage - apple tree shape */}
          <div 
            style={{
              position: 'absolute',
              width: `${tree.size * 0.9}px`,
              height: `${tree.size * 0.6}px`,
              left: `${tree.size * 0.05}px`,
              bottom: `${tree.size * 0.35}px`,
              backgroundColor: `hsl(${90 + Math.random() * 20}, 65%, 40%)`,
              borderRadius: '50%',
              boxShadow: 'inset -8px -8px rgba(0,0,0,0.1)'
            }}
          />
          
          {/* Add apples */}
          {hasApples && Array.from({ length: 6 }).map((_, i) => {
            const angle = i * (Math.PI * 2 / 6);
            const distance = tree.size * 0.3;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            return (
              <div
                key={`apple-${tree.id}-${i}`}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  left: `${tree.size / 2 + offsetX - 4}px`,
                  bottom: `${tree.size * 0.5 + offsetY - 4}px`,
                  backgroundColor: '#ff0000',
                  borderRadius: '50%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  zIndex: 5
                }}
              />
            );
          })}
        </div>
      );
    }
  };
  
  // Render bush with enhanced detail
  // const renderBush = (bush: Bush) => {
  //   const adjustedX = bush.x - cameraPosition.x;
  //   const adjustedY = bush.y - cameraPosition.y;
    
  //   // Skip rendering if outside viewport
  //   if (adjustedX < -bush.size || 
  //       adjustedY < -bush.size || 
  //       adjustedX > 1024 + 50 || 
  //       adjustedY > 768 + 50) {
  //     return null;
  //   }
    
  //   if (bush.variant === 0) {
  //     // Round berry bush
  //     const hasBerries = bush.id % 3 === 0; // Only some bushes have berries
      
  //     return (
  //       <div 
  //         key={`bush-${bush.id}`}
  //         style={{
  //           position: 'absolute',
  //           left: `${adjustedX}px`,
  //           top: `${adjustedY}px`,
  //           width: `${bush.size}px`,
  //           height: `${bush.size}px`,
  //           zIndex: Math.floor(bush.y + bush.size)
  //         }}
  //       >
  //         {/* Bush foliage */}
  //         <div 
  //           style={{
  //             position: 'absolute',
  //             width: `${bush.size}px`,
  //             height: `${bush.size * 0.8}px`,
  //             bottom: '0px',
  //             backgroundColor: bush.color,
  //             borderRadius: '50% 50% 40% 40%',
  //             boxShadow: 'inset -5px -5px rgba(0,0,0,0.1)'
  //           }}
  //         />
          
  //         {/* Add berries */}
  //         {hasBerries && Array.from({ length: 5 }).map((_, i) => {
  //           const angle = i * (Math.PI * 2 / 5);
  //           const distance = bush.size * 0.25;
  //           const offsetX = Math.cos(angle) * distance;
  //           const offsetY = Math.sin(angle) * distance - bush.size * 0.1;
            
  //           return (
  //             <div
  //               key={`berry-${bush.id}-${i}`}
  //               style={{
  //                 position: 'absolute',
  //                 width: '6px',
  //                 height: '6px',
  //                 left: `${bush.size / 2 + offsetX - 3}px`,
  //                 bottom: `${bush.size * 0.4 + offsetY - 3}px`,
  //                 backgroundColor: '#3344ff',
  //                 borderRadius: '50%',
  //                 boxShadow: '0 1px 1px rgba(0,0,0,0.3)',
  //                 zIndex: 10
  //               }}
  //             />
  //           );
  //         })}
  //       </div>
  //     );
  //   } else if (bush.variant === 1) {
  //     // Pointed bush
  //     return (
  //       <div 
  //         key={`bush-${bush.id}`}
  //         style={{
  //           position: 'absolute',
  //           left: `${adjustedX}px`,
  //           top: `${adjustedY}px`,
  //           width: `${bush.size}px`,
  //           height: `${bush.size}px`,
  //           zIndex: Math.floor(bush.y + bush.size)
  //         }}
  //       >
  //         {/* Bush base */}
  //         <div 
  //           style={{
  //             position: 'absolute',
  //             width: `${bush.size}px`,
  //             height: `${bush.size * 0.4}px`,
  //             bottom: '0px',
  //             backgroundColor: bush.color,
  //             borderRadius: '30% 30% 40% 40%',
  //             boxShadow: 'inset -3px -3px rgba(0,0,0,0.1)'
  //           }}
  //         />
          
  //         {/* Bush points */}
  //         {Array.from({ length: 5 }).map((_, i) => {
  //           const angle = (i * (Math.PI * 2 / 5)) + Math.PI/5;
  //           const distance = bush.size * 0.3;
  //           const offsetX = Math.cos(angle) * distance;
  //           const offsetY = Math.sin(angle) * distance;
            
  //           return (
  //             <div
  //               key={`leaf-${bush.id}-${i}`}
  //               style={{
  //                 position: 'absolute',
  //                 width: `${bush.size * 0.4}px`,
  //                 height: `${bush.size * 0.5}px`,
  //                 left: `${bush.size / 2 + offsetX - bush.size * 0.2}px`,
  //                 bottom: `${bush.size * 0.4 + offsetY - bush.size * 0.1}px`,
  //                 backgroundColor: bush.color,
  //                 borderRadius: '50% 50% 10% 10%',
  //                 transform: `rotate(${i * 72}deg)`,
  //                 boxShadow: 'inset -2px -2px rgba(0,0,0,0.1)'
  //               }}
  //             />
  //           );
  //         })}
  //       </div>
  //     );
  //   } else {
  //     // Flowering bush
  //     return (
  //       <div 
  //         key={`bush-${bush.id}`}
  //         style={{
  //           position: 'absolute',
  //           left: `${adjustedX}px`,
  //           top: `${adjustedY}px`,
  //           width: `${bush.size}px`,
  //           height: `${bush.size}px`,
  //           zIndex: Math.floor(bush.y + bush.size)
  //         }}
  //       >
  //         {/* Bush base */}
  //         <div 
  //           style={{
  //             position: 'absolute',
  //             width: `${bush.size}px`,
  //             height: `${bush.size * 0.7}px`,
  //             bottom: '0px',
  //             backgroundColor: bush.color,
  //             borderRadius: '40%',
  //             boxShadow: 'inset -4px -4px rgba(0,0,0,0.1)'
  //           }}
  //         />
          
  //         {/* Flowers */}
  //         {Array.from({ length: 7 }).map((_, i) => {
  //           const angle = i * (Math.PI * 2 / 7);
  //           const distance = bush.size * 0.3;
  //           const offsetX = Math.cos(angle) * distance;
  //           const offsetY = Math.sin(angle) * distance;
  //           const flowerColors = ['#ffffff', '#ffaaaa', '#ffffaa'];
  //           const flowerColor = flowerColors[i % flowerColors.length];
            
  //           return (
  //             <div
  //               key={`flower-${bush.id}-${i}`}
  //               style={{
  //                 position: 'absolute',
  //                 width: '10px',
  //                 height: '10px',
  //                 left: `${bush.size / 2 + offsetX - 5}px`,
  //                 bottom: `${bush.size * 0.35 + offsetY - 5}px`,
  //                 backgroundColor: flowerColor,
  //                 borderRadius: '50%',
  //                 boxShadow: '0 0 2px rgba(255,255,255,0.7)',
  //                 zIndex: 10
  //               }}
  //             />
  //           );
  //         })}
  //       </div>
  //     );
  //   }
  // };
  
  // Render a flower
  // const renderFlower = (flower: Flower) => {
  //   const adjustedX = flower.x - cameraPosition.x;
  //   const adjustedY = flower.y - cameraPosition.y;
    
  //   // Skip rendering if outside viewport
  //   if (adjustedX < -20 || 
  //       adjustedY < -20 || 
  //       adjustedX > 1024 + 20 || 
  //       adjustedY > 768 + 20) {
  //     return null;
  //   }
    
  //   return (
  //     <div
  //       key={`flower-${flower.id}`}
  //       style={{
  //         position: 'absolute',
  //         left: `${adjustedX}px`,
  //         top: `${adjustedY}px`,
  //         zIndex: Math.floor(flower.y)
  //       }}
  //     >
  //       {/* Stem */}
  //       <div
  //         style={{
  //           position: 'absolute',
  //           width: '2px',
  //           height: '10px',
  //           left: '4px',
  //           bottom: '0px',
  //           backgroundColor: '#3b8132',
  //           zIndex: 1
  //         }}
  //       />
        
  //       {/* Petals */}
  //       {Array.from({ length: 5 }).map((_, i) => {
  //         const angle = i * (Math.PI * 2 / 5);
  //         return (
  //           <div
  //             key={`petal-${flower.id}-${i}`}
  //             style={{
  //               position: 'absolute',
  //               width: '5px',
  //               height: '5px',
  //               left: '2px',
  //               top: '0px',
  //               backgroundColor: flower.color,
  //               borderRadius: '50%',
  //               transform: `rotate(${i * 72}deg) translate(3px, 0)`,
  //               transformOrigin: 'center center',
  //               zIndex: 2
  //             }}
  //           />
  //         );
  //       })}
        
  //       {/* Center */}
  //       <div
  //         style={{
  //           position: 'absolute',
  //           width: '4px',
  //           height: '4px',
  //           left: '3px',
  //           top: '3px',
  //           backgroundColor: '#ffff00',
  //           borderRadius: '50%',
  //           zIndex: 3
  //         }}
  //       />
  //     </div>
  //   );
  // };
  
  return (
    <div 
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Base ground layer */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#7bae58',
        }}
      />
      
      {/* Generate grass patches */}
      {/* {Array.from({ length: 200 }).map((_, i) => {
        // Use a deterministic pattern for even distribution
        const row = Math.floor(i / 20);
        const col = i % 20;
        
        // Add some variation to the grid
        const offsetX = Math.random() * 50 - 25;
        const offsetY = Math.random() * 50 - 25;
        
        const x = (col * (1024 / 20)) + offsetX;
        const y = (row * (768 / 10)) + offsetY;
        
        const angle = Math.floor(Math.random() * 360);
        const size = 4 + Math.floor(Math.random() * 4);
        
        return (
          <div 
            key={`grass-${i}`}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size * 1.5}px`,
              backgroundColor: `hsl(${100 + Math.random() * 30}, 70%, ${40 + Math.random() * 20}%)`,
              transform: `rotate(${angle}deg)`,
              borderRadius: '0 100% 0 100%',
              opacity: 0.8
            }}
          />
        );
      })} */}
      
      {/* Render world elements in order */}
      {/* {visibleElements.flowers.map(flower => renderFlower(flower))}
      {visibleElements.bushes.map(bush => renderBush(bush))} */}
      {visibleElements.trees.map(tree => renderTree(tree))}
      
      {/* Time of day lighting effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          ...getTimeOfDayStyle()
        }}
      />
    </div>
  );
};

export default World;
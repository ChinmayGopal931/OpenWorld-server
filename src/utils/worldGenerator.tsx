// file: src/utils/worldGenerator.ts

import { Tree, Bush, Flower, WorldElement }  from "./game";

// Global ID counters to ensure uniqueness
let nextTreeId = 1000000;
let nextBushId = 2000000;
let nextFlowerId = 3000000;

// Seeded random generator for deterministic world generation
const createSeededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

// Check if a new element would collide with existing elements
const checkCollisionWithExistingElements = (
  x: number,
  y: number,
  size: number,
  existingElements: WorldElement[]
): boolean => {
  // Add a small buffer space between elements
  const buffer = 10;
  
  for (const element of existingElements) {
    const elementSize = element.size || 10; // Default size if not specified
    
    // Simple circular collision detection
    const distance = Math.sqrt(
      Math.pow(x + size/2 - (element.x + elementSize/2), 2) + 
      Math.pow(y + size/2 - (element.y + elementSize/2), 2)
    );
    
    if (distance < (size/2 + elementSize/2 + buffer)) {
      return true;
    }
  }
  
  return false;
};

// Generate trees within a chunk
export const generateTrees = (
  chunkX: number,
  chunkY: number,
  chunkSize: number,
  count: number,
  seed: number
): Tree[] => {
  const random = createSeededRandom(seed);
  const trees: Tree[] = [];
  
  for (let i = 0; i < count; i++) {
    const size = 80 + Math.floor(random() * 40);
    const variant = Math.floor(random() * 3); // 3 tree variants
    
    // Try to find a valid position
    let attempts = 0;
    let validPosition = false;
    let x = 0, y = 0;
    
    while (!validPosition && attempts < 50) {
      attempts++;
      x = chunkX + Math.floor(random() * (chunkSize - size));
      y = chunkY + Math.floor(random() * (chunkSize - size));
      
      validPosition = !checkCollisionWithExistingElements(x, y, size, trees);
    }
    
    if (validPosition) {
      trees.push({
        id: nextTreeId++, // Use global counter for unique IDs
        x,
        y,
        size,
        color: `hsl(${110 + random() * 30}, ${70 + random() * 10}%, ${35 + random() * 15}%)`,
        variant
      });
    }
  }
  
  return trees;
};

// Generate bushes within a chunk
export const generateBushes = (
  chunkX: number,
  chunkY: number,
  chunkSize: number,
  count: number,
  seed: number,
  existingElements: WorldElement[] = []
): Bush[] => {
  const random = createSeededRandom(seed);
  const bushes: Bush[] = [];
  
  for (let i = 0; i < count; i++) {
    const size = 40 + Math.floor(random() * 20);
    const variant = Math.floor(random() * 3); // 3 bush variants
    
    // Try to find a valid position
    let attempts = 0;
    let validPosition = false;
    let x = 0, y = 0;
    
    while (!validPosition && attempts < 50) {
      attempts++;
      x = chunkX + Math.floor(random() * (chunkSize - size));
      y = chunkY + Math.floor(random() * (chunkSize - size));
      
      validPosition = !checkCollisionWithExistingElements(x, y, size, [...existingElements, ...bushes]);
    }
    
    if (validPosition) {
      bushes.push({
        id: nextBushId++, // Use global counter for unique IDs
        x,
        y,
        size,
        color: `hsl(${100 + random() * 50}, ${65 + random() * 15}%, ${30 + random() * 15}%)`,
        variant
      });
    }
  }
  
  return bushes;
};

// Generate flowers within a chunk
export const generateFlowers = (
  chunkX: number,
  chunkY: number,
  chunkSize: number,
  count: number,
  seed: number,
  existingElements: WorldElement[] = []
): Flower[] => {
  const random = createSeededRandom(seed);
  const flowers: Flower[] = [];
  
  const flowerColors = [
    '#FF5733', // Orange
    '#DAF7A6', // Light Green
    '#FFC300', // Yellow
    '#C70039', // Red
    '#900C3F', // Maroon
    '#581845', // Purple
    '#FFFFFF', // White
    '#FFC0CB', // Pink
    '#3D85C6'  // Blue
  ];
  
  for (let i = 0; i < count; i++) {
    // Flowers are small, so less collision checking needed
    const x = chunkX + Math.floor(random() * chunkSize);
    const y = chunkY + Math.floor(random() * chunkSize);
    const color = flowerColors[Math.floor(random() * flowerColors.length)];
    
    // Simple check to avoid placing flowers directly on trees or bushes
    let validPosition = true;
    
    for (const element of existingElements) {
      const elementSize = element.size || 10;
      const distance = Math.sqrt(
        Math.pow(x - (element.x + elementSize/2), 2) + 
        Math.pow(y - (element.y + elementSize/2), 2)
      );
      
      if (distance < elementSize/2) {
        validPosition = false;
        break;
      }
    }
    
    if (validPosition) {
      flowers.push({
        id: nextFlowerId++, // Use global counter for unique IDs
        x,
        y,
        color
      });
    }
  }
  
  return flowers;
};
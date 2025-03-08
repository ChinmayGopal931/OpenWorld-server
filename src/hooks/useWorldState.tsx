// file: src/hooks/useWorldState.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Position, Tree, Bush, Flower, GameConfig, WorldChunk, WorldElement } from '../utils/game';
import { generateTrees, generateBushes, generateFlowers } from '../utils/worldGenerator';

export const useWorldState = (config: GameConfig, playerPosition: Position) => {
  // Time of day simulation
  const [timeOfDay, setTimeOfDay] = useState<string>('day');
  const [gameTime, setGameTime] = useState<number>(8); // Start at 8 AM
  
  // World is divided into chunks for efficient loading/rendering
  const [loadedChunks, setLoadedChunks] = useState<Map<string, WorldChunk>>(new Map());
  
  // Cache of all generated elements for mini-map and persistence
  const [worldElements, setWorldElements] = useState<{
    trees: Tree[],
    bushes: Bush[],
    flowers: Flower[]
  }>({
    trees: [],
    bushes: [],
    flowers: []
  });
  
  // Reference to all world elements for internal use
  const worldElementsRef = useRef(worldElements);
  const loadedChunksRef = useRef(loadedChunks);
  
  // Update refs when state changes
  useEffect(() => {
    worldElementsRef.current = worldElements;
  }, [worldElements]);
  
  useEffect(() => {
    loadedChunksRef.current = loadedChunks;
  }, [loadedChunks]);
  
  // Generate a key for a chunk based on its coordinates
  const getChunkKey = useCallback((chunkX: number, chunkY: number) => `${chunkX},${chunkY}`, []);
  
  // Get the chunk coordinates that contain a world position
  const getChunkCoordinates = useCallback((position: Position) => ({
    x: Math.floor(position.x / config.chunkSize),
    y: Math.floor(position.y / config.chunkSize)
  }), [config.chunkSize]);
  
  // Generate content for a new chunk
  const generateChunk = useCallback((chunkX: number, chunkY: number): WorldChunk => {
    const chunkOriginX = chunkX * config.chunkSize;
    const chunkOriginY = chunkY * config.chunkSize;
    
    // Use seeded random based on chunk coordinates for consistent generation
    const chunkSeed = chunkX * 10000 + chunkY;
    
    // Generate environment elements for this chunk
    const trees = generateTrees(
      chunkOriginX, 
      chunkOriginY,
      config.chunkSize,
      5 + Math.floor((Math.sin(chunkSeed) + 1) * 5), // 5-15 trees per chunk
      chunkSeed
    );
    
    const bushes = generateBushes(
      chunkOriginX,
      chunkOriginY,
      config.chunkSize,
      8 + Math.floor((Math.cos(chunkSeed) + 1) * 7), // 8-22 bushes per chunk
      chunkSeed + 1,
      trees // Avoid placing bushes on trees
    );
    
    const flowers = generateFlowers(
      chunkOriginX,
      chunkOriginY,
      config.chunkSize,
      15 + Math.floor((Math.sin(chunkSeed * 0.1) + 1) * 10), // 15-35 flowers per chunk
      chunkSeed + 2,
      [...trees, ...bushes] // Avoid placing flowers on trees or bushes
    );
    
    // Return the chunk without updating state here
    return {
      x: chunkX,
      y: chunkY,
      trees,
      bushes,
      flowers,
      isLoaded: true
    };
  }, [config.chunkSize]);
  
  // Separate function to handle state updates after chunk generation
  const addElementsToWorldState = useCallback((newElements: {
    trees: Tree[],
    bushes: Bush[],
    flowers: Flower[]
  }) => {
    setWorldElements(prev => ({
      trees: [...prev.trees, ...newElements.trees],
      bushes: [...prev.bushes, ...newElements.bushes],
      flowers: [...prev.flowers, ...newElements.flowers]
    }));
  }, []);
  
  // Load chunks around the player
  const loadChunks = useCallback((position: Position) => {
    const currentChunk = getChunkCoordinates(position);
    const newChunks = new Map(loadedChunksRef.current);
    const renderDistance = config.renderDistance;
    const newElements = {
      trees: [] as Tree[],
      bushes: [] as Bush[],
      flowers: [] as Flower[]
    };
    let chunksChanged = false;
    
    // Load chunks in render distance
    for (let x = currentChunk.x - renderDistance; x <= currentChunk.x + renderDistance; x++) {
      for (let y = currentChunk.y - renderDistance; y <= currentChunk.y + renderDistance; y++) {
        // Skip if out of world bounds
        if (x < 0 || y < 0 || 
            x * config.chunkSize >= config.worldWidth || 
            y * config.chunkSize >= config.worldHeight) {
          continue;
        }
        
        const chunkKey = getChunkKey(x, y);
        
        // If chunk not loaded, generate it
        if (!newChunks.has(chunkKey)) {
          const chunk = generateChunk(x, y);
          newChunks.set(chunkKey, chunk);
          newElements.trees.push(...chunk.trees);
          newElements.bushes.push(...chunk.bushes);
          newElements.flowers.push(...chunk.flowers);
          chunksChanged = true;
        }
      }
    }
    
    // Update state only if changes were made
    if (chunksChanged) {
      setLoadedChunks(newChunks);
      addElementsToWorldState(newElements);
    }
  }, [
    getChunkCoordinates, 
    config.renderDistance, 
    config.chunkSize, 
    config.worldWidth, 
    config.worldHeight, 
    getChunkKey,
    generateChunk,
    addElementsToWorldState
  ]);
  
  // Get elements visible in the current viewport
  const getVisibleElements = useCallback((
    cameraPosition: Position, 
    viewportWidth: number, 
    viewportHeight: number
  ) => {
    // Visible area with padding
    const visibleArea = {
      left: cameraPosition.x - 100,
      right: cameraPosition.x + viewportWidth + 100,
      top: cameraPosition.y - 100,
      bottom: cameraPosition.y + viewportHeight + 100
    };
    
    const isElementVisible = (element: WorldElement) => {
      // Simple visibility check - can be optimized with spatial partitioning
      return element.x < visibleArea.right &&
             element.x + (element.size || 0) > visibleArea.left &&
             element.y < visibleArea.bottom &&
             element.y + (element.size || 0) > visibleArea.top;
    };
    
    // Filter all loaded chunks for visible elements
    const visibleElements = {
      trees: [] as Tree[],
      bushes: [] as Bush[],
      flowers: [] as Flower[]
    };
    
    for (const chunk of loadedChunksRef.current.values()) {
      // Add visible elements from this chunk
      visibleElements.trees.push(...chunk.trees.filter(isElementVisible));
      // visibleElements.bushes.push(...chunk.bushes.filter(isElementVisible));
      // visibleElements.flowers.push(...chunk.flowers.filter(isElementVisible));
    }
    
    return visibleElements;
  }, []);
  
  // Set up game time tracking
  useEffect(() => {
    const gameTimeInterval = setInterval(() => {
      setGameTime(prevTime => {
        let newTime = prevTime + config.timeScale;
        if (newTime >= 24) newTime = 0;
        
        // Update time of day
        if (newTime >= 6 && newTime < 8) {
          setTimeOfDay('dawn');
        } else if (newTime >= 8 && newTime < 18) {
          setTimeOfDay('day');
        } else if (newTime >= 18 && newTime < 20) {
          setTimeOfDay('dusk');
        } else {
          setTimeOfDay('night');
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(gameTimeInterval);
  }, [config.timeScale]);
  
  // Initial world generation - only run once on mount
  useEffect(() => {
    // Load chunks around the initial player position
    loadChunks(playerPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateWithServerChunks = useCallback((serverChunks: WorldChunk[]) => {
    if (!serverChunks || serverChunks.length === 0) return;
    
    // Create new map to store updated chunks
    const newChunks = new Map(loadedChunksRef.current);
    const newElements = {
      trees: [] as Tree[],
      bushes: [] as Bush[],
      flowers: [] as Flower[]
    };
    
    // Process each chunk from server
    for (const chunk of serverChunks) {
      const chunkKey = getChunkKey(chunk.x, chunk.y);
      
      // If we already have this chunk, skip it
      if (newChunks.has(chunkKey)) continue;
      
      // Store the new chunk
      newChunks.set(chunkKey, chunk);
      
      // Collect elements for global tracking
      newElements.trees.push(...chunk.trees);
      newElements.bushes.push(...chunk.bushes);
      newElements.flowers.push(...chunk.flowers);
    }
    
    // Update state if we have new chunks
    if (newElements.trees.length > 0 || 
        newElements.bushes.length > 0 || 
        newElements.flowers.length > 0) {
      
      // Update chunks
      setLoadedChunks(newChunks);
      
      // Update global elements list
      setWorldElements(prev => ({
        trees: [...prev.trees, ...newElements.trees],
        bushes: [...prev.bushes, ...newElements.bushes],
        flowers: [...prev.flowers, ...newElements.flowers]
      }));
      
      // Also update the ref for internal usage
      worldElementsRef.current = {
        trees: [...worldElementsRef.current.trees, ...newElements.trees],
        bushes: [...worldElementsRef.current.bushes, ...newElements.bushes],
        flowers: [...worldElementsRef.current.flowers, ...newElements.flowers]
      };
      
      console.log(`Added ${newElements.trees.length} trees, ${newElements.bushes.length} bushes, ${newElements.flowers.length} flowers from server chunks`);
    }
  }, [getChunkKey]);
  
  return {
    timeOfDay,
    gameTime,
    worldElements,
    loadChunks,
    getVisibleElements,
    updateWithServerChunks
  };
};
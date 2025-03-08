import { useState, useCallback, useRef } from 'react';
import { Position, Direction, GameConfig, KeysPressed, Hitbox } from '../utils/game';


export const useGameEngine = (config: GameConfig) => {
  // Player state
  const [playerPosition, setPlayerPosition] = useState<Position>({ 
    x: config.worldWidth / 2, 
    y: config.worldHeight / 2 
  });
  const [direction, setDirection] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  
  // Keyboard state
  const [keysPressed, setKeysPressed] = useState<KeysPressed>({});
  
  // Animation timers and smoothing
  const animationTimer = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const targetPosition = useRef<Position>(playerPosition);
  const movementSmoothing = 0.15; // Lower value for smoother movement
  
  // Current state refs to avoid dependency cycles
  const playerPositionRef = useRef<Position>(playerPosition);
  playerPositionRef.current = playerPosition;
  
  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;
  
  const isMovingRef = useRef<boolean>(isMoving);
  isMovingRef.current = isMoving;
  
  const keysPressedRef = useRef<KeysPressed>(keysPressed);
  keysPressedRef.current = keysPressed;
  
  // For collision detection with world elements
  const [collisionObjects, setCollisionObjects] = useState<Hitbox[]>([]);
  const collisionObjectsRef = useRef<Hitbox[]>(collisionObjects);
  collisionObjectsRef.current = collisionObjects;
  
  // Check if a position would collide with any objects
  const checkCollision = useCallback((x: number, y: number): boolean => {
    // Create player hitbox (smaller than visible character for better gameplay)
    const playerHitbox: Hitbox = {
      left: x + 16,
      right: x + config.characterSize - 16,
      top: y + config.characterSize / 2,
      bottom: y + config.characterSize - 8
    };
    
    // Check collisions with stored objects
    for (const obj of collisionObjectsRef.current) {
      if (playerHitbox.right > obj.left && 
          playerHitbox.left < obj.right && 
          playerHitbox.bottom > obj.top && 
          playerHitbox.top < obj.bottom) {
        return true;
      }
    }
    
    // Check world boundaries
    if (playerHitbox.left < 0 || 
        playerHitbox.right > config.worldWidth || 
        playerHitbox.top < 0 || 
        playerHitbox.bottom > config.worldHeight) {
      return true;
    }
    
    return false;
  }, [config.characterSize, config.worldWidth, config.worldHeight]);
  
  // Handle key events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault();
      setKeysPressed(keys => {
        // Only update if the key isn't already pressed
        if (!keys[e.key]) {
          return { ...keys, [e.key]: true };
        }
        return keys;
      });
    }
  }, []);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeysPressed(keys => {
      // Only update if the key is currently pressed
      if (keys[e.key]) {
        const newKeys = { ...keys };
        newKeys[e.key] = false;
        return newKeys;
      }
      return keys;
    });
  }, []);
  
  // Update collision objects from environment
  const updateCollisions = useCallback((objects: Hitbox[]) => {
    setCollisionObjects(objects);
  }, []);
  
  // Movement logic - use refs to avoid dependency cycles
  const updatePlayerMovement = useCallback((time: number) => {
    // Calculate deltaTime (time since last frame in milliseconds)
    const deltaTime = lastFrameTime.current ? time - lastFrameTime.current : 16.67;
    lastFrameTime.current = time;
    
    // Constrain deltaTime to prevent huge jumps after tab switching/inactivity
    const clampedDeltaTime = Math.min(deltaTime, 100);
    
    // Get the current values from refs
    const keys = keysPressedRef.current;
    const currentDirection = directionRef.current;
    const targetPos = targetPosition.current;
    let newX = targetPos.x;
    let newY = targetPos.y;
    let newDirection = currentDirection;
    let moving = false;
    
    // Calculate movement speed based on deltaTime for frame-independent movement
    const frameSpeed = (config.movementSpeed * clampedDeltaTime) / 16.67; // Normalize to 60fps
    
    // Handle movement input
    if (keys['ArrowUp'] || keys['w']) {
      const testY = Math.max(0, newY - frameSpeed);
      if (!checkCollision(newX, testY)) newY = testY;
      newDirection = 'up';
      moving = true;
    }
    if (keys['ArrowDown'] || keys['s']) {
      const testY = Math.min(config.worldHeight - config.characterSize, newY + frameSpeed);
      if (!checkCollision(newX, testY)) newY = testY;
      newDirection = 'down';
      moving = true;
    }
    if (keys['ArrowLeft'] || keys['a']) {
      const testX = Math.max(0, newX - frameSpeed);
      if (!checkCollision(testX, newY)) newX = testX;
      newDirection = 'left';
      moving = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
      const testX = Math.min(config.worldWidth - config.characterSize, newX + frameSpeed);
      if (!checkCollision(testX, newY)) newX = testX;
      newDirection = 'right';
      moving = true;
    }
    
    // Update target position
    targetPosition.current = { x: newX, y: newY };
    
    // Update direction if it changed
    if (newDirection !== currentDirection) {
      setDirection(newDirection);
    }
    
    // Update movement state if it changed
    if (moving !== isMovingRef.current) {
      setIsMoving(moving);
    }
    
    // Smoothly interpolate towards the target position
    const currentPos = playerPositionRef.current;
    
    // Don't interpolate if we're already at the target (or very close)
    const distanceSquared = 
      Math.pow(currentPos.x - targetPos.x, 2) + 
      Math.pow(currentPos.y - targetPos.y, 2);
    
    // Only update position if we're not too close to the target
    if (distanceSquared > 0.1) {
      // Calculate interpolation factor based on deltaTime
      const factor = Math.min(1.0, movementSmoothing * (clampedDeltaTime / 16.67));
      
      // Calculate interpolated position with easing
      const interpolatedX = currentPos.x + (targetPos.x - currentPos.x) * factor;
      const interpolatedY = currentPos.y + (targetPos.y - currentPos.y) * factor;
      
      setPlayerPosition({
        x: interpolatedX,
        y: interpolatedY
      });
    }
    
    // Update animation frame for walking
    if (moving) {
      animationTimer.current += clampedDeltaTime;
      if (animationTimer.current > 120) { // Control animation speed
        setAnimationFrame(prev => (prev + 1) % 6);
        animationTimer.current = 0;
      }
    } else if (animationFrame !== 0) {
      // Only reset animation frame if we're currently not at frame 0
      setAnimationFrame(0);
    }
  }, [
    config.movementSpeed, 
    config.worldHeight, 
    config.worldWidth, 
    config.characterSize, 
    checkCollision,
    animationFrame
  ]);
  
  return {
    playerPosition,
    playerDirection: direction,
    isMoving,
    animationFrame,
    keysPressed,
    handleKeyDown,
    handleKeyUp,
    updatePlayerMovement,
    updateCollisions
  };
};
// file: src/components/game/ui/StatusBar.tsx
import React from 'react';
import { Direction, Position } from '../utils/game';

interface StatusBarProps {
  position: Position;
  direction: Direction;
  isMoving: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ position, direction, isMoving }) => {
  return (
    <div style={styles.statusBar}>
      <div style={styles.statusFlex}>
        <div>Position: X: {Math.round(position.x)}, Y: {Math.round(position.y)}</div>
        <div>Direction: {direction}</div>
        <div>{isMoving ? 'Moving' : 'Idle'}</div>
      </div>
    </div>
  );
};

const styles = {
  statusBar: {
    marginTop: '16px',
    backgroundColor: '#2c3e50',
    padding: '16px',
    borderRadius: '8px',
    color: '#ecf0f1',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '800px',
  },
  statusFlex: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
  },
};

export default StatusBar;

// file: src/components/game/ChatSystem.tsx
import React, { useState, useEffect, useRef } from 'react';
import multiplayerClient from '../services/MultiPlayerClient';


interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

const ChatSystem: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Handle incoming chat messages
  useEffect(() => {
    // System message for startup
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      playerId: 'system',
      username: 'System',
      message: 'Connected to chat. Press Enter to chat with other players.',
      timestamp: Date.now(),
      isSystem: true
    };
    
    setMessages([systemMessage]);
    
    const handleChatMessage = (playerId: string, username: string, message: string) => {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_${Math.random()}`,
        playerId,
        username,
        message,
        timestamp: Date.now()
      }]);
      
      // Update player names map
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.set(playerId, username);
        return newNames;
      });
    };
    
    // Handle player joins for the chat system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePlayerJoin = (player: any) => {
      // Add welcome message
      if (player.id !== multiplayerClient.getPlayerId()) {
        setMessages(prev => [...prev, {
          id: `join_${Date.now()}_${player.id}`,
          playerId: 'system',
          username: 'System',
          message: `${player.username} joined the game`,
          timestamp: Date.now(),
          isSystem: true
        }]);
      }
      
      // Track player name
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.set(player.id, player.username);
        return newNames;
      });
    };
    
    // Handle player leaves
    const handlePlayerLeave = (playerId: string) => {
      const playerName = playerNames.get(playerId) || 'Unknown player';
      
      setMessages(prev => [...prev, {
        id: `leave_${Date.now()}_${playerId}`,
        playerId: 'system',
        username: 'System',
        message: `${playerName} left the game`,
        timestamp: Date.now(),
        isSystem: true
      }]);
      
      // Remove from player names
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.delete(playerId);
        return newNames;
      });
    };
    
    // Register event handlers
    multiplayerClient.onChatMessage(handleChatMessage);
    multiplayerClient.onPlayerJoin(handlePlayerJoin);
    multiplayerClient.onPlayerLeave(handlePlayerLeave);
    
    // Auto-scroll chat when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Toggle chat with Enter key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      multiplayerClient.offChatMessage(handleChatMessage);
      multiplayerClient.offPlayerJoin(handlePlayerJoin);
      multiplayerClient.offPlayerLeave(handlePlayerLeave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, playerNames]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Send a chat message
  const sendMessage = () => {
    if (input.trim()) {
      multiplayerClient.sendChatMessage(input.trim());
      setInput('');
    }
  };
  
  // Handle input submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: isOpen ? '20px' : '70px',
        left: '20px',
        width: isOpen ? '400px' : '320px',
        maxHeight: isOpen ? '320px' : '200px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        padding: '10px',
        color: 'white',
        zIndex: 1500
      }}
    >
      {/* Message display area */}
      <div
        style={{
          maxHeight: isOpen ? '250px' : '120px',
          overflowY: 'auto',
          marginBottom: isOpen ? '10px' : '0',
          fontSize: '14px'
        }}
      >
        {messages.slice(-8).map(msg => (
          <div key={msg.id} style={{ marginBottom: '5px' }}>
            {msg.isSystem ? (
              <div style={{ color: '#a3e635', fontSize: '12px', fontStyle: 'italic' }}>
                {msg.message}
              </div>
            ) : (
              <>
                <span 
                  style={{ 
                    fontWeight: 'bold', 
                    color: msg.playerId === multiplayerClient.getPlayerId() ? '#66ff66' : '#ffff66' 
                  }}
                >
                  {msg.username}:
                </span> {msg.message}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input box - only visible when chat is open */}
      {isOpen && (
        <div style={{ display: 'flex' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoFocus
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid #555',
              borderRadius: '4px',
              color: 'white',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              marginLeft: '5px',
              padding: '8px',
              backgroundColor: '#4a65ff',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      )}
      
      {!isOpen && (
        <div style={{ fontSize: '12px', fontStyle: 'italic' }}>
          Press Enter to open chat
        </div>
      )}
    </div>
  );
};

export default ChatSystem;

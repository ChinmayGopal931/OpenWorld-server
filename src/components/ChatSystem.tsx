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
  const playerNamesRef = useRef<Map<string, string>>(new Map());
  const isOpenRef = useRef<boolean>(false);

  // Sync refs with state
  useEffect(() => {
    playerNamesRef.current = playerNames;
  }, [playerNames]);
  
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    console.log('[ChatSystem] Initializing chat system');
    
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
      console.log(`[ChatSystem] Received message from ${username}: "${message}"`);
      
      setMessages(prev => {
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random()}`,
          playerId,
          username,
          message,
          timestamp: Date.now()
        };
        return [...prev, newMessage];
      });
      
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.set(playerId, username);
        return newNames;
      });
    };
    
    const handlePlayerJoin = (player: any) => {
      console.log(`[ChatSystem] Player joined: ${player.username} (${player.id})`);
      
      if (player.id !== multiplayerClient.getPlayerId()) {
        setMessages(prev => {
          const joinMessage = {
            id: `join_${Date.now()}_${player.id}`,
            playerId: 'system',
            username: 'System',
            message: `${player.username} joined the game`,
            timestamp: Date.now(),
            isSystem: true
          };
          return [...prev, joinMessage];
        });
      }
      
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.set(player.id, player.username);
        return newNames;
      });
    };
    
    const handlePlayerLeave = (playerId: string) => {
      const playerName = playerNamesRef.current.get(playerId) || 'Unknown player';
      console.log(`[ChatSystem] Player left: ${playerName} (${playerId})`);
      
      setMessages(prev => {
        const leaveMessage = {
          id: `leave_${Date.now()}_${playerId}`,
          playerId: 'system',
          username: 'System',
          message: `${playerName} left the game`,
          timestamp: Date.now(),
          isSystem: true
        };
        return [...prev, leaveMessage];
      });
      
      setPlayerNames(prev => {
        const newNames = new Map(prev);
        newNames.delete(playerId);
        return newNames;
      });
    };
    
    multiplayerClient.onChatMessage(handleChatMessage);
    multiplayerClient.onPlayerJoin(handlePlayerJoin);
    multiplayerClient.onPlayerLeave(handlePlayerLeave);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isOpenRef.current) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpenRef.current) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('[ChatSystem] Cleaning up event handlers');
      multiplayerClient.offChatMessage(handleChatMessage);
      multiplayerClient.offPlayerJoin(handlePlayerJoin);
      multiplayerClient.offPlayerLeave(handlePlayerLeave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const sendMessage = () => {
    if (input.trim()) {
      multiplayerClient.sendChatMessage(input.trim());
      setInput('');
    }
  };

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
        zIndex: 9999
      }}
    >
      <div
        style={{
          maxHeight: isOpen ? '250px' : '120px',
          overflowY: 'auto',
          marginBottom: isOpen ? '10px' : '0',
          fontSize: '14px'
        }}
      >
        {messages.map(msg => ( // Removed slice to show all messages
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
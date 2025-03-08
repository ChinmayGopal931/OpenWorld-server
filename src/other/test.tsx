import { useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function MinimalSocketTest() {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [pongCount, setPongCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  
  const connect = () => {
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Create a new, simple connection
    socketRef.current = io('http://localhost:3002', {
      transports: ['websocket'],
      reconnection: true
    });
    
    socketRef.current.on('connect', () => {
      console.log('Minimal test connected:', socketRef.current?.id);
      setConnected(true);
      setSocketId(socketRef.current?.id || '');
    });
    
    socketRef.current.on('disconnect', (reason) => {
      console.log('Minimal test disconnected:', reason);
      setConnected(false);
    });
    
    socketRef.current.on('pong', (data) => {
      console.log('Received pong:', data);
      setPongCount(prev => prev + 1);
    });
  };
  
  const sendPing = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    } else {
      console.log('Cannot ping - not connected');
    }
  };
  
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  
  return (
    <div style={{
      margin: '20px',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '5px'
    }}>
      <h2>Minimal Socket.io Test</h2>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <div>Socket ID: {socketId || 'None'}</div>
      <div>Pong count: {pongCount}</div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={connect} disabled={connected}>Connect</button>
        <button onClick={sendPing} disabled={!connected} style={{ marginLeft: '10px' }}>Send Ping</button>
        <button onClick={disconnect} disabled={!connected} style={{ marginLeft: '10px' }}>Disconnect</button>
      </div>
    </div>
  );
}

export function SimpleSocketTest() {
  const [log, setLog] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const connect = () => {
    addLog("Starting connection test...");
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Create a minimal socket
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: false
    });
    
    socketRef.current.on('connect', () => {
      addLog(`Connected with ID: ${socketRef.current?.id}`);
    });
    
    socketRef.current.on('disconnect', (reason) => {
      addLog(`Disconnected: ${reason}`);
    });
    
    socketRef.current.on('connect_error', (error) => {
      addLog(`Connection error: ${error.message}`);
    });
  };
  
  const testJoin = () => {
    if (!socketRef.current?.connected) {
      addLog("Not connected. Connect first.");
      return;
    }
    
    addLog("Sending minimal join...");
    socketRef.current.emit('join', { username: 'test-user' });
  };
  
  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      addLog("Socket disconnected and cleared");
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px', 
      right: '20px',
      width: '300px',
      padding: '10px',
      background: '#333',
      color: 'white',
      zIndex: 9999,
      borderRadius: '5px'
    }}>
      <h3>Simple Socket Test</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={connect}>Connect</button>
        <button onClick={testJoin}>Test Join</button>
        <button onClick={cleanup}>Cleanup</button>
      </div>
      <div 
        style={{ 
          height: '200px', 
          overflowY: 'auto', 
          background: '#222', 
          padding: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
      >
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
    </div>
  );
}

// Add this component at the end of your Game component
export const ConnectionTest = () => {
  const [testStatus, setTestStatus] = useState('Not tested');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testData, setTestData] = useState<any>(null);
  
  const runHttpTest = async () => {
    setTestStatus('Testing HTTP...');
    try {
      const response = await fetch('http://localhost:3001/test-connection');
      const data = await response.json();
      setTestStatus('HTTP test success');
      setTestData(data);
    } catch (error) {
      setTestStatus(`HTTP test failed: ${error}`);
    }
  };
  
  const runSocketTest = () => {
    setTestStatus('Testing socket...');
    const testSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: false
    });
    
    testSocket.on('connect', () => {
      setTestStatus(`Socket connected: ${testSocket.id}`);
      testSocket.emit('simpleJoin', { username: 'tester' });
    });
    
    testSocket.on('simpleJoinResponse', (data) => {
      setTestStatus(`Join response received: ${data.message}`);
      setTestData(data);
    });
    
    testSocket.on('simpleState', (data) => {
      setTestStatus(`Simple state received with ${Object.keys(data.players).length} players and ${data.trees.length} trees`);
      setTestData(data);
    });
    
    testSocket.on('disconnect', (reason) => {
      setTestStatus(`Socket disconnected: ${reason}`);
    });
    
    testSocket.on('connect_error', (error) => {
      setTestStatus(`Socket connect error: ${error.message}`);
    });
    
    // Clean up after 10 seconds
    setTimeout(() => {
      if (testSocket.connected) {
        testSocket.disconnect();
      }
    }, 10000);
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '10px',
      backgroundColor: '#374151',
      color: 'white',
      borderRadius: '4px',
      zIndex: 1000
    }}>
      <div>Status: {testStatus}</div>
      {testData && (
        <div style={{ maxHeight: '150px', overflow: 'auto', marginTop: '10px' }}>
          <pre>{JSON.stringify(testData, null, 2)}</pre>
        </div>
      )}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={runHttpTest} style={{ padding: '5px 10px' }}>Test HTTP</button>
        <button onClick={runSocketTest} style={{ padding: '5px 10px' }}>Test Socket</button>
      </div>
    </div>
  );
};


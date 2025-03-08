// file: src/components/game/ui/LoginScreen.tsx
import  { useEffect, useState } from 'react';


interface LoginScreenProps {
  onLogin: (username: string, serverUrl: string) => void;
  isConnecting?: boolean;
  serverUrl?: string;
  errorMessage?: string;
  defaultUsername?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  isConnecting = false, 
  serverUrl = 'http://localhost:3001',
  errorMessage = '',
  defaultUsername = ''
}) => {
  const [username, setUsername] = useState<string>(defaultUsername);
  const [serverAddress, setServerAddress] = useState<string>(serverUrl);
  const [validationError, setValidationError] = useState<string>('');
  const [showServerOptions, setShowServerOptions] = useState<boolean>(false);
  
  // Reset validation error when external error message changes
  useEffect(() => {
    if (errorMessage) {
      setValidationError('');
    }
  }, [errorMessage]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setValidationError('Please enter a username');
      return;
    }
    
    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 16) {
      setValidationError('Username must be at most 16 characters');
      return;
    }
    
    // Server address validation - simple regex for URL format
    if (showServerOptions && !serverAddress.match(/^https?:\/\/.+/)) {
      setValidationError('Please enter a valid server URL (http:// or https://)');
      return;
    }
    
    // Clear any previous errors
    setValidationError('');
    
    // Call the login function
    onLogin(username, serverAddress);
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Forest Explorer</h1>
        <h2 style={styles.subtitle}>Multiplayer Adventure</h2>
        
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>
                Choose Your Username:
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="Enter username"
                disabled={isConnecting}
                autoFocus
              />
            </div>
            
            {showServerOptions && (
              <div style={styles.inputGroup}>
                <label htmlFor="serverAddress" style={styles.label}>
                  Server Address:
                </label>
                <input
                  id="serverAddress"
                  type="text"
                  value={serverAddress}
                  onChange={(e) => setServerAddress(e.target.value)}
                  style={styles.input}
                  placeholder="http://localhost:3001"
                  disabled={isConnecting}
                />
              </div>
            )}
            
            <div style={styles.serverToggle}>
              <button
                type="button"
                onClick={() => setShowServerOptions(!showServerOptions)}
                style={styles.toggleButton}
                disabled={isConnecting}
              >
                {showServerOptions ? 'Hide Server Options' : 'Show Server Options'}
              </button>
            </div>
            
            {(validationError || errorMessage) && (
              <div style={styles.error}>
                {validationError || errorMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              style={styles.button}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Enter Game'}
            </button>
          </form>
        </div>
        
        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>Game Controls:</h3>
          <ul style={styles.instructionsList}>
            <li>WASD or Arrow Keys to move</li>
            <li>Press Enter to open chat</li>
            <li>ESC to close chat</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100vh',
    backgroundColor: '#1a1c29',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
  },
  loginBox: {
    backgroundColor: '#2c3e50',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    width: '500px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginBottom: '12px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(50,150,255,0.4)',
  },
  subtitle: {
    fontSize: '16px',
    color: '#bdc3c7',
    marginBottom: '32px',
  },
  formContainer: {
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: '#ecf0f1',
    fontSize: '14px',
    marginBottom: '8px',
    textAlign: 'left' as const,
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#34495e',
    border: '2px solid #7f8c8d',
    borderRadius: '6px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  serverToggle: {
    marginBottom: '16px',
    width: '100%',
    textAlign: 'left' as const,
  },
  toggleButton: {
    backgroundColor: 'transparent',
    color: '#3498db',
    border: 'none',
    padding: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    marginBottom: '16px',
    width: '100%',
    textAlign: 'left' as const,
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
  },
  instructions: {
    backgroundColor: '#34495e',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'left' as const,
  },
  instructionsTitle: {
    fontSize: '14px',
    color: '#f0f6fc',
    marginBottom: '12px',
  },
  instructionsList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    color: '#bdc3c7',
    fontSize: '12px',
  },
};

export default LoginScreen;
import React, { useState } from 'react';
import SpotifyNowPlaying from './components/SpotifyNowPlaying';

// Test component to verify error boundary functionality
function ErrorBoundaryTest() {
  const [shouldError, setShouldError] = useState(false);
  const [errorType, setErrorType] = useState('render');

  // Component that throws errors for testing
  function ErrorTrigger({ type }) {
    if (type === 'render') {
      throw new Error('Test render error');
    }
    if (type === 'api') {
      // Simulate API error by passing invalid URL
      return <SpotifyNowPlaying apiUrl="https://invalid-url-that-will-fail.com/api" />;
    }
    return <div>No error</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h2>Error Boundary Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShouldError(!shouldError)}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: shouldError ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {shouldError ? 'Stop Error' : 'Trigger Render Error'}
        </button>
        
        <button 
          onClick={() => setErrorType(errorType === 'api' ? 'render' : 'api')}
          style={{ 
            padding: '10px 20px',
            background: '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Switch to {errorType === 'api' ? 'Render' : 'API'} Error
        </button>
      </div>

      <div style={{ border: '2px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>Test Area:</h3>
        {shouldError ? (
          <ErrorTrigger type={errorType} />
        ) : (
          <SpotifyNowPlaying 
            apiUrl="https://corner16-now-playing-6suud6888-sauce-projects-7fcf076e.vercel.app/api/spotify/now-playing"
            showAnimatedIcon={true}
            fontSize={16}
          />
        )}
      </div>
    </div>
  );
}

export default ErrorBoundaryTest;
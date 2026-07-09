import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const posSystem = searchParams.get('pos_system');

  return (
    <div className="error-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Integration Failed</h1>
        
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {posSystem && (
          <div style={{ marginBottom: '20px' }}>
            <strong>POS System:</strong> {posSystem}
          </div>
        )}
        
        <div style={{ marginTop: '30px' }}>
          <Link 
            to="/vendor-integration" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              margin: '0 10px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              backgroundColor: '#007bff',
              color: 'white'
            }}
          >
            Try Again
          </Link>
          <Link 
            to="/" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              margin: '0 10px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              backgroundColor: '#6c757d',
              color: 'white'
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

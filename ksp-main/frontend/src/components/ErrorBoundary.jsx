import React from 'react';
import Login from './Login';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("KSP DRISHTI Error Boundary Caught Error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('ksp_auth');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.hash = '#login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
              KSP DRISHTI — Session Reset Required
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Navigation or history state was reset. Click below to return to the Police Multi-Division Login Portal.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
              }}
            >
              Return to Login Portal ➔
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

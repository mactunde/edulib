import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('EduLib Error Boundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'var(--bg)', padding:'2rem', textAlign:'center',
      }}>
        <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>⚠️</div>
        <h2 style={{ fontFamily:'Playfair Display,serif', marginBottom:'.75rem' }}>
          Something went wrong
        </h2>
        <p style={{ color:'var(--muted)', maxWidth:420, lineHeight:1.6, marginBottom:'2rem' }}>
          An unexpected error occurred. Please refresh the page.
          If this keeps happening, contact your administrator.
        </p>
        <details style={{
          background:'white', border:'1px solid var(--border)',
          borderRadius:8, padding:'1rem', maxWidth:540,
          textAlign:'left', marginBottom:'2rem',
          fontSize:'.8rem', color:'var(--muted)',
        }}>
          <summary style={{ cursor:'pointer', fontWeight:600 }}>Technical details</summary>
          <pre style={{ marginTop:'.5rem', overflow:'auto', whiteSpace:'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
        </details>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}>
          🔄 Reload Page
        </button>
      </div>
    );
  }
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const home = user
    ? (user.role === 'admin' ? '/admin' : '/library')
    : '/';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem', lineHeight: 1 }}>📭</div>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 'clamp(2rem,6vw,3.5rem)',
        marginBottom: '.75rem',
      }}>
        Page Not Found
      </h1>
      <p style={{
        color: 'rgba(255,255,255,.6)',
        fontSize: '1.05rem',
        maxWidth: 380,
        lineHeight: 1.6,
        marginBottom: '2.5rem',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => nav(home)}
        className="btn btn-accent"
        style={{ padding: '.85rem 2.2rem', fontSize: '1rem' }}
      >
        ← Back to {user ? (user.role === 'admin' ? 'Dashboard' : 'Library') : 'Home'}
      </button>
    </div>
  );
}

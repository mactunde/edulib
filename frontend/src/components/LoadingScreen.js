import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: 'white', gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>📚</div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(255,255,255,.6)' }}>Loading EduLib…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) return setError('Please enter your username and password.');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.firstName || user.username}!`);
      nav(user.role === 'admin' ? '/admin' : '/library');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ background:'linear-gradient(135deg,#f0ebe3,#faf7f2)' }}>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">Edu<span>Lib</span></Link>
        <Link to="/signup" className="btn btn-outline btn-sm">Create Account</Link>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div className="card" style={{ width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,.1)', borderRadius:20, padding:'2.5rem' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>📚</div>
            <h2 style={{ fontSize:'1.8rem' }}>Welcome Back</h2>
            <p style={{ color:'var(--muted)', fontSize:'.9rem', marginTop:'.25rem' }}>Log in to access your library</p>
          </div>

          {error && <div className="error-msg" style={{ marginBottom:'1rem' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="field">
              <label>Username</label>
              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Your username" autoFocus autoComplete="username" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Your password" autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop:'.5rem' }}
              disabled={loading}>
              {loading ? 'Signing in…' : 'Log In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'.9rem', color:'var(--muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color:'var(--accent-p)', fontWeight:600 }}>Sign up free</Link>
          </p>

          <div style={{ marginTop:'1.25rem', padding:'.75rem', background:'var(--bg)',
            borderRadius:8, fontSize:'.8rem', color:'var(--muted)' }}>
            🔑 <strong>Admin:</strong> use credentials set in your <code>.env</code> file
          </div>
        </div>
      </div>
    </div>
  );
}

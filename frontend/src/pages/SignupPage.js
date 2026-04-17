import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

function getAgeCategory(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age >= 5  && age <= 11) return { label: 'Primary (Ages 5–11)',    emoji: '🌱', key: 'primary' };
  if (age >= 12 && age <= 16) return { label: 'Secondary (Ages 12–16)', emoji: '🚀', key: 'secondary' };
  if (age >= 17)              return { label: 'Tertiary (Ages 17+)',     emoji: '🎓', key: 'tertiary' };
  return { label: 'Too young (min age 5)', emoji: '⚠️', key: null };
}

const CATEGORY_COLORS = { primary: 'var(--accent-p)', secondary: 'var(--accent-s)', tertiary: 'var(--accent-t)' };

export default function SignupPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '',
    className: '', school: '', username: '', password: '', confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const preview = form.dob ? getAgeCategory(form.dob) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { firstName, lastName, dob, className, school, username, password, confirm } = form;
    if (!firstName || !lastName || !dob || !className || !school || !username || !password)
      return setError('Please fill in all fields.');
    if (password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (password !== confirm)
      return setError('Passwords do not match.');
    const cat = getAgeCategory(dob);
    if (!cat?.key)
      return setError('Learner must be at least 5 years old to register.');

    setLoading(true);
    try {
      const user = await register({ firstName, lastName, dob, className, school, username, password });
      toast.success(`Welcome to EduLib, ${user.firstName}! 🎉`);
      nav('/library');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ background:'linear-gradient(135deg,#f0ebe3,#faf7f2)' }}>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">Edu<span>Lib</span></Link>
        <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div className="card" style={{ width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,.1)', borderRadius:20, padding:'2.5rem' }}>
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontSize:'1.8rem' }}>Create Your Account</h2>
            <p style={{ color:'var(--muted)', fontSize:'.9rem', marginTop:'.25rem' }}>
              Join EduLib — your personalised digital library
            </p>
          </div>

          {error && <div className="error-msg" style={{ marginBottom:'1rem' }}>⚠️ {error}</div>}

          {/* Live category preview */}
          {preview && (
            <div style={{
              display:'flex', alignItems:'center', gap:'.75rem',
              padding:'.75rem 1rem', borderRadius:10, marginBottom:'1.25rem',
              background: preview.key ? `${CATEGORY_COLORS[preview.key]}15` : '#fff8f0',
              border: `1.5px solid ${preview.key ? `${CATEGORY_COLORS[preview.key]}40` : '#f4a26140'}`,
            }}>
              <span style={{ fontSize:'1.5rem' }}>{preview.emoji}</span>
              <div>
                <p style={{ fontSize:'.78rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:.5, color:'var(--muted)' }}>Your Library Category</p>
                <p style={{ fontWeight:600, color: preview.key ? CATEGORY_COLORS[preview.key] : 'var(--danger)' }}>
                  {preview.label}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              <div className="field">
                <label>First Name</label>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Ama" />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Asante" />
              </div>
              <div className="field">
                <label>Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
                  max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field">
                <label>Class / Form / Year</label>
                <input value={form.className} onChange={e => set('className', e.target.value)}
                  placeholder="e.g. Class 4 / Form 2" />
              </div>
              <div className="field" style={{ gridColumn:'span 2' }}>
                <label>School Name</label>
                <input value={form.school} onChange={e => set('school', e.target.value)}
                  placeholder="e.g. Accra Academy" />
              </div>
              <div className="field" style={{ gridColumn:'span 2' }}>
                <label>Choose a Username</label>
                <input value={form.username} onChange={e => set('username', e.target.value)}
                  placeholder="e.g. ama_reads_2024" autoComplete="username" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters" autoComplete="new-password" />
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="Repeat password" autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create My Account →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'.9rem', color:'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--accent-p)', fontWeight:600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

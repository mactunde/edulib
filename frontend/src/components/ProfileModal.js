import React, { useState } from 'react';
import { userAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProfileModal({ onClose }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('profile'); // profile | password

  // Profile form
  const [school,    setSchool]    = useState(user.school    || '');
  const [className, setClassName] = useState(user.className || '');
  const [saving,    setSaving]    = useState(false);

  // Password form
  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' });
  const [pwSaving,  setPwSaving]  = useState(false);

  const CAT_COLOR = { primary:'var(--accent-p)', secondary:'var(--accent-s)', tertiary:'var(--accent-t)' };
  const CAT_EMOJI = { primary:'🌱', secondary:'🚀', tertiary:'🎓' };
  const catColor  = CAT_COLOR[user.category] || 'var(--accent-p)';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!school || !className) return toast.error('School and class cannot be empty.');
    setSaving(true);
    try {
      await userAPI.updateProfile({ school, className });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current)               return toast.error('Enter your current password.');
    if (pwForm.next.length < 6)        return toast.error('New password must be at least 6 characters.');
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match.');
    setPwSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('Password changed! Please log in again.');
      setTimeout(logout, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h3 style={{ fontFamily:'Playfair Display,serif' }}>My Profile</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* User summary */}
        <div style={{
          display:'flex', alignItems:'center', gap:'1rem',
          padding:'1rem', borderRadius:12, marginBottom:'1.5rem',
          background: `${catColor}12`,
          border: `1.5px solid ${catColor}30`,
        }}>
          <div style={{
            width:52, height:52, borderRadius:'50%',
            background: catColor, display:'flex',
            alignItems:'center', justifyContent:'center',
            fontSize:'1.5rem', flexShrink:0,
          }}>
            {CAT_EMOJI[user.category] || '📚'}
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:'1.05rem' }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>@{user.username}</p>
          </div>
          <span className={`badge badge-${user.category}`} style={{ marginLeft:'auto' }}>
            {user.category}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem' }}>
          {[['profile','👤 Profile'],['password','🔒 Password']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex:1, padding:'.6rem', border:'1.5px solid var(--border)',
              borderRadius:8, fontWeight:600, fontSize:'.85rem', cursor:'pointer',
              background: tab===id ? 'var(--primary)' : 'white',
              color: tab===id ? 'white' : 'var(--text)',
              transition:'all .2s',
            }}>{label}</button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="field">
                <label>First Name</label>
                <input value={user.firstName} disabled
                  style={{ opacity:.6, cursor:'not-allowed' }} />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input value={user.lastName} disabled
                  style={{ opacity:.6, cursor:'not-allowed' }} />
              </div>
            </div>
            <div className="field">
              <label>Username</label>
              <input value={`@${user.username}`} disabled
                style={{ opacity:.6, cursor:'not-allowed' }} />
            </div>
            <div className="field">
              <label>School Name</label>
              <input value={school} onChange={e => setSchool(e.target.value)}
                placeholder="Your school" />
            </div>
            <div className="field">
              <label>Class / Form</label>
              <input value={className} onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Form 3 / Year 10" />
            </div>
            <div className="field">
              <label>Library Category</label>
              <input value={`${CAT_EMOJI[user.category]} ${user.category?.charAt(0).toUpperCase() + user.category?.slice(1)} — auto-assigned from your date of birth`}
                disabled style={{ opacity:.6, cursor:'not-allowed' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <form onSubmit={handleChangePassword} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="field">
              <label>Current Password</label>
              <input type="password" value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                placeholder="Your current password" autoComplete="current-password" />
            </div>
            <div className="field">
              <label>New Password</label>
              <input type="password" value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                placeholder="Min. 6 characters" autoComplete="new-password" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            <div style={{ background:'#fff8f0', border:'1px solid #fde8c8',
              borderRadius:8, padding:'.65rem .9rem', fontSize:'.82rem', color:'#c07030' }}>
              ⚠️ You will be logged out after changing your password.
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

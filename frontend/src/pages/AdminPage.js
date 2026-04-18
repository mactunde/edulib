import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { adminAPI } from '../lib/api';
import toast from 'react-hot-toast';

/* ── Helpers ────────────────────────────────────────────── */
const CAT_COLOR = { primary:'var(--accent-p)', secondary:'var(--accent-s)', tertiary:'var(--accent-t)' };
const ACTION_LABELS = { login:'Logged in', signup:'Signed up', book_open:'Read', book_upload:'Uploaded' };
const EMOJIS = ['📗','📘','📙','📕','📚','📖','🔬','🧪','🧬','📐','📊','🌍','✍️','💻','🏛️','⚗️','💹','📈','🎨','🔭'];

function StatCard({ icon, num, label, color }) {
  return (
    <div className="card" style={{ textAlign:'center', padding:'1.5rem' }}>
      <div style={{ fontSize:'2rem', marginBottom:'.4rem' }}>{icon}</div>
      <div style={{ fontSize:'2.2rem', fontWeight:900, fontFamily:'Playfair Display,serif',
        color: color || 'var(--text)' }}>{num ?? '—'}</div>
      <div style={{ fontSize:'.78rem', color:'var(--muted)', textTransform:'uppercase',
        letterSpacing:.5, marginTop:'.2rem' }}>{label}</div>
    </div>
  );
}

/* ── Overview ───────────────────────────────────────────── */
function Overview() {
  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(() => toast.error('Could not load stats.'));
    adminAPI.activity().then(r => setActivity(r.data.activity.slice(0, 10))).catch(() => {});
  }, []);

  return (
    <>
      <h2>Dashboard Overview</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', margin:'1.5rem 0' }}>
        <StatCard icon="📚" num={stats?.totalBooks}     label="Total Books" />
        <StatCard icon="👥" num={stats?.totalUsers}     label="Learners" />
        <StatCard icon="🌱" num={stats?.primaryBooks}   label="Primary Books"   color="var(--accent-p)" />
        <StatCard icon="🚀" num={stats?.secondaryBooks} label="Secondary Books" color="var(--accent-s)" />
        <StatCard icon="🎓" num={stats?.tertiaryBooks}  label="Tertiary Books"  color="var(--accent-t)" />
        <StatCard icon="📋" num={stats?.totalActivity}  label="Activity Logs" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom:'1.25rem', paddingBottom:'.75rem', borderBottom:'1px solid var(--border)' }}>
          🕐 Recent Activity
        </h3>
        {activity.length === 0
          ? <p style={{ color:'var(--muted)' }}>No activity yet.</p>
          : activity.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'.75rem',
              padding:'.65rem 0', borderBottom:'1px solid var(--border)', fontSize:'.875rem' }}>
              <div style={{ width:9, height:9, borderRadius:'50%', flexShrink:0,
                background: CAT_COLOR[a.users?.category] || '#aaa' }} />
              <strong>{a.users ? `${a.users.first_name} ${a.users.last_name}` : 'Admin'}</strong>
              <span style={{ color:'var(--muted)' }}>{ACTION_LABELS[a.action] || a.action}</span>
              {a.books?.title && <><span style={{ color:'var(--muted)' }}>→</span><em>{a.books.title}</em></>}
              <span style={{ marginLeft:'auto', color:'var(--muted)', fontSize:'.78rem', whiteSpace:'nowrap' }}>
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))
        }
      </div>
    </>
  );
}

/* ── Manage Books ───────────────────────────────────────── */
function ManageBooks() {
  const [books,      setBooks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(() => {
    adminAPI.listBooks()
      .then(r => setBooks(r.data.books))
      .catch(() => toast.error('Could not load books.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}"? This also deletes the file.`)) return;
    try {
      await adminAPI.deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
      toast.success('Book removed.');
    } catch { toast.error('Could not delete book.'); }
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({ title: book.title, author: book.author, subject: book.subject, category: book.category, description: book.description || '', emoji: book.emoji || '📗' });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id) => {
    setEditSaving(true);
    try {
      const res = await adminAPI.editBook(id, editForm);
      setBooks(prev => prev.map(b => b.id === id ? { ...b, ...res.data.book } : b));
      toast.success('Book updated.');
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update book.');
    } finally { setEditSaving(false); }
  };

  const downloadCSV = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q);
  });

  const EMOJIS = ['📗','📘','📙','📕','📚','📖','🔬','🧪','🧬','📐','📊','🌍','✍️','💻','🏛️','⚗️','💹','📈','🎨','🔭'];

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <h2>Manage Books ({books.length})</h2>
        <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
          <input
            style={{ padding:'.6rem .9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:'.88rem', outline:'none', width:220 }}
            placeholder="🔍 Search books…" value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor='var(--accent-p)'}
            onBlur={e  => e.target.style.borderColor='var(--border)'}
          />
        </div>
      </div>

      <div className="card" style={{ overflowX:'auto' }}>
        {loading
          ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>Loading…</p>
          : filtered.length === 0
          ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>{books.length === 0 ? 'No books yet. Upload one!' : 'No books match your search.'}</p>
          : <table className="data-table">
              <thead>
                <tr><th>Cover</th><th>Title / Author</th><th>Subject</th><th>Category</th><th>Added</th><th style={{ minWidth:140 }}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => editingId === b.id ? (
                  // ── Inline edit row ──
                  <tr key={b.id} style={{ background:'#fffbf5' }}>
                    <td>
                      <select value={editForm.emoji} onChange={e => setEditForm(p=>({...p,emoji:e.target.value}))}
                        style={{ fontSize:'1.3rem', border:'1px solid var(--border)', borderRadius:6, padding:'.2rem', background:'white' }}>
                        {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={editForm.title} onChange={e => setEditForm(p=>({...p,title:e.target.value}))}
                        style={{ width:'100%', padding:'.4rem .6rem', border:'1.5px solid var(--accent-p)', borderRadius:6, marginBottom:'.3rem', fontFamily:'DM Sans,sans-serif', fontSize:'.9rem' }} />
                      <input value={editForm.author} onChange={e => setEditForm(p=>({...p,author:e.target.value}))}
                        style={{ width:'100%', padding:'.4rem .6rem', border:'1.5px solid var(--border)', borderRadius:6, fontFamily:'DM Sans,sans-serif', fontSize:'.85rem' }} />
                    </td>
                    <td>
                      <input value={editForm.subject} onChange={e => setEditForm(p=>({...p,subject:e.target.value}))}
                        style={{ width:'100%', padding:'.4rem .6rem', border:'1.5px solid var(--border)', borderRadius:6, fontFamily:'DM Sans,sans-serif', fontSize:'.88rem' }} />
                    </td>
                    <td>
                      <select value={editForm.category} onChange={e => setEditForm(p=>({...p,category:e.target.value}))}
                        style={{ padding:'.4rem .6rem', border:'1.5px solid var(--border)', borderRadius:6, fontFamily:'DM Sans,sans-serif', fontSize:'.85rem' }}>
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                        <option value="tertiary">Tertiary</option>
                      </select>
                    </td>
                    <td style={{ whiteSpace:'nowrap' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                        <button className="btn btn-accent btn-sm" onClick={() => saveEdit(b.id)} disabled={editSaving}>{editSaving ? '…' : '✓ Save'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>✕</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // ── Normal row ──
                  <tr key={b.id}>
                    <td style={{ fontSize:'1.5rem', width:48 }}>{b.emoji}</td>
                    <td>
                      <strong style={{ display:'block' }}>{b.title}</strong>
                      <span style={{ color:'var(--muted)', fontSize:'.82rem' }}>{b.author}</span>
                    </td>
                    <td>{b.subject}</td>
                    <td><span className={`badge badge-${b.category}`}>{b.category}</span></td>
                    <td style={{ whiteSpace:'nowrap', fontSize:'.82rem', color:'var(--muted)' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(b)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id, b.title)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </>
  );
}

/* ── Upload Book ────────────────────────────────────────── */
function UploadBook() {
  const [form, setForm] = useState({ title:'', author:'', subject:'', category:'primary', description:'', emoji:'📗' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.subject) return toast.error('Title, author and subject are required.');
    if (!file) return toast.error('Please select a PDF or EPUB file.');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);

      // Use axios directly so we can track upload progress
      const api = require('../lib/api').default;
      await api.post('/api/admin/books', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minute timeout for large files
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });

      toast.success(`"${form.title}" uploaded successfully! 🎉`);
      setForm({ title:'', author:'', subject:'', category:'primary', description:'', emoji:'📗' });
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <h2>Upload New Book</h2>
      <div className="card" style={{ marginTop:'1.5rem', maxWidth:640 }}>
        {/* Drop zone */}
        <div style={{
          border:`2px dashed ${file ? 'var(--accent-s)' : 'var(--border)'}`,
          borderRadius:12, padding:'2rem', textAlign:'center',
          marginBottom:'1.5rem', background: file ? '#f0fdf8' : 'var(--bg)',
          transition:'all .2s', cursor:'pointer',
        }}
          onClick={() => document.getElementById('file-input').click()}>
          <input id="file-input" type="file" accept=".pdf,.epub"
            style={{ display:'none' }}
            onChange={e => setFile(e.target.files[0] || null)} />
          <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>{file ? '✅' : '📤'}</div>
          {file
            ? <><p style={{ fontWeight:700, color:'var(--accent-s)' }}>{file.name}</p>
                <p style={{ fontSize:'.8rem', color:'var(--muted)', marginTop:'.25rem' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p></>
            : <><p style={{ fontWeight:600 }}>Click to select a PDF or EPUB file</p>
                <p style={{ fontSize:'.82rem', color:'var(--muted)', marginTop:'.25rem' }}>
                  Max 50 MB · PDF and EPUB supported</p></>
          }
        </div>

        <form onSubmit={handleUpload} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="field"><label>Book Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Introduction to Physics" /></div>
          <div className="field"><label>Author *</label>
            <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="e.g. Dr. K. Mensah" /></div>
          <div className="field"><label>Subject *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Physics" /></div>
          <div className="field"><label>Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="primary">🌱 Primary (Ages 5–11)</option>
              <option value="secondary">🚀 Secondary (Ages 12–16)</option>
              <option value="tertiary">🎓 Tertiary (Ages 17+)</option>
            </select>
          </div>
          <div className="field"><label>Cover Emoji</label>
            <select value={form.emoji} onChange={e => set('emoji', e.target.value)}>
              {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn:'span 2' }}><label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Short description of this book (optional)" rows={3} /></div>

          <div style={{ gridColumn:'span 2' }}>
            <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
              {uploading ? `⏳ Uploading… ${progress}%` : '⬆️ Upload Book to Library'}
            </button>
            {uploading && (
              <div style={{ marginTop:'.75rem' }}>
                <div style={{ background:'var(--border)', borderRadius:8, height:8, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:8,
                    background:'linear-gradient(90deg,var(--accent-s),var(--accent-p))',
                    width:`${progress}%`,
                    transition:'width .3s ease',
                  }} />
                </div>
                <p style={{ textAlign:'center', fontSize:'.8rem', color:'var(--muted)', marginTop:'.4rem' }}>
                  {progress < 100 ? `Uploading file… ${progress}%` : '✅ File sent — saving to library…'}
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

/* ── Users ──────────────────────────────────────────────── */
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.listUsers()
      .then(r => setUsers(r.data.users))
      .catch(() => toast.error('Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User removed.');
    } catch { toast.error('Could not remove user.'); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q) || u.school_name?.toLowerCase().includes(q);
  });

  const downloadCSV = async () => {
    try {
      const res = await adminAPI.exportUsers();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'edulib-users.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Users exported.');
    } catch { toast.error('Could not export users.'); }
  };

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <h2>Learner Accounts ({users.length})</h2>
        <button className="btn btn-ghost btn-sm" onClick={downloadCSV}>⬇️ Export CSV</button>
      </div>
      <input
        style={{ width:'100%', maxWidth:360, padding:'.7rem 1rem', margin:'1.25rem 0',
          border:'1.5px solid var(--border)', borderRadius:10, fontSize:'.95rem',
          outline:'none', fontFamily:'DM Sans, sans-serif' }}
        placeholder="🔍  Search by name, username or school…"
        value={search} onChange={e => setSearch(e.target.value)}
        onFocus={e => e.target.style.borderColor='var(--accent-p)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}
      />
      <div className="card" style={{ overflowX:'auto' }}>
        {loading ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>Loading…</p> :
        filtered.length === 0 ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>No users found.</p> :
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Username</th><th>School</th><th>Class</th><th>Category</th><th>Joined</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td style={{ color:'var(--muted)' }}>@{u.username}</td>
                <td>{u.school_name}</td>
                <td>{u.class_name}</td>
                <td><span className={`badge badge-${u.category}`}>{u.category}</span></td>
                <td style={{ whiteSpace:'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        }
      </div>
    </>
  );
}

/* ── Activity Log ───────────────────────────────────────── */
function ActivityLog() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.activity()
      .then(r => setActivity(r.data.activity))
      .catch(() => toast.error('Could not load activity.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <h2>Activity Log ({activity.length})</h2>
        <button className="btn btn-ghost btn-sm" onClick={async () => {
          try {
            const res = await adminAPI.exportActivity();
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a'); a.href = url; a.download = 'edulib-activity.csv'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Activity exported.');
          } catch { toast.error('Could not export activity.'); }
        }}>⬇️ Export CSV</button>
      </div>
      <div className="card">
        {loading ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>Loading…</p> :
        activity.length === 0 ? <p style={{ color:'var(--muted)', padding:'2rem', textAlign:'center' }}>No activity yet.</p> :
          <div>
            {activity.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'.75rem',
                padding:'.7rem 0', borderBottom:'1px solid var(--border)', fontSize:'.875rem' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0,
                  background: CAT_COLOR[a.users?.category] || '#ccc' }} />
                <strong style={{ minWidth:140 }}>
                  {a.users ? `${a.users.first_name} ${a.users.last_name}` : 'Admin'}
                </strong>
                <span style={{ color:'var(--muted)' }}>
                  {ACTION_LABELS[a.action] || a.action}
                </span>
                {a.books?.title && <><span style={{ color:'var(--border)' }}>→</span><em>{a.books.title}</em></>}
                {a.users && <span className={`badge badge-${a.users.category} hide-sm`} style={{ fontSize:'.65rem' }}>{a.users.category}</span>}
                <span style={{ marginLeft:'auto', color:'var(--muted)', fontSize:'.78rem', whiteSpace:'nowrap' }}>
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        }
      </div>
    </>
  );
}

/* ── Settings ────────────────────────────────────────────── */
function Settings() {
  const [pwForm,   setPwForm]   = useState({ current:'', next:'', confirm:'' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState(null);

  const handlePw = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next.length < 8) return setPwMsg({ type:'err', text:'New password must be at least 8 characters.' });
    if (pwForm.next !== pwForm.confirm) return setPwMsg({ type:'err', text:'Passwords do not match.' });
    setPwSaving(true);
    try {
      const res = await api.post('/api/admin/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg({ type:'ok', text: res.data.message });
      setPwForm({ current:'', next:'', confirm:'' });
    } catch (err) {
      setPwMsg({ type:'err', text: err.response?.data?.error || 'Could not update password.' });
    } finally { setPwSaving(false); }
  };

  return (
    <>
      <h2>Settings</h2>
      <div className="card" style={{ maxWidth:480, marginTop:'1.5rem' }}>
        <h3 style={{ marginBottom:'1.25rem', paddingBottom:'.75rem', borderBottom:'1px solid var(--border)' }}>🔒 Admin Password</h3>
        <p style={{ color:'var(--muted)', fontSize:'.88rem', marginBottom:'1.25rem', lineHeight:1.6 }}>
          After verifying your current password, update <code>ADMIN_PASSWORD</code> in your Render environment variables and redeploy to make the change permanent.
        </p>
        {pwMsg && (
          <div className={pwMsg.type==='ok' ? 'success-msg' : 'error-msg'} style={{ marginBottom:'1rem' }}>
            {pwMsg.type==='ok' ? '✅' : '⚠️'} {pwMsg.text}
          </div>
        )}
        <form onSubmit={handlePw} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="field"><label>Current Password</label>
            <input type="password" value={pwForm.current} onChange={e => setPwForm(p=>({...p,current:e.target.value}))} placeholder="Current admin password" autoComplete="current-password" /></div>
          <div className="field"><label>New Password (min 8 chars)</label>
            <input type="password" value={pwForm.next} onChange={e => setPwForm(p=>({...p,next:e.target.value}))} placeholder="New password" autoComplete="new-password" /></div>
          <div className="field"><label>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password" autoComplete="new-password" /></div>
          <button type="submit" className="btn btn-primary" disabled={pwSaving}>{pwSaving ? 'Verifying…' : 'Verify & Update'}</button>
        </form>
      </div>
    </>
  );
}

/* ── Admin Shell ────────────────────────────────────────── */
const NAV_ITEMS = [
  { to:'',          icon:'📊', label:'Overview'      },
  { to:'books',     icon:'📚', label:'Manage Books'  },
  { to:'upload',    icon:'⬆️',  label:'Upload Book'  },
  { to:'users',     icon:'👥', label:'Users'         },
  { to:'activity',  icon:'📋', label:'Activity Log'  },
  { to:'settings',  icon:'⚙️',  label:'Settings'     },
];

export default function AdminPage() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page">
      <nav className="navbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button style={{ display:'none', background:'none', border:'none', color:'white',
            fontSize:'1.3rem', cursor:'pointer' }}
            className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}>☰</button>
          <div className="navbar-brand">
            Edu<span>Lib</span>
            <span style={{ fontSize:'.75rem', fontFamily:'DM Sans,sans-serif',
              fontWeight:400, color:'rgba(255,255,255,.5)', marginLeft:'.5rem' }}>Admin</span>
          </div>
        </div>
        <div className="navbar-right">
          <span className="badge badge-admin">⚙️ Admin</span>
          <button className="btn btn-danger btn-sm" onClick={logout}>Log Out</button>
        </div>
      </nav>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <aside style={{
          width:230, background:'var(--primary)', color:'white',
          padding:'1.25rem .75rem', display:'flex', flexDirection:'column', gap:'.25rem',
          minHeight:'calc(100vh - 64px)',
          flexShrink:0,
        }}>
          <div style={{ fontSize:'.7rem', textTransform:'uppercase', letterSpacing:1,
            color:'rgba(255,255,255,.4)', padding:'.5rem .75rem', marginBottom:'.25rem' }}>
            Navigation
          </div>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={`/admin${item.to ? '/' + item.to : ''}`} end={item.to === ''}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'.75rem',
                padding:'.75rem', borderRadius:8, fontSize:'.9rem',
                background: isActive ? 'var(--accent-p)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,.7)',
                textDecoration:'none', transition:'all .2s',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.color='white'; }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.7)'; }}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex:1, padding:'2rem', overflowY:'auto', maxHeight:'calc(100vh - 64px)' }}>
          <Routes>
            <Route index           element={<Overview />} />
            <Route path="books"    element={<ManageBooks />} />
            <Route path="upload"   element={<UploadBook />} />
            <Route path="users"    element={<Users />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBooks } from '../hooks/useBooks';
import { activityAPI } from '../lib/api';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import ProfileModal from '../components/ProfileModal';
import toast from 'react-hot-toast';

const CAT_META = {
  primary:   { emoji:'🌱', label:'Primary Library',   ages:'Ages 5–11',  bannerBg:'linear-gradient(135deg,#f4a261,#e76f51)' },
  secondary: { emoji:'🚀', label:'Secondary Library', ages:'Ages 12–16', bannerBg:'linear-gradient(135deg,#2a9d8f,#264653)' },
  tertiary:  { emoji:'🎓', label:'Tertiary Library',  ages:'Ages 17+',   bannerBg:'linear-gradient(135deg,#6a4c93,#3d1a78)' },
};

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'.4rem', marginTop:'2rem', flexWrap:'wrap' }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        style={{ padding:'.5rem .9rem', borderRadius:8, border:'1.5px solid var(--border)', background:'white', cursor:'pointer', fontWeight:700, opacity: page===1 ? .4 : 1 }}>‹</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          style={{ padding:'.5rem .9rem', borderRadius:8, border:'1.5px solid var(--border)', fontWeight:600, cursor:'pointer', background: p===page ? 'var(--primary)' : 'white', color: p===page ? 'white' : 'var(--text)', transition:'all .2s' }}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        style={{ padding:'.5rem .9rem', borderRadius:8, border:'1.5px solid var(--border)', background:'white', cursor:'pointer', fontWeight:700, opacity: page===totalPages ? .4 : 1 }}>›</button>
    </div>
  );
}

export default function LibraryPage() {
  const { user, logout } = useAuth();
  const cat = CAT_META[user.category] || CAT_META.primary;

  const { books, subjects, loading, error, total, page, setPage, totalPages, search, setSearch, subject, setSubject } = useBooks();

  const [activity,    setActivity]    = useState([]);
  const [actLoading,  setActLoading]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [tab,         setTab]         = useState('books');

  useEffect(() => {
    if (tab !== 'history' || activity.length > 0) return;
    setActLoading(true);
    activityAPI.mine()
      .then(r => setActivity(r.data.activity))
      .catch(() => toast.error('Could not load reading history.'))
      .finally(() => setActLoading(false));
  }, [tab]);

  return (
    <div className="page">
      <nav className="navbar">
        <div className="navbar-brand">Edu<span>Lib</span></div>
        <div className="navbar-right">
          <span className="badge badge-ghost hide-sm">👤 {user.firstName} {user.lastName}</span>
          <span className={`badge badge-${user.category}`}>{cat.emoji} {user.category.charAt(0).toUpperCase() + user.category.slice(1)}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setShowProfile(true)}>⚙️ <span className="hide-sm">Profile</span></button>
          <button className="btn btn-danger btn-sm" onClick={logout}>Log Out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'2rem', width:'100%' }}>

        {/* Banner */}
        <div style={{ borderRadius:16, padding:'1.5rem 2rem', marginBottom:'2rem', background:cat.bannerBg, color:'white', display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'3rem' }}>{cat.emoji}</span>
          <div style={{ flex:1, minWidth:180 }}>
            <h2 style={{ fontSize:'1.5rem', marginBottom:'.2rem' }}>{cat.label}</h2>
            <p style={{ opacity:.85, fontSize:'.9rem' }}>
              Welcome, <strong>{user.firstName}</strong>
              {user.school && ` · ${user.school}`}
              {user.className && ` · ${user.className}`}
              {` · ${cat.ages}`}
            </p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:'2rem', fontWeight:900, fontFamily:'Playfair Display,serif' }}>{total}</div>
            <div style={{ fontSize:'.78rem', opacity:.8, textTransform:'uppercase', letterSpacing:.5 }}>Books Available</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem' }}>
          {[['books','📚 Books'],['history','📋 My Reading History']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:'.6rem 1.25rem', borderRadius:8, border:'1.5px solid var(--border)', background:tab===id ? 'var(--primary)' : 'white', color:tab===id ? 'white' : 'var(--text)', fontWeight:600, fontSize:'.88rem', cursor:'pointer', transition:'all .2s' }}>{label}</button>
          ))}
        </div>

        {/* Books tab */}
        {tab === 'books' && <>
          <div style={{ display:'flex', gap:'.75rem', marginBottom:'1.75rem', flexWrap:'wrap' }}>
            <input
              style={{ flex:1, minWidth:200, padding:'.7rem 1rem', border:'1.5px solid var(--border)', borderRadius:10, fontSize:'.95rem', outline:'none', fontFamily:'DM Sans,sans-serif', transition:'border-color .2s' }}
              placeholder="🔍  Search by title, author or subject…"
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--accent-p)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ padding:'.7rem 1rem', border:'1.5px solid var(--border)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:'.9rem', outline:'none', background:'white', cursor:'pointer' }}>
              {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
            </select>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:'4rem', color:'var(--muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem', animation:'spin 1s linear infinite' }}>📚</div>
              <p>Loading your library…</p>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {!loading && error && (
            <div style={{ textAlign:'center', padding:'4rem', color:'var(--danger)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
              <p>{error}</p>
              <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
          {!loading && !error && books.length === 0 && (
            <div style={{ textAlign:'center', padding:'4rem', color:'var(--muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
              <p>{total === 0 ? 'No books uploaded yet. Check back soon!' : 'No books match your search.'}</p>
            </div>
          )}
          {!loading && !error && books.length > 0 && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'1.25rem' }}>
                {books.map(b => <BookCard key={b.id} book={b} onOpen={setSelected} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </>}

        {/* History tab */}
        {tab === 'history' && (
          <div className="card">
            <h3 style={{ marginBottom:'1.25rem', paddingBottom:'.75rem', borderBottom:'1px solid var(--border)' }}>📋 My Reading History</h3>
            {actLoading && <p style={{ color:'var(--muted)', textAlign:'center', padding:'2rem' }}>Loading…</p>}
            {!actLoading && activity.length === 0 && <p style={{ color:'var(--muted)', textAlign:'center', padding:'2rem' }}>No activity yet — open a book to start your history!</p>}
            {!actLoading && activity.length > 0 && (
              <div>
                {activity.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'.75rem 0', borderBottom:'1px solid var(--border)', fontSize:'.88rem' }}>
                    <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{a.books?.emoji || '📖'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <strong>{a.action==='book_open'?'Read':a.action==='login'?'Logged in':a.action==='password_change'?'Changed password':a.action}</strong>
                      {a.books?.title && <span style={{ color:'var(--muted)' }}> · {a.books.title}</span>}
                    </div>
                    <span style={{ color:'var(--muted)', fontSize:'.78rem', whiteSpace:'nowrap', flexShrink:0 }}>{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selected    && <BookModal    book={selected} onClose={() => setSelected(null)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}

import React from 'react';

const CAT_COLOR = { primary: 'var(--accent-p)', secondary: 'var(--accent-s)', tertiary: 'var(--accent-t)' };

export default function BookCard({ book, onOpen }) {
  const color = CAT_COLOR[book.category] || 'var(--accent-p)';
  return (
    <div onClick={() => onOpen(book)} style={{
      background:'white', borderRadius:14, overflow:'hidden',
      border:'1.5px solid var(--border)', cursor:'pointer',
      display:'flex', flexDirection:'column',
      transition:'transform .22s, box-shadow .22s, border-color .22s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 14px 36px rgba(0,0,0,.13)'; e.currentTarget.style.borderColor='transparent'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor='var(--border)'; }}>

      {/* Cover */}
      <div style={{
        height:150, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'4rem', background: book.cover_color || '#f5f5f5',
        position:'relative',
      }}>
        {book.emoji || '📗'}
        <div style={{
          position:'absolute', top:8, right:8,
          background:'rgba(255,255,255,.9)', borderRadius:6,
          padding:'.15rem .45rem', fontSize:'.7rem', fontWeight:700,
          color, textTransform:'uppercase', letterSpacing:.5,
        }}>{book.subject}</div>
      </div>

      {/* Info */}
      <div style={{ padding:'1rem', flex:1, display:'flex', flexDirection:'column', gap:'.3rem' }}>
        <h4 style={{ fontSize:'.95rem', lineHeight:1.3, fontFamily:'Playfair Display, serif' }}>{book.title}</h4>
        <p style={{ fontSize:'.8rem', color:'var(--muted)' }}>{book.author}</p>
        <button onClick={e => { e.stopPropagation(); onOpen(book); }}
          style={{
            marginTop:'auto', paddingTop:'.6rem', paddingBottom:'.6rem',
            border:'none', borderRadius:8, background:color, color:'white',
            fontSize:'.82rem', fontWeight:700,
            transition:'opacity .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          📖 Open Book
        </button>
      </div>
    </div>
  );
}

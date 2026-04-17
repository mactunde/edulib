import React, { useState } from 'react';
import { booksAPI } from '../lib/api';
import PDFViewer from './PDFViewer';
import toast from 'react-hot-toast';

const CAT_COLOR = { primary:'var(--accent-p)', secondary:'var(--accent-s)', tertiary:'var(--accent-t)' };
const CAT_LABEL = { primary:'Primary (Ages 5–11)', secondary:'Secondary (Ages 12–16)', tertiary:'Tertiary (Ages 17+)' };

export default function BookModal({ book, onClose }) {
  const [state, setState] = useState('detail'); // detail | loading | reading
  const [pdfUrl, setPdfUrl] = useState('');
  const color = CAT_COLOR[book.category] || 'var(--accent-p)';

  const handleRead = async () => {
    setState('loading');
    try {
      const res = await booksAPI.openBook(book.id);
      setPdfUrl(res.data.signedUrl);
      setState('reading');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not open book. Please try again.');
      setState('detail');
    }
  };

  if (state === 'reading') {
    return (
      <PDFViewer
        url={pdfUrl}
        title={book.title}
        onClose={() => { setState('detail'); setPdfUrl(''); onClose(); }}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.25rem',
            lineHeight:1.3, maxWidth:'88%' }}>{book.title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{
          height:180, borderRadius:12,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'6rem', background: book.cover_color || '#f5f5f5',
          marginBottom:'1.5rem', position:'relative',
        }}>
          {book.emoji || '📗'}
          <span style={{
            position:'absolute', bottom:10, right:10,
            background:'rgba(255,255,255,.9)', borderRadius:6,
            padding:'.2rem .6rem', fontSize:'.75rem', fontWeight:700,
            color, textTransform:'uppercase', letterSpacing:.5,
          }}>{book.subject}</span>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'1.25rem', fontSize:'.9rem' }}>
          <tbody>
            {[
              ['Author',      book.author],
              ['Category',    CAT_LABEL[book.category] || book.category],
              ['Description', book.description || 'No description provided.'],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'.5rem .4rem', fontWeight:700,
                  color:'var(--muted)', width:'28%', verticalAlign:'top' }}>{k}</td>
                <td style={{ padding:'.5rem .4rem', lineHeight:1.55 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={handleRead} disabled={state === 'loading'}
          style={{
            width:'100%', padding:'1rem', border:'none', borderRadius:10,
            background:color, color:'white', fontSize:'1rem', fontWeight:700,
            cursor: state === 'loading' ? 'wait' : 'pointer',
            opacity: state === 'loading' ? .75 : 1,
            fontFamily:'DM Sans,sans-serif', transition:'all .2s',
          }}>
          {state === 'loading' ? '⏳ Loading book…' : '📖 Read Now'}
        </button>

        <p style={{ textAlign:'center', fontSize:'.78rem', color:'var(--muted)', marginTop:'.65rem' }}>
          Opens in full-screen reader · Reading is logged to your history
        </p>
      </div>
    </div>
  );
}

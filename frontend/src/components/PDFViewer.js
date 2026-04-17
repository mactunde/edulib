import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * PDFViewer — renders a PDF in-browser using Mozilla PDF.js (CDN).
 *
 * Props:
 *   url      : string  — signed URL of the PDF
 *   title    : string  — book title shown in toolbar
 *   onClose  : fn      — called when user closes viewer
 */
export default function PDFViewer({ url, title, onClose }) {
  const canvasRef  = useRef(null);
  const pdfRef     = useRef(null);
  const renderRef  = useRef(null); // tracks in-progress render task

  const [pageNum,    setPageNum]    = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale,      setScale]      = useState(1.3);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Load PDF.js from CDN once ──────────────────────────────
  useEffect(() => {
    if (window.pdfjsLib) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }, []);

  // ── Load PDF document ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const tryLoad = () => {
      if (!window.pdfjsLib) { setTimeout(tryLoad, 200); return; }
      window.pdfjsLib.getDocument({ url }).promise
        .then(pdf => {
          if (cancelled) return;
          pdfRef.current = pdf;
          setTotalPages(pdf.numPages);
          setPageNum(1);
        })
        .catch(() => { if (!cancelled) setError('Could not load PDF. The link may have expired.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    tryLoad();
    return () => { cancelled = true; };
  }, [url]);

  // ── Render current page ────────────────────────────────────
  const renderPage = useCallback(async (num) => {
    if (!pdfRef.current || !canvasRef.current) return;

    // Cancel any in-progress render
    if (renderRef.current) {
      try { await renderRef.current.cancel(); } catch {}
    }

    try {
      const page     = await pdfRef.current.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext('2d');

      canvas.width  = viewport.width;
      canvas.height = viewport.height;

      renderRef.current = page.render({ canvasContext: ctx, viewport });
      await renderRef.current.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        setError('Render error: ' + err.message);
      }
    }
  }, [scale]);

  useEffect(() => {
    if (!loading && totalPages > 0) renderPage(pageNum);
  }, [pageNum, scale, loading, totalPages, renderPage]);

  // ── Keyboard navigation ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  setPageNum(p => Math.min(p + 1, totalPages));
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    setPageNum(p => Math.max(p - 1, 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalPages, onClose]);

  const canPrev = pageNum > 1;
  const canNext = pageNum < totalPages;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,10,20,.95)',
      zIndex: 500,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn .2s ease',
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '.75rem',
        padding: '.75rem 1.25rem',
        background: '#1a1a2e',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        flexWrap: 'wrap',
        color: 'white',
        flexShrink: 0,
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: 'white',
          width: 36, height: 36, borderRadius: 8, fontSize: '1rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>✕</button>

        {/* Title */}
        <span style={{
          flex: 1, fontFamily: 'Playfair Display, serif',
          fontWeight: 700, fontSize: '1rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>📖 {title}</span>

        {/* Page nav */}
        {totalPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
            <button onClick={() => setPageNum(p => Math.max(p - 1, 1))}
              disabled={!canPrev}
              style={{ ...navBtnStyle, opacity: canPrev ? 1 : .35 }}>‹</button>
            <span style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.8)', minWidth: 80, textAlign: 'center' }}>
              {pageNum} / {totalPages}
            </span>
            <button onClick={() => setPageNum(p => Math.min(p + 1, totalPages))}
              disabled={!canNext}
              style={{ ...navBtnStyle, opacity: canNext ? 1 : .35 }}>›</button>
          </div>
        )}

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.6))} style={navBtnStyle}>−</button>
          <span style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.7)', minWidth: 42, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3.0))} style={navBtnStyle}>+</button>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '2rem 1rem', gap: '1rem',
      }}>
        {loading && (
          <div style={{ color: 'rgba(255,255,255,.6)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '1rem', marginTop: '6rem' }}>
            <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>📄</div>
            <p>Loading PDF…</p>
          </div>
        )}

        {error && (
          <div style={{ color: '#e63946', background: 'rgba(230,57,70,.1)',
            border: '1px solid rgba(230,57,70,.3)', borderRadius: 10,
            padding: '1rem 1.5rem', marginTop: '4rem', textAlign: 'center' }}>
            ⚠️ {error}
            <br />
            <button onClick={onClose} style={{ ...navBtnStyle, marginTop: '.75rem', padding: '.5rem 1rem' }}>
              Close
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{
              boxShadow: '0 8px 40px rgba(0,0,0,.6)',
              borderRadius: 4, overflow: 'hidden', lineHeight: 0,
            }}>
              <canvas ref={canvasRef} />
            </div>

            {/* Page turn buttons (large, below canvas) */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem' }}>
              <button
                onClick={() => setPageNum(p => Math.max(p - 1, 1))}
                disabled={!canPrev}
                style={{ ...pageNavBtn, opacity: canPrev ? 1 : .3 }}>
                ← Previous Page
              </button>
              <button
                onClick={() => setPageNum(p => Math.min(p + 1, totalPages))}
                disabled={!canNext}
                style={{ ...pageNavBtn, opacity: canNext ? 1 : .3 }}>
                Next Page →
              </button>
            </div>

            <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.75rem', marginTop: '.25rem' }}>
              Use arrow keys or buttons to navigate • Esc to close
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

const navBtnStyle = {
  background: 'rgba(255,255,255,.12)',
  border: 'none',
  color: 'white',
  width: 32, height: 32,
  borderRadius: 6,
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background .15s',
};

const pageNavBtn = {
  background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.2)',
  color: 'white',
  padding: '.6rem 1.5rem',
  borderRadius: 8,
  fontSize: '.9rem',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: 600,
  transition: 'background .15s',
};

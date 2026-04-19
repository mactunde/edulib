import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * PDFViewer — crisp, scrollable PDF reader using PDF.js (CDN).
 * - Renders at device pixel ratio for sharp text on all screens
 * - Scrolls freely up/down AND left/right
 * - Fits to container width by default (click FIT to reset)
 * - Keyboard: ← → page turn, + − zoom, 0 fit, Esc close
 */
export default function PDFViewer({ url, title, onClose }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const pdfRef       = useRef(null);
  const renderRef    = useRef(null);

  const [pageNum,    setPageNum]    = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale,      setScale]      = useState(null); // null = auto fit-to-width
  const [fitScale,   setFitScale]   = useState(1.5);
  const [loading,    setLoading]    = useState(true);
  const [rendering,  setRendering]  = useState(false);
  const [error,      setError]      = useState('');

  // ── Load PDF.js from CDN ───────────────────────────────────
  useEffect(() => {
    const setup = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    if (window.pdfjsLib) { setup(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = setup;
    document.head.appendChild(s);
  }, []);

  // ── Load PDF ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPageNum(1);

    const tryLoad = () => {
      if (!window.pdfjsLib) { setTimeout(tryLoad, 200); return; }
      window.pdfjsLib.getDocument({ url }).promise
        .then(pdf => {
          if (cancelled) return;
          pdfRef.current = pdf;
          setTotalPages(pdf.numPages);
        })
        .catch(() => { if (!cancelled) setError('Could not load PDF. The link may have expired.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    tryLoad();
    return () => { cancelled = true; };
  }, [url]);

  // ── Calculate fit-to-width scale ──────────────────────────
  const calcFit = useCallback(async (num) => {
    if (!pdfRef.current || !containerRef.current) return;
    try {
      const page = await pdfRef.current.getPage(num);
      const cw   = containerRef.current.clientWidth - 48;
      const nw   = page.getViewport({ scale: 1 }).width;
      setFitScale(cw / nw);
    } catch {}
  }, []);

  // ── Render page at device pixel ratio (crisp text) ────────
  const renderPage = useCallback(async (num) => {
    if (!pdfRef.current || !canvasRef.current) return;
    if (renderRef.current) { try { await renderRef.current.cancel(); } catch {} }

    setRendering(true);
    try {
      const page     = await pdfRef.current.getPage(num);
      const dpr      = window.devicePixelRatio || 1;
      const active   = scale ?? fitScale;
      const viewport = page.getViewport({ scale: active });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext('2d');

      // Set canvas resolution to device pixels for crisp rendering
      canvas.width        = Math.floor(viewport.width  * dpr);
      canvas.height       = Math.floor(viewport.height * dpr);
      canvas.style.width  = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      renderRef.current = page.render({ canvasContext: ctx, viewport });
      await renderRef.current.promise;

      // Scroll to top-left on page change
      containerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException')
        setError('Could not render page.');
    } finally {
      setRendering(false);
    }
  }, [scale, fitScale]);

  useEffect(() => {
    if (!loading && totalPages > 0) {
      calcFit(pageNum).then(() => renderPage(pageNum));
    }
  }, [pageNum, scale, loading, totalPages, calcFit, renderPage]);

  // Recalculate on window resize
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!loading && totalPages > 0 && scale === null)
          calcFit(pageNum).then(() => renderPage(pageNum));
      }, 300);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [loading, totalPages, pageNum, scale, calcFit, renderPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPageNum(p => Math.min(p+1, totalPages));
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   setPageNum(p => Math.max(p-1, 1));
      if (e.key === 'Escape') onClose();
      if (e.key === '=' || e.key === '+') setScale(s => Math.min((s ?? fitScale) + 0.2, 4.0));
      if (e.key === '-')                  setScale(s => Math.max((s ?? fitScale) - 0.2, 0.4));
      if (e.key === '0')                  setScale(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [totalPages, fitScale, onClose]);

  const canPrev = pageNum > 1;
  const canNext = pageNum < totalPages;
  const displayPct = Math.round((scale ?? fitScale) * 100);

  return (
    <div style={{ position:'fixed', inset:0, background:'#1a1a2e',
      zIndex:500, display:'flex', flexDirection:'column', animation:'fadeIn .2s ease' }}>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'.6rem',
        padding:'.65rem 1rem', background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,.07)',
        flexShrink:0, flexWrap:'wrap' }}>

        <button onClick={onClose} title="Close (Esc)" style={TB}>✕</button>

        <span style={{ flex:1, color:'white', fontWeight:600, fontSize:'.95rem',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>
          📖 {title}
        </span>

        {totalPages > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flexShrink:0 }}>
            <button onClick={() => setPageNum(p => Math.max(p-1,1))}
              disabled={!canPrev} title="Previous (←)"
              style={{ ...TB, opacity: canPrev ? 1 : .3 }}>‹</button>
            <span style={{ color:'rgba(255,255,255,.75)', fontSize:'.85rem',
              minWidth:72, textAlign:'center', userSelect:'none' }}>
              {pageNum} / {totalPages}
            </span>
            <button onClick={() => setPageNum(p => Math.min(p+1,totalPages))}
              disabled={!canNext} title="Next (→)"
              style={{ ...TB, opacity: canNext ? 1 : .3 }}>›</button>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:'.3rem', flexShrink:0 }}>
          <button onClick={() => setScale(s => Math.max((s ?? fitScale) - 0.2, 0.4))}
            title="Zoom out (-)" style={TB}>−</button>
          <button onClick={() => setScale(null)} title="Reset to fit width (0)"
            style={{ ...TB, width:'auto', padding:'0 .6rem', fontSize:'.72rem', fontWeight:700,
              background: scale === null ? 'rgba(244,162,97,.3)' : 'rgba(255,255,255,.1)',
              color: scale === null ? '#f4a261' : 'white' }}>
            {scale === null ? 'FIT' : `${displayPct}%`}
          </button>
          <button onClick={() => setScale(s => Math.min((s ?? fitScale) + 0.2, 4.0))}
            title="Zoom in (+)" style={TB}>+</button>
        </div>

        {rendering && (
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:'.72rem' }}>rendering…</span>
        )}
      </div>

      {/* ── Scrollable reading area ── */}
      <div ref={containerRef} style={{
        flex:1,
        overflow:'auto',          /* scroll UP/DOWN and LEFT/RIGHT freely */
        background:'#252836',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        padding:'2rem 1.5rem',
        gap:'1.25rem',
      }}>
        {loading && (
          <div style={{ color:'rgba(255,255,255,.6)', display:'flex',
            flexDirection:'column', alignItems:'center', gap:'1rem', marginTop:'8rem' }}>
            <div style={{ fontSize:'3rem', animation:'spin 1s linear infinite' }}>📄</div>
            <p>Loading PDF…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ color:'#e63946', background:'rgba(230,57,70,.1)',
            border:'1px solid rgba(230,57,70,.3)', borderRadius:10,
            padding:'1.5rem 2rem', marginTop:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>⚠️</div>
            <p>{error}</p>
            <button onClick={onClose} style={{ ...TB, marginTop:'1rem',
              width:'auto', padding:'.5rem 1.25rem' }}>Close</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* White page — canvas sits inside so background is crisp white */}
            <div style={{
              background:'white',
              boxShadow:'0 4px 40px rgba(0,0,0,.6)',
              borderRadius:2,
              lineHeight:0,
              display:'inline-block',
            }}>
              <canvas ref={canvasRef} style={{ display:'block' }} />
            </div>

            {/* Page buttons */}
            <div style={{ display:'flex', gap:'.75rem', flexShrink:0 }}>
              <button onClick={() => setPageNum(p => Math.max(p-1,1))}
                disabled={!canPrev}
                style={{ ...PB, opacity: canPrev ? 1 : .3 }}>← Previous Page</button>
              <button onClick={() => setPageNum(p => Math.min(p+1,totalPages))}
                disabled={!canNext}
                style={{ ...PB, opacity: canNext ? 1 : .3 }}>Next Page →</button>
            </div>

            <p style={{ color:'rgba(255,255,255,.22)', fontSize:'.72rem',
              textAlign:'center', userSelect:'none', paddingBottom:'.5rem' }}>
              Scroll up/down/left/right to read &nbsp;·&nbsp;
              ← → keys to turn pages &nbsp;·&nbsp;
              + − to zoom &nbsp;·&nbsp;
              FIT to reset &nbsp;·&nbsp;
              Esc to close
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin   { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0}             to{opacity:1} }
        /* Dark scrollbars for the reading area */
        div::-webkit-scrollbar       { width:8px; height:8px; }
        div::-webkit-scrollbar-track { background:#1a1a2e; }
        div::-webkit-scrollbar-thumb { background:rgba(255,255,255,.18); border-radius:4px; }
        div::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.32); }
      `}</style>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────
const TB = {
  background:'rgba(255,255,255,.1)', border:'none', color:'white',
  width:32, height:32, borderRadius:6, fontSize:'1rem', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  flexShrink:0, transition:'background .15s',
};

const PB = {
  background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)',
  color:'white', padding:'.6rem 1.5rem', borderRadius:8, fontSize:'.9rem',
  cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:600,
  transition:'background .2s', flexShrink:0,
};

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const nav = useNavigate();
  return (
    <div className="page">
      <nav className="navbar">
        <div className="navbar-brand">Edu<span>Lib</span></div>
        <div className="navbar-right">
          <button className="btn btn-outline btn-sm" onClick={() => nav('/signup')}>Sign Up</button>
          <button className="btn btn-accent btn-sm" onClick={() => nav('/login')}>Log In</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '5rem 2rem 3rem',
        background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)',
        color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(244,162,97,.12) 0%,transparent 70%)',
          top:-200, right:-150, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(106,76,147,.18) 0%,transparent 70%)',
          bottom:-100, left:-100, pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:640 }}>
          <div style={{ display:'inline-block', background:'rgba(244,162,97,.15)',
            border:'1px solid rgba(244,162,97,.3)', borderRadius:20,
            padding:'.35rem 1rem', fontSize:'.8rem', fontWeight:600,
            letterSpacing:.5, marginBottom:'1.5rem', color:'#f4a261' }}>
            📚 Smart Age-Matched Learning
          </div>
          <h1 style={{ fontSize:'clamp(2.4rem,6vw,4.2rem)', lineHeight:1.1, marginBottom:'1.25rem' }}>
            The Digital Library<br />Built for <span style={{ color:'#f4a261' }}>Every Learner</span>
          </h1>
          <p style={{ fontSize:'1.1rem', color:'rgba(255,255,255,.7)',
            lineHeight:1.7, marginBottom:'2.5rem' }}>
            Sign up once. We read your date of birth and automatically take you
            to the right shelf — Primary, Secondary, or Tertiary.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-accent" style={{ padding:'.9rem 2.2rem', fontSize:'1rem' }}
              onClick={() => nav('/signup')}>Get Started Free →</button>
            <button className="btn btn-outline" style={{ padding:'.9rem 2.2rem', fontSize:'1rem' }}
              onClick={() => nav('/login')}>I Have an Account</button>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section style={{ background:'white', padding:'4rem 2rem' }}>
        <h2 style={{ textAlign:'center', fontSize:'2rem', marginBottom:'.5rem' }}>Three Libraries in One</h2>
        <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:'3rem' }}>
          Automatically matched to your age — no manual selection needed.
        </p>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap',
          justifyContent:'center', maxWidth:900, margin:'0 auto' }}>
          {[
            { emoji:'🌱', title:'Primary', ages:'Ages 5 – 11', desc:'Illustrated, curriculum-aligned books that make early learning joyful.', color:'var(--accent-p)', bg:'#fff8f2' },
            { emoji:'🚀', title:'Secondary', ages:'Ages 12 – 16', desc:'Core subject textbooks and enrichment titles for growing minds.', color:'var(--accent-s)', bg:'#f0fdf8' },
            { emoji:'🎓', title:'Tertiary', ages:'Ages 17 & above', desc:'Advanced academic resources for college and university learners.', color:'var(--accent-t)', bg:'#f8f2ff' },
          ].map(c => (
            <div key={c.title} style={{
              flex:'1 1 220px', maxWidth:280,
              background:c.bg, borderRadius:16,
              border:`2px solid ${c.color}33`,
              padding:'2rem 1.5rem', textAlign:'center',
              transition:'transform .25s, box-shadow .25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ fontSize:'3rem', marginBottom:'.75rem' }}>{c.emoji}</div>
              <h3 style={{ color:c.color, fontSize:'1.3rem', marginBottom:'.3rem' }}>{c.title}</h3>
              <p style={{ fontWeight:700, fontSize:'.85rem', marginBottom:'.6rem' }}>{c.ages}</p>
              <p style={{ color:'var(--muted)', fontSize:'.88rem', lineHeight:1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background:'var(--bg)', padding:'4rem 2rem', textAlign:'center' }}>
        <h2 style={{ fontSize:'2rem', marginBottom:'3rem' }}>How It Works</h2>
        <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap',
          justifyContent:'center', maxWidth:800, margin:'0 auto' }}>
          {[
            { step:'1', icon:'📝', title:'Sign Up', desc:'Enter your name, date of birth, class, and school.' },
            { step:'2', icon:'🔑', title:'Log In', desc:'We calculate your age and route you to the right library.' },
            { step:'3', icon:'📖', title:'Start Reading', desc:'Browse, search, and open any book in your category.' },
          ].map(s => (
            <div key={s.step} style={{ flex:'1 1 200px', maxWidth:240 }}>
              <div style={{ width:56, height:56, borderRadius:'50%',
                background:'var(--primary)', color:'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.3rem', margin:'0 auto .75rem' }}>{s.icon}</div>
              <h4 style={{ marginBottom:'.4rem' }}>{s.title}</h4>
              <p style={{ color:'var(--muted)', fontSize:'.88rem', lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ background:'var(--primary)', color:'rgba(255,255,255,.5)',
        textAlign:'center', padding:'1.5rem', fontSize:'.85rem' }}>
        © {new Date().getFullYear()} EduLib — Smart Digital Library
      </footer>
    </div>
  );
}

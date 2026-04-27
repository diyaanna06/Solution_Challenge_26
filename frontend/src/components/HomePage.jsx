// src/components/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

// ── Animated counter hook ─────────────────────────────────────────────────────
const useCounter = (target, duration = 1800, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

// ── Intersection observer hook ────────────────────────────────────────────────
const useVisible = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, suffix = '', label, icon, start }) => {
  const count = useCounter(value, 1600, start);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize:    'clamp(32px, 5vw, 52px)',
        fontWeight:  '900',
        color:       'white',
        lineHeight:  1,
        fontFamily:  "'Fraunces', Georgia, serif",
        letterSpacing: '-1.5px',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontWeight: '500' }}>
        {label}
      </div>
    </div>
  );
};

// ── Live ticker ───────────────────────────────────────────────────────────────
const TICKER = [
  '🟢 Active — Flood relief · Varanasi',
  '✅ Resolved — Medical aid · Lucknow',
  '🟡 Pending — Food distribution · Kanpur',
  '🟢 Active — Rescue operation · Prayagraj',
  '✅ Resolved — Shelter setup · Agra',
  '🟢 Active — Clean water · Mathura',
  '🔔 New — Heavy-lifting needed · Gorakhpur',
];

const Ticker = () => (
  <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
    <style>{`@keyframes ticker { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }`}</style>
    <div style={{ display: 'inline-block', animation: 'ticker 30s linear infinite' }}>
      {[...TICKER, ...TICKER].map((item, i) => (
        <span key={i} style={{ display: 'inline-block', padding: '0 36px', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.3px' }}>{item}</span>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
const HomePage = () => {
  const navigate = useNavigate();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [statsRef, statsVisible]    = useVisible();
  const [probRef,  probVisible]     = useVisible();
  const [featRef,  featVisible]     = useVisible();

  useEffect(() => { const t = setTimeout(() => setHeroLoaded(true), 80); return () => clearTimeout(t); }, []);

  const problems = [
    { icon: '📋', title: 'Scattered Data',    desc: 'Community needs live on paper surveys, WhatsApp chains, and phone calls — invisible to anyone trying to see the full picture.' },
    { icon: '⏳', title: 'Slow Response',     desc: 'Without central coordination, volunteers arrive late or at the wrong site. Every minute of delay costs lives.' },
    { icon: '🔗', title: 'Skill Mismatches', desc: 'Help goes where it\'s easiest, not where it\'s needed. Medical volunteers end up doing heavy lifting while rescue experts sit idle.' },
    { icon: '📊', title: 'No Prioritization', desc: 'Every request looks equally urgent on paper. Overwhelmed coordinators guess — and the most critical cases get missed.' },
  ];

  const features = [
    { icon: '🤖', color: '#7C3AED', label: 'AI Triage',       desc: 'Gemini AI scores severity 1–10, extracts required skills, and estimates affected people — the moment a report is submitted.' },
    { icon: '📍', color: '#0369A1', label: 'GPS Routing',      desc: 'Reporters pin the exact crisis location on a map. Volunteers navigate straight to it — no vague street descriptions.' },
    { icon: '🎯', color: theme.primary, label: 'Smart Matching', desc: 'The AI cross-references skills, proximity, and workload to pick the optimal volunteer team for each task.' },
    { icon: '📱', color: '#D97706', label: 'Push Alerts',      desc: 'Selected volunteers receive instant push notifications — even with the app running in the background.' },
    { icon: '👥', color: '#BE185D', label: 'Team Dashboard',   desc: 'See your full team, their skills, and real-time progress — every active volunteer in one live view.' },
    { icon: '🔍', color: '#0D9488', label: 'Proof & Audit',    desc: 'Volunteers submit photo evidence on completion. Admins verify before officially closing the request.' },
  ];

  const steps = [
    { icon: '📝', title: 'Report',     sub: 'Pin exact location & describe the emergency', color: '#2E7D52' },
    { icon: '🤖', title: 'AI Triages', sub: 'Severity scored, best volunteer team selected', color: '#7C3AED' },
    { icon: '📱', title: 'Alert',      sub: 'Push notifications sent to matched volunteers', color: '#D97706' },
    { icon: '🤝', title: 'Respond',    sub: 'Team navigates to precise GPS coordinates',    color: '#0369A1' },
    { icon: '✅', title: 'Resolve',    sub: 'Proof submitted, admin verifies & closes',     color: '#BE185D' },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'NGO Coordinator · Lucknow',  text: 'Before this platform, I was managing 40+ WhatsApp groups. Now the AI handles the routing and I just review outcomes.', av: 'PS', color: '#2E7D52' },
    { name: 'Ravi Tiwari',  role: 'Field Volunteer · Varanasi', text: 'I get a push notification, see exactly where to go, and know my team members before arriving. This is what coordination should feel like.', av: 'RT', color: '#7C3AED' },
    { name: 'Anjali Mehta', role: 'Community Member · Kanpur',  text: 'My mother needed urgent medical help during the floods. I submitted a request and two trained volunteers arrived within 90 minutes.', av: 'AM', color: '#D97706' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Trebuchet MS', sans-serif", backgroundColor: '#F4F9F6', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(10px) rotate(-2deg)} }
        @keyframes pulse  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes shimmer{ 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .feat-card { transition: transform 0.25s, box-shadow 0.25s !important; }
        .feat-card:hover { transform: translateY(-5px) !important; box-shadow: 0 16px 48px rgba(46,125,82,0.16) !important; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(110,231,183,0.5) !important; }
        .cta-secondary:hover { transform: translateY(-2px); }
        .step-node:hover { transform: scale(1.08) !important; }
      `}</style>

      {/* ══════════════ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        position:      'relative',
        background:    'linear-gradient(150deg, #071A0F 0%, #0D3320 28%, #1B5E38 62%, #2E7D52 100%)',
        overflow:      'hidden',
        minHeight:     '100vh',
        display:       'flex',
        flexDirection: 'column',
      }}>
        {/* Ambient blobs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-12%', right:'-6%', width:'580px', height:'580px', borderRadius:'50%', background:'radial-gradient(circle, rgba(110,231,183,0.13) 0%, transparent 68%)', animation:'floatA 9s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'-15%', left:'-4%', width:'440px', height:'440px', borderRadius:'50%', background:'radial-gradient(circle, rgba(46,125,82,0.18) 0%, transparent 70%)', animation:'floatB 11s ease-in-out infinite' }} />
          {/* Dot grid overlay */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.055 }}>
            <defs><pattern id="g" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#6EE7B7"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'88px 24px 52px', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:'780px', width:'100%', textAlign:'center' }}>

            {/* Pulse badge */}
            <div style={{ opacity: heroLoaded?1:0, transform: heroLoaded?'none':'translateY(14px)', transition:'opacity 0.5s, transform 0.5s' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'9px', backgroundColor:'rgba(110,231,183,0.1)', border:'1px solid rgba(110,231,183,0.22)', borderRadius:'999px', padding:'7px 18px', marginBottom:'34px' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#6EE7B7', display:'block', animation:'pulse 2s ease-in-out infinite' }}/>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#6EE7B7', textTransform:'uppercase', letterSpacing:'1.8px' }}>Live Relief Network · India</span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ opacity: heroLoaded?1:0, transform: heroLoaded?'none':'translateY(22px)', transition:'opacity 0.6s 0.1s, transform 0.6s 0.1s' }}>
              <h1 style={{ margin:'0 0 26px', fontSize:'clamp(38px, 7.5vw, 72px)', fontWeight:'900', color:'white', lineHeight:1.04, letterSpacing:'-2.5px', fontFamily:"'Fraunces', Georgia, serif" }}>
                AI-Powered Help,<br/>
                <em style={{ background:'linear-gradient(90deg, #6EE7B7, #34D399, #A7F3D0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>
                  When It Matters Most
                </em>
              </h1>
            </div>

            {/* Subtitle */}
            <div style={{ opacity: heroLoaded?1:0, transform: heroLoaded?'none':'translateY(22px)', transition:'opacity 0.6s 0.2s, transform 0.6s 0.2s' }}>
              <p style={{ margin:'0 auto 48px', fontSize:'clamp(16px, 2.2vw, 20px)', color:'rgba(255,255,255,0.68)', lineHeight:1.75, maxWidth:'570px' }}>
                Report a community crisis and Gemini AI instantly scores its severity,
                selects the right volunteers, and routes them to the precise GPS location — all within minutes.
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', opacity: heroLoaded?1:0, transform: heroLoaded?'none':'translateY(22px)', transition:'opacity 0.6s 0.3s, transform 0.6s 0.3s' }}>
              <button className="cta-primary" onClick={() => navigate('/login')} style={{ padding:'16px 36px', backgroundColor:'#6EE7B7', color:'#071A0F', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'800', cursor:'pointer', boxShadow:'0 6px 28px rgba(110,231,183,0.4)', transition:'transform 0.2s, box-shadow 0.2s', letterSpacing:'0.2px' }}>
                🚨 Report an Issue
              </button>
              <button className="cta-secondary" onClick={() => navigate('/onboarding')} style={{ padding:'16px 32px', backgroundColor:'rgba(255,255,255,0.08)', color:'white', border:'1.5px solid rgba(255,255,255,0.22)', borderRadius:'12px', fontSize:'15px', fontWeight:'700', cursor:'pointer', backdropFilter:'blur(8px)', transition:'transform 0.2s' }}>
                🤝 Become a Volunteer
              </button>
            </div>

            {/* Trust strip */}
            <div style={{ marginTop:'48px', display:'flex', alignItems:'center', justifyContent:'center', gap:'28px', flexWrap:'wrap', opacity: heroLoaded?1:0, transition:'opacity 0.9s 0.55s' }}>
              {['🔒 Verified volunteers only', '🤖 Gemini AI powered', '📍 GPS-precise routing'].map((s, i) => (
                <span key={i} style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)', fontWeight:'500' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <Ticker />
      </section>

      {/* ══════════════ STATS ═════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background:'linear-gradient(135deg, #0D3320, #1B5E38)', padding:'clamp(52px, 9vw, 80px) 24px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'clamp(28px, 6vw, 56px)', textAlign:'center' }}>
          <StatCard value={120}  suffix="+"    label="Communities Served" icon="🏘️" start={statsVisible} />
          <StatCard value={850}  suffix="+"    label="Active Volunteers"  icon="🤝" start={statsVisible} />
          <StatCard value={3200} suffix="+"    label="Requests Resolved"  icon="✅" start={statsVisible} />
          <StatCard value={2}    suffix=" hrs" label="Avg Response Time"  icon="⚡" start={statsVisible} />
        </div>
      </section>

      {/* ══════════════ PROBLEM ═══════════════════════════════════════════════ */}
      <section ref={probRef} style={{ padding:'clamp(64px, 10vw, 100px) 24px', backgroundColor:'#F4F9F6' }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ maxWidth:'580px', marginBottom:'clamp(40px, 7vw, 64px)' }}>
            <span style={{ display:'inline-block', fontSize:'11px', fontWeight:'700', color:theme.danger, textTransform:'uppercase', letterSpacing:'2px', backgroundColor:theme.dangerLight, border:`1px solid ${theme.dangerBorder}`, padding:'5px 14px', borderRadius:'999px', marginBottom:'18px' }}>The Problem</span>
            <h2 style={{ margin:'0 0 16px', fontSize:'clamp(28px, 5vw, 52px)', fontWeight:'900', color:theme.textPrimary, letterSpacing:'-1.8px', lineHeight:1.08, fontFamily:"'Fraunces', Georgia, serif" }}>
              Traditional Relief<br/>Coordination Is Broken
            </h2>
            <p style={{ margin:0, fontSize:'16px', color:theme.textSecondary, lineHeight:1.72 }}>
              Local NGOs have the heart — but the systems aren't keeping pace with the scale of the crisis.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'18px' }}>
            {problems.map((p, i) => (
              <div key={i} style={{
                backgroundColor:'white', borderRadius:'16px', padding:'28px',
                border:`1px solid ${theme.border}`, boxShadow:'0 2px 12px rgba(46,125,82,0.06)',
                position:'relative', overflow:'hidden',
                opacity: probVisible ? 1 : 0, transform: probVisible ? 'none' : 'translateY(24px)',
                transition:`opacity 0.5s ${0.1*i}s, transform 0.5s ${0.1*i}s`,
              }}>
                <div style={{ position:'absolute', top:'-6px', right:'14px', fontSize:'88px', fontWeight:'900', color:'rgba(220,38,38,0.035)', fontFamily:"'Fraunces', Georgia, serif", lineHeight:1, userSelect:'none' }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ width:'46px', height:'46px', borderRadius:'12px', backgroundColor:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'18px' }}>
                  {p.icon}
                </div>
                <h3 style={{ margin:'0 0 10px', fontSize:'17px', fontWeight:'800', color:theme.textPrimary }}>{p.title}</h3>
                <p style={{ margin:0, fontSize:'14px', color:theme.textSecondary, lineHeight:1.72 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════════════════════════════════ */}
      <section style={{ backgroundColor:'white', padding:'clamp(64px, 10vw, 100px) 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'linear-gradient(180deg, #F4F9F6, white)', pointerEvents:'none' }} />
        <div style={{ maxWidth:'1000px', margin:'0 auto', position:'relative' }}>
          <div style={{ textAlign:'center', marginBottom:'clamp(40px, 7vw, 60px)' }}>
            <span style={{ display:'inline-block', fontSize:'11px', fontWeight:'700', color:theme.primary, textTransform:'uppercase', letterSpacing:'2px', backgroundColor:theme.primaryBgCard, border:`1px solid ${theme.primaryBorder}`, padding:'5px 14px', borderRadius:'999px', marginBottom:'18px' }}>How It Works</span>
            <h2 style={{ margin:0, fontSize:'clamp(28px, 5vw, 52px)', fontWeight:'900', color:theme.textPrimary, letterSpacing:'-1.8px', fontFamily:"'Fraunces', Georgia, serif" }}>
              Report to Resolution<br/>in Minutes
            </h2>
          </div>

          {/* Step rail */}
          <div style={{ display:'flex', gap:'0', overflowX:'auto', paddingBottom:'12px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ flex:'1 0 155px', textAlign:'center', padding:'0 10px', position:'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position:'absolute', top:'34px', left:'calc(50% + 34px)', right:'-34px', height:'2px', background:`linear-gradient(90deg, ${step.color}55, ${steps[i+1].color}55)`, zIndex:0 }} />
                )}
                <div className="step-node" style={{ width:'68px', height:'68px', borderRadius:'50%', background:`linear-gradient(135deg, ${step.color}20, ${step.color}45)`, border:`2px solid ${step.color}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 16px', position:'relative', zIndex:1, transition:'transform 0.2s', cursor:'default' }}>
                  {step.icon}
                  <div style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'22px', height:'22px', borderRadius:'50%', backgroundColor:step.color, color:'white', fontSize:'10px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>{i+1}</div>
                </div>
                <h4 style={{ margin:'0 0 6px', fontSize:'14px', fontWeight:'800', color:theme.textPrimary }}>{step.title}</h4>
                <p style={{ margin:0, fontSize:'12px', color:theme.textSecondary, lineHeight:1.55 }}>{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════════════════════════════════════ */}
      <section ref={featRef} style={{ padding:'clamp(64px, 10vw, 100px) 24px', backgroundColor:'#F4F9F6' }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'clamp(40px, 7vw, 60px)', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <span style={{ display:'inline-block', fontSize:'11px', fontWeight:'700', color:theme.primary, textTransform:'uppercase', letterSpacing:'2px', backgroundColor:theme.primaryBgCard, border:`1px solid ${theme.primaryBorder}`, padding:'5px 14px', borderRadius:'999px', marginBottom:'18px' }}>Our Solution</span>
              <h2 style={{ margin:0, fontSize:'clamp(28px, 5vw, 52px)', fontWeight:'900', color:theme.textPrimary, letterSpacing:'-1.8px', fontFamily:"'Fraunces', Georgia, serif", lineHeight:1.08 }}>
                Everything the Network<br/>Needs to Respond Fast
              </h2>
            </div>
            <button onClick={() => {navigate('/onboarding'); window.scrollTo({top: 0, left: 0, behavior: 'instant'})}} style={{ padding:'12px 24px', backgroundColor:'white', color:theme.primary, border:`1.5px solid ${theme.primaryBorder}`, borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', flexShrink:0, boxShadow:theme.shadow }}>
              Join as Volunteer →
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
            {features.map((f, i) => (
              <div key={i} className="feat-card" style={{
                backgroundColor:'white', borderRadius:'16px', padding:'28px',
                border:`1px solid ${theme.border}`, boxShadow:'0 2px 8px rgba(46,125,82,0.06)',
                opacity: featVisible?1:0, transform: featVisible?'none':'translateY(20px)',
                transition:`opacity 0.5s ${0.07*i}s, transform 0.5s ${0.07*i}s, box-shadow 0.25s`,
              }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', backgroundColor:`${f.color}18`, border:`1px solid ${f.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'18px' }}>
                  {f.icon}
                </div>
                <div style={{ fontSize:'10px', fontWeight:'700', color:f.color, textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:'8px' }}>{f.label}</div>
                <p style={{ margin:0, fontSize:'14px', color:theme.textSecondary, lineHeight:1.72 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════════════════════════════════ */}
      <section style={{ padding:'clamp(64px, 10vw, 100px) 24px', background:'linear-gradient(160deg, #071A0F 0%, #0D3320 50%, #1B5E38 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', right:'-8%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(110,231,183,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:'1000px', margin:'0 auto', position:'relative' }}>
          <div style={{ textAlign:'center', marginBottom:'clamp(40px, 7vw, 56px)' }}>
            <h2 style={{ margin:'0 0 14px', fontSize:'clamp(26px, 5vw, 48px)', fontWeight:'900', color:'white', letterSpacing:'-1.5px', fontFamily:"'Fraunces', Georgia, serif" }}>
              Voices from the Field
            </h2>
            <p style={{ margin:0, fontSize:'16px', color:'rgba(255,255,255,0.55)', maxWidth:'440px', margin:'0 auto' }}>
              Real people. Real emergencies. Real coordination.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'18px' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ backgroundColor:'rgba(255,255,255,0.06)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'28px' }}>
                <div style={{ fontSize:'44px', lineHeight:1, color:'rgba(110,231,183,0.28)', marginBottom:'16px', fontFamily:'Georgia, serif', fontWeight:'900' }}>"</div>
                <p style={{ margin:'0 0 24px', fontSize:'15px', color:'rgba(255,255,255,0.8)', lineHeight:1.78, fontStyle:'italic' }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', backgroundColor:t.color, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', flexShrink:0 }}>{t.av}</div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'white' }}>{t.name}</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ DUAL CTA ══════════════════════════════════════════════ */}
      <section style={{ padding:'clamp(64px, 10vw, 100px) 24px', backgroundColor:'white' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px' }}>
          {/* Emergency card */}
          <div style={{ background:'linear-gradient(135deg, #DC2626, #EF4444)', borderRadius:'20px', padding:'clamp(32px, 6vw, 52px)', color:'white', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'150px', height:'150px', borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
            <div style={{ fontSize:'40px', marginBottom:'18px' }}>🚨</div>
            <h3 style={{ margin:'0 0 12px', fontSize:'clamp(20px, 3vw, 28px)', fontWeight:'900', lineHeight:1.2, fontFamily:"'Fraunces', Georgia, serif" }}>Need Help Right Now?</h3>
            <p style={{ margin:'0 0 28px', fontSize:'14px', color:'rgba(255,255,255,0.78)', lineHeight:1.72 }}>Report an issue and our AI will route the right volunteers to you within minutes.</p>
            <button onClick={() => navigate('/login')} style={{ padding:'13px 28px', backgroundColor:'white', color:'#DC2626', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'800', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.18)' }}>
              Report an Issue
            </button>
          </div>
          {/* Volunteer card */}
          <div style={{ background:`linear-gradient(135deg, ${theme.primaryDark}, ${theme.primary})`, borderRadius:'20px', padding:'clamp(32px, 6vw, 52px)', color:'white', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'150px', height:'150px', borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
            <div style={{ fontSize:'40px', marginBottom:'18px' }}>🌿</div>
            <h3 style={{ margin:'0 0 12px', fontSize:'clamp(20px, 3vw, 28px)', fontWeight:'900', lineHeight:1.2, fontFamily:"'Fraunces', Georgia, serif" }}>Ready to Volunteer?</h3>
            <p style={{ margin:'0 0 28px', fontSize:'14px', color:'rgba(255,255,255,0.78)', lineHeight:1.72 }}>Join skilled volunteers and let AI match you with tasks where you're needed most.</p>
            <button onClick={() => {navigate('/onboarding'); window.scrollTo({top: 0, left: 0, behavior: 'instant'})}} style={{ padding:'13px 28px', backgroundColor:'#6EE7B7', color:'#071A0F', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'800', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.18)' }}>
              Start Your Journey →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
 
// ── tiny animation helper ─────────────────────────────────────────────────────
const useEntrance = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);
  return visible;
};
 
// ── Coming-soon modal ─────────────────────────────────────────────────────────
const ComingSoonModal = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position:        'fixed',
      inset:           0,
      backgroundColor: 'rgba(10,26,17,0.72)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      zIndex:          999,
      padding:         '20px',
      backdropFilter:  'blur(4px)',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#fff',
        borderRadius:    '20px',
        maxWidth:        '440px',
        width:           '100%',
        overflow:        'hidden',
        boxShadow:       '0 32px 80px rgba(0,0,0,0.28)',
        animation:       'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {/* top accent */}
      <div style={{
        height:     '6px',
        background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight}, #6EE7B7)`,
      }} />
 
      <div style={{ padding: '36px 36px 32px' }}>
        {/* icon */}
        <div style={{
          width:           '64px',
          height:          '64px',
          borderRadius:    '16px',
          backgroundColor: theme.primaryBg,
          border:          `2px solid ${theme.primaryBorder}`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '30px',
          marginBottom:    '20px',
        }}>
          🔭
        </div>
 
        <h2 style={{
          margin:      '0 0 10px',
          fontSize:    '22px',
          fontWeight:  '800',
          color:       theme.textPrimary,
          lineHeight:  1.2,
          fontFamily:  "'Fraunces', 'Georgia', serif",
          letterSpacing: '-0.5px',
        }}>
          Coming in the Next Version
        </h2>
 
        <p style={{
          margin:     '0 0 8px',
          fontSize:   '15px',
          color:      theme.textSecondary,
          lineHeight: 1.65,
        }}>
          The <strong style={{ color: theme.textPrimary }}>Regional Admin Finder</strong> will let you locate the
          coordinator responsible for your district and send them a direct
          volunteering request — all from within the platform.
        </p>
 
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: theme.textMuted, lineHeight: 1.6 }}>
          For now, please reach out to your community's relief coordinator
          through your local NGO, WhatsApp group, or community notice board.
          They will handle your onboarding directly.
        </p>
 
        {/* what's coming list */}
        <div style={{
          backgroundColor: theme.primaryBg,
          border:          `1px solid ${theme.primaryBorder}`,
          borderRadius:    '12px',
          padding:         '16px 18px',
          marginBottom:    '28px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            What's planned
          </div>
          {[
            '📍  District-based admin directory',
            '📬  In-app volunteer application form',
            '🔔  Admin response notifications',
            '🤝  Direct chat with your coordinator',
          ].map((item, i) => (
            <div key={i} style={{ fontSize: '13px', color: theme.textSecondary, padding: '5px 0', borderBottom: i < 3 ? `1px dashed ${theme.borderLight}` : 'none' }}>
              {item}
            </div>
          ))}
        </div>
 
        <button
          onClick={onClose}
          style={{
            width:           '100%',
            padding:         '13px',
            backgroundColor: theme.primary,
            color:           'white',
            border:          'none',
            borderRadius:    '10px',
            cursor:          'pointer',
            fontWeight:      '700',
            fontSize:        '14px',
            letterSpacing:   '0.2px',
          }}
        >
          Got it, I'll reach out directly
        </button>
      </div>
    </div>
 
    <style>{`
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.88) translateY(12px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>
);
 
// ── Main page ─────────────────────────────────────────────────────────────────
const VolunteerOnboarding = () => {
  const navigate    = useNavigate();
  const visible     = useEntrance();
  const [modal, setModal] = useState(false);
 
  const steps = [
    {
      num:   '01',
      icon:  '🙋',
      color: '#2E7D52',
      title: 'Express Your Interest',
      body:  'Decide you want to volunteer in your community. No formal application is needed at this stage — just the intent to help.',
      note:  null,
    },
    {
      num:   '02',
      icon:  '🤝',
      color: '#0369A1',
      title: 'Contact Your Regional Admin',
      body:  'Reach out to the coordinator who manages your district\'s relief network. They are responsible for reviewing and onboarding new volunteers.',
      note:  'Each region has a dedicated admin appointed by a central authority. Use the button below to find yours.',
    },
    {
      num:   '03',
      icon:  '🛠️',
      color: '#D97706',
      title: 'Admin Assigns Your Skills',
      body:  'During onboarding, your admin will log your capabilities into the system — things like First Aid, Heavy Lifting, Rescue Operations, or Language skills.',
      note:  'These skills are what the AI uses to match you to the right tasks. You can\'t set them yourself — accuracy is guaranteed by admin oversight.',
    },
    {
      num:   '04',
      icon:  '📍',
      color: '#7C3AED',
      title: 'Set Your Base Location',
      body:  'Once promoted, you\'ll be prompted to pin your operational base area on a map. The AI uses this to assign you only to crises within your 20 km radius.',
      note:  'This is a one-time setup. Choose carefully.',
    },
    {
      num:   '05',
      icon:  '🚀',
      color: theme.primary,
      title: 'Start Receiving Assignments',
      body:  'You\'re live! The AI will now send you targeted push notifications the moment a task matching your skills and location is reported.',
      note:  null,
    },
  ];
 
  const faqs = [
    {
      q: 'Can I sign up as a volunteer directly?',
      a: 'Not yet — volunteers are promoted by regional admins to ensure accountability and proper skill verification. Contact your local coordinator to get started.',
    },
    {
      q: 'What skills can I be assigned?',
      a: 'Common skills include: First Aid, Rescue Operations, Heavy Lifting, Food Distribution, Counselling, Translation, Logistics, and Medical Support. Your admin will assign the ones that match your real capabilities.',
    },
    {
      q: 'Is there a commitment requirement?',
      a: 'There is no minimum time commitment. You can accept or decline individual task invitations based on your availability. The AI won\'t penalise you for declining — it simply routes to the next available volunteer.',
    },
    {
      q: 'What happens after I complete a task?',
      a: 'You submit photo proof and resolution notes. An admin reviews and approves your work, which builds your task completion history and improves your future AI-match priority.',
    },
    {
      q: 'Can I volunteer in multiple regions?',
      a: 'Currently each volunteer is anchored to one base location. Multi-region support is planned for a future release.',
    },
  ];
 
  return (
    <div style={{ fontFamily: "'DM Sans', 'Trebuchet MS', sans-serif", backgroundColor: '#F7FBF8', minHeight: '100vh' }}>
 
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        position:   'relative',
        overflow:   'hidden',
        background: `linear-gradient(145deg, #0D3320 0%, ${theme.primaryDark} 45%, #1F6B42 100%)`,
        padding:    '80px 24px 100px',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', backgroundColor: 'rgba(110,231,183,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(110,231,183,0.5)' }} />
        <div style={{ position: 'absolute', top: '60%', right: '15%', width: 5, height: 5, borderRadius: '50%', backgroundColor: 'rgba(110,231,183,0.4)' }} />
 
        <div style={{
          maxWidth:   '720px',
          margin:     '0 auto',
          textAlign:  'center',
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {/* pill badge */}
          <div style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '8px',
            backgroundColor: 'rgba(110,231,183,0.15)',
            border:          '1px solid rgba(110,231,183,0.3)',
            borderRadius:    '999px',
            padding:         '6px 16px',
            marginBottom:    '28px',
          }}>
            <span style={{ fontSize: '14px' }}>🌿</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Volunteer Programme
            </span>
          </div>
 
          <h1 style={{
            margin:        '0 0 20px',
            fontSize:      'clamp(30px, 6vw, 56px)',
            fontWeight:    '800',
            color:         'white',
            lineHeight:    1.1,
            letterSpacing: '-1.5px',
            fontFamily:    "'Fraunces', 'Georgia', serif",
          }}>
            Become the Help<br />
            <span style={{ color: '#6EE7B7' }}>Your Community Needs</span>
          </h1>
 
          <p style={{
            margin:     '0 0 40px',
            fontSize:   'clamp(15px, 2vw, 18px)',
            color:      'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            maxWidth:   '520px',
            margin:     '0 auto 40px',
          }}>
            Our volunteers are ordinary people with extraordinary commitment.
            Here's exactly how to join the Disaster Relief Network and start
            making a difference in your district.
          </p>
 
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setModal(true)}
              style={{
                padding:         '14px 32px',
                backgroundColor: '#6EE7B7',
                color:           '#0D3320',
                border:          'none',
                borderRadius:    '10px',
                fontSize:        '15px',
                fontWeight:      '800',
                cursor:          'pointer',
                display:         'flex',
                alignItems:      'center',
                gap:             '8px',
                boxShadow:       '0 4px 24px rgba(110,231,183,0.35)',
              }}
            >
              📍 Find Your Regional Admin
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding:         '14px 28px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color:           'white',
                border:          '1.5px solid rgba(255,255,255,0.3)',
                borderRadius:    '10px',
                fontSize:        '15px',
                fontWeight:      '600',
                cursor:          'pointer',
                backdropFilter:  'blur(4px)',
              }}
            >
              Already a volunteer? Sign in →
            </button>
          </div>
        </div>
      </div>
 
      {/* ── CURVED DIVIDER ───────────────────────────────────────────────── */}
      <div style={{ marginTop: '-2px', lineHeight: 0, backgroundColor: '#0D3320' }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
          <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="#F7FBF8" />
        </svg>
      </div>
 
      {/* ── ADMIN CALLOUT BANNER ─────────────────────────────────────────── */}
      <div style={{ padding: '0 24px', marginTop: '8px' }}>
        <div style={{
          maxWidth:        '860px',
          margin:          '0 auto',
          backgroundColor: 'white',
          border:          `1.5px solid ${theme.primaryBorder}`,
          borderRadius:    '16px',
          padding:         '28px 32px',
          display:         'flex',
          gap:             '24px',
          alignItems:      'flex-start',
          boxShadow:       '0 4px 24px rgba(46,125,82,0.09)',
          flexWrap:        'wrap',
        }}>
          <div style={{
            flexShrink:      0,
            width:           '52px',
            height:          '52px',
            borderRadius:    '14px',
            backgroundColor: theme.primaryBg,
            border:          `1px solid ${theme.primaryBorder}`,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '26px',
          }}>
            ℹ️
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: theme.textPrimary }}>
              Volunteering is Admin-Driven — Here's Why
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7 }}>
              Unlike most platforms, you <strong style={{ color: theme.textPrimary }}>cannot self-register as a volunteer</strong>.
              Each volunteer is personally verified and onboarded by a Regional Admin — a trusted
              coordinator appointed for your district. This ensures only vetted, skilled people
              are dispatched to real emergencies.
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7 }}>
              Your admin will also <strong style={{ color: theme.textPrimary }}>set your skills in the system</strong> during
              onboarding — not you — so the AI always has accurate data when routing tasks.
            </p>
          </div>
          <button
            onClick={() => setModal(true)}
            style={{
              flexShrink:      0,
              padding:         '11px 22px',
              backgroundColor: theme.primary,
              color:           'white',
              border:          'none',
              borderRadius:    '10px',
              cursor:          'pointer',
              fontWeight:      '700',
              fontSize:        '13px',
              whiteSpace:      'nowrap',
              alignSelf:       'center',
            }}
          >
            📍 Find Admin
          </button>
        </div>
      </div>
 
      {/* ── STEPS ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '72px 24px 60px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
 
          {/* heading */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{
              display:         'inline-block',
              fontSize:        '11px',
              fontWeight:      '700',
              color:           theme.primary,
              textTransform:   'uppercase',
              letterSpacing:   '2px',
              backgroundColor: theme.primaryBgCard,
              border:          `1px solid ${theme.primaryBorder}`,
              padding:         '4px 14px',
              borderRadius:    '999px',
              marginBottom:    '16px',
            }}>
              How It Works
            </span>
            <h2 style={{
              margin:        '0 0 14px',
              fontSize:      'clamp(24px, 4vw, 40px)',
              fontWeight:    '800',
              color:         theme.textPrimary,
              letterSpacing: '-1px',
              fontFamily:    "'Fraunces', 'Georgia', serif",
              lineHeight:    1.2,
            }}>
              Your Volunteer Journey, Step by Step
            </h2>
            <p style={{ margin: 0, fontSize: '15px', color: theme.textSecondary, maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
              Five clear steps from first interest to your first assignment.
              No surprises, no bureaucratic runaround.
            </p>
          </div>
 
          {/* step cards */}
          <div style={{ position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position:        'absolute',
              left:            '35px',
              top:             '44px',
              bottom:          '44px',
              width:           '2px',
              background:      `repeating-linear-gradient(to bottom, ${theme.primaryBorder} 0px, ${theme.primaryBorder} 8px, transparent 8px, transparent 16px)`,
              display:         'block',
            }} />
 
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display:    'flex',
                  gap:        '24px',
                  marginBottom: i < steps.length - 1 ? '24px' : 0,
                  opacity:    visible ? 1 : 0,
                  transform:  visible ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.5s ease ${0.1 + i * 0.1}s, transform 0.5s ease ${0.1 + i * 0.1}s`,
                }}
              >
                {/* step indicator */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width:           '70px',
                    height:          '70px',
                    borderRadius:    '18px',
                    backgroundColor: 'white',
                    border:          `2px solid ${step.color}22`,
                    boxShadow:       `0 4px 16px ${step.color}18`,
                    display:         'flex',
                    flexDirection:   'column',
                    alignItems:      'center',
                    justifyContent:  'center',
                    zIndex:          1,
                    position:        'relative',
                  }}>
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>{step.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: step.color, marginTop: '3px', letterSpacing: '0.5px' }}>
                      {step.num}
                    </span>
                  </div>
                </div>
 
                {/* card */}
                <div style={{
                  flex:            1,
                  backgroundColor: 'white',
                  border:          `1px solid ${theme.border}`,
                  borderRadius:    '14px',
                  padding:         '22px 24px',
                  boxShadow:       '0 2px 12px rgba(46,125,82,0.07)',
                  borderLeft:      `4px solid ${step.color}`,
                }}>
                  <h3 style={{
                    margin:      '0 0 8px',
                    fontSize:    '17px',
                    fontWeight:  '800',
                    color:       theme.textPrimary,
                    lineHeight:  1.3,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: '0 0 (step.note ? 12 : 0)px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7, marginBottom: step.note ? '12px' : 0 }}>
                    {step.body}
                  </p>
                  {step.note && (
                    <div style={{
                      display:         'flex',
                      gap:             '8px',
                      alignItems:      'flex-start',
                      backgroundColor: theme.primaryBg,
                      border:          `1px solid ${theme.primaryBorder}`,
                      borderRadius:    '8px',
                      padding:         '10px 12px',
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>💡</span>
                      <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                        {step.note}
                        {i === 1 && (
                          <button
                            onClick={() => setModal(true)}
                            style={{
                              marginLeft:     '6px',
                              background:     'none',
                              border:         'none',
                              color:          theme.primary,
                              fontWeight:     '700',
                              fontSize:       '13px',
                              cursor:         'pointer',
                              textDecoration: 'underline',
                              padding:        0,
                            }}
                          >
                            Find your regional admin →
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── WHAT VOLUNTEERS DO ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', padding: '72px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display:         'inline-block',
              fontSize:        '11px',
              fontWeight:      '700',
              color:           '#D97706',
              textTransform:   'uppercase',
              letterSpacing:   '2px',
              backgroundColor: '#FEF3C7',
              border:          '1px solid #FDE68A',
              padding:         '4px 14px',
              borderRadius:    '999px',
              marginBottom:    '16px',
            }}>
              Volunteer Role
            </span>
            <h2 style={{
              margin:        '0 0 14px',
              fontSize:      'clamp(22px, 3.5vw, 36px)',
              fontWeight:    '800',
              color:         theme.textPrimary,
              letterSpacing: '-0.8px',
              fontFamily:    "'Fraunces', 'Georgia', serif",
            }}>
              What You'll Actually Do
            </h2>
          </div>
 
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { icon: '📱', title: 'Receive Smart Alerts',     body: 'Get push notifications the moment a task matching your skills appears within your 20 km zone.' },
              { icon: '✅', title: 'Accept or Decline',        body: 'You\'re never forced. Accept tasks you can handle, decline ones you can\'t. The AI adjusts automatically.' },
              { icon: '🗺️', title: 'Navigate to the Scene',   body: 'The exact GPS coordinates are shared so you know precisely where to go — no vague descriptions.' },
              { icon: '👥', title: 'Coordinate as a Team',     body: 'See who else is on your task. Multiple volunteers are assigned based on severity and requirement.' },
              { icon: '📸', title: 'Submit Proof of Work',     body: 'When done, upload photos and notes. An admin reviews and officially closes the request.' },
              { icon: '📊', title: 'Build Your Track Record',  body: 'Your completed tasks and response history improve your priority score for future AI matching.' },
            ].map((card, i) => (
              <div key={i} style={{
                backgroundColor: theme.primaryBg,
                border:          `1px solid ${theme.primaryBorder}`,
                borderRadius:    '14px',
                padding:         '24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{card.icon}</div>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>{card.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, lineHeight: 1.65 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display:         'inline-block',
              fontSize:        '11px',
              fontWeight:      '700',
              color:           '#0369A1',
              textTransform:   'uppercase',
              letterSpacing:   '2px',
              backgroundColor: '#E0F2FE',
              border:          '1px solid #BAE6FD',
              padding:         '4px 14px',
              borderRadius:    '999px',
              marginBottom:    '16px',
            }}>
              FAQ
            </span>
            <h2 style={{
              margin:        '0',
              fontSize:      'clamp(22px, 3.5vw, 36px)',
              fontWeight:    '800',
              color:         theme.textPrimary,
              letterSpacing: '-0.8px',
              fontFamily:    "'Fraunces', 'Georgia', serif",
            }}>
              Common Questions
            </h2>
          </div>
 
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
 
      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <div style={{
        margin:     '0 24px 64px',
        maxWidth:   '860px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{
          background:   `linear-gradient(135deg, #0D3320 0%, ${theme.primaryDark} 50%, #1F6B42 100%)`,
          borderRadius: '20px',
          padding:      'clamp(32px, 6vw, 56px) 32px',
          textAlign:    'center',
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* bg decoration */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(110,231,183,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
 
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</div>
            <h2 style={{
              margin:      '0 0 14px',
              fontSize:    'clamp(22px, 3.5vw, 36px)',
              fontWeight:  '800',
              color:       'white',
              lineHeight:  1.2,
              fontFamily:  "'Fraunces', 'Georgia', serif",
              letterSpacing: '-0.8px',
            }}>
              Ready to Take the First Step?
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: '15px', color: 'rgba(255,255,255,0.75)', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.65 }}>
              Connect with your regional coordinator today.
              They will handle everything from here.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setModal(true)}
                style={{
                  padding:         '14px 32px',
                  backgroundColor: '#6EE7B7',
                  color:           '#0D3320',
                  border:          'none',
                  borderRadius:    '10px',
                  fontSize:        '15px',
                  fontWeight:      '800',
                  cursor:          'pointer',
                  boxShadow:       '0 4px 24px rgba(110,231,183,0.3)',
                }}
              >
                📍 Find Your Regional Admin
              </button>
              <button
                onClick={() => {
                    navigate('/home');
                }}
                style={{
                  padding:         '14px 24px',
                  backgroundColor: 'transparent',
                  color:           'rgba(255,255,255,0.8)',
                  border:          '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius:    '10px',
                  fontSize:        '15px',
                  fontWeight:      '600',
                  cursor:          'pointer',
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {modal && <ComingSoonModal onClose={() => setModal(false)} />}
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
};
 
// ── Accordion FAQ item ────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      backgroundColor: 'white',
      border:          `1px solid ${open ? theme.primaryBorder : theme.border}`,
      borderRadius:    '12px',
      overflow:        'hidden',
      transition:      'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width:           '100%',
          display:         'flex',
          justifyContent:  'space-between',
          alignItems:      'center',
          padding:         '18px 22px',
          background:      'none',
          border:          'none',
          cursor:          'pointer',
          textAlign:       'left',
          gap:             '12px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          flexShrink:      0,
          width:           '28px',
          height:          '28px',
          borderRadius:    '50%',
          backgroundColor: open ? theme.primary : theme.primaryBg,
          color:           open ? 'white' : theme.primary,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '16px',
          fontWeight:      '700',
          lineHeight:      1,
          transition:      'background 0.2s, color 0.2s',
        }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
};
 
export default VolunteerOnboarding;
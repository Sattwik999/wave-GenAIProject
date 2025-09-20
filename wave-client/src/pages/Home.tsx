import { useState, useEffect } from 'react'

export default function Home(){
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getPersonalizedGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 6) return { greeting: "Still awake?", message: "Sometimes our minds need extra care during quiet hours." }
    if (hour < 12) return { greeting: "Good morning!", message: "A fresh start is a beautiful opportunity for self-care." }
    if (hour < 17) return { greeting: "Good afternoon!", message: "How has your day been treating you so far?" }
    if (hour < 21) return { greeting: "Good evening!", message: "Time to unwind and reflect on your journey today." }
    return { greeting: "Good evening!", message: "Your mental wellness matters, especially during quiet moments." }
  }

  const { greeting, message } = getPersonalizedGreeting()

  // Time-of-day based gentle recommendation (simple, local-only)
  const getRecommendation = () => {
    const hour = currentTime.getHours()
    if (hour < 11) return { label: '2‑min Box Breathing', href: '/meditation', emoji: '🌬️' }
    if (hour < 17) return { label: '5‑Senses Grounding', href: '/meditation', emoji: '🖐️' }
    if (hour < 21) return { label: 'Gratitude Check‑in', href: '/journal', emoji: '💡' }
    return { label: 'Body Scan (3 min)', href: '/meditation', emoji: '🧘‍♂️' }
  }
  const rec = getRecommendation()

  return (
    <>
      <style>{`
        .home-wrapper {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background: transparent;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Top Dashboard - Professional Hero Section */
        .intro-hero {
          text-align: center;
          width: 100%;
          max-width: 100%;
          margin: 0 0 40px 0;
          padding: 60px 20px 40px;
          /* Refined multi-layer gradient with depth */
          background:
            linear-gradient(145deg, 
              rgba(var(--accent-rgb), 0.22) 0%,
              rgba(var(--accent-rgb), 0.08) 40%,
              rgba(255,255,255,0.05) 100%),
            rgba(11, 18, 32, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 10px 30px -5px rgba(0, 0, 0, 0.3),
            0 1px 0 rgba(255, 255, 255, 0.05) inset;
          position: relative;
          box-sizing: border-box;
        }

        /* Centered inner container for hero to improve rhythm */
        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 20px 30px;
          text-align: center;
          position: relative;
        }
        
        /* Add a subtle decoration line below the hero inner */
        .hero-inner::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(var(--accent-rgb), 0.6),
            transparent);
          border-radius: 2px;
        }

        .intro-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            linear-gradient(135deg,
              color-mix(in oklab, var(--accent) 10%, transparent),
              transparent 60%);
          pointer-events: none;
        }

        .wave-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .wave-logo-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 
            0 8px 30px rgba(0, 0, 0, 0.25);
          background: linear-gradient(135deg, 
            rgba(var(--accent-rgb), 0.15),
            rgba(0, 0, 0, 0.2));
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .wave-logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .wave-logo {
          font-size: 3.5rem;
          font-weight: 800;
          /* Professional gradient with refined contrast and depth */
          background: linear-gradient(135deg, var(--accent), var(--accent));
          background: linear-gradient(135deg,
            var(--accent) 0%,
            color-mix(in oklab, var(--accent) 70%, white) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
          font-family: 'Inter', system-ui, sans-serif;
        }

        .wave-subtitle {
          font-size: 1.3rem;
          color: rgba(var(--accent-rgb), 0.9);
          font-weight: 600;
          margin-bottom: 18px;
          letter-spacing: 0.5px;
          position: relative;
          display: inline-block;
        }
        
        /* Add decorative elements around subtitle */
        .wave-subtitle::before,
        .wave-subtitle::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 20px;
          height: 1px;
          background: rgba(var(--accent-rgb), 0.4);
        }
        
        .wave-subtitle::before {
          right: calc(100% + 12px);
        }
        
        .wave-subtitle::after {
          left: calc(100% + 12px);
        }

        .greeting-section {
          /* Use a refined gradient with subtle accent and lighten background */
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(255,255,255,0.05));
          backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 6px 30px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .greeting-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.6;
        }

        .greeting-text {
          font-size: 1.25rem;
          color: #FFFFFF;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          margin-bottom: 8px;
        }

        .greeting-message {
          color: #9CA3AF;
          font-size: 1rem;
          line-height: 1.5;
        }

        .intro-description {
          font-size: 1.1rem;
          color: #D1D5DB;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        /* Recommendation chip */
        .recommendation {
          display: flex;
          justify-content: center;
          margin: 16px 0 24px 0;
        }
        .rec-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 9999px;
          color: #FFFFFF;
          text-decoration: none;
          background: rgba(var(--accent-rgb), 0.15);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          backdrop-filter: blur(16px);
          box-shadow: 
            0 6px 20px rgba(0,0,0,0.2), 
            inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          font-weight: 500;
        }
        .rec-chip:hover {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.5);
          box-shadow: 
            0 10px 25px rgba(0,0,0,0.25), 
            inset 0 1px 0 rgba(255,255,255,0.15);
          background: rgba(var(--accent-rgb), 0.25);
        }
        .rec-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.2);
          position: relative;
        }
        /* Pulse animation for recommendation dot */
        .rec-dot::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--accent);
          z-index: -1;
          opacity: 0.6;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          70% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        /* Quick actions row */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          max-width: 720px;
          margin: 14px auto 0 auto;
          padding: 0 8px;
        }
        .qa-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 14px;
          color: #E5E7EB;
          text-decoration: none;
          background: rgba(11, 18, 32, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(14px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          white-space: nowrap;
        }
        .qa-button:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); box-shadow: 0 10px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16); }
        .qa-emoji { font-size: 1.05rem; }
        .qa-label { font-size: .95rem; color: #D1D5DB; }
        .qa-chat { --qa: #1A73E8; }
        .qa-meditate { --qa: #34D399; }
        .qa-mood { --qa: #06b6d4; }
        .qa-crisis { --qa: #ef4444; }
        .qa-button { position: relative; }
        .qa-button::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--qa, #1A73E8), transparent);
          opacity: .5;
        }

        .features-intro {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 40px 20px;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .section-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: #E5E7EB;
          margin-bottom: 16px;
        }

        .section-overline {
          text-align: center;
          font-size: .8rem;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #9CA3AF;
          margin-bottom: 8px;
          opacity: .9;
        }

        .section-subtitle {
          text-align: center;
          color: #9CA3AF;
          font-size: 1.1rem;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin: 0 auto 40px auto;
          max-width: 1200px;
          width: 100%;
          justify-items: center;
          padding: 0;
          box-sizing: border-box;
        }

        .feature-card {
          background: rgba(11, 18, 32, 0.3);
          backdrop-filter: blur(30px);
          border-radius: 20px;
          padding: 32px;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1),
                      0 0 0 1px rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 400px;
          justify-self: center;
        }

        .card-badge {
          position: absolute;
          top: 10px; right: 10px;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: .7rem;
          font-weight: 600;
          color: #E5E7EB;
          background: rgba(26,115,232,0.2);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
        }
        .card-badge.green { background: rgba(52,211,153,0.18); }
        .card-badge.red { background: rgba(239,68,68,0.18); }

        .feature-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
          transition: left 0.6s ease;
        }

        .feature-card:hover::after {
          left: 100%;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--card-accent, #667eea), var(--card-accent-end, #764ba2));
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.2),
                      0 0 0 1px rgba(255, 255, 255, 0.1);
          text-decoration: none;
          color: inherit;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .feature-card.primary {
          --card-accent: #1A73E8;
          --card-accent-end: #1A73E8;
          background: rgba(11, 18, 32, 0.35);
          border-color: rgba(26, 115, 232, 0.1);
        }

        .feature-card.primary::before {
          background: linear-gradient(135deg, rgba(26, 115, 232, 0.1), rgba(26, 115, 232, 0.05));
        }

        .feature-card.wellness {
          --card-accent: #34D399;
          --card-accent-end: #34D399;
          background: rgba(11, 18, 32, 0.35);
          border-color: rgba(52, 211, 153, 0.1);
        }

        .feature-card.wellness::before {
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.05));
        }

        .feature-card.calm {
          --card-accent: #06b6d4;
          --card-accent-end: #0891b2;
          background: rgba(11, 18, 32, 0.35);
          border-color: rgba(6, 182, 212, 0.1);
        }

        .feature-card.calm::before {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
        }

        .feature-card.urgent {
          --card-accent: #ef4444;
          --card-accent-end: #dc2626;
          background: rgba(11, 18, 32, 0.35);
          border-color: rgba(239, 68, 68, 0.1);
        }

        .feature-card.urgent::before {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          display: block;
          text-align: center;
        }

        .feature-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #E5E7EB;
          margin-bottom: 12px;
          text-align: center;
        }

        .feature-description {
          color: #D1D5DB;
          font-size: 1rem;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 16px;
        }

        .feature-benefits {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-benefits li {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin-bottom: 6px;
          padding-left: 20px;
          position: relative;
        }

        .feature-benefits li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--card-accent, #667eea);
          font-weight: bold;
        }

        .cta-section {
          text-align: center;
          padding: 60px 20px;
          background: rgba(11, 18, 32, 0.25);
          backdrop-filter: blur(30px);
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
          margin-top: 40px;
          width: 100%;
          max-width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(26, 115, 232, 0.03), rgba(52, 211, 153, 0.02));
          pointer-events: none;
        }

        .cta-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #E5E7EB;
          margin-bottom: 16px;
        }

        .cta-description {
          color: #9CA3AF;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .cta-button {
          display: inline-block;
          background: rgba(26, 115, 232, 0.8);
          backdrop-filter: blur(20px);
          color: white;
          padding: 18px 36px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.4s ease;
          border: 1px solid rgba(26, 115, 232, 0.3);
          box-shadow: 0 8px 32px rgba(26, 115, 232, 0.2), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:hover {
          background: rgba(26, 115, 232, 1);
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 40px rgba(26, 115, 232, 0.4), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
          text-decoration: none;
          color: white;
          border-color: rgba(26, 115, 232, 0.5);
        }

        .stats-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin: 32px auto;
          padding: 0;
          max-width: 600px;
          width: 100%;
          justify-items: center;
          box-sizing: border-box;
        }

        .stat-item {
          text-align: center;
          padding: 24px;
          background: rgba(11, 18, 32, 0.2);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 250px;
          justify-self: center;
        }

        .stat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px; height: 44px;
          border-radius: 50%;
          margin-bottom: 10px;
          background: color-mix(in oklab, var(--accent) 12%, transparent);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
          font-size: 1.1rem;
        }

        .stat-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--card-accent, #1A73E8), transparent);
          opacity: 0.4;
        }

        .stat-item:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent);
          display: block;
        }

        .stat-label {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .wave-logo {
            font-size: 2.5rem;
          }
          
          .wave-logo-circle {
            width: 70px;
            height: 70px;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .intro-hero {
            padding: 24px 16px;
            margin-bottom: 24px;
          }
          
          .feature-card {
            padding: 20px;
          }
        }
      `}</style>

      <div className="home-wrapper">
        <div className="intro-hero" style={{
          background: "linear-gradient(135deg, rgba(var(--accent-rgb), 0.3) 0%, rgba(255,255,255,0.1) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }}>
          <div className="hero-inner" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
          <div className="wave-logo-container">
            <div className="wave-logo-circle">
              <img src="/logo.png" alt="WAVE Logo" className="wave-logo-image" />
            </div>
            <h1 className="wave-logo">WAVE</h1>
          </div>
          <p className="wave-subtitle">Wellbeing Advisor with Voice Empathy</p>
          
          <div className="greeting-section">
            <div className="greeting-text">{greeting}</div>
            <div className="greeting-message">{message}</div>
          </div>

          {/* Time-of-day recommendation chip */}
          <div className="recommendation">
            <a className="rec-chip" href={rec.href} aria-label={`Try: ${rec.label}`}>
              <span className="rec-dot" aria-hidden="true"></span>
              <span role="img" aria-hidden className="qa-emoji">{rec.emoji}</span>
              <span>Try: {rec.label}</span>
            </a>
          </div>
          
          <p className="intro-description">
            Your personal mental wellness companion powered by AI. WAVE combines empathetic conversations, 
            mood tracking, reflective journaling, and calming experiences to support your mental health journey. 
            Built with privacy-first principles and designed for real human connection.
          </p>

          {/* <div className="stats-preview">
            <div className="stat-item">
              <div className="stat-icon" aria-hidden>🕒</div>
              <span className="stat-number">24/7</span>
              <div className="stat-label">Always Available Support</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" aria-hidden>🤖</div>
              <span className="stat-number">AI</span>
              <div className="stat-label">Powered Conversations</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" aria-hidden>🔒</div>
              <span className="stat-number">100%</span>
              <div className="stat-label">Privacy Protected</div>
            </div>
          </div> */}

          {/* Quick actions row */}
          {/* <div className="quick-actions" role="navigation" aria-label="Quick actions">
            <a href="/chat" className="qa-button qa-chat" aria-label="Open Chat">
              <span className="qa-emoji">💬</span>
              <span className="qa-label">Chat</span>
            </a>
            <a href="/meditation" className="qa-button qa-meditate" aria-label="Start Meditation">
              <span className="qa-emoji">🧘‍♀️</span>
              <span className="qa-label">Meditate</span>
            </a>
            <a href="/mood" className="qa-button qa-mood" aria-label="Log Mood">
              <span className="qa-emoji">😊</span>
              <span className="qa-label">Log Mood</span>
            </a>
            <a href="/crisis" className="qa-button qa-crisis" aria-label="Open Crisis Tools">
              <span className="qa-emoji">🆘</span>
              <span className="qa-label">Crisis</span>
            </a>
          </div> */}
          </div>
        </div>

        <div className="features-intro">
          <div className="section-overline">Explore tools</div>
          <h2 className="section-title">What You Can Do With WAVE</h2>
          <p className="section-subtitle">
            Discover powerful tools designed to support your mental wellness journey, 
            each crafted with care and backed by therapeutic principles.
          </p>

          <div className="features-grid">
            <a href="/chat" className="feature-card primary">
              <span className="card-badge">Popular</span>
              <span className="feature-icon">💬</span>
              <h3 className="feature-title">Empathetic Conversations</h3>
              <p className="feature-description">
                Chat with AI that understands and responds with genuine empathy. Create personalized support figures who know you.
              </p>
              <ul className="feature-benefits">
                <li>Personalized AI companions</li>
                <li>Therapeutic conversation flows</li>
                <li>24/7 emotional support</li>
                <li>Context-aware responses</li>
              </ul>
            </a>

            <a href="/meditation" className="feature-card calm">
              <span className="card-badge green">New</span>
              <span className="feature-icon">🧘‍♀️</span>
              <h3 className="feature-title">Meditation & Calm</h3>
              <p className="feature-description">
                Practice mindfulness with guided meditation sessions, breathing exercises, and calming soundscapes to reduce stress and anxiety.
              </p>
              <ul className="feature-benefits">
                <li>Guided meditation sessions</li>
                <li>Breathing exercises & techniques</li>
                <li>Calming ambient soundscapes</li>
                <li>Stress & anxiety reduction tools</li>
              </ul>
            </a>

            <a href="/mood" className="feature-card wellness">
              <span className="feature-icon">😊</span>
              <h3 className="feature-title">Mood Intelligence</h3>
              <p className="feature-description">
                Track your emotional patterns and discover insights. Simple 1-5 scale logging with powerful trend analysis.
              </p>
              <ul className="feature-benefits">
                <li>Daily mood tracking</li>
                <li>Pattern recognition</li>
                <li>Progress visualization</li>
                <li>Personalized insights</li>
              </ul>
            </a>

            <a href="/journal" className="feature-card wellness">
              <span className="feature-icon">📝</span>
              <h3 className="feature-title">Reflective Journaling</h3>
              <p className="feature-description">
                Express yourself freely in a private, secure space. Your thoughts and reflections help build self-awareness.
              </p>
              <ul className="feature-benefits">
                <li>Private, encrypted entries</li>
                <li>Emotional pattern detection</li>
                <li>Time capsule feature</li>
                <li>Self-discovery tools</li>
              </ul>
            </a>

            <a href="/crisis" className="feature-card urgent">
              <span className="card-badge red">Safe</span>
              <span className="feature-icon">🆘</span>
              <h3 className="feature-title">Crisis Support</h3>
              <p className="feature-description">
                Immediate help when you need it most. Breathing exercises, grounding techniques, and professional helplines.
              </p>
              <ul className="feature-benefits">
                <li>Emergency breathing exercises</li>
                <li>Grounding techniques</li>
                <li>Professional helplines</li>
                <li>Instant access support</li>
              </ul>
            </a>

            <a href="/pulse" className="feature-card primary">
              <span className="feature-icon">🤝</span>
              <h3 className="feature-title">Community Connection</h3>
              <p className="feature-description">
                Feel connected through anonymous community wellness trends. You're not alone in your journey.
              </p>
              <ul className="feature-benefits">
                <li>Anonymous community insights</li>
                <li>Collective wellness trends</li>
                <li>Shared experience awareness</li>
                <li>Connection without exposure</li>
              </ul>
            </a>
          </div>

          <div className="cta-section">
            <h2 className="cta-title">Start Your Wellness Journey Today</h2>
            <p className="cta-description">
              Take the first step towards better mental health. Whether you need someone to talk to, 
              want to track your progress, or need immediate support—WAVE is here for you.
            </p>
            <a href="/chat" className="cta-button">Begin Conversation</a>
          </div>
        </div>
      </div>
    </>
  )
}

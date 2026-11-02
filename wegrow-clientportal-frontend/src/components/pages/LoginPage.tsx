import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../context/PortalContext';
import { WeGrowLogo } from '../common/Icons';

export const LoginPage: React.FC<{ onForgotPw: () => void }> = ({ onForgotPw }) => {
  const { login, loading } = usePortal();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SVG Animation Refs for comets
  const purplePathRef = useRef<SVGPathElement>(null);
  const tealPathRef = useRef<SVGPathElement>(null);
  const purpleCometRef = useRef<SVGGElement>(null);
  const tealCometRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let animId: number;
    const speedPurple = 4200; // 4.2 seconds cycle
    const speedTeal = 3600;   // 3.6 seconds cycle
    let start: number | null = null;

    const animateLoop = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      // Move purple comet along purple line
      if (purplePathRef.current && purpleCometRef.current) {
        try {
          const len = purplePathRef.current.getTotalLength();
          const progress = (elapsed % speedPurple) / speedPurple;
          const pt = purplePathRef.current.getPointAtLength(progress * len);
          purpleCometRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        } catch {
          // ignore before SVG mount
        }
      }

      // Move teal comet along teal line (with offset)
      if (tealPathRef.current && tealCometRef.current) {
        try {
          const len = tealPathRef.current.getTotalLength();
          const progress = ((elapsed + 1800) % speedTeal) / speedTeal;
          const pt = tealPathRef.current.getPointAtLength(progress * len);
          tealCometRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        } catch {
          // ignore
        }
      }

      animId = requestAnimationFrame(animateLoop);
    };

    animId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email or Client ID and your password.');
      return;
    }
    setError(null);
    const ok = await login(email, password, remember);
    if (ok) {
      navigate('/');
    } else {
      setError('That email or password is not recognised. Check both and try again.');
    }
  };

  return (
    <div className="login">
      <section className="login-art">
        {/* Soft Ambient Floating Light Blobs in background */}
        <div className="ambient-blob blob-purple-top" />
        <div className="ambient-blob blob-teal-mid" />
        <div className="ambient-blob blob-violet-bottom" />

        {/* Animated dynamic SVG background */}
        <svg className="bg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            {/* Vibrant Line Gradients */}
            <linearGradient id="purpleLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7B42E8" />
              <stop offset="50%" stopColor="#AF7DFF" />
              <stop offset="100%" stopColor="#8751F2" />
            </linearGradient>
            <linearGradient id="tealLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1EB5AF" />
              <stop offset="50%" stopColor="#4FFCF5" />
              <stop offset="100%" stopColor="#25CCC5" />
            </linearGradient>

            {/* Glowing Flow Dash Gradients */}
            <linearGradient id="tealPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3CC3BF" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#68FFF9" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="purplePulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7E4CE8" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#CCA8FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            {/* Area Fills under lines */}
            <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8A56EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#241448" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3CC3BF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#241448" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="glowTeal" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Twinkling ambient star particles */}
          <g className="bg-particles">
            <circle cx="120" cy="180" r="2.2" fill="#AF8EFF" className="twinkle-dot dot-1" />
            <circle cx="380" cy="140" r="2.8" fill="#4DFDF6" className="twinkle-dot dot-2" />
            <circle cx="220" cy="320" r="1.8" fill="#ffffff" className="twinkle-dot dot-3" />
            <circle cx="490" cy="310" r="2.4" fill="#D6C4FF" className="twinkle-dot dot-1" />
            <circle cx="80" cy="440" r="2.2" fill="#3CC3BF" className="twinkle-dot dot-2" />
            <circle cx="530" cy="520" r="2.6" fill="#ffffff" className="twinkle-dot dot-3" />
            <circle cx="160" cy="680" r="1.8" fill="#4DFDF6" className="twinkle-dot dot-1" />
            <circle cx="420" cy="650" r="2.4" fill="#AF8EFF" className="twinkle-dot dot-2" />
          </g>

          {/* Animated Line & Area Group */}
          <g className="chart-lines-group">
            {/* Area Fills under lines */}
            <path
              d="M-20 620 L120 520 L220 580 L360 420 L480 470 L640 280 L640 820 L-20 820 Z"
              fill="url(#purpleAreaGrad)"
            />
            <path
              d="M-20 660 L120 560 L220 620 L360 460 L480 510 L640 320 L640 820 L-20 820 Z"
              fill="url(#tealAreaGrad)"
            />

            {/* Base Continuous Trend Lines with Ref for length calculation */}
            <path
              ref={purplePathRef}
              d="M-20 620 L120 520 L220 580 L360 420 L480 470 L640 280"
              fill="none"
              stroke="url(#purpleLineGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            <path
              ref={tealPathRef}
              d="M-20 660 L120 560 L220 620 L360 460 L480 510 L640 320"
              fill="none"
              stroke="url(#tealLineGrad)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />

            {/* Continuous High-Speed Fiber Stream Lines (Direct Pure CSS Flow) */}
            <path
              d="M-20 620 L120 520 L220 580 L360 420 L480 470 L640 280"
              fill="none"
              stroke="#D8BEFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="fiber-stream-purple"
              filter="url(#glowPurple)"
            />
            <path
              d="M-20 660 L120 560 L220 620 L360 460 L480 510 L640 320"
              fill="none"
              stroke="#6AFFF9"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="fiber-stream-teal"
              filter="url(#glowTeal)"
            />

            {/* Shooting Bright Laser Packets (Pure CSS Keyframe Animation) */}
            <path
              d="M-20 620 L120 520 L220 580 L360 420 L480 470 L640 280"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowPurple)"
              className="shooting-laser-purple"
            />
            <path
              d="M-20 660 L120 560 L220 620 L360 460 L480 510 L640 320"
              fill="none"
              stroke="#A3FFFA"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowTeal)"
              className="shooting-laser-teal"
            />

            {/* Traveling Light Energy Comets (JS 60FPS Tracked along path) */}
            <g ref={purpleCometRef} className="moving-comet purple-comet">
              <circle r="16" fill="#A875FF" opacity="0.45" filter="url(#glowPurple)" />
              <circle r="8" fill="#D2B2FF" opacity="0.9" />
              <circle r="3.8" fill="#ffffff" />
            </g>

            <g ref={tealCometRef} className="moving-comet teal-comet">
              <circle r="15" fill="#3CC3BF" opacity="0.5" filter="url(#glowTeal)" />
              <circle r="7.5" fill="#6AFFF9" opacity="0.9" />
              <circle r="3.5" fill="#ffffff" />
            </g>

            {/* Milestone Node 0: Above 6-month on Purple line at (120, 520) */}
            <circle cx="120" cy="520" r="5" className="radar-ping purple-ping delay-1" fill="none" />
            <circle cx="120" cy="520" r="5.5" fill="#ffffff" filter="url(#glowPurple)" />
            <circle cx="120" cy="520" r="2.2" fill="#5E28B0" />

            {/* Milestone Node 1: Purple line peak at (360, 420) */}
            <circle cx="360" cy="420" r="7" className="radar-ping teal-ping" fill="none" />
            <circle cx="360" cy="420" r="7" className="radar-ping teal-ping delay-1" fill="none" />
            <circle cx="360" cy="420" r="7.5" fill="#3CC3BF" filter="url(#glowTeal)" />
            <circle cx="360" cy="420" r="3" fill="#ffffff" />

            {/* Milestone Node 2: Purple line dip at (480, 470) */}
            <circle cx="480" cy="470" r="6" className="radar-ping purple-ping" fill="none" />
            <circle cx="480" cy="470" r="6" className="radar-ping purple-ping delay-1" fill="none" />
            <circle cx="480" cy="470" r="6" fill="#ffffff" filter="url(#glowPurple)" />
            <circle cx="480" cy="470" r="2.5" fill="#4B1F8C" />

            {/* Milestone Node 3: Teal line dip at (220, 620) */}
            <circle cx="220" cy="620" r="5" className="radar-ping teal-ping delay-1" fill="none" />
            <circle cx="220" cy="620" r="5" fill="#3CC3BF" filter="url(#glowTeal)" />
            <circle cx="220" cy="620" r="2.2" fill="#ffffff" />

            {/* Milestone Node 4: Teal line dip at (480, 510) */}
            <circle cx="480" cy="510" r="4.5" fill="#3CC3BF" opacity="0.9" />
          </g>
        </svg>

        <div className="login-art-content">
          <div className="brandrow">
            <div className="hero-logo-badge">
              <img src="/wegrow-logo.webp" alt="WeGrow B School" className="hero-logo-img" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em' }}>WeGrow B School</div>
              <div style={{ fontSize: 13, color: '#C4B7EC' }}>Business Transformation &amp; Management Consulting</div>
            </div>
          </div>

          <div>
            <h1>Every decision, session and milestone of your transformation in one place.</h1>
            <p>
              Your action plan, consulting sessions, reports and progress — shared openly between your leadership team and your WeGrow consultants.
            </p>
            <div className="stats">
              <div>
                <b>6-month</b>
                <span>structured action plans</span>
              </div>
              <div>
                <b>Live</b>
                <span>progress tracking</span>
              </div>
              <div>
                <b>Private</b>
                <span>to your company only</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#9C8FC8' }}>
            © 2026 WeGrow B School
          </div>
        </div>
      </section>

      <section className="login-form">
        <form className="box" onSubmit={handleSubmit} noValidate>
          <div className="login-form-brand">
            <img src="/wegrow-logo.webp" alt="WeGrow B School" />
          </div>
          <h2>Welcome back</h2>
          <p className="muted" style={{ margin: '0 0 26px' }}>
            Access your business transformation journey.
          </p>

          {error && (
            <div className="err" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="em">Email or Client ID</label>
            <input
              className="input"
              id="em"
              autoComplete="username"
              placeholder="you@company.com or Client ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              className="input"
              id="pw"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="row-between" style={{ margin: '4px 0 22px' }}>
            <label className="check">
              <input
                type="checkbox"
                id="rm"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={onForgotPw}
              className="small"
              style={{ fontWeight: 600, background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          <button className="btn primary block" type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Log in to client portal'}
          </button>
        </form>
      </section>
    </div>
  );
};

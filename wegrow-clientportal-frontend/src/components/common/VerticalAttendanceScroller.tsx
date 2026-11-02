import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../../types';
import { Icon } from './Icons';

interface VerticalAttendanceScrollerProps {
  attendees: AttendanceRecord[];
  title?: string;
  height?: number | string;
  isProjector?: boolean;
}

export const VerticalAttendanceScroller: React.FC<VerticalAttendanceScrollerProps> = ({
  attendees,
  title = 'Live Attendance Stream',
  height = 360,
  isProjector = false
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  const speedSeconds = {
    slow: 35,
    normal: 20,
    fast: 10
  }[speed];

  const formatTime = (iso?: string) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  // Duplicate items for continuous smooth looping
  const displayItems = useMemo(() => {
    if (attendees.length === 0) return [];
    if (attendees.length < 5) {
      // Repeat more times if few items so there is enough height for continuous scrolling
      return [...attendees, ...attendees, ...attendees, ...attendees];
    }
    return [...attendees, ...attendees];
  }, [attendees]);

  return (
    <div
      style={{
        background: isProjector ? '#0B0F19' : 'var(--ink, #120C24)',
        color: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        height: height,
        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Scroller Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 10px #10B981'
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.02em', color: '#F3F4F6' }}>
            {title} ({attendees.length} Checked In)
          </span>
          <span className="badge b-ok" style={{ fontSize: 10, padding: '2px 6px' }}>
            ↑ Scrolling Bottom to Top
          </span>
        </div>

        {/* Controls: Speed & Pause */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setIsPaused(!isPaused)}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              background: isPaused ? '#EF4444' : 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer'
            }}
            title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: 2 }}>
            {(['slow', 'normal', 'fast'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  background: speed === s ? 'var(--brand, #7C3AED)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontWeight: speed === s ? 700 : 400
                }}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroller Viewport (Masked with top/bottom fade gradient) */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {attendees.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: `scrollUpContinuous ${speedSeconds}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          >
            {displayItems.map((att, idx) => (
              <div
                key={`${att.id || att.phone}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'background 0.2s ease, transform 0.2s ease'
                }}
              >
                {/* Left: Time and Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🕒 {formatTime(att.checkedInAt)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
                      {att.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {att.designation} {att.company ? `· ${att.company}` : ''}
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & WhatsApp indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: '#6EE7B7',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: 12
                    }}
                  >
                    💬 {att.whatsapp || att.phone}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#34D399',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    ✓ Checked In
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              textAlign: 'center',
              padding: 20
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
            <div style={{ fontWeight: 600, color: '#E5E7EB', marginBottom: 4 }}>
              Waiting for Participants to Scan QR Code
            </div>
            <div style={{ fontSize: 12, maxWidth: 300 }}>
              Team members scan the QR code with their mobile phone cameras to check in. As they submit, their names will scroll upwards line by line here!
            </div>
          </div>
        )}
      </div>

      {/* CSS Keyframe for smooth vertical bottom-to-top infinite scrolling */}
      <style>{`
        @keyframes scrollUpContinuous {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
};


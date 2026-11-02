import React, { useState, useMemo } from 'react';
import { SessionFeedback } from '../../types';
import { fmt, fmtL, TODAY } from '../../utils/date';
import { FeedbackDetailModal } from '../modals/FeedbackDetailModal';

interface VerticalFeedbackScrollerProps {
  feedbackList: { f: SessionFeedback; c?: any; s?: any }[];
  title?: string;
  height?: number | string;
}

export const VerticalFeedbackScroller: React.FC<VerticalFeedbackScrollerProps> = ({
  feedbackList,
  title = 'Live Feedback Completed Stream',
  height = 340
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [selectedItem, setSelectedItem] = useState<{ f: SessionFeedback; c?: any; s?: any } | null>(null);

  const speedSeconds = {
    slow: 40,
    normal: 22,
    fast: 12
  }[speed];

  const renderStars = (rating: number) => {
    return (
      <span style={{ color: '#F59E0B', fontSize: 13, letterSpacing: '2px' }}>
        {'★'.repeat(Math.max(1, Math.min(5, rating)))}
        <span style={{ opacity: 0.3 }}>{'★'.repeat(Math.max(0, 5 - rating))}</span>
      </span>
    );
  };

  // Duplicate for smooth continuous looping
  const displayItems = useMemo(() => {
    if (feedbackList.length === 0) return [];
    if (feedbackList.length < 4) {
      return [...feedbackList, ...feedbackList, ...feedbackList, ...feedbackList];
    }
    return [...feedbackList, ...feedbackList];
  }, [feedbackList]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #16102B 0%, #0F0A1E 100%)',
        color: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        height: height,
        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
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
              background: '#8B5CF6',
              display: 'inline-block',
              boxShadow: '0 0 10px #8B5CF6'
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F3F4F6' }}>
            {title} ({feedbackList.length} Completed)
          </span>
          <span className="badge b-teal" style={{ fontSize: 10, padding: '2px 6px' }}>
            ↑ Scrolling Bottom to Top
          </span>
        </div>

        {/* Controls */}
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
                  background: speed === s ? '#8B5CF6' : 'transparent',
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

      {/* Viewport Masked */}
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
        {feedbackList.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: `feedbackScrollUp ${speedSeconds}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          >
            {displayItems.map(({ f, c, s }, idx) => (
              <div
                key={`${f.session || idx}-${idx}`}
                onClick={() => setSelectedItem({ f, c, s })}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
                title="Click to view full feedback form & message"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {f.attendeeName || c?.contact || 'Participant'} 📝
                    </span>
                    <span style={{ fontSize: 12, color: '#A78BFA', marginLeft: 8 }}>
                      ({f.attendeeRole || 'Team Member'}{c?.company ? ` · ${c.company}` : ''})
                    </span>
                  </div>
                  <div>{renderStars(f.rating)}</div>
                </div>

                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                  Session: <b>{s?.title || f.session}</b> · {fmt(f.date || TODAY)}
                </div>

                {(f.useful || f.comments) && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#E5E7EB',
                      background: 'rgba(139, 92, 246, 0.1)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontStyle: 'italic',
                      lineHeight: 1.4
                    }}
                  >
                    "{f.comments || f.useful}"
                  </div>
                )}
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
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <div style={{ fontWeight: 600, color: '#E5E7EB', marginBottom: 4 }}>
              Waiting for Completed Feedback Submissions
            </div>
            <div style={{ fontSize: 12, maxWidth: 320 }}>
              When participants submit their ratings and reviews via their WhatsApp link, their names, stars, and comments will scroll line by line from bottom to top here!
            </div>
          </div>
        )}
      </div>

      {/* Keyframe Animation */}
      <style>{`
        @keyframes feedbackScrollUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>

      {/* Detail Modal */}
      {selectedItem && (
        <FeedbackDetailModal
          feedback={selectedItem.f}
          client={selectedItem.c}
          session={selectedItem.s}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};


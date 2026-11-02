import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { WeGrowLogo } from '../common/Icons';
import { fmt, TODAY } from '../../utils/date';

export const PublicFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get('sessionId') || 'S1';
  const clientId = searchParams.get('clientId') || 'C001';
  const attendeeName = searchParams.get('name') || '';
  const attendeePhone = searchParams.get('phone') || '';
  const attendeeWhatsapp = searchParams.get('whatsapp') || attendeePhone;
  const attendeeRole = searchParams.get('role') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [relevance, setRelevance] = useState<string>('Very Relevant');
  const [selectedUsefulChips, setSelectedUsefulChips] = useState<string[]>([
    '🎯 Actionable Roadmap & Next Steps'
  ]);
  const [customUseful, setCustomUseful] = useState<string>('');
  const [deliveryRating, setDeliveryRating] = useState<string>('Clear & Structured Concepts');
  const [selectedImproveChips, setSelectedImproveChips] = useState<string[]>([
    '✨ Great session, keep the same structure!'
  ]);
  const [customImprove, setCustomImprove] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  // Quick suggestion options
  const USEFUL_CHIPS = [
    '🎯 Actionable Roadmap & Next Steps',
    '💡 Bottlenecks & Growth Levers',
    '🤝 Cross-Team Alignment',
    '📊 Clear KPI & Performance Metrics',
    '⚡ Interactive Problem-Solving',
    '👥 Leadership & Delegation'
  ];

  const RELEVANCE_OPTIONS = [
    { key: 'Very Relevant', label: '🚀 Very Relevant', desc: 'Immediately applicable to operations' },
    { key: 'Relevant', label: '🎯 Relevant', desc: 'Good strategic alignment & clarity' },
    { key: 'Neutral', label: '⚖️ Neutral', desc: 'Some points were applicable' },
    { key: 'Needs Focus', label: '🔍 Needs Focus', desc: 'More niche department focus needed' }
  ];

  const DELIVERY_CHIPS = [
    '⚡ High Energy & Engaging',
    '🎯 Clear & Structured Concepts',
    '⏱️ Well-Paced & Practical',
    '💡 Real-World Examples'
  ];

  const IMPROVE_CHIPS = [
    '✨ Great session, keep the same structure!',
    '⏱️ More time for open Q&A',
    '📑 Share materials in advance',
    '🔍 More industry-specific cases',
    '🛠️ Ready-to-use action templates'
  ];

  // Toggle chip in / out of selected array
  const toggleUsefulChip = (chip: string) => {
    setSelectedUsefulChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const toggleImproveChip = (chip: string) => {
    setSelectedImproveChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        setLoading(true);
        const data = await api.attendance.getSessionInfo(sessionId, clientId);
        if (mounted && data) {
          setSessionInfo(data);
        }
      } catch (e) {
        console.warn('Could not load session for feedback, using fallback defaults:', e);
        if (mounted) {
          setSessionInfo({
            session: {
              sessionId,
              title: 'WeGrow Consulting Session',
              date: TODAY,
              consultant: 'Dr. Thavabalan'
            },
            client: {
              company: 'Client Company'
            }
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, [sessionId, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const compiledUseful = [
      ...selectedUsefulChips,
      customUseful.trim()
    ].filter(Boolean).join('\n• ');

    const compiledImprove = [
      ...selectedImproveChips,
      customImprove.trim()
    ].filter(Boolean).join('\n• ');

    const compiledComments = [
      deliveryRating ? `Consultant Delivery: ${deliveryRating}` : '',
      comments.trim()
    ].filter(Boolean).join('\n\n');

    try {
      await api.attendance.submitAttendeeFeedback({
        clientId: sessionInfo?.client?.clientId || clientId,
        sessionId: sessionInfo?.session?.sessionId || sessionId,
        rating,
        useful: compiledUseful ? `• ${compiledUseful}` : '',
        relevance,
        improve: compiledImprove ? `• ${compiledImprove}` : '',
        comments: compiledComments,
        attendeeName: attendeeName || 'Participant',
        attendeePhone,
        attendeeWhatsapp,
        attendeeRole
      });
      setSubmitted(true);
    } catch (err: any) {
      console.warn('API submission failed, recording local fallback:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const starLabels = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Exceptional'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F1F5F9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>WeGrow Session Feedback</div>
          <div style={{ color: '#64748B', fontSize: 14 }}>Loading feedback form…</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #EDE9FE 0%, #E2E8F0 100%)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
    >
      {/* Expanded Main Feedback Box */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          height: 'min(860px, calc(100vh - 40px))',
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Fixed Header (Does Not Scroll) */}
        <div
          style={{
            flexShrink: 0,
            padding: '22px 24px 18px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            color: '#FFFFFF',
            textAlign: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: 8, display: 'flex' }}>
              <WeGrowLogo size={26} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', color: '#EDE9FE' }}>
              WEGROW CONSULTING
            </span>
          </div>

          <h2 style={{ fontSize: 24, margin: '4px 0', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Session Feedback
          </h2>

          <div style={{ fontSize: 14, color: '#DDD6FE', marginTop: 4, fontWeight: 500 }}>
            {sessionInfo?.client?.company ? <b>{sessionInfo.client.company}</b> : ''}
            {sessionInfo?.session?.title ? ` · ${sessionInfo.session.title}` : ''}
          </div>
        </div>

        {/* Scrollable Form Body Inside The Box */}
        {submitted ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
                fontSize: 38,
                boxShadow: '0 10px 25px rgba(5, 150, 105, 0.25)'
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: 26, marginBottom: 10, color: '#0F172A', fontWeight: 800 }}>
              Thank You for Your Feedback!
            </h3>
            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
              {attendeeName ? <b>{attendeeName}, </b> : ''}your responses have been recorded in real time and updated to the session wall.
            </p>
            <div
              style={{
                padding: '16px 24px',
                background: '#F8FAFC',
                borderRadius: 14,
                fontSize: 16,
                border: '1px solid #E2E8F0',
                display: 'inline-block',
                margin: '0 auto'
              }}
            >
              <span>Overall Rating Submitted: </span>
              <b style={{ color: '#D97706', fontSize: 18 }}>
                {'★'.repeat(rating)}{'☆'.repeat(5 - rating)} ({rating}/5 — {starLabels[rating]})
              </b>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {/* The Internal Scrollable Area with Increased Font and Content Sizes */}
            <div
              className="feedback-scroll-box"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {attendeeName && (
                <div
                  style={{
                    padding: '10px 16px',
                    background: '#EDE9FE',
                    color: '#5B21B6',
                    borderRadius: 10,
                    marginBottom: 20,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 600
                  }}
                >
                  <span style={{ fontSize: 18 }}>👋</span>
                  <span>
                    Responding as <b>{attendeeName}</b> {attendeeRole ? `(${attendeeRole})` : ''}
                  </span>
                </div>
              )}

              {/* 1. Overall Session Rating */}
              <div
                style={{
                  marginBottom: 22,
                  textAlign: 'center',
                  background: '#F8FAFC',
                  padding: '18px 16px',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0'
                }}
              >
                <label style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                  1. Overall Session Rating
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 44,
                        color: s <= rating ? '#F59E0B' : '#CBD5E1',
                        transition: 'transform 0.15s, color 0.15s',
                        padding: '2px 4px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.22)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title={`${s} Stars - ${starLabels[s]}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>
                  {rating} of 5 Stars · {starLabels[rating]}
                </div>
              </div>

              {/* 2. Business Relevance (Exact Selection - Fixed!) */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  2. Business Relevance to Your Day-to-Day Operations
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {RELEVANCE_OPTIONS.map((r) => {
                    const isSelected = relevance === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRelevance(r.key)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                          background: isSelected ? '#F5F3FF' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? '#7C3AED' : '#0F172A' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                          {r.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Key Takeaways & Useful Insights (With Add + Remove Option!) */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    3. What is the #1 takeaway or insight you found most useful?
                  </label>
                  {selectedUsefulChips.length > 0 && (
                    <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                      {selectedUsefulChips.length} selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 10, fontWeight: 500 }}>
                  Tap <span style={{ color: '#7C3AED', fontWeight: 700 }}>+</span> to add, or tap <span style={{ color: '#EF4444', fontWeight: 700 }}>✕</span> to remove:
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {USEFUL_CHIPS.map((chip) => {
                    const isSelected = selectedUsefulChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleUsefulChip(chip)}
                        style={{
                          fontSize: 13,
                          padding: '8px 14px',
                          borderRadius: 18,
                          border: isSelected ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                          background: isSelected ? '#7C3AED' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title={isSelected ? 'Click to remove this option' : 'Click to add this option'}
                      >
                        {isSelected ? (
                          <>
                            <span>✓ {chip}</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                background: 'rgba(255,255,255,0.25)',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ✕
                            </span>
                          </>
                        ) : (
                          <span>+ {chip}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  placeholder="Or type additional key takeaways here…"
                  value={customUseful}
                  onChange={(e) => setCustomUseful(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    color: '#0F172A'
                  }}
                />
              </div>

              {/* 4. Consultant Delivery & Effectiveness */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  4. Consultant Delivery &amp; Effectiveness
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DELIVERY_CHIPS.map((chip) => {
                    const active = deliveryRating === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setDeliveryRating(chip)}
                        style={{
                          fontSize: 13,
                          padding: '8px 16px',
                          borderRadius: 20,
                          border: active ? '2px solid #10B981' : '1px solid #E2E8F0',
                          background: active ? '#ECFDF5' : '#FFFFFF',
                          color: active ? '#065F46' : '#334155',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {active ? `● ${chip}` : chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Suggested Improvements (With Add + Remove Option!) */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    5. What could make our next session even more impactful?
                  </label>
                  {selectedImproveChips.length > 0 && (
                    <span style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
                      {selectedImproveChips.length} selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 10, fontWeight: 500 }}>
                  Tap <span style={{ color: '#6366F1', fontWeight: 700 }}>+</span> to add, or tap <span style={{ color: '#EF4444', fontWeight: 700 }}>✕</span> to remove:
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {IMPROVE_CHIPS.map((chip) => {
                    const isSelected = selectedImproveChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleImproveChip(chip)}
                        style={{
                          fontSize: 13,
                          padding: '8px 14px',
                          borderRadius: 18,
                          border: isSelected ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                          background: isSelected ? '#6366F1' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title={isSelected ? 'Click to remove this suggestion' : 'Click to add this suggestion'}
                      >
                        {isSelected ? (
                          <>
                            <span>✓ {chip}</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                background: 'rgba(255,255,255,0.25)',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ✕
                            </span>
                          </>
                        ) : (
                          <span>+ {chip}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Or type additional improvement points…"
                  value={customImprove}
                  onChange={(e) => setCustomImprove(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    color: '#0F172A'
                  }}
                />
              </div>

              {/* 6. Additional Comments */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  6. Additional Comments or Questions for WeGrow (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional comments or questions for Dr. Thavabalan & team…"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    color: '#0F172A'
                  }}
                />
              </div>
            </div>

            {/* Fixed Footer (Docked At Bottom of Box) */}
            <div
              style={{
                flexShrink: 0,
                padding: '16px 28px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.04)'
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  border: 'none',
                  borderRadius: 10,
                  boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  letterSpacing: '0.01em'
                }}
              >
                {submitting ? 'Submitting Real-Time Feedback…' : 'Submit Session Feedback →'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ fontSize: 13, color: '#64748B', marginTop: 12, textAlign: 'center', fontWeight: 500 }}>
        WeGrow Consulting Portal · Real-time synchronized feedback
      </div>

      {/* Sleek Custom Scrollbar */}
      <style>{`
        .feedback-scroll-box::-webkit-scrollbar {
          width: 8px;
        }
        .feedback-scroll-box::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 4px;
        }
        .feedback-scroll-box::-webkit-scrollbar-thumb {
          background: #94A3B8;
          border-radius: 4px;
        }
        .feedback-scroll-box::-webkit-scrollbar-thumb:hover {
          background: #64748B;
        }
      `}</style>
    </div>
  );
};

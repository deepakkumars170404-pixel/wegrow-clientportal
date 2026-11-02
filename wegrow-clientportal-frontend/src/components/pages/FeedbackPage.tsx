import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { fmt } from '../../utils/date';
import { WhatsAppFeedbackDispatchTable } from '../common/WhatsAppFeedbackDispatchTable';
import { VerticalFeedbackScroller } from '../common/VerticalFeedbackScroller';
import { FeedbackDetailModal } from '../modals/FeedbackDetailModal';
import { SessionFeedback } from '../../types';

interface FeedbackPageProps {
  onGiveFeedback: (sessionId: string) => void;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ onGiveFeedback }) => {
  const { client } = usePortal();
  const [selectedFeedback, setSelectedFeedback] = useState<{ f: SessionFeedback; session?: any } | null>(null);
  if (!client) return null;

  const isSessionEvaluated = (s: any) =>
    client.feedback.some(
      (f) =>
        f.session === s.id ||
        (s.sessionId && f.session === s.sessionId) ||
        (f.session && f.session.replace('S0', 'S') === s.id) ||
        (s.sessionId && f.session.replace('S0', 'S') === s.sessionId) ||
        (s._id && f.session === s._id)
    );

  const pendingFeedbackList = client.sessions.filter(
    (s) => s.status === 'Completed' && !isSessionEvaluated(s)
  );

  const submittedFeedback = [...client.feedback].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const clientFeedbackStream = submittedFeedback.map((f) => ({
    f,
    c: client,
    s: client.sessions.find(
      (x) =>
        x.id === f.session ||
        x.sessionId === f.session ||
        (x.sessionId && x.sessionId === f.session.replace('S0', 'S')) ||
        x._id === f.session
    )
  }));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Session feedback</h1>
          <p>Real-time ratings and attendee feedback submitted during and after consulting sessions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge b-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Live Sync Active
          </span>
        </div>
      </div>

      {pendingFeedbackList.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <h3>Waiting for your feedback</h3>
            <span className="badge b-teal">{pendingFeedbackList.length}</span>
          </div>
          {pendingFeedbackList.map((s) => (
            <div key={s.id} className="li">
              <div className="grow">
                <div className="ttl">{s.title}</div>
                <div className="sub">
                  {fmt(s.date)} · {s.mode}
                </div>
              </div>
              <button className="btn sm teal" onClick={() => onGiveFeedback(s.id)}>
                Give feedback
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vertical Bottom-to-Top Scrolling Live Completed Feedback Stream */}
      <div style={{ marginBottom: 20 }}>
        <VerticalFeedbackScroller
          feedbackList={clientFeedbackStream}
          title="Completed Feedback Stream (Bottom to Top)"
          height={280}
        />
      </div>

      {/* Session Attendees & WhatsApp Feedback Dispatch Table */}
      <WhatsAppFeedbackDispatchTable
        clientId={client.id || (client as any).clientId}
        isAdmin={false}
      />

      <div className="card mt">
        <div className="card-head">
          <h3>Submitted feedback</h3>
        </div>
        {submittedFeedback.length > 0 ? (
          submittedFeedback.map((f, idx) => {
            const s = client.sessions.find(
              (x) =>
                x.id === f.session ||
                x.sessionId === f.session ||
                (x.sessionId && x.sessionId === f.session.replace('S0', 'S')) ||
                x._id === f.session
            );
            return (
              <div
                key={idx}
                className="li"
                style={{
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  borderRadius: 8,
                  padding: '14px',
                  transition: 'background 0.15s ease'
                }}
                onClick={() => setSelectedFeedback({ f, session: s })}
                title="Click to view full feedback form & message"
              >
                <div className="grow">
                  <div className="row-between">
                    <div className="ttl" style={{ color: 'var(--brand, #5B21B6)', textDecoration: 'underline' }}>
                      {s ? s.title : f.session}
                    </div>
                    <span style={{ color: '#E0A526', whiteSpace: 'nowrap' }}>
                      {'★'.repeat(f.rating)}
                      <span style={{ color: 'var(--line-2)' }}>{'★'.repeat(5 - f.rating)}</span>
                    </span>
                  </div>
                  <div className="sub">
                    {fmt(f.date)} · {f.relevance}
                    {f.attendeeName && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: 'var(--brand, #5B21B6)',
                          fontWeight: 700,
                          background: '#EDE9FE',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12
                        }}
                      >
                        👤 {f.attendeeName} {f.attendeeRole ? `(${f.attendeeRole})` : ''} · 👁️ View Form
                      </span>
                    )}
                  </div>
                  {f.useful && (
                    <div className="small" style={{ marginTop: 6 }}>
                      <b>Useful:</b> {f.useful}
                    </div>
                  )}
                  {f.improve && (
                    <div className="small">
                      <b>Improve:</b> {f.improve}
                    </div>
                  )}
                  {f.comments && <div className="small muted">"{f.comments}"</div>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <b>No feedback yet</b>
            Rate a completed session to see it here.
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback.f}
          client={client}
          session={selectedFeedback.session}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </>
  );
};

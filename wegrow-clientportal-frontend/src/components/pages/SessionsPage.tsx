import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { fmt, fmtL, D } from '../../utils/date';

interface SessionsPageProps {
  onOpenSession: (id: string) => void;
  onGiveFeedback: (id: string) => void;
  onOpenQRAttendance?: (session: any) => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  onOpenSession,
  onGiveFeedback,
  onOpenQRAttendance
}) => {
  const { client, loading, showToast } = usePortal();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');

  if (!client) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 24px', margin: '40px auto', maxWidth: 560 }}>
        <div style={{ display: 'inline-block', width: 34, height: 34, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
        <h3 style={{ marginTop: 16 }}>Loading sessions…</h3>
        <p className="muted" style={{ maxWidth: '45ch', margin: '8px auto 20px' }}>
          Retrieving transformation sessions schedule…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const upcomingSessions = client.sessions.filter((s) => s.status === 'Upcoming');
  const completedSessions = [...client.sessions]
    .filter((s) => s.status === 'Completed')
    .reverse();

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Consulting sessions</h1>
          <p>
            {completedSessions.length} completed, {upcomingSessions.length} scheduled with{' '}
            {client.consultant} and the WeGrow team.
          </p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={tab === 'upcoming' ? 'on' : ''}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button
          className={tab === 'history' ? 'on' : ''}
          onClick={() => setTab('history')}
        >
          Completed ({completedSessions.length})
        </button>
      </div>

      {tab === 'upcoming' ? (
        <div className="grid g2">
          {upcomingSessions.map((s) => (
            <div key={s.id} className="sess card">
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div className="date">
                  <div className="datebox">
                    <b>{D(s.date).getDate()}</b>
                    <span>
                      {
                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
                          D(s.date).getMonth()
                        ]
                      }
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                    <div className="small muted">{fmtL(s.date)}</div>
                  </div>
                </div>
                <span className={`badge ${s.mode === 'Online' ? 'b-info' : 'b-teal'}`}>
                  {s.mode}
                </span>
              </div>

              <div
                className="small"
                style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '16px 0' }}
              >
                <span>
                  <Icon name="clock" /> {s.time}
                </span>
                <span>
                  <Icon name={s.mode === 'Online' ? 'video' : 'pin'} /> {s.location}
                </span>
                <span>
                  <Icon name="user" /> Consultant: {s.consultant}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {s.mode === 'Online' && (
                  <button
                    className="btn sm primary"
                    onClick={() => showToast(`Opening meeting link for ${s.title}…`)}
                  >
                    <Icon name="video" />
                    Join session
                  </button>
                )}
                <button className="btn sm" onClick={() => onOpenSession(s.id)}>
                  View details
                </button>
                <button
                  className="btn sm"
                  onClick={() => onOpenQRAttendance?.(s)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--brand)',
                    borderColor: 'var(--brand)'
                  }}
                  title="Open QR Attendance Scanner & Live Wall"
                >
                  📱 QR Attendance &amp; Live Wall
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '8px 0' }}>
          <div className="tablewrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Your feedback</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map((s) => {
                  const fb = client.feedback.find((x) => x.session === s.id);
                  return (
                    <tr
                      key={s.id}
                      className="click"
                      onClick={() => onOpenSession(s.id)}
                    >
                      <td>
                        <b>{s.title}</b>
                      </td>
                      <td>{fmt(s.date)}</td>
                      <td>{s.mode}</td>
                      <td>{s.duration} min</td>
                      <td>
                        <span className="badge b-ok">
                          <Icon name="check" />
                          Completed
                        </span>
                      </td>
                      <td>
                        {fb ? (
                          <span style={{ color: '#E0A526' }}>
                            {'★'.repeat(fb.rating)}
                            <span className="muted">{'★'.repeat(5 - fb.rating)}</span>
                          </span>
                        ) : (
                          <button
                            className="btn sm teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGiveFeedback(s.id);
                            }}
                          >
                            Give feedback
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

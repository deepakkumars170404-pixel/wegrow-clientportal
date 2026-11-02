import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon, ClientLogo, WeGrowLogo } from '../common/Icons';
import { PhotoArt, BannerArt } from '../common/Charts';
import { fmt, fmtL, TODAY } from '../../utils/date';
import { SessionFeedback } from '../../types';

interface ModalContainerProps {
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({ onClose, wide, children }) => (
  <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
      {children}
    </div>
  </div>
);

// Session Modal
export const SessionModal: React.FC<{
  sessionId: string;
  onClose: () => void;
  onGiveFeedback: (id: string) => void;
  onOpenQRAttendance?: (session: any, clientId: string) => void;
}> = ({ sessionId, onClose, onGiveFeedback, onOpenQRAttendance }) => {
  const { client, showToast } = usePortal();
  if (!client) return null;

  const s = client.sessions.find((x) => x.id === sessionId);
  if (!s) return null;

  const idx = client.sessions.indexOf(s);
  const prev = client.sessions[idx - 1];
  const sm = s.summary;
  const f = client.feedback.find(
    (x) =>
      x.session === s.id ||
      (s.sessionId && x.session === s.sessionId) ||
      (s.sessionId && x.session === s.sessionId.replace('S', 'S0')) ||
      (s.sessionId && x.session.replace('S0', 'S') === s.sessionId) ||
      (s as any)._id === x.session
  );

  return (
    <ModalContainer onClose={onClose} wide>
      <div className="mh">
        <div>
          <span className={`badge ${s.status === 'Completed' ? 'b-ok' : 'b-brand'}`}>
            {s.status}
          </span>
          <h2 style={{ marginTop: 8 }}>{s.title}</h2>
          <div className="small muted">
            {fmtL(s.date)} · {s.time} · {s.mode}
          </div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <dl className="kv">
          <dt>Consultant</dt>
          <dd>{s.consultant}</dd>
          <dt>Location</dt>
          <dd>{s.location}</dd>
          <dt>Duration</dt>
          <dd>{s.duration} minutes</dd>
          {s.link && s.status !== 'Completed' && (
            <>
              <dt>Meeting link</dt>
              <dd>
                <a href={s.link} target="_blank" rel="noopener noreferrer">
                  {s.link}
                </a>
              </dd>
            </>
          )}
        </dl>

        {sm ? (
          <>
            <h4>Participants</h4>
            <div className="small">{sm.participants.join(' · ')}</div>

            <h4>Key discussions</h4>
            <ul className="small">
              {sm.discussions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>

            <h4>Key findings</h4>
            <ol className="small">
              {sm.findings.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>

            <h4>Decisions made</h4>
            <ul className="small">
              {sm.decisions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>

            <h4>Next steps</h4>
            <ul className="small">
              {sm.next.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h4>Agenda</h4>
            <ol className="small">
              {s.agenda.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
            <h4>Objective</h4>
            <div className="small">{s.objectives[0]}</div>
            {prev && prev.summary && (
              <>
                <h4>Previous session summary — {prev.title}</h4>
                <div className="small">{prev.summary.decisions.join('. ')}.</div>
              </>
            )}
            <h4>Notes</h4>
            <div className="small muted">Please review the pre-read and bring decisions on open items.</div>
          </>
        )}

        <h4>Attachments</h4>
        {s.attachments.map((a, i) => (
          <div key={i} className="li">
            <span className="fileic ft-pdf">PDF</span>
            <div className="grow">
              <div className="ttl">{a}</div>
            </div>
            <button
              className="btn sm ghost"
              onClick={() => showToast(`Downloading ${a}`)}
            >
              <Icon name="download" />
            </button>
          </div>
        ))}

        {s.status === 'Completed' && (
          <>
            <h4>Your feedback</h4>
            {f ? (
              <div className="small">
                <span style={{ color: '#E0A526' }}>{'★'.repeat(f.rating)}</span> · {f.relevance}
                {f.useful && ` — “${f.useful}”`}
              </div>
            ) : (
              <div className="small muted">Not submitted yet.</div>
            )}
          </>
        )}
      </div>

      <div className="mf">
        <button
          className="btn"
          style={{
            borderColor: 'var(--brand)',
            color: 'var(--brand)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          onClick={() => {
            onClose();
            onOpenQRAttendance?.(s, client.id || (client as any).clientId || 'C001');
          }}
        >
          📱 QR Attendance &amp; Live Wall
        </button>
        {s.status === 'Completed' ? (
          <>
            {!f && (
              <button
                className="btn teal"
                onClick={() => {
                  onClose();
                  onGiveFeedback(s.id);
                }}
              >
                Give feedback
              </button>
            )}
            <button
              className="btn primary"
              onClick={() => showToast(`Downloading Session_Report_${s.id}.pdf`)}
            >
              <Icon name="download" />
              Download session report
            </button>
          </>
        ) : (
          <>
            {s.mode === 'Online' && (
              <button
                className="btn primary"
                onClick={() => showToast(`Opening meeting for ${s.title}…`)}
              >
                <Icon name="video" />
                Join session
              </button>
            )}
            <button
              className="btn"
              onClick={() => showToast(`${s.title} added to your calendar`)}
            >
              <Icon name="calendar" />
              Add to calendar
            </button>
          </>
        )}
      </div>
    </ModalContainer>
  );
};

// Action Item Modal
export const ActionModal: React.FC<{
  actionId: string;
  onClose: () => void;
}> = ({ actionId, onClose }) => {
  const { client, addActionComment, showToast } = usePortal();
  const [commentText, setCommentText] = useState('');

  if (!client) return null;
  const a = client.actions.find((x) => x.id === actionId);
  if (!a) return null;
  const m = client.months[a.month - 1];

  const handleAddComment = () => {
    if (!commentText.trim()) {
      showToast('Type a comment first');
      return;
    }
    addActionComment(a.id, commentText.trim());
    setCommentText('');
  };

  return (
    <ModalContainer onClose={onClose}>
      <div className="mh">
        <div>
          <div className="small" style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Month {m.n} · {m.theme}
          </div>
          <h2 style={{ marginTop: 4 }}>{a.title}</h2>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span
            className={`badge ${
              a.status === 'Delayed'
                ? 'b-bad'
                : a.status === 'Completed'
                ? 'b-ok'
                : a.status === 'In Progress'
                ? 'b-info'
                : 'b-brand'
            }`}
          >
            <span className="dot" />
            {a.status}
          </span>
          <span className="badge b-warn">{a.priority} Priority</span>
          {a.status !== 'Completed' && a.due < TODAY && (
            <span className="badge b-bad">Past due</span>
          )}
        </div>

        <p className="small" style={{ margin: '0 0 16px' }}>
          {a.desc}
        </p>

        <dl className="kv">
          <dt>Assigned to</dt>
          <dd>{a.owner}</dd>
          <dt>Due date</dt>
          <dd>{fmtL(a.due)}</dd>
          <dt>Progress</dt>
          <dd>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="progress" style={{ flex: 1, maxWidth: 260 }}>
                <i style={{ width: `${a.progress}%` }} />
              </div>
              <b>{a.progress}%</b>
            </div>
          </dd>
        </dl>

        <h4>Comments</h4>
        {a.comments.length > 0 ? (
          a.comments.map((x, idx) => (
            <div key={idx} className="li">
              <span
                className="avatar"
                style={{
                  width: 30,
                  height: 30,
                  fontSize: 11,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)'
                }}
              >
                {x.by.split(' ').map((y) => y[0]).join('').slice(0, 2)}
              </span>
              <div className="grow">
                <div className="small">
                  <b>{x.by}</b> <span className="muted">· {fmt(x.date)}</span>
                </div>
                <div className="small">{x.text}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="small muted">No comments yet.</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            className="input"
            placeholder="Add a comment for your consultant"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
          />
          <button className="btn primary" onClick={handleAddComment}>
            <Icon name="send" />
          </button>
        </div>

        <h4>Attachments</h4>
        {a.attachments.length > 0 ? (
          a.attachments.map((name, i) => (
            <div key={i} className="li">
              <span className="fileic ft-pdf">DOC</span>
              <div className="grow">
                <div className="ttl">{name}</div>
              </div>
              <button
                className="btn sm ghost"
                onClick={() => showToast(`Downloading ${name}`)}
              >
                <Icon name="download" />
              </button>
            </div>
          ))
        ) : (
          <div className="small muted">No attachments.</div>
        )}
      </div>
    </ModalContainer>
  );
};

// Report Modal Preview
export const ReportModal: React.FC<{
  reportId: string;
  onClose: () => void;
}> = ({ reportId, onClose }) => {
  const { client, showToast } = usePortal();
  if (!client) return null;
  const r = client.reports.find((x) => x.id === reportId);
  if (!r) return null;

  return (
    <ModalContainer onClose={onClose} wide>
      <div className="mh">
        <div>
          <span className="badge b-brand">{r.cat}</span>
          <h2 style={{ marginTop: 8 }}>{r.name}</h2>
          <div className="small muted">
            {fmt(r.date)} · {r.pages} pages · prepared by {client.consultant}
          </div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 28, background: 'var(--bg)' }}>
          <div className="row-between">
            <ClientLogo client={client} size={32} />
            <WeGrowLogo size={32} />
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, margin: '24px 0 6px' }}>
            {r.name}
          </div>
          <div className="small muted">
            {client.company} · {fmt(r.date)}
          </div>
          <h4>Executive summary</h4>
          <p className="small">
            {r.desc} This preview shows the first page; download the PDF for the complete consulting report and appendices.
          </p>
          <h4>Headline numbers</h4>
          <div className="grid g3">
            {client.dept.slice(0, 3).map((d, i) => (
              <div key={i} className="card flat" style={{ padding: 14 }}>
                <div className="tiny muted">{d.k}</div>
                <div className="serif" style={{ fontSize: 26 }}>
                  {d.v}%
                </div>
                <div className="tiny up">+{d.v - d.prev} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mf">
        <button
          className="btn primary"
          onClick={() => showToast(`Downloading ${r.name.replace(/\W+/g, '_')}.pdf`)}
        >
          <Icon name="download" />
          Download PDF
        </button>
      </div>
    </ModalContainer>
  );
};

// Update Modal
export const UpdateModal: React.FC<{
  updateId: string;
  onClose: () => void;
  onNavigate: (page: string) => void;
}> = ({ updateId, onClose, onNavigate }) => {
  const { client } = usePortal();
  if (!client) return null;
  const u = client.updates.find((x) => x.id === updateId);
  if (!u) return null;

  return (
    <ModalContainer onClose={onClose}>
      <div className="mh">
        <div>
          <span className="badge b-brand">{u.type}</span>
          <h2 style={{ marginTop: 8 }}>{u.title}</h2>
          <div className="small muted">
            Posted {fmt(u.date)} · {u.cat} · {client.consultant}
          </div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <p style={{ margin: 0, maxWidth: '65ch', lineHeight: 1.6 }}>{u.body}</p>
      </div>

      <div className="mf">
        {u.type === 'Action Required' && (
          <button
            className="btn primary"
            onClick={() => {
              onClose();
              onNavigate('sessions');
            }}
          >
            Go to sessions
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </ModalContainer>
  );
};

// Event Modal
export const EventModal: React.FC<{
  eventId: string;
  onClose: () => void;
}> = ({ eventId, onClose }) => {
  const { client, toggleEventRegistration, isRegisteredForEvent } = usePortal();
  if (!client) return null;
  const e = client.events.find((x) => x.id === eventId);
  if (!e) return null;

  const isReg = isRegisteredForEvent(e.id);
  const past = e.date < TODAY;

  return (
    <ModalContainer onClose={onClose} wide>
      <div className="mh">
        <div />
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb" style={{ paddingTop: 6 }}>
        <div className="evbanner">
          <BannerArt hue={e.hue} title={e.title} />
        </div>
        <span className="badge b-teal">{e.type}</span>
        <h2 className="serif" style={{ fontWeight: 500, fontSize: 28, margin: '10px 0 4px' }}>
          {e.title}
        </h2>
        <dl className="kv" style={{ marginTop: 14 }}>
          <dt>Date</dt>
          <dd>{fmtL(e.date)}</dd>
          <dt>Time</dt>
          <dd>{e.time}</dd>
          <dt>Location</dt>
          <dd>{e.loc}</dd>
          <dt>Participants</dt>
          <dd>
            {e.participants} · {e.seats} seats
          </dd>
        </dl>
        <h4>About</h4>
        <p className="small" style={{ margin: 0 }}>
          {e.desc}
        </p>
        <h4>Agenda</h4>
        <ol className="small">
          {e.agenda.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
        <h4>Speakers</h4>
        <div className="small">
          {e.speakers.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      </div>

      <div className="mf">
        {past ? (
          <span className="small muted" style={{ marginRight: 'auto' }}>
            This event has ended.
          </span>
        ) : isReg ? (
          <>
            <span className="badge b-ok" style={{ marginRight: 'auto' }}>
              <Icon name="check" />
              You're registered
            </span>
            <button className="btn" onClick={() => toggleEventRegistration(e.id)}>
              Cancel registration
            </button>
          </>
        ) : (
          <button className="btn primary" onClick={() => toggleEventRegistration(e.id)}>
            Register for this event
          </button>
        )}
      </div>
    </ModalContainer>
  );
};

// Photo Modal
export const PhotoModal: React.FC<{
  photoId: string;
  onClose: () => void;
}> = ({ photoId, onClose }) => {
  const { client, showToast } = usePortal();
  if (!client) return null;
  const p = client.photos.find((x) => x.id === photoId);
  if (!p) return null;

  return (
    <ModalContainer onClose={onClose} wide>
      <div className="mh">
        <div>
          <span className="badge b-brand">{p.cat}</span>
          <h2 style={{ marginTop: 8 }}>{p.title}</h2>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <div className="photo big" style={{ cursor: 'default' }}>
          <PhotoArt hue={p.hue} seed={p.seed} w={800} h={500} />
        </div>
        <dl className="kv" style={{ marginTop: 16 }}>
          <dt>Date</dt>
          <dd>{fmtL(p.date)}</dd>
          <dt>Event</dt>
          <dd>{p.title}</dd>
          <dt>Description</dt>
          <dd>{p.desc}</dd>
        </dl>
      </div>

      <div className="mf">
        <button
          className="btn"
          onClick={() => showToast(`Downloading ${p.title.replace(/\W+/g, '_')}.jpg`)}
        >
          <Icon name="download" />
          Download
        </button>
      </div>
    </ModalContainer>
  );
};

// Document Preview Modal
export const DocumentModal: React.FC<{
  docName: string;
  onClose: () => void;
}> = ({ docName, onClose }) => {
  const { client, showToast } = usePortal();
  if (!client) return null;

  return (
    <ModalContainer onClose={onClose} wide>
      <div className="mh">
        <div>
          <h2 style={{ wordBreak: 'break-all' }}>{docName}</h2>
          <div className="small muted">{client.company} · confidential</div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 12,
            background: 'var(--bg)',
            padding: '40px 28px',
            textAlign: 'center'
          }}
        >
          <span
            className={`fileic ft-${docName.split('.').pop() || 'pdf'}`}
            style={{ margin: '0 auto 14px', width: 56, height: 64 }}
          >
            {(docName.split('.').pop() || 'pdf').toUpperCase()}
          </span>
          <div className="small muted">
            Document preview active. You can download the file below.
          </div>
        </div>
      </div>

      <div className="mf">
        <button className="btn primary" onClick={() => showToast(`Downloading ${docName}`)}>
          <Icon name="download" />
          Download
        </button>
      </div>
    </ModalContainer>
  );
};

// Feedback Form Modal
export const FeedbackModal: React.FC<{
  sessionId: string;
  onClose: () => void;
}> = ({ sessionId, onClose }) => {
  const { client, submitFeedback } = usePortal();
  const [rating, setRating] = useState(5);
  const [useful, setUseful] = useState('');
  const [relevance, setRelevance] = useState('Very Relevant');
  const [delivery, setDelivery] = useState('Clear & Structured Concepts');
  const [improve, setImprove] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const USEFUL_CHIPS = [
    '🎯 Actionable Roadmap & Next Steps',
    '💡 Bottlenecks & Growth Levers',
    '🤝 Cross-Team Alignment',
    '📊 Clear KPI & Performance Metrics',
    '⚡ Interactive Problem-Solving',
    '👥 Leadership & Delegation'
  ];

  const DELIVERY_CHIPS = [
    '⚡ High Energy & Engaging',
    '🎯 Clear & Structured Concepts',
    '⏱️ Well-Paced & Practical',
    '💡 Real-World Examples'
  ];

  const IMPROVE_CHIPS = [
    '⏱️ More time for open Q&A',
    '📑 Share materials in advance',
    '🔍 More industry-specific cases',
    '🛠️ Ready-to-use action templates',
    '✨ Great session, keep the same structure!'
  ];

  const handleToggleChip = (
    currentValue: string,
    setter: (val: string) => void,
    chipText: string
  ) => {
    if (currentValue.includes(chipText)) {
      const updated = currentValue
        .split('\n')
        .filter((line) => line.trim() !== chipText.trim())
        .join('\n');
      setter(updated.trim());
    } else {
      const updated = currentValue ? `${currentValue}\n• ${chipText}` : `• ${chipText}`;
      setter(updated);
    }
  };

  if (!client) return null;
  const s = client.sessions.find((x) => x.id === sessionId);
  if (!s) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Select a rating from 1 to 5 stars to submit.');
      return;
    }

    const compiledComments = [
      delivery ? `Consultant Delivery: ${delivery}` : '',
      comments.trim()
    ].filter(Boolean).join('\n\n');

    submitFeedback({
      session: s.id,
      rating,
      useful: useful.trim(),
      relevance,
      improve: improve.trim(),
      comments: compiledComments,
      date: TODAY
    });
    onClose();
  };

  const starLabels = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Exceptional'];

  return (
    <ModalContainer onClose={onClose}>
      <div className="mh">
        <div>
          <div className="small muted">
            {s.title} · {fmt(s.date)}
          </div>
          <h2>Session Feedback &amp; Review</h2>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <form className="mb" onSubmit={handleSubmit} style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: 4 }}>
        {error && (
          <div className="err" role="alert">
            {error}
          </div>
        )}

        {/* 1. Rating */}
        <div className="field" style={{ textAlign: 'center', background: 'var(--paper-sub, #F9FAFB)', padding: 14, borderRadius: 10 }}>
          <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>1. Overall Session Rating</label>
          <div className="stars" style={{ justifyContent: 'center', display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className={i <= rating ? 'on' : ''}
                onClick={() => setRating(i)}
                aria-label={`${i} stars`}
                style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: i <= rating ? '#F59E0B' : 'var(--line-2)' }}
              >
                ★
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginTop: 4 }}>
            {rating} of 5 — {starLabels[rating]}
          </div>
        </div>

        {/* 2. Business Relevance */}
        <div className="field">
          <label style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>2. Business Relevance</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { val: 'Very Relevant', lbl: '🚀 Very Relevant (immediately applicable)' },
              { val: 'Relevant', lbl: '🎯 Relevant (good strategic alignment)' },
              { val: 'Neutral', lbl: '⚖️ Neutral (some points applicable)' },
              { val: 'Not Relevant', lbl: '🔍 Needs more department focus' }
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRelevance(r.val)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: relevance === r.val ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: relevance === r.val ? 'var(--brand-mute, #F5F3FF)' : 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: 12,
                  fontWeight: relevance === r.val ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                {r.lbl}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Key Takeaway */}
        <div className="field">
          <label htmlFor="fu" style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>
            3. What was the #1 takeaway or insight you found most useful?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {USEFUL_CHIPS.map((chip) => {
              const active = useful.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleToggleChip(useful, setUseful, chip)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 14,
                    border: active ? '1px solid var(--brand)' : '1px solid var(--line)',
                    background: active ? 'var(--brand)' : 'var(--paper-sub)',
                    color: active ? '#FFFFFF' : 'var(--ink)',
                    cursor: 'pointer'
                  }}
                >
                  {active ? `✓ ${chip}` : `+ ${chip}`}
                </button>
              );
            })}
          </div>
          <textarea
            className="input"
            id="fu"
            rows={2}
            placeholder="Tap points above or type key takeaway…"
            value={useful}
            onChange={(e) => setUseful(e.target.value)}
          />
        </div>

        {/* 4. Consultant Delivery */}
        <div className="field">
          <label style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>
            4. Consultant Delivery &amp; Pace
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {DELIVERY_CHIPS.map((chip) => {
              const active = delivery === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDelivery(chip)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 14,
                    border: active ? '1.5px solid #10B981' : '1px solid var(--line)',
                    background: active ? '#ECFDF5' : 'var(--paper-sub)',
                    color: active ? '#065F46' : 'var(--ink)',
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {active ? `● ${chip}` : chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Suggestions for improvement */}
        <div className="field">
          <label htmlFor="fi" style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>
            5. What could make our next session even more impactful?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {IMPROVE_CHIPS.map((chip) => {
              const active = improve.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleToggleChip(improve, setImprove, chip)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 14,
                    border: active ? '1px solid #6366F1' : '1px solid var(--line)',
                    background: active ? '#6366F1' : 'var(--paper-sub)',
                    color: active ? '#FFFFFF' : 'var(--ink)',
                    cursor: 'pointer'
                  }}
                >
                  {active ? `✓ ${chip}` : `+ ${chip}`}
                </button>
              );
            })}
          </div>
          <textarea
            className="input"
            id="fi"
            rows={2}
            placeholder="Tap points above or type improvement area…"
            value={improve}
            onChange={(e) => setImprove(e.target.value)}
          />
        </div>

        {/* 6. Comments */}
        <div className="field">
          <label htmlFor="fc" style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>
            6. Additional comments or questions for WeGrow
          </label>
          <textarea
            className="input"
            id="fc"
            rows={2}
            placeholder="Optional comments…"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <button className="btn primary block" type="submit" style={{ padding: 12, fontSize: 14, fontWeight: 700 }}>
          Submit Session Feedback
        </button>
        <div className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
          Shared directly with Dr. Thavabalan &amp; your WeGrow consulting team.
        </div>
      </form>
    </ModalContainer>
  );
};

// Forgot Password Modal
export const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showToast } = usePortal();
  const [emailInput, setEmailInput] = useState('');

  return (
    <ModalContainer onClose={onClose}>
      <div className="mh">
        <h2>Reset your password</h2>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="mb">
        <div className="field">
          <label htmlFor="fe">Email or Client ID</label>
          <input
            className="input"
            id="fe"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          We will email a reset link to the address WeGrow has on file for your company.
        </p>
      </div>

      <div className="mf">
        <button
          className="btn primary"
          onClick={() => {
            onClose();
            showToast('Reset link sent if the account exists');
          }}
        >
          Send reset link
        </button>
      </div>
    </ModalContainer>
  );
};

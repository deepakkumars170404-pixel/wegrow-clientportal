import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortal } from '../../context/PortalContext';
import { Icon, ClientLogo } from '../common/Icons';
import { fmt, fmtS, fmtL, TODAY, D, MON, addDays } from '../../utils/date';
import { ClientData, ActionStatus, ActionPriority, BusinessUpdate } from '../../types';
import { HorizontalBars, LineChart } from '../common/Charts';
import { WhatsAppFeedbackDispatchTable } from '../common/WhatsAppFeedbackDispatchTable';
import { VerticalFeedbackScroller } from '../common/VerticalFeedbackScroller';
import { FeedbackDetailModal } from '../modals/FeedbackDetailModal';

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------
const overallProgress = (c: ClientData): number =>
  c.actions?.length
    ? Math.round(
        c.actions.reduce((s, x) => s + (Number(x.progress) || 0), 0) /
          c.actions.length
      )
    : 0;

const monthProgress = (c: ClientData, n: number): number => {
  const items = (c.actions || []).filter((a) => a.month === n);
  return items.length
    ? Math.round(
        items.reduce((s, a) => s + (Number(a.progress) || 0), 0) / items.length
      )
    : 0;
};

const currentMonth = (c: ClientData) => {
  const k = TODAY.slice(0, 7);
  return (
    c.months.find((m) => m.key === k) ||
    (c.months.length > 0 && k < c.months[0].key
      ? c.months[0]
      : c.months[c.months.length - 1]) || {
      n: 1,
      theme: 'Business Transformation',
      name: 'Month 1',
      key: k
    }
  );
};

const getScore = (c: ClientData) =>
  c.scoreHistory && c.scoreHistory.length
    ? c.scoreHistory[c.scoreHistory.length - 1].v
    : '—';

const isOverdue = (a: any) =>
  a.status !== 'Completed' && a.due && a.due < TODAY;

const nextSession = (c: ClientData) =>
  (c.sessions || []).find((s) => s.date >= TODAY && s.status === 'Upcoming');

const actionCounts = (c: ClientData) => {
  const r: Record<string, number> = {
    total: c.actions?.length || 0,
    Completed: 0,
    'In Progress': 0,
    'Under Review': 0,
    'Not Started': 0,
    Delayed: 0
  };
  (c.actions || []).forEach((a) => {
    if (r[a.status] !== undefined) r[a.status]++;
  });
  return r;
};

const attentionItems = (cl: ClientData[]) => {
  const out: Array<{
    c: ClientData;
    kind: 'task' | 'summary';
    sort: string;
    title: string;
    subtitle: string;
    item: any;
  }> = [];

  cl.forEach((c) => {
    (c.actions || [])
      .filter((a) => a.status === 'Delayed' || isOverdue(a))
      .forEach((a) =>
        out.push({
          c,
          kind: 'task',
          sort: a.due || TODAY,
          title: a.title,
          subtitle: `${a.status === 'Delayed' ? 'Delayed' : 'Overdue since ' + fmtS(a.due)} · ${a.owner}`,
          item: a
        })
      );

    (c.sessions || [])
      .filter((s) => s.date < TODAY && s.status !== 'Cancelled' && !s.summary)
      .forEach((s) =>
        out.push({
          c,
          kind: 'summary',
          sort: s.date,
          title: s.title,
          subtitle: `Held ${fmtS(s.date)} · summary not published`,
          item: s
        })
      );
  });

  return out.sort((a, b) => String(a.sort).localeCompare(String(b.sort)));
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    'Not Started': 'b-mute',
    'In Progress': 'b-info',
    'Under Review': 'b-brand',
    Completed: 'b-ok',
    Delayed: 'b-bad'
  };
  return (
    <span className={`badge ${map[s] || 'b-mute'}`}>
      <span className="dot" />
      {s}
    </span>
  );
};

const prioBadge = (p: string) => {
  const map: Record<string, string> = {
    High: 'b-bad',
    Medium: 'b-warn',
    Low: 'b-mute'
  };
  return <span className={`badge ${map[p] || 'b-mute'}`}>{p}</span>;
};

const renderStars = (rating: number) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ color: '#E0A526', whiteSpace: 'nowrap', fontSize: 14 }}>
      {'★'.repeat(r)}
      <span style={{ color: 'var(--line-2)' }}>{'★'.repeat(5 - r)}</span>
    </span>
  );
};

const typeTone: Record<string, [string, string]> = {
  'General Update': ['b-mute', 'updates'],
  'Important Update': ['b-info', 'alert'],
  'Action Required': ['b-bad', 'flag'],
  Milestone: ['b-ok', 'target'],
  Recommendation: ['b-teal', 'spark']
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// =============================================================
// 1. ADMIN OVERVIEW PAGE
// =============================================================
export const AdminOverviewPage: React.FC<{
  onNavigate: (page: string) => void;
  onOpenAddClient: () => void;
  onOpenAssignTask: (clientId?: string, month?: number, action?: any) => void;
  onOpenScheduleSession: (clientId?: string, session?: any) => void;
  onOpenUpload: (clientId?: string) => void;
  onOpenBroadcast: () => void;
  onOpenSessionSummary?: (clientId: string, sessionId: string) => void;
  onOpenQRAttendance?: (session?: any, clientId?: string) => void;
}> = ({
  onNavigate,
  onOpenAddClient,
  onOpenAssignTask,
  onOpenScheduleSession,
  onOpenUpload,
  onOpenBroadcast,
  onOpenSessionSummary,
  onOpenQRAttendance
}) => {
  const { clients, user, loading } = usePortal();
  const navigate = useNavigate();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');

  const openActions = cl.flatMap((c) =>
    (c.actions || []).filter((a) => a.status !== 'Completed')
  );
  const overdueCount = openActions.filter(isOverdue).length;

  const in14 = addDays(TODAY, 14);
  const upcomingSessions = cl
    .flatMap((c) =>
      (c.sessions || [])
        .filter((s) => s.status === 'Upcoming' && s.date >= TODAY && s.date <= in14)
        .map((s) => ({ c, s }))
    )
    .sort((a, b) => a.s.date.localeCompare(b.s.date));

  const allFeedback = cl
    .flatMap((c) =>
      (c.feedback || []).map((f) => ({
        c,
        f,
        s: (c.sessions || []).find((x) => x.id === f.session)
      }))
    )
    .sort((a, b) => (b.f.date || '').localeCompare(a.f.date || ''));

  const avgRating = allFeedback.length
    ? (
        allFeedback.reduce((s, x) => s + x.f.rating, 0) / allFeedback.length
      ).toFixed(1)
    : '—';

  const att = attentionItems(cl);
  const avgProgress = cl.length
    ? Math.round(cl.reduce((s, c) => s + overallProgress(c), 0) / cl.length)
    : 0;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'Consultant'}
          </h1>
          <p>
            {fmtL(TODAY)} · {loading && cl.length === 0 ? 'Syncing active client portals…' : `${cl.length} active client portal${cl.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="qa">
          <button
            className="btn"
            style={{
              borderColor: 'var(--brand)',
              color: 'var(--brand)',
              fontWeight: 700,
              background: 'var(--brand-mute)'
            }}
            onClick={() => onOpenQRAttendance?.()}
            title="Launch QR Attendance & Live Scroller Wall"
          >
            📱 QR Attendance &amp; Live Wall
          </button>
          <button className="btn primary" onClick={() => onOpenAssignTask()}>
            <Icon name="plus" /> Assign task
          </button>
          <button className="btn" onClick={() => onOpenScheduleSession()}>
            <Icon name="calendar" /> Schedule session
          </button>
          <button className="btn" onClick={() => onOpenUpload()}>
            <Icon name="upload" /> Upload
          </button>
          <button className="btn" onClick={onOpenBroadcast}>
            <Icon name="send" /> Publish update
          </button>
        </div>
      </div>

      {cl.length === 0 ? (
        loading ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 34, height: 34, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Loading client transformation dossiers…</div>
            <div className="small muted" style={{ marginTop: 4 }}>Connecting live database records</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div className="card empty" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <b style={{ fontSize: 18 }}>No client portals yet</b>
            <p style={{ margin: '8px auto 20px', maxWidth: '46ch', color: 'var(--ink-3)' }}>
              Add your first client to initialize their private transformation portal.
            </p>
            <button className="btn primary" onClick={onOpenAddClient}>
              <Icon name="plus" /> Add a client
            </button>
          </div>
        )
      ) : (
        <>
          <section className="grid g4">
            <div className="card kpi">
              <div className="k-lbl">
                Active clients <Icon name="building" />
              </div>
              <div className="k-val">{cl.length}</div>
              <div className="k-sub">avg. progress {avgProgress}%</div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">
                Open action items <Icon name="plan" />
              </div>
              <div className="k-val">{openActions.length}</div>
              <div className="k-sub">
                {overdueCount ? (
                  <span style={{ color: 'var(--bad)', fontWeight: 700 }}>
                    {overdueCount} overdue
                  </span>
                ) : (
                  'none overdue'
                )}
              </div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">
                Sessions, next 14 days <Icon name="sessions" />
              </div>
              <div className="k-val">{upcomingSessions.length}</div>
              <div className="k-sub">
                {upcomingSessions[0]
                  ? `next: ${fmtS(upcomingSessions[0].s.date)}`
                  : 'nothing scheduled'}
              </div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">
                Avg. session rating <Icon name="star" />
              </div>
              <div className="k-val">
                {avgRating}
                <small>/5</small>
              </div>
              <div className="k-sub">{allFeedback.length} ratings received</div>
            </div>
          </section>

          <section className="grid g-dash mt">
            <div className="stack">
              <div className="card">
                <div className="card-head">
                  <h3>Needs your attention</h3>
                  <span className={`badge ${att.length ? 'b-bad' : 'b-ok'}`}>
                    {att.length ? `${att.length} pending` : 'All clear'}
                  </span>
                </div>
                {att.length > 0 ? (
                  att.slice(0, 8).map((x, i) => (
                    <div key={i} className="li">
                      <ClientLogo client={x.c} size={30} />
                      <div className="grow">
                        <b className="ttl">{x.title}</b>
                        <div className="sub">{x.subtitle}</div>
                        <div className="tiny muted">{x.c.company}</div>
                      </div>
                      {x.kind === 'task' ? (
                        <button
                          className="btn sm"
                          onClick={() => onOpenAssignTask(x.c.id, x.item.month, x.item)}
                        >
                          Update
                        </button>
                      ) : (
                        <button
                          className="btn sm primary"
                          onClick={() => {
                            if (onOpenSessionSummary) {
                              onOpenSessionSummary(x.c.id, x.item.id);
                            } else {
                              onOpenScheduleSession(x.c.id, x.item);
                            }
                          }}
                        >
                          Write summary
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="small muted">
                    Nothing overdue and every held session has a published summary.
                  </div>
                )}
                {att.length > 8 && (
                  <button
                    className="btn sm ghost"
                    style={{ marginTop: 8 }}
                    onClick={() => navigate('/admin/tasks')}
                  >
                    See all on the task board
                  </button>
                )}
              </div>

              <div className="card" style={{ padding: '8px 0' }}>
                <div className="card-head" style={{ padding: '14px 22px 0' }}>
                  <h3>Client portfolio</h3>
                  <button className="btn sm ghost" onClick={() => navigate('/admin/clients')}>
                    All clients
                  </button>
                </div>
                <div className="tablewrap">
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Month</th>
                        <th style={{ width: 150 }}>Progress</th>
                        <th>Open</th>
                        <th>Score</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cl.map((c) => {
                        const ac = actionCounts(c);
                        const ov = overallProgress(c);
                        return (
                          <tr
                            key={c.id}
                            className="click"
                            onClick={() => navigate(`/admin/client/${c.id}/overview`)}
                          >
                            <td>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <ClientLogo client={c} size={30} />
                                <div>
                                  <b>{c.company}</b>
                                  <div className="tiny muted">{c.consultant || 'WeGrow Team'}</div>
                                </div>
                              </div>
                            </td>
                            <td>{currentMonth(c).n} of 6</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div className="progress" style={{ flex: 1 }}>
                                  <i style={{ width: `${ov}%` }} />
                                </div>
                                <b className="small">{ov}%</b>
                              </div>
                            </td>
                            <td>
                              {ac.total - ac.Completed}
                              {ac.Delayed > 0 && (
                                <span className="badge b-bad" style={{ marginLeft: 6 }}>
                                  {ac.Delayed} delayed
                                </span>
                              )}
                            </td>
                            <td>{getScore(c)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="btn sm ghost">Manage</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <div className="card-head">
                  <h3>Upcoming sessions</h3>
                  <button className="btn sm ghost" onClick={() => navigate('/admin/sessions')}>
                    Schedule
                  </button>
                </div>
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.slice(0, 6).map(({ c, s }, i) => (
                    <div
                      key={i}
                      className="li clickable"
                      onClick={() => onOpenScheduleSession(c.id, s)}
                    >
                      <div className="datebox">
                        <b>{D(s.date).getDate()}</b>
                        <span>{MON[D(s.date).getMonth()]}</span>
                      </div>
                      <div className="grow">
                        <div className="ttl">{s.title}</div>
                        <div className="sub">
                          {c.company} · {s.time || s.mode}
                        </div>
                      </div>
                      <button
                        className="btn sm"
                        style={{
                          borderColor: 'var(--brand)',
                          color: 'var(--brand)',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQRAttendance?.(s, c.id || c.clientId);
                        }}
                        title="Launch QR Attendance & Live Wall"
                      >
                        📱 QR Code
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="small muted">No sessions in the next two weeks.</div>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <h3>Latest feedback</h3>
                  <button className="btn sm ghost" onClick={() => navigate('/admin/feedback')}>
                    All feedback
                  </button>
                </div>
                {allFeedback.length > 0 ? (
                  allFeedback.slice(0, 4).map((x, i) => (
                    <div key={i} className="li">
                      <div className="grow">
                        <div className="row-between">
                          <b className="small">{x.s ? x.s.title : 'Consulting Session'}</b>
                          {renderStars(x.f.rating)}
                        </div>
                        <div className="tiny muted">
                          {x.c.company} · {fmtS(x.f.date || TODAY)}
                        </div>
                        {x.f.useful && (
                          <div className="small" style={{ marginTop: 4 }}>
                            "{x.f.useful}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="small muted">
                    Feedback appears here after clients rate a session.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

// =============================================================
// 2. ADMIN CLIENTS PAGE
// =============================================================
export const AdminClientsPage: React.FC<{
  onNavigate: (page: string) => void;
  onOpenAddClient: () => void;
}> = ({ onNavigate, onOpenAddClient }) => {
  const { clients, setPreviewAs } = usePortal();
  const navigate = useNavigate();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            Clients
          </h1>
          <p>Each client gets a private portal. Open a client to manage everything they see.</p>
        </div>
        <button className="btn primary" onClick={onOpenAddClient}>
          <Icon name="plus" /> Add a client
        </button>
      </div>

      {cl.length > 0 ? (
        <div className="grid g3">
          {cl.map((c) => {
            const ns = nextSession(c);
            const ac = actionCounts(c);
            const ov = overallProgress(c);

            return (
              <div key={c.id} className="card ccard">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <ClientLogo client={c} size={48} />
                  <div style={{ minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: 20, lineHeight: 1.2 }}>
                      {c.company}
                    </div>
                    <div className="tiny muted">
                      {c.id} · {c.industry || 'Management Consulting'}
                    </div>
                  </div>
                </div>

                <dl className="kv small" style={{ gridTemplateColumns: '110px 1fr', margin: '16px 0' }}>
                  <dt>Contact</dt>
                  <dd>{c.contact || '—'}</dd>
                  <dt>Consultant</dt>
                  <dd>{c.consultant || 'WeGrow Consultant'}</dd>
                  <dt>Period</dt>
                  <dd>
                    {fmtS(c.start)} {D(c.start).getFullYear()} – {fmtS(c.end)} {D(c.end).getFullYear()}
                  </dd>
                  <dt>Next session</dt>
                  <dd>{ns ? `${fmtS(ns.date)} · ${ns.title}` : '—'}</dd>
                </dl>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="progress" style={{ flex: 1 }}>
                    <i style={{ width: `${ov}%` }} />
                  </div>
                  <b className="small">{ov}%</b>
                </div>

                <div className="tiny muted" style={{ marginTop: 6 }}>
                  {ac.Completed}/{ac.total} tasks complete
                  {ac.Delayed > 0 && (
                    <span style={{ color: 'var(--bad)', marginLeft: 6 }}>
                      · {ac.Delayed} delayed
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <button
                    className="btn sm primary"
                    onClick={() => navigate(`/admin/client/${c.id}/overview`)}
                  >
                    Manage portal
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setPreviewAs(c.id);
                      navigate('/dashboard');
                    }}
                  >
                    <Icon name="eye" /> Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <b style={{ fontSize: 18 }}>No client portals yet</b>
          <p style={{ margin: '8px auto 20px', maxWidth: '46ch', color: 'var(--ink-3)' }}>
            Add your first client to create their private portal. You can then assign tasks, schedule sessions and upload reports for them.
          </p>
          <button className="btn primary" onClick={onOpenAddClient}>
            <Icon name="plus" /> Add a client
          </button>
        </div>
      )}
    </>
  );
};

// =============================================================
// 3. ADMIN CLIENT WORKSPACE PAGE (Single Client Detail)
// =============================================================
export const AdminClientWorkspacePage: React.FC<{
  onOpenAssignTask: (clientId?: string, month?: number, action?: any) => void;
  onOpenScheduleSession: (clientId?: string, session?: any) => void;
  onOpenUpload: (clientId?: string) => void;
  onOpenScores?: (clientId: string) => void;
  onOpenMonth?: (clientId: string, monthNum: number) => void;
  onOpenSessionSummary?: (clientId: string, sessionId: string) => void;
  onOpenQRAttendance?: (session: any, clientId: string) => void;
}> = ({
  onOpenAssignTask,
  onOpenScheduleSession,
  onOpenUpload,
  onOpenScores,
  onOpenMonth,
  onOpenSessionSummary,
  onOpenQRAttendance
}) => {
  const { id, tab: routeTab } = useParams<{ id: string; tab?: string }>();
  const { clients, setPreviewAs, updateTaskStatus, deleteActionItem, deleteSession, showToast, refreshData } = usePortal();
  const navigate = useNavigate();

  const c = id ? clients[id] : null;
  const [tab, setTab] = useState<string>(routeTab || 'overview');
  const [selectedFeedbackModal, setSelectedFeedbackModal] = useState<{ feedback: any; client?: any; session?: any } | null>(null);

  useEffect(() => {
    if (routeTab) setTab(routeTab);
  }, [routeTab]);

  if (!c) {
    return (
      <div className="card empty" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h3>Client not found</h3>
        <p className="muted">This client does not exist or has been archived.</p>
        <button className="btn sm" onClick={() => navigate('/admin/clients')}>
          Back to all clients
        </button>
      </div>
    );
  }

  const cid = c.id;
  const ov = overallProgress(c);
  const cm = currentMonth(c);
  const ac = actionCounts(c);
  const ns = nextSession(c);
  const att = attentionItems([c]);

  const WS_TABS = [
    ['overview', 'Overview'],
    ['plan', 'Plan'],
    ['sessions', 'Sessions'],
    ['reports', 'Reports'],
    ['documents', 'Documents'],
    ['photos', 'Photos'],
    ['updates', 'Updates'],
    ['events', 'Events'],
    ['notifications', 'Notifications'],
    ['scores', 'Scores'],
    ['feedback', 'Feedback'],
    ['profile', 'Profile']
  ];

  const contentCounts: Array<[string, string, number, string]> = [
    ['plan', 'Action items', c.actions?.length || 0, 'task'],
    ['sessions', 'Sessions', c.sessions?.length || 0, 'session'],
    ['reports', 'Reports', c.reports?.length || 0, 'report'],
    ['documents', 'Documents', c.documents?.length || 0, 'document'],
    ['photos', 'Photos', c.photos?.length || 0, 'photo'],
    ['updates', 'Updates', c.updates?.length || 0, 'update'],
    ['events', 'Events', c.events?.length || 0, 'event'],
    ['notifications', 'Notifications', c.notifications?.length || 0, 'notif']
  ];

  return (
    <>
      <button
        className="btn sm ghost"
        onClick={() => navigate('/admin/clients')}
        style={{ marginBottom: 12 }}
      >
        <Icon name="chevL" /> All clients
      </button>

      <div className="wshead card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
          <ClientLogo client={c} size={52} />
          <div style={{ minWidth: 0 }}>
            <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: 0, lineHeight: 1.15 }}>
              {c.company}
            </h1>
            <div className="small muted">
              {c.contact}
              {c.contactTitle ? ` · ${c.contactTitle}` : ''} · {fmtS(c.start)} {D(c.start).getFullYear()} – {fmtS(c.end)} {D(c.end).getFullYear()} · {c.consultant}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => onOpenUpload(cid)}>
            <Icon name="upload" /> Upload
          </button>
          <button
            className="btn"
            onClick={() => {
              setPreviewAs(cid);
              navigate('/dashboard');
            }}
          >
            <Icon name="eye" /> Preview portal
          </button>
        </div>
      </div>

      <div className="tabs">
        {WS_TABS.map((t) => (
          <button
            key={t[0]}
            className={tab === t[0] ? 'on' : ''}
            onClick={() => {
              setTab(t[0]);
              navigate(`/admin/client/${cid}/${t[0]}`, { replace: true });
            }}
          >
            {t[1]}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          <section className="grid g4">
            <div className="card kpi">
              <div className="k-lbl">Overall progress</div>
              <div className="k-val">{ov}<small>%</small></div>
              <div className="k-sub">Month {cm.n} of 6 · {cm.theme}</div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">Action items</div>
              <div className="k-val">{ac.total}</div>
              <div className="k-sub">
                {ac.Completed} done · {(c.actions || []).filter(isOverdue).length} overdue
              </div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">Next session</div>
              <div className="k-val" style={{ fontSize: 26 }}>
                {ns ? fmtS(ns.date) : '—'}
              </div>
              <div className="k-sub">{ns ? ns.title : 'Schedule one'}</div>
            </div>
            <div className="card kpi">
              <div className="k-lbl">Transformation score</div>
              <div className="k-val">
                {getScore(c)}<small>/100</small>
              </div>
              <div className="k-sub">{c.feedback?.length || 0} session ratings</div>
            </div>
          </section>

          <div className="grid g-dash mt">
            <div className="card">
              <div className="card-head">
                <h3>What's in this client's portal</h3>
                <span className="small muted">Everything here is visible to {c.contact || 'the client'}</span>
              </div>
              <div className="contentgrid">
                {contentCounts.map((x) => (
                  <div key={x[0]} className="cc">
                    <button
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                      onClick={() => setTab(x[0])}
                    >
                      <b className="serif" style={{ fontSize: 28, display: 'block' }}>{x[2]}</b>
                      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{x[1]}</span>
                    </button>
                    <button
                      className="btn sm ghost"
                      style={{ marginTop: 6 }}
                      onClick={() => {
                        if (x[3] === 'task') onOpenAssignTask(cid);
                        else if (x[3] === 'session') onOpenScheduleSession(cid);
                        else onOpenUpload(cid);
                      }}
                    >
                      <Icon name="plus" /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Needs attention</h3>
              </div>
              {att.length > 0 ? (
                att.map((x, i) => (
                  <div key={i} className="li">
                    <div className="grow">
                      <b className="ttl">{x.title}</b>
                      <div className="sub">{x.subtitle}</div>
                    </div>
                    {x.kind === 'task' ? (
                      <button
                        className="btn sm"
                        onClick={() => onOpenAssignTask(cid, x.item.month, x.item)}
                      >
                        Update
                      </button>
                    ) : (
                      <button
                        className="btn sm primary"
                        onClick={() => onOpenScheduleSession(cid, x.item)}
                      >
                        Write summary
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="small muted">All clear for this client.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Plan */}
      {tab === 'plan' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="small muted">
              Assign and monitor action items for {c.company}. Client sees updates immediately.
            </div>
            <button className="btn primary" onClick={() => onOpenAssignTask(cid)}>
              <Icon name="plus" /> Assign task
            </button>
          </div>

          {c.months.map((m) => {
            const items = (c.actions || []).filter((a) => a.month === m.n);
            const mp = monthProgress(c, m.n);
            const isCur = m.key === cm.key;

            return (
              <div key={m.n} className={`card mblock ${isCur ? 'now' : ''}`}>
                <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div className="small" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                      Month {m.n} · {m.name} {m.year} {isCur ? ' · current' : ''}
                    </div>
                    <div className="serif" style={{ fontSize: 22 }}>{m.theme}</div>
                    <div className="small muted" style={{ maxWidth: '70ch' }}>
                      {m.objective || 'No objective specified.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <b className="small">{mp}%</b>
                    <button
                      className="btn sm"
                      onClick={() => onOpenMonth && onOpenMonth(cid, m.n)}
                    >
                      Edit month
                    </button>
                    <button
                      className="btn sm primary"
                      onClick={() => onOpenAssignTask(cid, m.n)}
                    >
                      <Icon name="plus" /> Task
                    </button>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="tablewrap" style={{ marginTop: 12 }}>
                    <table className="t">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Owner</th>
                          <th>Due</th>
                          <th>Priority</th>
                          <th style={{ width: 160 }}>Status</th>
                          <th style={{ width: 90 }}>Progress</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <b>{a.title}</b>
                              {a.comments && a.comments.length > 0 && (
                                <div className="tiny muted">
                                  {a.comments.length} comment{a.comments.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </td>
                            <td>{a.owner}</td>
                            <td style={isOverdue(a) ? { color: 'var(--bad)', fontWeight: 700 } : {}}>
                              {fmtS(a.due)}
                            </td>
                            <td>{prioBadge(a.priority)}</td>
                            <td>
                              <select
                                className="input sm-input"
                                value={a.status}
                                onChange={(e) =>
                                  updateTaskStatus(cid, a.id, e.target.value as ActionStatus)
                                }
                              >
                                {['Not Started', 'In Progress', 'Under Review', 'Completed', 'Delayed'].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="progress">
                                <i style={{ width: `${a.progress}%` }} />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                className="btn sm ghost"
                                onClick={() => onOpenAssignTask(cid, a.month, a)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn sm ghost danger-t"
                                onClick={() => {
                                  if (window.confirm(`Delete task "${a.title}"?`)) {
                                    deleteActionItem(cid, a.id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="small muted" style={{ marginTop: 12 }}>
                    No action items in this month yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Sessions */}
      {tab === 'sessions' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">
              Consulting sessions held or planned for {c.company}.
            </div>
            <button className="btn primary" onClick={() => onOpenScheduleSession(cid)}>
              <Icon name="plus" /> Schedule session
            </button>
          </div>

          <div className="card" style={{ padding: '8px 0' }}>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Summary</th>
                    <th>Feedback</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(c.sessions || []).map((s) => {
                    const f = (c.feedback || []).find((x) => x.session === s.id);
                    return (
                      <tr key={s.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {fmt(s.date)}
                          <div className="tiny muted">{s.time}</div>
                        </td>
                        <td><b>{s.title}</b></td>
                        <td>{s.mode}</td>
                        <td>
                          <span className={`badge ${s.status === 'Completed' ? 'b-ok' : s.status === 'Cancelled' ? 'b-mute' : 'b-brand'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          {s.summary ? (
                            <button
                              className="btn sm ghost"
                              onClick={() => {
                                if (onOpenSessionSummary) {
                                  onOpenSessionSummary(cid, s.id);
                                } else {
                                  onOpenScheduleSession(cid, s);
                                }
                              }}
                            >
                              <Icon name="check" /> Published
                            </button>
                          ) : s.date <= TODAY && s.status !== 'Cancelled' ? (
                            <button
                              className="btn sm primary"
                              onClick={() => {
                                if (onOpenSessionSummary) {
                                  onOpenSessionSummary(cid, s.id);
                                } else {
                                  onOpenScheduleSession(cid, s);
                                }
                              }}
                            >
                              Write summary
                            </button>
                          ) : (
                            <span className="tiny muted">Pending</span>
                          )}
                        </td>
                        <td>{f ? renderStars(f.rating) : <span className="tiny muted">—</span>}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn sm"
                            style={{
                              marginRight: 6,
                              borderColor: 'var(--brand)',
                              color: 'var(--brand)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            onClick={() => onOpenQRAttendance?.(s, cid)}
                            title="Launch QR Attendance & WhatsApp Feedback"
                          >
                            📱 QR &amp; WA
                          </button>
                          <button
                            className="btn sm ghost"
                            onClick={() => onOpenScheduleSession(cid, s)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn sm ghost danger-t"
                            onClick={() => {
                              if (window.confirm(`Delete session "${s.title}"?`)) {
                                deleteSession(cid, s.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!c.sessions || c.sessions.length === 0) && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">
                          <b>No sessions yet</b> Schedule a consulting session to get started.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {tab === 'reports' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">{(c.reports || []).length} reports published</div>
            <button className="btn primary" onClick={() => onOpenUpload(cid)}>
              <Icon name="upload" /> Upload report
            </button>
          </div>

          <div className="card" style={{ padding: '8px 0' }}>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.reports || []).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.name}</b>
                        <div className="tiny muted">{r.desc}</div>
                      </td>
                      <td>{r.cat}</td>
                      <td>{fmtS(r.date)}</td>
                      <td>{r.pages || '—'} pages</td>
                    </tr>
                  ))}
                  {(!c.reports || c.reports.length === 0) && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty"><b>No reports yet</b> Upload assessment or progress deliverables.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {tab === 'documents' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">{(c.documents || []).length} documents in library</div>
            <button className="btn primary" onClick={() => onOpenUpload(cid)}>
              <Icon name="upload" /> Upload document
            </button>
          </div>

          <div className="card" style={{ padding: '8px 0' }}>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Uploaded by</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.documents || []).map((d) => (
                    <tr key={d.id}>
                      <td><b>{d.name}</b></td>
                      <td>{d.cat}</td>
                      <td>{fmtS(d.date)}</td>
                      <td>{d.by}</td>
                    </tr>
                  ))}
                  {(!c.documents || c.documents.length === 0) && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty"><b>No documents</b> Upload SOPs, agreements, and blueprints.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Photos */}
      {tab === 'photos' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">{(c.photos || []).length} photos in gallery</div>
            <button className="btn primary" onClick={() => onOpenUpload(cid)}>
              <Icon name="upload" /> Upload photos
            </button>
          </div>

          {c.photos && c.photos.length > 0 ? (
            <div className="pgrid">
              {c.photos.map((p) => (
                <div key={p.id} className="photo">
                  {p.url ? (
                    <img src={p.url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ background: 'var(--surface-2)', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                      <Icon name="photos" size={32} />
                    </div>
                  )}
                  <div className="cap">
                    <b>{p.title}</b>
                    <span>{fmtS(p.date)} · {p.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty"><b>No photos yet</b> Upload photos from client workshops and events.</div>
          )}
        </div>
      )}

      {/* Tab: Updates */}
      {tab === 'updates' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">{(c.updates || []).length} updates sent to {c.company}</div>
            <button className="btn primary" onClick={() => onOpenUpload(cid)}>
              <Icon name="plus" /> Publish update
            </button>
          </div>

          <div className="card">
            {(c.updates || []).length > 0 ? (
              c.updates.map((u) => {
                const t = typeTone[u.type] || typeTone['General Update'];
                return (
                  <div key={u.id} className="upd">
                    <span className={`ic ${t[0]}`}>
                      <Icon name={t[1] as any} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-between" style={{ alignItems: 'flex-start' }}>
                        <b>{u.title}</b>
                        <span className={`badge ${t[0]}`}>{u.type}</span>
                      </div>
                      <div className="tiny muted">{fmt(u.date)} · {u.cat}</div>
                      <div className="small" style={{ marginTop: 4 }}>{u.body}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty"><b>No updates yet</b> Publish your first business update.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Events */}
      {tab === 'events' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">{(c.events || []).length} events visible to client</div>
          </div>

          <div className="card" style={{ padding: '8px 0' }}>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.events || []).map((e) => (
                    <tr key={e.id}>
                      <td><b>{e.title}</b></td>
                      <td>{e.type}</td>
                      <td>{fmtS(e.date)}</td>
                      <td>{e.loc}</td>
                    </tr>
                  ))}
                  {(!c.events || c.events.length === 0) && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty"><b>No events yet</b> Invite client to training and networking summits.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Scores */}
      {tab === 'scores' && (
        <div>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="small muted">Drive client analytics and benchmark maturity scores.</div>
            {onOpenScores && (
              <button className="btn primary" onClick={() => onOpenScores(cid)}>
                Update scores
              </button>
            )}
          </div>

          <div className="grid g2">
            <div className="card">
              <div className="card-head">
                <h3>Area scores</h3>
              </div>
              <HorizontalBars rows={c.dept || []} showPrev={true} />
            </div>
            <div className="card">
              <div className="card-head">
                <h3>Overall score trend</h3>
              </div>
              {c.scoreHistory && c.scoreHistory.length > 0 ? (
                <div className="tablewrap">
                  <LineChart pts={c.scoreHistory} min={0} max={100} />
                </div>
              ) : (
                <div className="small muted">No scores logged yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Feedback */}
      {tab === 'feedback' && (
        <div className="card">
          {(c.feedback || []).length > 0 ? (
            c.feedback.map((f, i) => {
              const s = (c.sessions || []).find((x) => x.id === f.session || x.sessionId === f.session);
              return (
                <div
                  key={i}
                  className="li"
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    borderRadius: 8,
                    transition: 'background 0.15s ease'
                  }}
                  onClick={() => setSelectedFeedbackModal({ feedback: f, client: c, session: s })}
                  title="Click to view full feedback form response"
                >
                  <div className="grow">
                    <div className="row-between">
                      <b style={{ color: 'var(--brand, #5B21B6)', textDecoration: 'underline' }}>
                        {s ? s.title : 'Session'}
                      </b>
                      {renderStars(f.rating)}
                    </div>
                    <div className="sub">
                      {fmt(f.date || TODAY)} · {f.relevance}
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
                    {f.useful && <div className="small" style={{ marginTop: 6 }}><b>Useful:</b> {f.useful}</div>}
                    {f.improve && <div className="small"><b>Improve:</b> {f.improve}</div>}
                    {f.comments && <div className="small muted">"{f.comments}"</div>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <b>No feedback yet</b> Reviews appear after client evaluates completed sessions.
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div className="grid g-dash">
          <div className="card">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
              <ClientLogo client={c} size={64} />
              <div>
                <div className="serif" style={{ fontSize: 26 }}>{c.company}</div>
                <div className="muted small">{c.industry} {c.location ? `· ${c.location}` : ''}</div>
              </div>
            </div>

            <dl className="kv">
              <dt>Client ID</dt><dd>{c.id}</dd>
              <dt>Contact</dt><dd>{c.contact} {c.contactTitle ? `· ${c.contactTitle}` : ''}</dd>
              <dt>Login email</dt><dd>{c.email || '—'}</dd>
              <dt>Portal password</dt><dd>{c.password ? '•••••••• (set)' : 'Not set'}</dd>
              <dt>Phone</dt><dd>{c.phone || '—'}</dd>
              <dt>Period</dt><dd>{fmt(c.start)} – {fmt(c.end)}</dd>
              <dt>Consultant</dt><dd>{c.consultant}</dd>
              <dt>Areas</dt>
              <dd>
                {(c.areas || []).map((a) => (
                  <span key={a} className="badge b-brand" style={{ margin: '0 4px 4px 0' }}>
                    {a}
                  </span>
                ))}
              </dd>
            </dl>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedbackModal && (
        <FeedbackDetailModal
          feedback={selectedFeedbackModal.feedback}
          client={selectedFeedbackModal.client}
          session={selectedFeedbackModal.session}
          onClose={() => setSelectedFeedbackModal(null)}
        />
      )}
    </>
  );
};

// =============================================================
// 4. ADMIN TASKS PAGE (Kanban Task Board)
// =============================================================
export const AdminTasksPage: React.FC<{
  onOpenAssignTask: (clientId?: string, month?: number, action?: any) => void;
}> = ({ onOpenAssignTask }) => {
  const { clients, updateTaskStatus } = usePortal();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  let rows = cl
    .filter((c) => selectedClient === 'all' || c.id === selectedClient)
    .flatMap((c) => (c.actions || []).map((a) => ({ c, a })));

  if (overdueOnly) {
    rows = rows.filter((x) => isOverdue(x.a) || x.a.status === 'Delayed');
  }

  const KANBAN_COLS: ActionStatus[] = [
    'Not Started',
    'In Progress',
    'Under Review',
    'Completed',
    'Delayed'
  ];

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            Task board
          </h1>
          <p>Every action item across client portals. Modify status inline to update the client's roadmap.</p>
        </div>
        <button
          className="btn primary"
          onClick={() => onOpenAssignTask(selectedClient !== 'all' ? selectedClient : undefined)}
        >
          <Icon name="plus" /> Assign task
        </button>
      </div>

      <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input"
            style={{ width: 'auto' }}
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All clients</option>
            {cl.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company} ({c.id})
              </option>
            ))}
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
            />
            Overdue or delayed only
          </label>
        </div>
        <span className="small muted">{rows.length} tasks</span>
      </div>

      <div className="tablewrap">
        <div className="kanban">
          {KANBAN_COLS.map((colStatus) => {
            const colItems = rows
              .filter((x) => x.a.status === colStatus)
              .sort((a, b) => (a.a.due || '').localeCompare(b.a.due || ''));

            return (
              <div key={colStatus} className="kcol">
                <div className="khead">
                  {statusBadge(colStatus)}
                  <span className="tiny muted">{colItems.length}</span>
                </div>

                {colItems.map(({ c, a }) => (
                  <div key={a.id} className="kcard">
                    <div
                      className="clickable"
                      onClick={() => onOpenAssignTask(c.id, a.month, a)}
                    >
                      <div className="ttl small" style={{ fontWeight: 700 }}>
                        {a.title}
                      </div>
                      {selectedClient === 'all' && (
                        <div style={{ margin: '6px 0' }}>
                          <span className="cchip">
                            <ClientLogo client={c} size={20} />
                            {c.company}
                          </span>
                        </div>
                      )}
                      <div className="tiny muted">
                        {a.owner} ·{' '}
                        <span style={isOverdue(a) ? { color: 'var(--bad)', fontWeight: 700 } : {}}>
                          due {fmtS(a.due)}
                        </span>{' '}
                        · {a.priority}
                      </div>
                    </div>

                    <div className="progress" style={{ margin: '8px 0' }}>
                      <i style={{ width: `${a.progress}%` }} />
                    </div>

                    <select
                      className="input sm-input"
                      value={a.status}
                      onChange={(e) =>
                        updateTaskStatus(c.id, a.id, e.target.value as ActionStatus)
                      }
                    >
                      {KANBAN_COLS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="tiny muted" style={{ padding: 8 }}>
                    None
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// =============================================================
// 5. ADMIN SESSIONS PAGE (Session Schedule)
// =============================================================
export const AdminSessionsPage: React.FC<{
  onOpenScheduleSession: (clientId?: string, session?: any) => void;
  onOpenSessionSummary?: (clientId: string, sessionId: string) => void;
  onOpenQRAttendance?: (session: any, clientId: string) => void;
}> = ({ onOpenScheduleSession, onOpenSessionSummary, onOpenQRAttendance }) => {
  const { clients } = usePortal();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');
  const allSessions = cl.flatMap((c) => (c.sessions || []).map((s) => ({ c, s })));

  const upcoming = allSessions
    .filter((x) => x.s.status === 'Upcoming' && x.s.date >= TODAY)
    .sort((a, b) => a.s.date.localeCompare(b.s.date));

  const needSummary = allSessions
    .filter((x) => x.s.date < TODAY && x.s.status !== 'Cancelled' && !x.s.summary)
    .sort((a, b) => b.s.date.localeCompare(a.s.date));

  const recentlySummarised = allSessions
    .filter((x) => x.s.summary)
    .sort((a, b) => b.s.date.localeCompare(a.s.date))
    .slice(0, 10);

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            Session schedule
          </h1>
          <p>Consulting sessions scheduled across all client organisations.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn"
            style={{
              borderColor: 'var(--brand)',
              color: 'var(--brand)',
              fontWeight: 700,
              background: 'var(--brand-mute)'
            }}
            onClick={() => {
              const target = upcoming[0] || needSummary[0] || allSessions[0];
              if (target) {
                onOpenQRAttendance?.(target.s, target.c.id || target.c.clientId);
              } else {
                onOpenScheduleSession();
              }
            }}
            title="Launch QR Attendance Code & Live Wall"
          >
            📱 QR Attendance &amp; Live Wall
          </button>
          <button className="btn primary" onClick={() => onOpenScheduleSession()}>
            <Icon name="plus" /> Schedule session
          </button>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h3>Upcoming</h3>
              <span className="badge b-brand">{upcoming.length}</span>
            </div>
            {upcoming.length > 0 ? (
              upcoming.map(({ c, s }) => (
                <div key={s.id} className="li">
                  <div className="datebox">
                    <b>{D(s.date).getDate()}</b>
                    <span>{MON[D(s.date).getMonth()]}</span>
                  </div>
                  <div className="grow">
                    <div className="ttl">{s.title}</div>
                    <div className="sub">
                      {c.company} · {s.time || ''} · {s.mode}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn sm"
                      style={{
                        borderColor: 'var(--brand)',
                        color: 'var(--brand)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      onClick={() => onOpenQRAttendance?.(s, c.id || c.clientId)}
                      title="Launch QR Attendance & Live Scroller Wall"
                    >
                      📱 QR Attendance
                    </button>
                    <button
                      className="btn sm"
                      onClick={() => onOpenScheduleSession(c.id, s)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="small muted">Nothing scheduled.</div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Recently summarised</h3>
            </div>
            {recentlySummarised.length > 0 ? (
              recentlySummarised.map(({ c, s }) => (
                <div key={s.id} className="li">
                  <div className="datebox">
                    <b>{D(s.date).getDate()}</b>
                    <span>{MON[D(s.date).getMonth()]}</span>
                  </div>
                  <div className="grow">
                    <div className="ttl">{s.title}</div>
                    <div className="sub">
                      {c.company} · {s.time || ''} · {s.mode}
                    </div>
                  </div>
                  <button
                    className="btn sm ghost"
                    onClick={() => {
                      if (onOpenSessionSummary) {
                        onOpenSessionSummary(c.id, s.id);
                      } else {
                        onOpenScheduleSession(c.id, s);
                      }
                    }}
                  >
                    View summary
                  </button>
                </div>
              ))
            ) : (
              <div className="small muted">No summaries yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Awaiting summary</h3>
            <span className={`badge ${needSummary.length ? 'b-warn' : 'b-ok'}`}>
              {needSummary.length}
            </span>
          </div>
          {needSummary.length > 0 ? (
            needSummary.map(({ c, s }) => (
              <div key={s.id} className="li">
                <div className="datebox">
                  <b>{D(s.date).getDate()}</b>
                  <span>{MON[D(s.date).getMonth()]}</span>
                </div>
                <div className="grow">
                  <div className="ttl">{s.title}</div>
                  <div className="sub">
                    {c.company} · Held {fmtS(s.date)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    className="btn sm"
                    style={{
                      color: '#059669',
                      borderColor: '#A7F3D0',
                      background: '#ECFDF5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => onOpenQRAttendance?.(s, c.id || c.clientId)}
                    title="Send WhatsApp Feedback to Attendees"
                  >
                    💬 WhatsApp Feedback
                  </button>
                  <button
                    className="btn sm primary"
                    onClick={() => {
                      if (onOpenSessionSummary) {
                        onOpenSessionSummary(c.id, s.id);
                      } else {
                        onOpenScheduleSession(c.id, s);
                      }
                    }}
                  >
                    Write summary
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="small muted">Every held session has a summary.</div>
          )}
        </div>
      </div>
    </>
  );
};

// =============================================================
// 6. ADMIN FEEDBACK PAGE
// =============================================================
export const AdminFeedbackPage: React.FC = () => {
  const { clients } = usePortal();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');
  const [selectedAdminFeedback, setSelectedAdminFeedback] = useState<{ feedback: any; client?: any; session?: any } | null>(null);

  const allFeedback = cl
    .flatMap((c) =>
      (c.feedback || []).map((f) => ({
        c,
        f,
        s: (c.sessions || []).find((x) => x.id === f.session)
      }))
    )
    .sort((a, b) => (b.f.date || '').localeCompare(a.f.date || ''));

  const avgRating = allFeedback.length
    ? (
        allFeedback.reduce((s, x) => s + x.f.rating, 0) / allFeedback.length
      ).toFixed(1)
    : '0';

  const highRatingCount = allFeedback.filter((x) => x.f.rating >= 4).length;
  const satRate = allFeedback.length
    ? Math.round((highRatingCount / allFeedback.length) * 100)
    : 0;

  const respondedClients = new Set(allFeedback.map((x) => x.c.id)).size;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            Client feedback
          </h1>
          <p>Real-time session reviews and ratings submitted by client teams via WhatsApp &amp; Portal.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge b-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Live Sync Active (Auto-updating)
          </span>
        </div>
      </div>

      <div className="grid g3">
        <div className="card kpi">
          <div className="k-lbl">Average rating <Icon name="star" /></div>
          <div className="k-val">{avgRating}<small>/5</small></div>
          <div className="k-sub">{allFeedback.length} total reviews</div>
        </div>
        <div className="card kpi">
          <div className="k-lbl">Satisfaction rate</div>
          <div className="k-val">{satRate}<small>%</small></div>
          <div className="k-sub">Rated 4 or 5 stars</div>
        </div>
        <div className="card kpi">
          <div className="k-lbl">Clients responded</div>
          <div className="k-val">{respondedClients}<small>/{cl.length}</small></div>
          <div className="k-sub">Active client participation</div>
        </div>
      </div>

      {/* Vertical Bottom-to-Top Scrolling Live Completed Feedback Stream */}
      <div style={{ margin: '20px 0' }}>
        <VerticalFeedbackScroller
          feedbackList={allFeedback}
          title="Live Feedback Completed Stream (Bottom to Top)"
          height={300}
        />
      </div>

      {/* Real-Time WhatsApp Feedback Dispatch Table */}
      <WhatsAppFeedbackDispatchTable isAdmin={true} />

      <div className="card mt">
        <div className="card-head">
          <h3>All feedback entries ({allFeedback.length})</h3>
        </div>
        {allFeedback.length > 0 ? (
          allFeedback.map(({ c, f, s }, i) => (
            <div
              key={i}
              className="li"
              style={{
                alignItems: 'flex-start',
                padding: '16px',
                cursor: 'pointer',
                borderRadius: 8,
                transition: 'background 0.15s ease'
              }}
              onClick={() => setSelectedAdminFeedback({ feedback: f, client: c, session: s })}
              title="Click to view full feedback form response"
            >
              <ClientLogo client={c} size={36} />
              <div className="grow" style={{ marginLeft: 12 }}>
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand, #5B21B6)', textDecoration: 'underline' }}>
                      {s ? s.title : 'Consulting Session'}
                    </div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>
                      {c.company} · {fmtL(f.date || TODAY)} ·{' '}
                      <span className="badge b-teal">{f.relevance || 'Relevant'}</span>
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
                  </div>
                  {renderStars(f.rating)}
                </div>
                {f.useful && (
                  <div className="small" style={{ marginTop: 8 }}>
                    <b>What was useful:</b> {f.useful}
                  </div>
                )}
                {f.improve && (
                  <div className="small" style={{ marginTop: 4 }}>
                    <b>Areas to improve:</b> {f.improve}
                  </div>
                )}
                {f.comments && (
                  <div className="small muted" style={{ marginTop: 4 }}>
                    "{f.comments}"
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <b>No feedback submitted yet</b> When clients rate completed sessions, reviews appear here.
          </div>
        )}
      </div>

      {/* Admin Feedback Detail Modal */}
      {selectedAdminFeedback && (
        <FeedbackDetailModal
          feedback={selectedAdminFeedback.feedback}
          client={selectedAdminFeedback.client}
          session={selectedAdminFeedback.session}
          onClose={() => setSelectedAdminFeedback(null)}
        />
      )}
    </>
  );
};

// =============================================================
// 7. ADMIN BROADCAST PAGE
// =============================================================
export const AdminBroadcastPage: React.FC<{
  onOpenBroadcast?: () => void;
}> = ({ onOpenBroadcast }) => {
  const { clients, publishUpdate, showToast } = usePortal();
  const cl = Object.values(clients).filter((c) => c.status !== 'Archived');

  const [selectedClients, setSelectedClients] = useState<string[]>(cl.map((c) => c.id));
  const [title, setTitle] = useState('');
  const [type, setType] = useState<BusinessUpdate['type']>('General Update');
  const [cat, setCat] = useState('Operations');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleClient = (cid: string) => {
    setSelectedClients((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const selectAll = () => setSelectedClients(cl.map((c) => c.id));
  const clearAll = () => setSelectedClients([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClients.length) {
      setError('Please select at least one recipient client.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }
    setError(null);

    try {
      setLoading(true);
      for (const cid of selectedClients) {
        await publishUpdate(cid, {
          title: title.trim(),
          type,
          cat,
          body: body.trim()
        });
      }
      showToast(`Broadcast update sent to ${selectedClients.length} clients`);
      setTitle('');
      setBody('');
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to broadcast update');
    }
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 4px' }}>
            Broadcast announcement
          </h1>
          <p>Deliver announcements, directives, and recommendations to clients.</p>
        </div>
      </div>

      <div className="grid g-dash">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-head">
            <h3>Compose broadcast</h3>
          </div>

          {error && (
            <div className="err" role="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="field">
            <label>
              Recipient clients <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <div className="clientpick" style={{ maxHeight: 180, overflowY: 'auto' }}>
              {cl.map((c) => (
                <label key={c.id} className="check">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(c.id)}
                    onChange={() => toggleClient(c.id)}
                  />
                  <span>
                    <ClientLogo client={c} size={20} />
                    <b>{c.company}</b> ({c.id})
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="button" className="btn sm ghost" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="btn sm ghost" onClick={clearAll}>
                Clear all
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="bcTitle">
              Headline <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <input
              className="input"
              id="bcTitle"
              required
              placeholder="e.g. Q4 Executive Leadership Alignment Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid g2" style={{ gap: 16 }}>
            <div className="field">
              <label htmlFor="bcType">Type</label>
              <select
                className="input"
                id="bcType"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                {['General Update', 'Important Update', 'Action Required', 'Milestone', 'Recommendation'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="bcCat">Category</label>
              <select
                className="input"
                id="bcCat"
                value={cat}
                onChange={(e) => setCat(e.target.value)}
              >
                {[
                  'Operations',
                  'People',
                  'Process',
                  'Technology',
                  'Finance',
                  'Performance',
                  'Consulting',
                  'Reports'
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="bcBody">
              Message <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <textarea
              className="input"
              id="bcBody"
              required
              rows={5}
              placeholder="Write the message that will appear in each recipient client's Business Updates..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <button className="btn primary" type="submit" disabled={loading}>
            <Icon name="send" />
            {loading ? 'Publishing...' : 'Publish broadcast'}
          </button>
        </form>
      </div>
    </>
  );
};

// Backward-compatibility alias
export const AdminPublishPage = AdminBroadcastPage;

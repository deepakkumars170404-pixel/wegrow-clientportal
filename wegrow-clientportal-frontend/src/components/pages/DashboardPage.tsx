import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { ProgressRing, DonutChart, LegendList, HorizontalBars, PhotoArt } from '../common/Charts';
import {
  fmt,
  fmtS,
  fmtL,
  D,
  TODAY,
  daysBetween
} from '../../utils/date';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenAction: (id: string) => void;
  onOpenSession: (id: string) => void;
  onOpenUpdate: (id: string) => void;
  onOpenEvent: (id: string) => void;
  onOpenPhoto: (id: string) => void;
  onGiveFeedback: (sessionId: string) => void;
  onOpenQRAttendance?: (session: any, clientId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAction,
  onOpenSession,
  onOpenUpdate,
  onOpenEvent,
  onOpenPhoto,
  onGiveFeedback,
  onOpenQRAttendance
}) => {
  const { client, user, loading, showToast } = usePortal();
  if (!client) {
    if (loading) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', margin: '40px auto', maxWidth: 560 }}>
          <div style={{ display: 'inline-block', width: 34, height: 34, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
          <h3 style={{ marginTop: 16 }}>Loading client dossier…</h3>
          <p className="muted" style={{ maxWidth: '45ch', margin: '8px auto 20px' }}>
            Preparing transformation metrics for {user?.name || 'your account'}…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 24px', margin: '40px auto', maxWidth: 560 }}>
        <Icon name="building" size={48} className="muted" />
        <h3 style={{ marginTop: 16 }}>No client record found</h3>
        <p className="muted" style={{ maxWidth: '45ch', margin: '8px auto 20px' }}>
          Could not find dossier records for {user?.clientId || 'your account'} on the server ({user?.email}).
        </p>
        <div className="small muted">
          Please contact your WeGrow Lead Consultant to initialize your client portal dossier.
        </div>
      </div>
    );
  }

  // Derived metrics
  const actions = client.actions;
  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === 'Completed').length;
  const inProgressActions = actions.filter((a) => a.status === 'In Progress' || a.status === 'Under Review').length;
  const delayedActions = actions.filter((a) => a.status === 'Delayed').length;
  const pendingActions = actions.filter((a) => a.status === 'Not Started').length;

  const overallProgress = totalActions
    ? Math.round(actions.reduce((s, a) => s + a.progress, 0) / totalActions)
    : 0;

  const currentMonthPlan =
    client.months.find((m) => TODAY.startsWith(m.key)) || client.months[0];

  const monthProgress = (n: number) => {
    const list = client.actions.filter((a) => a.month === n);
    return list.length ? Math.round(list.reduce((s, a) => s + a.progress, 0) / list.length) : 0;
  };

  const elapsedPct = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (daysBetween(client.start, TODAY) / daysBetween(client.start, client.end)) * 100
      )
    )
  );

  const openActionsList = client.actions
    .filter((a) => a.status !== 'Completed')
    .sort((a, b) => a.due.localeCompare(b.due));
  const nextAction = openActionsList[0];

  const nextSession = client.sessions.find((s) => s.date >= TODAY);
  const lastSession = [...client.sessions].reverse().find((s) => s.date < TODAY);

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

  const latestUpdate = [...client.updates].sort((a, b) => b.date.localeCompare(a.date))[0];
  const recommendationUpdate = client.updates.find((u) => u.type === 'Recommendation') || latestUpdate;

  const scoreNow = client.scoreHistory?.length
    ? client.scoreHistory[client.scoreHistory.length - 1].v
    : 0;
  const scorePrev = client.scoreHistory?.length && client.scoreHistory.length > 1
    ? client.scoreHistory[client.scoreHistory.length - 2].v
    : scoreNow;

  const donutParts = [
    { k: 'Completed', v: completedActions, c: 'var(--brand)' },
    { k: 'In progress', v: inProgressActions, c: 'var(--teal)' },
    { k: 'Delayed', v: delayedActions, c: 'var(--bad)' },
    { k: 'Pending', v: pendingActions, c: 'var(--line-2)' }
  ];

  const fillPct =
    (client.months.findIndex((m) => m.key === currentMonthPlan.key) /
      (client.months.length - 1)) *
    100 *
    (5 / 6);

  return (
    <>
      {pendingFeedbackList.length > 0 && (
        <div className="fb-banner">
          <div>
            <b>How was {pendingFeedbackList[pendingFeedbackList.length - 1].title}?</b>
            <div className="small muted">
              Your feedback on the {fmtS(pendingFeedbackList[pendingFeedbackList.length - 1].date)} session takes under a minute and goes straight to your consultant.
            </div>
          </div>
          <button
            className="btn teal sm"
            onClick={() => onGiveFeedback(pendingFeedbackList[pendingFeedbackList.length - 1].id)}
          >
            Give feedback
          </button>
        </div>
      )}

      <section className="hero">
        <div className="welcome card">
          <svg className="deco" viewBox="0 0 300 300" aria-hidden="true">
            <circle cx="170" cy="170" r="130" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="40" />
            <circle
              cx="170"
              cy="170"
              r="130"
              fill="none"
              stroke="#3CC3BF"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 130 * overallProgress / 100} 1000`}
              transform="rotate(-90 170 170)"
              opacity="0.8"
            />
          </svg>
          <h1>Good morning, {client.contact.split(' ')[0]}</h1>
          <p>
            Here is where {client.company} stands in month {currentMonthPlan.n} of 6 — {currentMonthPlan.theme.toLowerCase()}.
          </p>
          <div className="meta">
            <div>
              Company
              <b>{client.company}</b>
            </div>
            <div>
              Consulting period
              <b>
                {fmtS(client.start)} {D(client.start).getFullYear()} – {fmtS(client.end)} {D(client.end).getFullYear()}
              </b>
            </div>
            <div>
              Consultant
              <b>{client.consultant}</b>
            </div>
          </div>
          <div className="bigprog">
            <div className="row-between">
              <span>Overall transformation progress</span>
              <b>{overallProgress}%</b>
            </div>
            <div className="progress lg">
              <i style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="tiny" style={{ marginTop: 8, color: '#B9ACE0' }}>
              {elapsedPct}% of the engagement time has passed
            </div>
          </div>
        </div>

        <div className="card nowcard">
          <h3>Right now</h3>
          <div>
            <div className="nowrow">
              <span className="ic b-brand">
                <Icon name="target" />
              </span>
              <div>
                <div className="lbl">Where we are</div>
                <div className="val">
                  Month {currentMonthPlan.n} · {currentMonthPlan.theme} — {monthProgress(currentMonthPlan.n)}% done
                </div>
              </div>
            </div>

            {nextAction && (
              <div
                className="nowrow clickable"
                onClick={() => onOpenAction(nextAction.id)}
              >
                <span className="ic b-warn">
                  <Icon name="flag" />
                </span>
                <div>
                  <div className="lbl">Next action</div>
                  <div className="val ttl">{nextAction.title}</div>
                  <div className="tiny muted">
                    Due {fmt(nextAction.due)} · {nextAction.owner}
                  </div>
                </div>
              </div>
            )}

            {nextSession && (
              <div
                className="nowrow clickable"
                onClick={() => onOpenSession(nextSession.id)}
              >
                <span className="ic b-teal">
                  <Icon name="sessions" />
                </span>
                <div>
                  <div className="lbl">Coming next</div>
                  <div className="val ttl">{nextSession.title}</div>
                  <div className="tiny muted">
                    {fmtL(nextSession.date)} · {nextSession.mode}
                  </div>
                </div>
              </div>
            )}

            {recommendationUpdate && (
              <div
                className="nowrow clickable"
                onClick={() => onOpenUpdate(recommendationUpdate.id)}
              >
                <span className="ic b-info">
                  <Icon name="spark" />
                </span>
                <div>
                  <div className="lbl">WeGrow recommends</div>
                  <div className="val ttl">{recommendationUpdate.title}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid g4">
        <div className="card kpi">
          <div className="k-lbl">
            Overall progress <Icon name="analytics" />
          </div>
          <div className="k-val">
            {overallProgress}
            <small>%</small>
          </div>
          <div className="k-sub">
            <span className="up">↑ {overallProgress - Math.round(overallProgress * 0.82)}%</span> this month
          </div>
        </div>

        <div className="card kpi">
          <div className="k-lbl">
            Action items <Icon name="plan" />
          </div>
          <div className="k-val">{totalActions}</div>
          <div className="k-sub">
            {completedActions} completed · {delayedActions} delayed
          </div>
        </div>

        <div className="card kpi">
          <div className="k-lbl">
            Sessions <Icon name="sessions" />
          </div>
          <div className="k-val">{client.sessions.length}</div>
          <div className="k-sub">
            {client.sessions.filter((s) => s.status === 'Completed').length} completed ·{' '}
            {client.sessions.filter((s) => s.status === 'Upcoming').length} upcoming
          </div>
        </div>

        <div className="card kpi">
          <div className="k-lbl">
            Transformation score <Icon name="target" />
          </div>
          <div className="k-val">
            {scoreNow}
            <small>/100</small>
          </div>
          <div className="k-sub">
            <span className="up">+{scoreNow - scorePrev}</span> since last month
          </div>
        </div>
      </section>

      <section className="card mt">
        <div className="card-head">
          <div>
            <h3>6-month action plan</h3>
            <div className="small muted">
              {fmtS(client.start)} {D(client.start).getFullYear()} → {fmtS(client.end)} {D(client.end).getFullYear()} · select a month to open it
            </div>
          </div>
          <button className="btn sm" onClick={() => onNavigate('action-plan')}>
            View full action plan
          </button>
        </div>
        <div className="tablewrap">
          <div className="rail" style={{ minWidth: 520 }}>
            <div className="fill" style={{ width: `${fillPct}%` }} />
            {client.months.map((m) => {
              const p = monthProgress(m.n);
              const cls = m.key < currentMonthPlan.key ? 'done' : m.key === currentMonthPlan.key ? 'now' : '';
              return (
                <button
                  key={m.n}
                  className={`stop ${cls}`}
                  onClick={() => onNavigate('action-plan')}
                >
                  <div className="node">
                    {cls === 'done' ? <Icon name="check" /> : p ? `${p}%` : '—'}
                  </div>
                  <div className="mn">{m.name.slice(0, 3)}</div>
                  <div className="th">{m.theme}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid g-dash mt">
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h3>Business transformation</h3>
              <button className="btn sm ghost" onClick={() => onNavigate('analytics')}>
                Open analytics
              </button>
            </div>
            <div className="grid g2" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                <DonutChart
                  parts={donutParts}
                  size={150}
                  stroke={24}
                  centerLabel={
                    <div>
                      <b style={{ fontSize: 30 }}>{Math.round((completedActions / totalActions) * 100)}%</b>
                      <span>items done</span>
                    </div>
                  }
                />
                <LegendList parts={donutParts} />
              </div>
              <div>
                <div className="small muted" style={{ fontWeight: 600, marginBottom: 12 }}>
                  Department performance
                </div>
                <HorizontalBars rows={client.dept} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Open action items</h3>
              <button className="btn sm ghost" onClick={() => onNavigate('action-plan')}>
                All items
              </button>
            </div>
            {openActionsList.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="li clickable"
                onClick={() => onOpenAction(a.id)}
              >
                <span className="tick" />
                <div className="grow">
                  <div className="ttl">{a.title}</div>
                  <div className="sub">
                    {a.owner} · due {fmt(a.due)}
                  </div>
                </div>
                <span
                  className={`badge ${
                    a.status === 'Delayed'
                      ? 'b-bad'
                      : a.status === 'In Progress'
                      ? 'b-info'
                      : a.status === 'Under Review'
                      ? 'b-brand'
                      : 'b-mute'
                  }`}
                >
                  <span className="dot" />
                  {a.status}
                </span>
              </div>
            ))}
            {client.actions
              .filter((a) => a.status === 'Completed')
              .slice(-2)
              .map((a) => (
                <div
                  key={a.id}
                  className="li clickable"
                  onClick={() => onOpenAction(a.id)}
                >
                  <span className="tick on">
                    <Icon name="check" />
                  </span>
                  <div className="grow">
                    <div className="ttl" style={{ color: 'var(--ink-3)' }}>
                      {a.title}
                    </div>
                    <div className="sub">Completed</div>
                  </div>
                </div>
              ))}
          </div>

          {lastSession && lastSession.summary && (
            <div className="card">
              <div className="card-head">
                <h3>Recent session summary</h3>
                <span className="badge b-ok">
                  <Icon name="check" />
                  Completed
                </span>
              </div>
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{lastSession.title}</div>
                  <div className="small muted">
                    {fmtL(lastSession.date)} · {lastSession.duration} minutes · {lastSession.mode}
                  </div>
                </div>
                <button className="btn sm" onClick={() => onOpenSession(lastSession.id)}>
                  View summary
                </button>
              </div>
              <div className="small" style={{ marginTop: 14 }}>
                <b>Key finding:</b> {lastSession.summary.findings[0]}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          {nextSession && (
            <div className="card">
              <div className="card-head">
                <h3>Upcoming session</h3>
                <span className="badge b-brand">in {daysBetween(TODAY, nextSession.date)} days</span>
              </div>
              <div className="sess" style={{ border: 0, padding: 0 }}>
                <div className="date">
                  <div className="datebox">
                    <b>{D(nextSession.date).getDate()}</b>
                    <span>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][D(nextSession.date).getMonth()]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{nextSession.title}</div>
                    <div className="small muted">
                      {nextSession.time} · {nextSession.mode}
                    </div>
                  </div>
                </div>
                <div className="small" style={{ margin: '14px 0' }}>
                  <Icon name="user" /> <span className="muted">Consultant:</span> {nextSession.consultant}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn sm"
                    style={{
                      borderColor: 'var(--brand)',
                      color: 'var(--brand)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onClick={() => onOpenQRAttendance?.(nextSession, client.id || (client as any).clientId)}
                  >
                    📱 QR Attendance
                  </button>
                  <button className="btn sm" onClick={() => onOpenSession(nextSession.id)}>
                    View session
                  </button>
                  {nextSession.mode === 'Online' && (
                    <button
                      className="btn sm primary"
                      onClick={() =>
                        showToast(
                          nextSession.date === TODAY
                            ? 'Opening meeting…'
                            : `This session opens on ${fmt(nextSession.date)} at 10:00 AM`
                        )
                      }
                    >
                      <Icon name="video" />
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h3>Latest updates</h3>
              <button className="btn sm ghost" onClick={() => onNavigate('updates')}>
                View all
              </button>
            </div>
            {[...client.updates]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((u) => (
                <div
                  key={u.id}
                  className="li clickable"
                  onClick={() => onOpenUpdate(u.id)}
                >
                  <span className="badge b-brand" style={{ padding: 6 }}>
                    <Icon name="updates" />
                  </span>
                  <div className="grow">
                    <div className="ttl">{u.title}</div>
                    <div className="sub">
                      {fmt(u.date)} · {u.type}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Upcoming events</h3>
              <button className="btn sm ghost" onClick={() => onNavigate('events')}>
                All events
              </button>
            </div>
            {client.events
              .filter((e) => e.date >= TODAY)
              .slice(0, 2)
              .map((e) => (
                <div
                  key={e.id}
                  className="li clickable"
                  onClick={() => onOpenEvent(e.id)}
                >
                  <div className="datebox" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                    <b>{D(e.date).getDate()}</b>
                    <span>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][D(e.date).getMonth()]}</span>
                  </div>
                  <div className="grow">
                    <div className="ttl">{e.title}</div>
                    <div className="sub">
                      {e.time.split(' –')[0]} · {e.loc}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="card mt">
        <div className="card-head">
          <h3>Photo highlights</h3>
          <button className="btn sm ghost" onClick={() => onNavigate('photos')}>
            Open gallery
          </button>
        </div>
        <div className="pgrid">
          {client.photos.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="photo"
              onClick={() => onOpenPhoto(p.id)}
            >
              <PhotoArt hue={p.hue} seed={p.seed} />
              <div className="cap">
                <b>{p.title}</b>
                {fmt(p.date)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

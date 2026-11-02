import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { ProgressRing } from '../common/Charts';
import { fmt, fmtS, D, MONF } from '../../utils/date';
import { ActionItem } from '../../types';

interface ActionPlanPageProps {
  onOpenAction: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const ActionPlanPage: React.FC<ActionPlanPageProps> = ({ onOpenAction, onNavigate }) => {
  const { client, showToast } = usePortal();
  const [activeView, setActiveView] = useState<'timeline' | 'list' | 'calendar'>('timeline');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  if (!client) return null;

  const monthProgress = (n: number) => {
    const list = client.actions.filter((a) => a.month === n);
    return list.length ? Math.round(list.reduce((s, a) => s + a.progress, 0) / list.length) : 0;
  };

  const overallProgress = client.actions.length
    ? Math.round(client.actions.reduce((s, a) => s + a.progress, 0) / client.actions.length)
    : 0;

  const statusCounts = {
    'Completed': client.actions.filter((a) => a.status === 'Completed').length,
    'In Progress': client.actions.filter((a) => a.status === 'In Progress').length,
    'Under Review': client.actions.filter((a) => a.status === 'Under Review').length,
    'Delayed': client.actions.filter((a) => a.status === 'Delayed').length,
    'Not Started': client.actions.filter((a) => a.status === 'Not Started').length
  };

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      'Completed': 'b-ok',
      'In Progress': 'b-info',
      'Under Review': 'b-brand',
      'Delayed': 'b-bad',
      'Not Started': 'b-mute'
    };
    return (
      <span className={`badge ${map[s] || 'b-mute'}`}>
        <span className="dot" />
        {s}
      </span>
    );
  };

  const getPrioBadge = (p: string) => {
    const map: Record<string, string> = {
      'High': 'b-bad',
      'Medium': 'b-warn',
      'Low': 'b-mute'
    };
    return <span className={`badge ${map[p] || 'b-mute'}`}>{p}</span>;
  };

  // Month Detail View
  if (selectedMonth !== null) {
    const m = client.months.find((x) => x.n === selectedMonth);
    const items = client.actions.filter((a) => a.month === selectedMonth);
    const p = monthProgress(selectedMonth);

    if (!m) return null;

    return (
      <div>
        <button
          className="btn sm ghost"
          onClick={() => setSelectedMonth(null)}
          style={{ marginBottom: 14 }}
        >
          <Icon name="chevL" />
          Back to all months
        </button>

        <div className="card">
          <div className="row-between" style={{ flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ maxWidth: 640 }}>
              <div className="small" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                Month {m.n} of 6 · {m.name} {m.year}
              </div>
              <h2 className="serif" style={{ fontWeight: 500, fontSize: 32, margin: '4px 0 10px' }}>
                {m.theme}
              </h2>
              <div className="kv">
                <dt>Objective</dt>
                <dd>{m.objective}</dd>
                <dt>Expected outcome</dt>
                <dd>{m.outcome}</dd>
              </div>
            </div>

            <ProgressRing
              pct={p}
              size={140}
              stroke={12}
              label={
                <div>
                  <b style={{ fontSize: 34 }}>{p}%</b>
                  <span>month progress</span>
                </div>
              }
            />
          </div>

          <div className="divider" />

          <div className="grid g2">
            <div>
              <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>
                Key focus areas
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.focus.map((f, i) => (
                  <span key={i} className="badge b-brand">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>
                Consultant notes
              </div>
              <div className="small">
                {m.notes ? m.notes : <span className="muted">Notes will be added when this month begins.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card-head mt">
          <h3>Action items ({items.length})</h3>
          <div className="small muted">
            {items.filter((a) => a.status === 'Completed').length} of {items.length} completed
          </div>
        </div>

        <div className="grid g2">
          {items.map((a) => (
            <div
              key={a.id}
              className="item clickable"
              onClick={() => onOpenAction(a.id)}
            >
              <div className="top">
                <h5 className="ttl">{a.title}</h5>
                {getStatusBadge(a.status)}
              </div>
              <div className="small muted">{a.desc}</div>
              <div className="meta">
                <span>Priority {getPrioBadge(a.priority)}</span>
                <span>
                  Owner <b>{a.owner}</b>
                </span>
                <span>
                  Due <b>{fmt(a.due)}</b>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="progress" style={{ flex: 1 }}>
                  <i
                    style={{
                      width: `${a.progress}%`,
                      background:
                        a.status === 'Delayed'
                          ? 'var(--bad)'
                          : a.status === 'Completed'
                          ? 'var(--ok)'
                          : undefined
                    }}
                  />
                </div>
                <b className="small">{a.progress}%</b>
              </div>
              <div className="row-between small muted">
                <span>
                  {a.comments.length} comment{a.comments.length === 1 ? '' : 's'} · {a.attachments.length} attachment{a.attachments.length === 1 ? '' : 's'}
                </span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>View details</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>6-month business transformation plan</h1>
          <p>
            {client.company} · {MONF[D(client.start).getMonth()]} {D(client.start).getFullYear()} → {MONF[D(client.end).getMonth()]} {D(client.end).getFullYear()}
          </p>
        </div>

        <div className="seg" role="tablist">
          {(
            [
              ['timeline', 'Timeline'],
              ['list', 'List'],
              ['calendar', 'Calendar']
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              className={activeView === v ? 'on' : ''}
              onClick={() => setActiveView(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center' }}>
          <ProgressRing
            pct={overallProgress}
            size={120}
            stroke={11}
            label={
              <div>
                <b style={{ fontSize: 30 }}>{overallProgress}%</b>
                <span>overall</span>
              </div>
            }
          />
          <div>
            <div className="legend" style={{ gap: 22 }}>
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status}>
                  {getStatusBadge(status)}
                  <b style={{ marginLeft: 6 }}>{count}</b>
                </span>
              ))}
            </div>
            <div className="small muted" style={{ marginTop: 12 }}>
              Currently in <b style={{ color: 'var(--ink)' }}>Month 3: People &amp; Organisation</b>. Delayed items are flagged in red and reviewed at every steering committee.
            </div>
          </div>
        </div>
      </div>

      {activeView === 'timeline' && (
        <div className="monthgrid">
          {client.months.map((m) => {
            const p = monthProgress(m.n);
            const items = client.actions.filter((a) => a.month === m.n);
            const isCompleted = p === 100 || m.n < 3;
            const isCurrent = m.n === 3;
            const badgeLabel = isCompleted ? 'Completed' : isCurrent ? 'Current month' : 'Upcoming';
            const badgeClass = isCompleted ? 'b-ok' : isCurrent ? 'b-brand' : 'b-mute';

            return (
              <button
                key={m.n}
                className={`mcard ${isCurrent ? 'now' : ''}`}
                onClick={() => setSelectedMonth(m.n)}
              >
                <div className="row-between">
                  <span className="mnum">Month {String(m.n).padStart(2, '0')}</span>
                  <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                </div>
                <h4>{m.name}</h4>
                <div className="small" style={{ fontWeight: 600 }}>
                  {m.theme}
                </div>
                <div className="small muted" style={{ margin: '8px 0 14px', minHeight: 42 }}>
                  {m.objective}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="progress" style={{ flex: 1 }}>
                    <i style={{ width: `${p}%` }} />
                  </div>
                  <b className="small">{p}%</b>
                </div>
                <div className="tiny muted" style={{ marginTop: 8 }}>
                  {items.filter((a) => a.status === 'Completed').length}/{items.length} action items complete
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeView === 'list' && (
        <div className="card" style={{ padding: '8px 0' }}>
          <div className="tablewrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Action item</th>
                  <th>Month</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {client.actions.map((a) => (
                  <tr
                    key={a.id}
                    className="click"
                    onClick={() => onOpenAction(a.id)}
                  >
                    <td>
                      <b>{a.title}</b>
                    </td>
                    <td>{client.months[a.month - 1].name.slice(0, 3)}</td>
                    <td>{a.owner}</td>
                    <td>{fmtS(a.due)}</td>
                    <td>{getPrioBadge(a.priority)}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td>
                      <div className="progress">
                        <i style={{ width: `${a.progress}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="vtl card">
          {client.months.map((m) => {
            const isCompleted = m.n < 3;
            const isCurrent = m.n === 3;
            return (
              <div key={m.n} className={`ev ${isCompleted ? 'done' : isCurrent ? 'now' : ''}`}>
                <div className="row-between" style={{ flexWrap: 'wrap' }}>
                  <div>
                    <span className="small" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                      {m.name} {m.year}
                    </span>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>{m.theme}</div>
                  </div>
                  <button className="btn sm" onClick={() => setSelectedMonth(m.n)}>
                    Open month
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  {client.actions
                    .filter((a) => a.month === m.n)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="li clickable"
                        onClick={() => onOpenAction(a.id)}
                        style={{ padding: '8px 0' }}
                      >
                        <span className={`tick ${a.status === 'Completed' ? 'on' : ''}`}>
                          {a.status === 'Completed' && <Icon name="check" />}
                        </span>
                        <div className="grow">
                          <div className="ttl small">{a.title}</div>
                        </div>
                        <span className="tiny muted">{fmtS(a.due)}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

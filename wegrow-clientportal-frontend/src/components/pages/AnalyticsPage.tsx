import React from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  ProgressRing,
  DonutChart,
  LegendList,
  HorizontalBars,
  RadarChart,
  LineChart,
  ColumnBars
} from '../common/Charts';

export const AnalyticsPage: React.FC = () => {
  const { client } = usePortal();
  if (!client) return null;

  const actions = client.actions;
  const total = actions.length;
  const completed = actions.filter((a) => a.status === 'Completed').length;
  const inProgress = actions.filter((a) => a.status === 'In Progress' || a.status === 'Under Review').length;
  const delayed = actions.filter((a) => a.status === 'Delayed').length;
  const pending = actions.filter((a) => a.status === 'Not Started').length;

  const scoreNow = client.scoreHistory[client.scoreHistory.length - 1].v;
  const scorePrev = client.scoreHistory[0].v;

  const donutParts = [
    { k: 'Completed', v: completed, c: 'var(--brand)' },
    { k: 'In progress', v: inProgress, c: 'var(--teal)' },
    { k: 'Delayed', v: delayed, c: 'var(--bad)' },
    { k: 'Pending', v: pending, c: 'var(--line-2)' }
  ];

  const monthProgress = (n: number) => {
    const list = client.actions.filter((a) => a.month === n);
    return list.length ? Math.round(list.reduce((s, a) => s + a.progress, 0) / list.length) : 0;
  };

  const monthsCol = client.months.map((m) => ({
    k: m.name.slice(0, 3),
    v: monthProgress(m.n)
  }));

  const owners: Record<string, { total: number; done: number }> = {};
  client.actions.forEach((a) => {
    const k = a.owner.replace(/ \(.*\)/, '');
    owners[k] = owners[k] || { total: 0, done: 0 };
    owners[k].total++;
    if (a.status === 'Completed') owners[k].done++;
  });

  const ownerBars = Object.entries(owners).map(([k, o]) => ({
    k: k.length > 16 ? k.slice(0, 15) + '…' : k,
    v: Math.round((o.done / o.total) * 100)
  }));

  const fb = client.feedback;
  const avgRating = fb.length
    ? (fb.reduce((s, f) => s + f.rating, 0) / fb.length).toFixed(1)
    : '—';
  const highlyRelevantPct = fb.length
    ? Math.round((fb.filter((f) => f.relevance === 'Very Relevant').length / fb.length) * 100)
    : 0;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Business analytics</h1>
          <p>How {client.company} has moved since the October baseline.</p>
        </div>
      </div>

      <div className="card">
        <div className="score-wrap">
          <ProgressRing
            pct={scoreNow}
            size={210}
            stroke={16}
            label={
              <div>
                <b>{scoreNow}</b>
                <span>out of 100</span>
              </div>
            }
          />
          <div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 26, margin: '0 0 4px' }}>
              Business transformation score
            </h3>
            <div className="small muted" style={{ marginBottom: 18 }}>
              Weighted across five areas; the grey tick marks the baseline.
            </div>
            <div style={{ display: 'flex', gap: 28, marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                <div className="tiny muted">Previous score</div>
                <div className="serif" style={{ fontSize: 28 }}>
                  {scorePrev}
                </div>
              </div>
              <div>
                <div className="tiny muted">Current score</div>
                <div className="serif" style={{ fontSize: 28 }}>
                  {scoreNow}
                </div>
              </div>
              <div>
                <div className="tiny muted">Improvement</div>
                <div className="serif up" style={{ fontSize: 28 }}>
                  +{scoreNow - scorePrev}
                </div>
              </div>
            </div>
            <HorizontalBars rows={client.dept} showPrev={true} />
          </div>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="card">
          <div className="card-head">
            <h3>Action plan completion</h3>
            <span className="small muted">{total} items</span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <DonutChart
              parts={donutParts}
              size={190}
              stroke={28}
              centerLabel={
                <div>
                  <b style={{ fontSize: 34 }}>{Math.round((completed / total) * 100)}%</b>
                  <span>completed</span>
                </div>
              }
            />
            <LegendList parts={donutParts} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Capability profile</h3>
            <span className="small muted">Now vs baseline</span>
          </div>
          <RadarChart rows={client.dept} />
          <div className="legend" style={{ justifyContent: 'center', marginTop: 6 }}>
            <span>
              <i style={{ background: 'var(--brand)' }} />
              Current
            </span>
            <span>
              <i style={{ background: 'var(--ink-3)' }} />
              Baseline
            </span>
          </div>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="card">
          <div className="card-head">
            <h3>Transformation score trend</h3>
          </div>
          <div className="tablewrap">
            <LineChart pts={client.scoreHistory} min={40} max={100} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Progress by month</h3>
          </div>
          <div className="tablewrap">
            <ColumnBars rows={monthsCol} />
          </div>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="card">
          <div className="card-head">
            <h3>Completion by owner</h3>
          </div>
          <HorizontalBars rows={ownerBars} />
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Session experience</h3>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <div>
              <div className="tiny muted">Average rating</div>
              <div className="serif" style={{ fontSize: 40 }}>
                {avgRating}
                <small className="muted" style={{ fontSize: 18 }}>
                  /5
                </small>
              </div>
            </div>
            <div>
              <div className="tiny muted">Rated “very relevant”</div>
              <div className="serif" style={{ fontSize: 40 }}>
                {highlyRelevantPct}
                <small className="muted" style={{ fontSize: 18 }}>
                  %
                </small>
              </div>
            </div>
            <div>
              <div className="tiny muted">Sessions rated</div>
              <div className="serif" style={{ fontSize: 40 }}>
                {fb.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

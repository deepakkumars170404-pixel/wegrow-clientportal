import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { fmt } from '../../utils/date';

interface ReportsPageProps {
  onOpenReport: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onOpenReport }) => {
  const { client, showToast } = usePortal();
  const [filter, setFilter] = useState('All');

  if (!client) return null;

  const categories = ['All', ...new Set(client.reports.map((r) => r.cat))];
  const list = client.reports
    .filter((r) => filter === 'All' || r.cat === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Reports &amp; summaries</h1>
          <p>Every report WeGrow has prepared for {client.company}.</p>
        </div>
      </div>

      <div className="filters">
        {categories.map((c) => (
          <button
            key={c}
            className={filter === c ? 'on' : ''}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid g3">
        {list.length > 0 ? (
          list.map((r) => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="row-between">
                <span className="badge b-brand">{r.cat}</span>
                <span className="tiny muted">{r.pages} pages</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.25 }}>
                  {r.name}
                </div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  {fmt(r.date)}
                </div>
              </div>
              <div className="small" style={{ flex: 1 }}>
                {r.desc}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn sm" onClick={() => onOpenReport(r.id)}>
                  <Icon name="eye" />
                  View
                </button>
                <button
                  className="btn sm primary"
                  onClick={() => showToast(`Downloading ${r.name}.pdf`)}
                >
                  <Icon name="download" />
                  Download PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <b>No reports in this category yet</b>
            They will appear here as soon as your consultant publishes them.
          </div>
        )}
      </div>
    </>
  );
};

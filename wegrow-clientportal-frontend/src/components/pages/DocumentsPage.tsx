import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { fmt } from '../../utils/date';

interface DocumentsPageProps {
  onViewDoc: (name: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onViewDoc }) => {
  const { client, showToast } = usePortal();
  const [filter, setFilter] = useState('All');

  if (!client) return null;

  const categories = [
    'All',
    'Business Reports',
    'Consulting Documents',
    'SOPs',
    'Action Plans',
    'Presentations',
    'Session Materials',
    'Agreements',
    'Certificates',
    'Other Documents'
  ];

  const list = client.documents
    .filter((d) => filter === 'All' || d.cat === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Documents</h1>
          <p>
            A private library for {client.company}. {client.documents.length} files.
          </p>
        </div>
        <span className="badge b-ok">
          <Icon name="shield" />
          Visible to your company only
        </span>
      </div>

      <div className="filters">
        {categories.map((c) => {
          const count = client.documents.filter((d) => d.cat === c).length;
          return (
            <button
              key={c}
              className={filter === c ? 'on' : ''}
              onClick={() => setFilter(c)}
            >
              {c} {c !== 'All' && <span className="muted">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: '8px 0' }}>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>File name</th>
                <th>Category</th>
                <th>Uploaded</th>
                <th>Uploaded by</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span
                          className={`fileic ft-${d.type}`}
                          style={{ width: 32, height: 38, fontSize: 9 }}
                        >
                          {d.type.toUpperCase()}
                        </span>
                        <b style={{ wordBreak: 'break-all' }}>{d.name}</b>
                      </div>
                    </td>
                    <td>{d.cat}</td>
                    <td>{fmt(d.date)}</td>
                    <td>{d.by}</td>
                    <td>
                      {d.type.toUpperCase()} · {d.size}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn sm ghost"
                        onClick={() => onViewDoc(d.name)}
                        title="View preview"
                      >
                        <Icon name="eye" />
                        View
                      </button>
                      <button
                        className="btn sm ghost"
                        onClick={() => showToast(`Downloading ${d.name}`)}
                        title="Download file"
                      >
                        <Icon name="download" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <b>No files in {filter}</b>
                      Your consultant will upload them here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

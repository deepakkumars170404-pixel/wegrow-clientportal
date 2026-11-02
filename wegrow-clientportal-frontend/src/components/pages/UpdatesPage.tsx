import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { fmt } from '../../utils/date';

interface UpdatesPageProps {
  onOpenUpdate: (id: string) => void;
}

const TYPE_CONFIG: Record<string, [string, string]> = {
  'General Update': ['b-mute', 'updates'],
  'Important Update': ['b-info', 'alert'],
  'Action Required': ['b-bad', 'flag'],
  'Milestone': ['b-ok', 'target'],
  'Recommendation': ['b-teal', 'spark']
};

export const UpdatesPage: React.FC<UpdatesPageProps> = ({ onOpenUpdate }) => {
  const { client, markUpdateRead } = usePortal();
  const [filter, setFilter] = useState('All');

  if (!client) return null;

  const types = ['All', ...Object.keys(TYPE_CONFIG)];
  const list = client.updates
    .filter((u) => filter === 'All' || u.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Business updates</h1>
          <p>News, decisions and recommendations from your WeGrow consultants.</p>
        </div>
      </div>

      <div className="filters">
        {types.map((t) => (
          <button
            key={t}
            className={filter === t ? 'on' : ''}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        {list.length > 0 ? (
          list.map((u) => {
            const config = TYPE_CONFIG[u.type] || TYPE_CONFIG['General Update'];
            const isUnread = !client.readUpdates?.includes(u.id);

            return (
              <div
                key={u.id}
                className={`upd ${isUnread ? 'unread' : ''} clickable`}
                onClick={() => {
                  markUpdateRead(u.id);
                  onOpenUpdate(u.id);
                }}
              >
                <span className={`ic ${config[0]}`}>
                  <Icon name={config[1]} />
                </span>
                <div className="grow" style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <div className="ttl" style={{ fontWeight: 700 }}>
                      {u.title}
                    </div>
                    <span className={`badge ${config[0]}`}>{u.type}</span>
                  </div>
                  <div className="small muted" style={{ margin: '4px 0 6px' }}>
                    {fmt(u.date)} · {u.cat}
                  </div>
                  <div className="small" style={{ maxWidth: '75ch' }}>
                    {u.body.length > 150 ? u.body.slice(0, 150) + '…' : u.body}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <b>No updates of this type</b>
            Choose another filter to see more.
          </div>
        )}
      </div>
    </>
  );
};

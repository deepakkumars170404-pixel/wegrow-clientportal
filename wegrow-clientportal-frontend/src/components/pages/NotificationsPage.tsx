import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { fmt } from '../../utils/date';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

const NOTIF_ICONS: Record<string, [string, string]> = {
  Sessions: ['sessions', 'b-brand'],
  'Action Plan': ['plan', 'b-warn'],
  Reports: ['reports', 'b-info'],
  Events: ['events', 'b-teal'],
  Important: ['alert', 'b-bad']
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { client, markNotificationRead, markAllNotificationsRead } = usePortal();
  const [filter, setFilter] = useState('All');

  if (!client) return null;

  const categories = ['All', 'Sessions', 'Action Plan', 'Reports', 'Events', 'Important'];
  const list = client.notifications
    .filter((n) => filter === 'All' || n.cat === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const unreadCount = client.notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>
        <button className="btn sm" onClick={markAllNotificationsRead}>
          <Icon name="check" />
          Mark all as read
        </button>
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

      <div className="card">
        {list.length > 0 ? (
          list.map((n) => {
            const iconConfig = NOTIF_ICONS[n.cat] || ['bell', 'b-mute'];
            return (
              <div
                key={n.id}
                className={`upd ${n.read ? '' : 'unread'} clickable`}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.link) {
                    const page = n.link.replace(/^#\/?/, '/');
                    onNavigate(page);
                  }
                }}
              >
                <span className={`ic ${iconConfig[1]}`}>
                  <Icon name={iconConfig[0]} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="ttl" style={{ fontWeight: n.read ? 500 : 700 }}>
                    {n.text}
                  </div>
                  <div className="tiny muted">
                    {fmt(n.date)} · {n.cat}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <b>You are all caught up</b>
            New notifications will appear here.
          </div>
        )}
      </div>
    </>
  );
};

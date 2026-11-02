import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import { BannerArt } from '../common/Charts';
import { fmtL, TODAY } from '../../utils/date';

interface EventsPageProps {
  onOpenEvent: (id: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onOpenEvent }) => {
  const { client, isRegisteredForEvent } = usePortal();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  if (!client) return null;

  const list = client.events
    .filter((e) => (tab === 'upcoming' ? e.date >= TODAY : e.date < TODAY))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Events</h1>
          <p>Workshops, business meets, training and networking open to {client.company}.</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={tab === 'upcoming' ? 'on' : ''}
          onClick={() => setTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={tab === 'past' ? 'on' : ''}
          onClick={() => setTab('past')}
        >
          Past
        </button>
      </div>

      <div className="grid g3">
        {list.length > 0 ? (
          list.map((e) => {
            const registered = isRegisteredForEvent(e.id);
            return (
              <div
                key={e.id}
                className="card clickable"
                onClick={() => onOpenEvent(e.id)}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div style={{ aspectRatio: '16/8' }}>
                  <BannerArt hue={e.hue} />
                </div>
                <div style={{ padding: 18 }}>
                  <div className="row-between">
                    <span className="badge b-teal">{e.type.replace(/s$/, '')}</span>
                    {registered && <span className="badge b-ok">Registered</span>}
                  </div>
                  <div
                    className="ttl"
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 21,
                      margin: '10px 0 6px',
                      lineHeight: 1.2
                    }}
                  >
                    {e.title}
                  </div>
                  <div className="small muted" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>
                      <Icon name="calendar" /> {fmtL(e.date)}
                    </span>
                    <span>
                      <Icon name="clock" /> {e.time}
                    </span>
                    <span>
                      <Icon name="pin" /> {e.loc}
                    </span>
                  </div>
                  <button className="btn sm" style={{ marginTop: 14 }}>
                    View event
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <b>No events here yet</b>
            New events will show up as soon as they are announced.
          </div>
        )}
      </div>
    </>
  );
};

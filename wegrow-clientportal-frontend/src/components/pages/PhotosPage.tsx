import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { PhotoArt } from '../common/Charts';
import { fmt } from '../../utils/date';

interface PhotosPageProps {
  onOpenPhoto: (id: string) => void;
}

export const PhotosPage: React.FC<PhotosPageProps> = ({ onOpenPhoto }) => {
  const { client } = usePortal();
  const [filter, setFilter] = useState('All');

  if (!client) return null;

  const categories = ['All', ...new Set(client.photos.map((p) => p.cat))];
  const list = client.photos.filter((p) => filter === 'All' || p.cat === filter);
  const [feat, ...rest] = list;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Photos</h1>
          <p>Moments from your sessions, workshops and events.</p>
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

      {feat ? (
        <>
          <div className="gal-feature">
            <div className="photo big" onClick={() => onOpenPhoto(feat.id)}>
              <PhotoArt hue={feat.hue} seed={feat.seed} w={800} h={500} />
              <div className="cap">
                <b style={{ fontSize: 18 }}>{feat.title}</b>
                {fmt(feat.date)} · {feat.desc}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {rest.slice(0, 2).map((p) => (
                <div key={p.id} className="photo" onClick={() => onOpenPhoto(p.id)}>
                  <PhotoArt hue={p.hue} seed={p.seed} />
                  <div className="cap">
                    <b>{p.title}</b>
                    {fmt(p.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pgrid mt">
            {rest.slice(2).map((p) => (
              <div key={p.id} className="photo" onClick={() => onOpenPhoto(p.id)}>
                <PhotoArt hue={p.hue} seed={p.seed} />
                <div className="cap">
                  <b>{p.title}</b>
                  {fmt(p.date)}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty">
          <b>No photos in this category</b>
          Try another category.
        </div>
      )}
    </>
  );
};

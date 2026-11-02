import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { ClientLogo } from '../common/Icons';
import { fmt } from '../../utils/date';

export const ProfilePage: React.FC = () => {
  const { client, updateClientProfile } = usePortal();

  if (!client) return null;

  const [contact, setContact] = useState(client.contact);
  const [contactTitle, setContactTitle] = useState(client.contactTitle);
  const [phone, setPhone] = useState(client.phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientProfile({
      contact: contact.trim() || client.contact,
      contactTitle: contactTitle.trim() || client.contactTitle,
      phone: phone.trim() || client.phone
    });
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Company profile</h1>
          <p>Fields marked editable can be changed by you; everything else is managed by WeGrow.</p>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="card">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 22 }}>
            <ClientLogo client={client} size={72} />
            <div>
              <div className="serif" style={{ fontSize: 28, lineHeight: 1.1 }}>
                {client.company}
              </div>
              <div className="muted">
                {client.industry} · {client.location}
              </div>
            </div>
          </div>

          <dl className="kv">
            <dt>Industry</dt>
            <dd>{client.industry}</dd>
            <dt>Company size</dt>
            <dd>{client.size}</dd>
            <dt>Location</dt>
            <dd>{client.location}</dd>
            <dt>Consulting start</dt>
            <dd>{fmt(client.start)}</dd>
            <dt>Consulting end</dt>
            <dd>{fmt(client.end)}</dd>
            <dt>Assigned consultant</dt>
            <dd>{client.consultant}</dd>
            <dt>Client ID</dt>
            <dd>{client.id}</dd>
          </dl>

          <h4 className="small muted" style={{ margin: '22px 0 10px', fontWeight: 700 }}>
            Business areas in scope
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {client.areas.map((a, idx) => (
              <span key={idx} className="badge b-brand">
                {a}
              </span>
            ))}
          </div>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="card-head">
            <h3>Primary contact</h3>
            <span className="badge b-teal">Editable</span>
          </div>

          <div className="field">
            <label htmlFor="pc">Name</label>
            <input
              className="input"
              id="pc"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pt">Title</label>
            <input
              className="input"
              id="pt"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pe">Email</label>
            <input
              className="input"
              id="pe"
              type="email"
              value={client.email}
              disabled
            />
            <span className="tiny muted">Login email can only be changed by WeGrow.</span>
          </div>

          <div className="field">
            <label htmlFor="pp">Phone</label>
            <input
              className="input"
              id="pp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="btn primary" type="submit">
            Save changes
          </button>
        </form>
      </div>
    </>
  );
};

import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, logout, showToast } = usePortal();
  const [emailNotif, setEmailNotif] = useState(true);
  const [remindNotif, setRemindNotif] = useState(true);
  const [digestNotif, setDigestNotif] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
    setter(!val);
    showToast('Preference saved');
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Settings</h1>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head">
            <h3>Notifications</h3>
          </div>

          <div className="setrow">
            <span className="small">Email me when a report or session summary is published</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={() => handleToggle(setEmailNotif, emailNotif)}
              />
              <span />
            </label>
          </div>

          <div className="setrow">
            <span className="small">Remind me 24 hours before each session</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={remindNotif}
                onChange={() => handleToggle(setRemindNotif, remindNotif)}
              />
              <span />
            </label>
          </div>

          <div className="setrow">
            <span className="small">Send a weekly progress digest every Monday</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={digestNotif}
                onChange={() => handleToggle(setDigestNotif, digestNotif)}
              />
              <span />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Appearance &amp; security</h3>
          </div>

          <div className="setrow">
            <span className="small">Theme</span>
            <div className="seg">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  className={theme === t ? 'on' : ''}
                  onClick={() => setTheme(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="setrow">
            <span className="small">Password</span>
            <button
              className="btn sm"
              onClick={() => showToast('A password reset link has been sent to your email')}
            >
              Change password
            </button>
          </div>

          <div className="setrow">
            <span className="small">Active session</span>
            <button className="btn sm" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePortal } from '../../context/PortalContext';
import { Icon, WeGrowLogo } from '../common/Icons';
import { VerticalAttendanceScroller } from '../common/VerticalAttendanceScroller';
import { WhatsAppFeedbackDispatchTable } from '../common/WhatsAppFeedbackDispatchTable';
import { fmt, TODAY } from '../../utils/date';
import { AttendanceRecord, Session } from '../../types';

interface AttendancePageProps {
  isAdmin?: boolean;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ isAdmin = false }) => {
  const { clients, client, attendances, showToast } = usePortal();

  // Selected client (admin only)
  const [selectedCid, setSelectedCid] = useState<string>(() => {
    if (!isAdmin && client) return client.id || (client as any).clientId || '';
    const keys = Object.keys(clients).filter((k) => clients[k]?.status !== 'Archived');
    return keys[0] || '';
  });

  // Active target client
  const targetClient = isAdmin
    ? (clients[selectedCid] || client || Object.values(clients)[0])
    : client;

  const targetClientId = targetClient?.id || (targetClient as any)?.clientId || 'C001';

  // All sessions for this client
  const clientSessions: Session[] = targetClient?.sessions || [];

  // Selected session ID (default to first upcoming, or first session, or 'all')
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (clientSessions.length > 0) {
      const upcoming = clientSessions.find((s) => s.status === 'Upcoming');
      return upcoming ? (upcoming.id || upcoming.sessionId || 'S1') : (clientSessions[0]?.id || clientSessions[0]?.sessionId || 'S1');
    }
    return 'S1';
  });

  // Fullscreen / Projector view mode
  const [isProjector, setIsProjector] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active session object
  const activeSession: Session | undefined = clientSessions.find(
    (s) => s.id === selectedSessionId || s.sessionId === selectedSessionId
  ) || clientSessions[0];

  const sessionTitle = activeSession?.title || 'Business Transformation & Review Session';
  const sessionDate = activeSession?.date || TODAY;
  const sessionTime =
    (activeSession as any)?.time ||
    (activeSession?.start && activeSession?.end ? `${activeSession.start} – ${activeSession.end}` : '10:00 AM – 11:30 AM');
  const sessionMode = activeSession?.mode || 'In person';
  const sessionLocation =
    (activeSession as any)?.location ||
    (sessionMode === 'In person' ? `${targetClient?.company || 'Client'} Conference Hall` : 'Google Meet');
  const sessionConsultant = (activeSession as any)?.consultant || targetClient?.consultant || 'Dr. Thavabalan & WeGrow Team';

  // Public check-in URL for active session
  const origin = window.location.origin;
  const currentSessionId = activeSession?.id || activeSession?.sessionId || selectedSessionId || 'S1';
  const checkInUrl = `${origin}/checkin/${encodeURIComponent(currentSessionId)}?clientId=${encodeURIComponent(targetClientId)}`;

  // Filter attendees for this session
  const sessionAttendees = useMemo(() => {
    return attendances.filter((att) => {
      if (selectedSessionId === 'all') {
        return att.clientId === targetClientId;
      }
      return (
        att.sessionId === currentSessionId ||
        att.sessionId === activeSession?.sessionId ||
        att.sessionId === activeSession?.id
      );
    });
  }, [attendances, selectedSessionId, currentSessionId, activeSession, targetClientId]);

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    showToast('Check-in link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Download QR Code image
  const handleDownloadQR = () => {
    try {
      const svgEl = document.getElementById('attendance-page-qr');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = 600;
        canvas.height = 600;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 600, 600);
          ctx.drawImage(img, 50, 50, 500, 500);
          const link = document.createElement('a');
          link.download = `QR-Attendance-${currentSessionId}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('QR Code downloaded!');
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      showToast('Could not download QR code image.');
    }
  };

  // If in Projector / Fullscreen mode:
  if (isProjector) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'radial-gradient(ellipse at top, #1E1538 0%, #0A0612 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 36px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Projector Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#7C3AED', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <WeGrowLogo size={24} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {targetClient?.company} · {sessionTitle}
              </div>
              <div style={{ fontSize: 13, color: '#A78BFA', marginTop: 2 }}>
                📅 {fmt(sessionDate)} · 🕒 {sessionTime} · 📍 {sessionLocation}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              LIVE: {sessionAttendees.length} Checked In
            </span>

            <button
              type="button"
              className="btn"
              onClick={() => setIsProjector(false)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: 600,
                fontSize: 13,
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              ✕ Exit Projector Mode
            </button>
          </div>
        </div>

        {/* Projector Body: Split 50/50 */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, minHeight: 0 }}>
          {/* Left: QR Display */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              📱 Mobile QR Attendance
            </div>

            <div
              style={{
                background: '#FFFFFF',
                padding: 18,
                borderRadius: 16,
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                border: '4px solid #7C3AED',
                marginBottom: 16
              }}
            >
              <QRCodeSVG
                id="attendance-page-qr-proj"
                value={checkInUrl}
                size={240}
                level="H"
                includeMargin={false}
              />
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Scan Camera to Check In
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 280, lineHeight: 1.4 }}>
              Open your phone camera, scan the QR code above, and submit your name to record your attendance instantly.
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn sm"
                onClick={handleCopyLink}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 12 }}
              >
                {copied ? '✓ Copied' : '📋 Copy Link'}
              </button>
              <a
                href={checkInUrl}
                target="_blank"
                rel="noreferrer"
                className="btn sm"
                style={{ background: '#7C3AED', color: '#FFFFFF', fontSize: 12, textDecoration: 'none' }}
              >
                ↗ Open Form
              </a>
            </div>
          </div>

          {/* Right: Vertical Scrolling Participants from Bottom to Top */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <VerticalAttendanceScroller
              attendees={sessionAttendees}
              title={`Live Participants (${sessionAttendees.length})`}
              height="100%"
              isProjector={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Normal Dashboard View
  return (
    <>
      {/* Page Header */}
      <div className="pagehead" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Attendance &amp; Live Participant Wall</h1>
            <span
              className="badge b-ok"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 8px' }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  display: 'inline-block'
                }}
              />
              Live Polling (4.5s)
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-sub)' }}>
            Real-time participant check-in stream, live bottom-to-top attendee wall, and instant WhatsApp feedback dispatch.
          </p>
        </div>

        {/* Top Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isAdmin && (
            <select
              value={selectedCid}
              onChange={(e) => {
                setSelectedCid(e.target.value);
                const firstSess = clients[e.target.value]?.sessions?.[0];
                if (firstSess) {
                  setSelectedSessionId(firstSess.id || firstSess.sessionId || 'S1');
                }
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)'
              }}
            >
              {Object.values(clients)
                .filter((c) => c.status !== 'Archived')
                .map((c) => (
                  <option key={c.id || (c as any).clientId} value={c.id || (c as any).clientId}>
                    🏢 {c.company}
                  </option>
                ))}
            </select>
          )}

          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--paper)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink)',
              maxWidth: 240
            }}
          >
            {clientSessions.map((s) => (
              <option key={s.id || s.sessionId} value={s.id || s.sessionId}>
                {s.status === 'Upcoming' ? '🟢 ' : '⚪ '}
                {s.title} ({fmt(s.date)})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn"
            onClick={() => setIsProjector(true)}
            style={{
              background: 'var(--ink, #120C24)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              padding: '7px 14px'
            }}
            title="Launch full-screen high contrast projector mode for seminar screens"
          >
            🖥️ Projector Mode
          </button>
        </div>
      </div>

      {/* Split Section: QR Code Card & Vertical Attendance Scroller */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 20,
          marginBottom: 24,
          alignItems: 'stretch'
        }}
      >
        {/* Left Card: QR Attendance Station */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 20
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                QR Attendance Station
              </div>
              <span className="badge b-purple" style={{ fontSize: 11 }}>
                {activeSession?.status || 'Scheduled'}
              </span>
            </div>

            {/* Session Summary Pill */}
            <div
              style={{
                background: 'var(--paper-sub, #F9FAFB)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                marginBottom: 16
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                {sessionTitle}
              </div>
              <div style={{ color: 'var(--ink-sub)' }}>
                📅 {fmt(sessionDate)} · 🕒 {sessionTime}
              </div>
              <div style={{ color: 'var(--ink-sub)', marginTop: 2 }}>
                📍 {sessionLocation} · 🏢 {targetClient?.company}
              </div>
            </div>

            {/* Centered QR SVG */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '8px 0 16px'
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  padding: 16,
                  borderRadius: 14,
                  border: '2px solid var(--brand, #7C3AED)',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.12)',
                  display: 'inline-block'
                }}
              >
                <QRCodeSVG
                  id="attendance-page-qr"
                  value={checkInUrl}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginTop: 10 }}>
                Scan to Check In Instantaneously
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-sub)', textAlign: 'center', marginTop: 2, maxWidth: 260 }}>
                Collects 6 fields: Name, Designation, Phone, WhatsApp, Company, Time.
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn sm"
              onClick={handleCopyLink}
              style={{ flex: 1, fontSize: 12 }}
            >
              {copied ? '✓ Copied' : '📋 Copy Link'}
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={handleDownloadQR}
              style={{ flex: 1, fontSize: 12 }}
            >
              📥 Save QR
            </button>
            <a
              href={checkInUrl}
              target="_blank"
              rel="noreferrer"
              className="btn sm brand"
              style={{
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              ↗ Form
            </a>
          </div>
        </div>

        {/* Right Card: Vertical Line-by-Line Bottom-to-Top Scroller */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <VerticalAttendanceScroller
            attendees={sessionAttendees}
            title={`Live Participant Stream · ${targetClient?.company || 'Session'}`}
            height="100%"
          />
        </div>
      </div>

      {/* Bottom Section: Attendees & WhatsApp Feedback Dispatch Table */}
      <WhatsAppFeedbackDispatchTable
        clientId={targetClientId}
        isAdmin={isAdmin}
      />
    </>
  );
};


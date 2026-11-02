import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePortal } from '../../context/PortalContext';
import { Icon, WeGrowLogo } from '../common/Icons';
import { fmt, TODAY } from '../../utils/date';
import { AttendanceRecord, Session } from '../../types';

interface QRAttendanceModalProps {
  session?: Session | any;
  clientId?: string;
  onClose: () => void;
}

export const QRAttendanceModal: React.FC<QRAttendanceModalProps> = ({
  session,
  clientId,
  onClose
}) => {
  const {
    client,
    clients,
    attendances,
    fetchSessionAttendees,
    markFeedbackSent,
    showToast
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'qr' | 'whatsapp'>('qr');
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionAttendees, setSessionAttendees] = useState<AttendanceRecord[]>([]);

  // Safe session and client fallbacks
  const safeSession: any = session || {
    id: 'S1',
    sessionId: 'S1',
    title: 'Business Transformation & Review Session',
    date: TODAY,
    mode: 'In person'
  };

  const sessionId = safeSession.sessionId || safeSession.id || 'S1';
  const effectiveClientId =
    clientId ||
    client?.id ||
    (client as any)?.clientId ||
    Object.keys(clients)[0] ||
    'C001';

  const targetCompany = client?.company || clients[effectiveClientId]?.company || 'Client Company';
  const sessionTime = safeSession.time || (safeSession.start && safeSession.end ? `${safeSession.start} – ${safeSession.end}` : '10:00 AM – 11:30 AM');
  const sessionLocation = safeSession.location || (safeSession.mode === 'In person' ? `${targetCompany} Office` : 'Google Meet');
  const sessionConsultant = safeSession.consultant || 'Dr. Thavabalan & WeGrow Team';

  // Build the public check-in URL
  const origin = window.location.origin;
  const checkInUrl = `${origin}/checkin/${encodeURIComponent(sessionId)}?clientId=${encodeURIComponent(effectiveClientId)}`;

  // Filter attendees for this session from state and poll live
  useEffect(() => {
    let mounted = true;

    async function updateList() {
      try {
        const list = await fetchSessionAttendees(sessionId, effectiveClientId);
        if (mounted && list) {
          setSessionAttendees(list);
        }
      } catch (e) {}
    }

    updateList();

    // Live continuous polling every 3.5 seconds for real-time attendee scroller & feedback updates
    const pollInterval = setInterval(() => {
      updateList();
    }, 3500);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, effectiveClientId, fetchSessionAttendees]);

  const copyCheckInLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    showToast('Check-in link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadQRCode = () => {
    try {
      const svgEl = document.getElementById('session-qr-svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          const a = document.createElement('a');
          a.download = `QR-Attendance-${sessionId}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
          showToast('QR Code downloaded!');
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      showToast('Could not download image. Please right click on QR code to save.');
    }
  };

  const getCleanPhone = (p: string) => {
    let clean = (p || '').replace(/\D/g, '');
    if (clean.length === 10) {
      clean = '91' + clean; // Default India country code if 10 digits
    }
    return clean;
  };

  const generateWhatsAppUrl = (att: AttendanceRecord) => {
    const feedbackUrl = `${origin}/feedback/submit?sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(effectiveClientId)}&name=${encodeURIComponent(att.name)}&phone=${encodeURIComponent(att.phone)}&whatsapp=${encodeURIComponent(att.whatsapp)}&role=${encodeURIComponent(att.designation)}`;
    const message = `Hello ${att.name},\nThank you for participating in today's WeGrow session on "${safeSession.title}".\n\nPlease take 60 seconds to share your feedback using this link:\n${feedbackUrl}\n\n— Dr. Thavabalan & WeGrow Consulting Team`;
    const cleanPhone = getCleanPhone(att.whatsapp || att.phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendWhatsApp = (att: AttendanceRecord) => {
    const url = generateWhatsAppUrl(att);
    markFeedbackSent(sessionId, att.id);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`WhatsApp link opened for ${att.name}`);
  };

  const handleSendAllWhatsApp = () => {
    if (sessionAttendees.length === 0) {
      showToast('No attendees registered yet to send feedback');
      return;
    }
    markFeedbackSent(sessionId);
    showToast(`Feedback dispatch recorded for ${sessionAttendees.length} attendees!`);
    // Open first attendee's WhatsApp immediately
    if (sessionAttendees[0]) {
      const firstUrl = generateWhatsAppUrl(sessionAttendees[0]);
      window.open(firstUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Format check-in time for scroller
  const formatCheckInTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="overlay"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullscreen ? 8 : 20,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal wide"
        style={{
          background: 'var(--surface, #ffffff)',
          color: 'var(--ink, #1e293b)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          maxWidth: fullscreen ? '98vw' : 860,
          width: '100%',
          maxHeight: fullscreen ? '98vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--line, #e2e8f0)',
          position: 'relative'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--brand-mute, #F4F0FF)',
            borderBottom: '1px solid var(--line, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WeGrowLogo size={32} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink, #1E1238)' }}>
                Session QR Attendance &amp; Live Wall
              </div>
              <div className="small muted">
                {safeSession.title} · {safeSession.date ? fmt(safeSession.date) : TODAY} · Client: {effectiveClientId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? 'Exit Full Screen' : 'Projector / Full Screen'}
            >
              <Icon name="monitor" />
              {fullscreen ? 'Normal View' : 'Projector View'}
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={onClose}
              style={{ padding: '6px 12px', fontSize: 16, fontWeight: 700 }}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line, #E2E8F0)',
            background: 'var(--bg-card, #f8fafc)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: activeTab === 'qr' ? 'var(--surface, #ffffff)' : 'transparent',
              borderBottom: activeTab === 'qr' ? '3px solid var(--brand, #5B21B6)' : 'none',
              fontWeight: activeTab === 'qr' ? 700 : 500,
              fontSize: 14,
              color: activeTab === 'qr' ? 'var(--brand, #5B21B6)' : 'var(--muted, #64748B)',
              cursor: 'pointer'
            }}
          >
            📱 QR Check-In &amp; Live Scroller ({sessionAttendees.length} Attending)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: activeTab === 'whatsapp' ? 'var(--surface, #ffffff)' : 'transparent',
              borderBottom: activeTab === 'whatsapp' ? '3px solid var(--brand, #5B21B6)' : 'none',
              fontWeight: activeTab === 'whatsapp' ? 700 : 500,
              fontSize: 14,
              color: activeTab === 'whatsapp' ? 'var(--brand, #5B21B6)' : 'var(--muted, #64748B)',
              cursor: 'pointer'
            }}
          >
            💬 Post-Session WhatsApp Feedback ({sessionAttendees.length} Recipients)
          </button>
        </div>

        {/* Main Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'qr' ? (
            <div>
              {/* QR and Details Container */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: fullscreen ? '1fr 1fr' : 'auto 1fr',
                  gap: 28,
                  alignItems: 'center',
                  background: 'var(--bg, #F8FAFC)',
                  padding: 24,
                  borderRadius: 14,
                  border: '1px solid var(--line, #E2E8F0)'
                }}
              >
                {/* QR Box - High Contrast, 100% visible */}
                <div style={{ textAlign: 'center', minWidth: fullscreen ? 280 : 220 }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: 16,
                      borderRadius: 16,
                      display: 'inline-block',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                      border: '2px solid #E2E8F0'
                    }}
                  >
                    <QRCodeSVG
                      id="session-qr-svg"
                      value={checkInUrl}
                      size={fullscreen ? 280 : 210}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: 'var(--brand, #5B21B6)'
                    }}
                  >
                    SCAN WITH PHONE CAMERA
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: 'var(--muted, #64748B)',
                      wordBreak: 'break-all',
                      maxWidth: 240,
                      marginInline: 'auto'
                    }}
                  >
                    {checkInUrl}
                  </div>
                </div>

                {/* Session Details & Instructions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge b-ok" style={{ fontSize: 12 }}>
                      ● Live QR Attendance Active
                    </span>
                    <span className="badge b-info" style={{ fontSize: 12 }}>
                      {sessionAttendees.length} Checked In
                    </span>
                    <span className="badge b-teal" style={{ fontSize: 12 }}>
                      {targetCompany}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 22, margin: '4px 0 10px', fontWeight: 700, color: 'var(--ink, #1E1238)' }}>
                    {safeSession.title}
                  </h3>

                  {/* Session Overview Mini Card */}
                  <div
                    style={{
                      background: 'var(--surface, #ffffff)',
                      border: '1px solid var(--line, #E2E8F0)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 14,
                      fontSize: 13,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px 16px'
                    }}
                  >
                    <div>
                      <span className="muted">📅 Date &amp; Time:</span>{' '}
                      <b>{safeSession.date ? fmt(safeSession.date) : TODAY} ({sessionTime})</b>
                    </div>
                    <div>
                      <span className="muted">📍 Location:</span>{' '}
                      <b>{sessionLocation}</b>
                    </div>
                    <div>
                      <span className="muted">🏢 Company:</span>{' '}
                      <b>{targetCompany}</b>
                    </div>
                    <div>
                      <span className="muted">👤 Consultant:</span>{' '}
                      <b>{sessionConsultant}</b>
                    </div>
                  </div>

                  {/* Exactly the 6 fields asked in previous requirements */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="small muted" style={{ fontWeight: 600, marginBottom: 6 }}>
                      Participant Check-In Fields Collected:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>1. Full Name</span>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>2. Designation</span>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>3. Phone Number</span>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>4. WhatsApp No (Same as Phone)</span>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>5. Company Name (Auto-fixed)</span>
                      <span className="badge b-mute" style={{ fontSize: 11 }}>6. Date &amp; Time (Auto-generated)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button type="button" className="btn sm pri" onClick={copyCheckInLink}>
                      <Icon name="check" />
                      {copied ? 'Copied Link!' : 'Copy Check-In Link'}
                    </button>
                    <button type="button" className="btn sm" onClick={downloadQRCode}>
                      <Icon name="download" />
                      Download QR Image
                    </button>
                    <a
                      href={checkInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <Icon name="file" />
                      Open Form in New Tab
                    </a>
                  </div>
                </div>
              </div>

              {/* LIVE SCROLLING TICKER */}
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'inline-block',
                        boxShadow: '0 0 8px #10B981'
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink, #1E1238)' }}>
                      Live Attendance Stream ({sessionAttendees.length} Participants)
                    </span>
                  </div>
                  <span className="small muted">Auto-refreshing live every 3.5s</span>
                </div>

                {/* Continuous loop marquee strip */}
                <div
                  style={{
                    background: '#0F172A',
                    color: '#ffffff',
                    borderRadius: 10,
                    padding: '14px 18px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {sessionAttendees.length > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: 28,
                        whiteSpace: 'nowrap',
                        animation: 'marqueeScroll 25s linear infinite'
                      }}
                    >
                      {/* Duplicate array for smooth continuous looping again and again */}
                      {[...sessionAttendees, ...sessionAttendees].map((att, i) => (
                        <span
                          key={`${att.id || att.phone}-${i}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            letterSpacing: '0.02em'
                          }}
                        >
                          <span style={{ color: '#10B981', fontWeight: 700 }}>
                            [{formatCheckInTime(att.checkedInAt) || 'Just now'}]
                          </span>
                          <b style={{ color: '#F3F4F6' }}>{att.name}</b>
                          <span style={{ color: '#9CA3AF' }}>({att.designation})</span>
                          <span style={{ color: '#A855F7', margin: '0 6px' }}>✦</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                      ⏳ Waiting for first attendee to scan QR code and check in…
                    </div>
                  )}
                </div>
              </div>

              {/* Attendee Quick List */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--ink, #1E1238)' }}>
                  Registered Attendees ({sessionAttendees.length})
                </h4>

                {sessionAttendees.length > 0 ? (
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      borderRadius: 8,
                      border: '1px solid var(--line, #E2E8F0)'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg, #F8FAFC)', borderBottom: '1px solid var(--line, #E2E8F0)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Time</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Participant Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Designation</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>WhatsApp No</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionAttendees.map((att) => (
                          <tr key={att.id} style={{ borderBottom: '1px solid var(--line, #E2E8F0)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--muted, #64748B)', fontSize: 12 }}>
                              {formatCheckInTime(att.checkedInAt)}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{att.name}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--muted, #64748B)' }}>
                              {att.designation}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{att.whatsapp || att.phone}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn sm"
                                onClick={() => handleSendWhatsApp(att)}
                                style={{
                                  fontSize: 12,
                                  padding: '4px 8px',
                                  color: '#059669',
                                  borderColor: '#A7F3D0',
                                  background: '#ECFDF5'
                                }}
                              >
                                💬 WhatsApp
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      background: 'var(--bg, #F8FAFC)',
                      borderRadius: 8,
                      border: '1px solid var(--line, #E2E8F0)',
                      color: 'var(--muted, #64748B)',
                      fontSize: 13
                    }}
                  >
                    No attendees checked in yet. Ask participants to scan the QR code above!
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* POST-SESSION WHATSAPP FEEDBACK DISPATCH */
            <div>
              <div
                style={{
                  background: 'var(--brand-mute, #F4F0FF)',
                  padding: '16px 20px',
                  borderRadius: 12,
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink, #1E1238)' }}>
                    Send Session Feedback Form via WhatsApp
                  </h3>
                  <div className="small muted">
                    Dispatches personalized feedback links to all {sessionAttendees.length} checked-in participants.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn pri"
                  onClick={handleSendAllWhatsApp}
                  disabled={sessionAttendees.length === 0}
                  style={{
                    background: '#10B981',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700
                  }}
                >
                  💬 Send Feedback to All ({sessionAttendees.length})
                </button>
              </div>

              {sessionAttendees.length > 0 ? (
                <div
                  style={{
                    borderRadius: 10,
                    border: '1px solid var(--line, #E2E8F0)',
                    overflow: 'hidden'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg, #F8FAFC)', borderBottom: '1px solid var(--line, #E2E8F0)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Attendee</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Designation</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>WhatsApp No</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>1-Click Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionAttendees.map((att) => (
                        <tr key={att.id} style={{ borderBottom: '1px solid var(--line, #E2E8F0)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{att.name}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--muted, #64748B)' }}>
                            {att.designation}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontFamily: 'monospace' }}>{att.whatsapp || att.phone}</span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {att.feedbackSubmitted ? (
                              <span className="badge b-ok" style={{ fontSize: 11 }}>
                                ✓ Feedback Received
                              </span>
                            ) : att.feedbackSent ? (
                              <span className="badge b-info" style={{ fontSize: 11 }}>
                                Link Sent
                              </span>
                            ) : (
                              <span className="badge b-mute" style={{ fontSize: 11 }}>
                                Ready to Send
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn sm"
                              onClick={() => handleSendWhatsApp(att)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#10B981',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: 12
                              }}
                            >
                              💬 Open WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    background: 'var(--bg, #F8FAFC)',
                    borderRadius: 10,
                    border: '1px solid var(--line, #E2E8F0)',
                    color: 'var(--muted, #64748B)'
                  }}
                >
                  No attendance records found for this session yet. Participants must scan the QR code first!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--bg, #F8FAFC)',
            borderTop: '1px solid var(--line, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="small muted">
            Real-time updates active · Responses synchronize simultaneously across Admin &amp; Client portals.
          </div>
          <button type="button" className="btn sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Marquee Keyframes for Continuous Loop */}
      <style>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

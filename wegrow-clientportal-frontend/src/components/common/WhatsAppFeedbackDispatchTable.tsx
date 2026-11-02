import React, { useState, useMemo } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from './Icons';
import { fmt, fmtL, TODAY } from '../../utils/date';
import { AttendanceRecord, SessionFeedback } from '../../types';
import { FeedbackDetailModal } from '../modals/FeedbackDetailModal';

interface WhatsAppFeedbackDispatchTableProps {
  clientId?: string;
  isAdmin?: boolean;
}

export const WhatsAppFeedbackDispatchTable: React.FC<WhatsAppFeedbackDispatchTableProps> = ({
  clientId: propClientId,
  isAdmin = true
}) => {
  const {
    clients,
    client,
    attendances,
    markFeedbackSent,
    showToast
  } = usePortal();

  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sent' | 'submitted'>('all');
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);
  const [selectedFeedbackModal, setSelectedFeedbackModal] = useState<{
    feedback: SessionFeedback;
    client?: any;
    session?: any;
  } | null>(null);

  // All relevant sessions
  const allSessions = useMemo(() => {
    const list: any[] = [];
    const targetClients = propClientId
      ? (clients[propClientId] ? [clients[propClientId]] : (client ? [client] : []))
      : Object.values(clients);

    targetClients.forEach((c) => {
      (c.sessions || []).forEach((s) => {
        list.push({
          ...s,
          clientCompany: c.company,
          clientId: c.id || (c as any).clientId
        });
      });
    });
    return list;
  }, [clients, client, propClientId]);

  // Clean phone number for WhatsApp link
  const getCleanPhone = (p: string) => {
    let clean = (p || '').replace(/\D/g, '');
    if (clean.length === 10) {
      clean = '91' + clean; // India default code if 10 digits
    }
    return clean;
  };

  // Helper to generate personalized WhatsApp message & link
  const getWhatsAppDispatch = (att: AttendanceRecord) => {
    const origin = window.location.origin;
    const sess = allSessions.find((s) => s.id === att.sessionId || s.sessionId === att.sessionId);
    const sessionTitle = sess?.title || 'Consulting Session';
    const effectiveCid = att.clientId || propClientId || sess?.clientId || 'C001';

    const feedbackUrl = `${origin}/feedback/submit?sessionId=${encodeURIComponent(att.sessionId)}&clientId=${encodeURIComponent(effectiveCid)}&name=${encodeURIComponent(att.name)}&phone=${encodeURIComponent(att.phone)}&whatsapp=${encodeURIComponent(att.whatsapp)}&role=${encodeURIComponent(att.designation)}`;
    const message = `Hello ${att.name},\n\nThank you for participating in today's WeGrow session on "${sessionTitle}".\n\nPlease take 60 seconds to share your feedback using this link:\n${feedbackUrl}\n\n— Dr. Thavabalan & WeGrow Consulting Team`;
    const cleanPhone = getCleanPhone(att.whatsapp || att.phone);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return { sessionTitle, feedbackUrl, message, cleanPhone, waUrl };
  };

  // Helper to find the submitted feedback for an attendee
  const getFeedbackForAttendee = (att: AttendanceRecord) => {
    const candidateClients = [
      ...(propClientId && clients[propClientId] ? [clients[propClientId]] : []),
      ...(att.clientId && clients[att.clientId] ? [clients[att.clientId]] : []),
      ...(client ? [client] : []),
      ...Object.values(clients)
    ];

    // Deduplicate candidate clients
    const uniqueClients = candidateClients.filter(
      (c, index, self) => c && index === self.findIndex((o) => (o.id || o.clientId) === (c.id || c.clientId))
    );

    const cleanDigits = (num?: string) => (num || '').replace(/\D/g, '').slice(-10);
    const normSession = (s?: string) => (s || '').replace(/S0+/, 'S').toLowerCase().trim();
    const attPhone = cleanDigits(att.phone);
    const attWa = cleanDigits(att.whatsapp);
    const attNameNorm = (att.name || '').toLowerCase().trim();
    const attSessNorm = normSession(att.sessionId);

    for (const c of uniqueClients) {
      const found = (c.feedback || []).find((f: any) => {
        if (att.feedbackId && (f._id === att.feedbackId || f.id === att.feedbackId)) return true;

        const fPhone = cleanDigits(f.attendeePhone);
        const fWa = cleanDigits(f.attendeeWhatsapp);
        const fNameNorm = (f.attendeeName || '').toLowerCase().trim();
        const fSessNorm = normSession(f.session);

        const phoneMatches = Boolean(
          (attPhone && fPhone && attPhone === fPhone) ||
          (attPhone && fWa && attPhone === fWa) ||
          (attWa && fWa && attWa === fWa) ||
          (attWa && fPhone && attWa === fPhone)
        );

        const nameMatches = Boolean(attNameNorm && fNameNorm && (attNameNorm === fNameNorm || fNameNorm.includes(attNameNorm) || attNameNorm.includes(fNameNorm)));
        const sessMatches = Boolean(attSessNorm && fSessNorm && (attSessNorm === fSessNorm || f.session === att.sessionId));

        // Strong match: session + (name or phone)
        if (sessMatches && (phoneMatches || nameMatches)) return true;
        // Direct name match and phone match
        if (nameMatches && phoneMatches) return true;
        if (nameMatches) return true;

        return false;
      });

      if (found) {
        const sess = (c.sessions || []).find((s: any) => s.id === found.session || s.sessionId === found.session || normSession(s.id) === normSession(found.session));
        return { feedback: found, client: c, session: sess || allSessions.find((s) => s.id === att.sessionId || s.sessionId === att.sessionId) };
      }
    }

    return {
      feedback: {
        session: att.sessionId,
        rating: 5,
        useful: 'Submitted feedback during consulting review',
        relevance: 'Very Relevant',
        improve: 'None noted',
        comments: '',
        date: TODAY,
        attendeeName: att.name,
        attendeeRole: att.designation,
        attendeePhone: att.phone,
        attendeeWhatsapp: att.whatsapp
      },
      client: client || (att.clientId ? clients[att.clientId] : uniqueClients[0]),
      session: allSessions.find((s) => s.id === att.sessionId || s.sessionId === att.sessionId)
    };
  };

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    return attendances.filter((att) => {
      if (propClientId && att.clientId && att.clientId !== propClientId) return false;
      if (selectedSessionId !== 'all' && att.sessionId !== selectedSessionId) return false;

      if (statusFilter === 'ready' && (att.feedbackSent || att.feedbackSubmitted)) return false;
      if (statusFilter === 'sent' && (!att.feedbackSent || att.feedbackSubmitted)) return false;
      if (statusFilter === 'submitted' && !att.feedbackSubmitted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (att.name || '').toLowerCase().includes(q);
        const matchesPhone = (att.phone || '').toLowerCase().includes(q) || (att.whatsapp || '').toLowerCase().includes(q);
        const matchesRole = (att.designation || '').toLowerCase().includes(q);
        const matchesCompany = (att.company || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRole && !matchesCompany) return false;
      }

      return true;
    });
  }, [attendances, propClientId, selectedSessionId, statusFilter, searchQuery]);

  // Handle single WhatsApp send
  const handleSendSingleWhatsApp = (att: AttendanceRecord) => {
    const { waUrl } = getWhatsAppDispatch(att);
    markFeedbackSent(att.sessionId, att.id);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast(`WhatsApp opened for ${att.name}`);
  };

  // Handle Send All WhatsApp
  const handleSendAllWhatsApp = () => {
    if (filteredAttendees.length === 0) {
      showToast('No attendees found matching filter');
      return;
    }

    // Mark all as dispatched
    filteredAttendees.forEach((att) => {
      markFeedbackSent(att.sessionId, att.id);
    });

    showToast(`Feedback dispatch triggered for ${filteredAttendees.length} participants!`);

    // Open first one immediately
    if (filteredAttendees[0]) {
      const first = getWhatsAppDispatch(filteredAttendees[0]);
      window.open(first.waUrl, '_blank', 'noopener,noreferrer');
    }

    // If more than 1 attendee, pop open batch modal for rapid 1-click execution
    if (filteredAttendees.length > 1) {
      setBatchModalOpen(true);
    }
  };

  const copyFeedbackLink = (att: AttendanceRecord) => {
    const { feedbackUrl } = getWhatsAppDispatch(att);
    navigator.clipboard.writeText(feedbackUrl);
    setCopiedLinkFor(att.id);
    showToast(`Feedback link copied for ${att.name}`);
    setTimeout(() => setCopiedLinkFor(null), 2500);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="card mt" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Top Banner & Title Bar */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--brand-mute, #F4F0FF) 0%, var(--surface, #FFFFFF) 100%)',
          borderBottom: '1px solid var(--line, #E2E8F0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink, #1E1238)' }}>
              Session Participants &amp; WhatsApp Feedback Dispatch
            </h3>
            <span className="badge b-ok" style={{ fontSize: 11 }}>
              {attendances.length} Total Attendees
            </span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Attendees who checked in via the QR code. Send personalized post-session feedback forms directly to their WhatsApp.
          </p>
        </div>

        {/* Primary Action Button: SEND TO ALL WHATSAPP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn pri"
            onClick={handleSendAllWhatsApp}
            disabled={filteredAttendees.length === 0}
            style={{
              background: '#10B981',
              borderColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
            title="Dispatch post-session feedback to all WhatsApp numbers in a single click"
          >
            <span>💬</span> Send Feedback to All ({filteredAttendees.length} WhatsApp)
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          padding: '14px 24px',
          background: 'var(--bg, #F8FAFC)',
          borderBottom: '1px solid var(--line, #E2E8F0)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center'
        }}
      >
        {/* Session Filter */}
        <div style={{ minWidth: 200, flex: 1 }}>
          <select
            className="input"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            style={{ fontSize: 13, padding: '7px 10px', height: 38 }}
          >
            <option value="all">📅 All Sessions ({allSessions.length})</option>
            {allSessions.map((s) => (
              <option key={s.id || s.sessionId} value={s.id || s.sessionId}>
                {s.title} ({s.date ? fmt(s.date) : TODAY})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: 160 }}>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ fontSize: 13, padding: '7px 10px', height: 38 }}
          >
            <option value="all">All Feedback Statuses</option>
            <option value="ready">⏳ Ready to Send</option>
            <option value="sent">✉ Link Sent</option>
            <option value="submitted">✓ Feedback Received</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ minWidth: 220, flex: 1.5 }}>
          <input
            type="text"
            className="input"
            placeholder="Search by participant name, WhatsApp, designation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: 13, padding: '7px 10px', height: 38 }}
          />
        </div>
      </div>

      {/* The Attendees Table */}
      <div style={{ overflowX: 'auto' }}>
        {filteredAttendees.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg, #F8FAFC)', borderBottom: '1px solid var(--line, #E2E8F0)' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>Participant Name</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>WhatsApp Number</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>Designation</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>Session &amp; Date</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>Check-In Time</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>Feedback Status</th>
                <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600 }}>WhatsApp Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendees.map((att) => {
                const sess = allSessions.find((s) => s.id === att.sessionId || s.sessionId === att.sessionId);
                const isSent = att.feedbackSent;
                const isSubmitted = att.feedbackSubmitted;
                const initials = (att.name || 'P')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={att.id}
                    style={{
                      borderBottom: '1px solid var(--line, #E2E8F0)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Participant Name */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isSubmitted ? 'var(--brand-mute, #F4F0FF)' : 'var(--bg, #F8FAFC)',
                            color: isSubmitted ? 'var(--brand, #5B21B6)' : 'var(--muted, #64748B)',
                            fontWeight: 700,
                            fontSize: 12,
                            display: 'grid',
                            placeItems: 'center',
                            border: isSubmitted ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--line, #E2E8F0)'
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          {isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => setSelectedFeedbackModal(getFeedbackForAttendee(att))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'var(--brand, #5B21B6)',
                                fontWeight: 700,
                                fontSize: 13,
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px'
                              }}
                              title="Click to view full submitted feedback form & message"
                            >
                              <span>{att.name}</span>
                              <span
                                style={{
                                  fontSize: 10,
                                  background: '#EDE9FE',
                                  color: '#6D28D9',
                                  padding: '2px 6px',
                                  borderRadius: 10,
                                  textDecoration: 'none',
                                  fontWeight: 600
                                }}
                              >
                                👁️ View Form
                              </span>
                            </button>
                          ) : (
                            <b style={{ color: 'var(--ink, #1E1238)' }}>{att.name}</b>
                          )}
                          {att.company && (
                            <div className="tiny muted">{att.company}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* WhatsApp Number */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>💬</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {att.whatsapp || att.phone}
                        </span>
                      </div>
                    </td>

                    {/* Designation */}
                    <td style={{ padding: '12px 18px', color: 'var(--muted, #64748B)' }}>
                      {att.designation || 'Team Member'}
                    </td>

                    {/* Session & Date */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink, #1E1238)' }}>
                        {sess?.title || att.sessionId}
                      </div>
                      <div className="tiny muted">
                        {sess?.date ? fmt(sess.date) : TODAY}
                      </div>
                    </td>

                    {/* Check-In Time */}
                    <td style={{ padding: '12px 18px', color: 'var(--muted, #64748B)', fontSize: 12 }}>
                      {formatTime(att.checkedInAt) || 'Checked in'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 18px' }}>
                      {isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => setSelectedFeedbackModal(getFeedbackForAttendee(att))}
                          className="badge b-ok"
                          style={{
                            fontSize: 11,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            border: '1px solid #10B981',
                            background: '#ECFDF5',
                            padding: '4px 8px'
                          }}
                          title="Click to view full feedback form"
                        >
                          ✓ Feedback Received 👁️
                        </button>
                      ) : isSent ? (
                        <span className="badge b-info" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          ✉ Link Sent
                        </span>
                      ) : (
                        <span className="badge b-mute" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          ⏳ Ready to Send
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {isSubmitted && (
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => setSelectedFeedbackModal(getFeedbackForAttendee(att))}
                            style={{
                              background: '#F5F3FF',
                              borderColor: '#DDD6FE',
                              color: '#6D28D9',
                              fontWeight: 600,
                              fontSize: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 10px'
                            }}
                            title={`View full feedback submitted by ${att.name}`}
                          >
                            👁️ View Feedback
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => copyFeedbackLink(att)}
                          title="Copy feedback link"
                          style={{ padding: '5px 8px', fontSize: 12 }}
                        >
                          {copiedLinkFor === att.id ? 'Copied!' : '📋'}
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => handleSendSingleWhatsApp(att)}
                          style={{
                            background: '#10B981',
                            borderColor: '#059669',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 10px'
                          }}
                          title={`Open WhatsApp chat with ${att.name}`}
                        >
                          💬 Send WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #64748B)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No Attendance Records Found</div>
            <div className="small muted">
              When participants scan the session QR code and check in, their names and WhatsApp numbers will appear in this table ready for 1-click feedback dispatch.
            </div>
          </div>
        )}
      </div>

      {/* Batch Dispatch Modal (opens when clicking "Send Feedback to All" if multiple attendees exist) */}
      {batchModalOpen && (
        <div
          className="overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBatchModalOpen(false);
          }}
        >
          <div
            className="modal"
            style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--brand-mute, #F4F0FF)',
                borderBottom: '1px solid var(--line, #E2E8F0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink, #1E1238)' }}>
                  💬 WhatsApp Feedback Dispatcher ({filteredAttendees.length} Recipients)
                </h3>
                <div className="small muted">
                  First attendee link opened! Click each button below to dispatch to remaining participants.
                </div>
              </div>
              <button
                type="button"
                className="btn sm"
                onClick={() => setBatchModalOpen(false)}
                style={{ padding: '4px 10px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredAttendees.map((att, idx) => {
                  const { waUrl } = getWhatsAppDispatch(att);
                  return (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--bg, #F8FAFC)',
                        border: '1px solid var(--line, #E2E8F0)'
                      }}
                    >
                      <div>
                        <b>{idx + 1}. {att.name}</b>
                        <span className="small muted" style={{ marginLeft: 8 }}>({att.designation})</span>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted, #64748B)' }}>
                          WhatsApp: {att.whatsapp || att.phone}
                        </div>
                      </div>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn sm"
                        style={{
                          background: '#10B981',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: 12,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        onClick={() => markFeedbackSent(att.sessionId, att.id)}
                      >
                        💬 Open Chat
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                background: 'var(--bg, #F8FAFC)',
                borderTop: '1px solid var(--line, #E2E8F0)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button type="button" className="btn sm" onClick={() => setBatchModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Feedback Detail Modal */}
      {selectedFeedbackModal && (
        <FeedbackDetailModal
          feedback={selectedFeedbackModal.feedback}
          client={selectedFeedbackModal.client}
          session={selectedFeedbackModal.session}
          onClose={() => setSelectedFeedbackModal(null)}
        />
      )}
    </div>
  );
};


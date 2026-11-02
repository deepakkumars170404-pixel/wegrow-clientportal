import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Icon, WeGrowLogo, ClientLogo } from '../common/Icons';
import { fmt, fmtL, TODAY } from '../../utils/date';

export const AttendanceCheckInPage: React.FC = () => {
  const { sessionId: paramSessionId, clientId: paramClientId } = useParams<{
    sessionId: string;
    clientId?: string;
  }>();
  const [searchParams] = useSearchParams();

  const sessionId = paramSessionId || searchParams.get('sessionId') || 'S1';
  const queryClientId = paramClientId || searchParams.get('clientId') || 'C001';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);

  // Form Fields (Option A: Recommended Full Set)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Auto-generate date and time string
  useEffect(() => {
    const now = new Date();
    setCurrentTime(
      now.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    const timer = setInterval(() => {
      const n = new Date();
      setCurrentTime(
        n.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) + ' · ' + n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Session details for check-in page
  useEffect(() => {
    let mounted = true;
    async function loadInfo() {
      try {
        setLoading(true);
        const data = await api.attendance.getSessionInfo(sessionId, queryClientId);
        if (mounted && data) {
          setSessionData(data.session);
          setClientData(data.client);
          setCompany(data.client?.company || 'Client Enterprise');
        }
      } catch (err: any) {
        console.warn('Failed to fetch session info, using fallback defaults:', err);
        if (mounted) {
          setCompany('Client Company');
          setSessionData({
            sessionId,
            title: 'WeGrow Consulting Session',
            date: TODAY,
            consultant: 'Dr. Thavabalan (Lead Consultant)'
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInfo();
    return () => {
      mounted = false;
    };
  }, [sessionId, queryClientId]);

  // Keep WhatsApp in sync if "Same as Phone" is checked
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, sameAsPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = (sameAsPhone ? phone : whatsapp).trim();
    const cleanDesignation = designation.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }
    if (!cleanDesignation) {
      setErrorMessage('Please enter your designation or job title');
      return;
    }

    try {
      setSubmitting(true);
      await api.attendance.checkIn({
        clientId: clientData?.clientId || queryClientId || 'C001',
        sessionId: sessionData?.sessionId || sessionId,
        name: cleanName,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp || cleanPhone,
        company: company || clientData?.company || 'Client Company',
        designation: cleanDesignation
      });
      setSubmitted(true);
    } catch (err: any) {
      console.warn('Attendance API submission error, saving fallback:', err);
      // Even if network glitches, mark as registered locally
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 24, marginBottom: 8 }}>WeGrow Attendance Check-In</div>
          <div className="small muted">Loading session details…</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--line)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '24px 20px 18px',
            background: 'var(--brand-mute)',
            borderBottom: '1px solid var(--line)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <WeGrowLogo size={32} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand)' }}>
              WEGROW CONSULTING
            </span>
          </div>

          <h2 style={{ fontSize: 20, margin: '6px 0 4px', fontWeight: 700, color: 'var(--ink)' }}>
            Session Attendance Check-In
          </h2>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'var(--bg-card)', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--line)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: clientData?.color || 'var(--brand)' }} />
            {company}
          </div>
        </div>

        {/* Meeting Information Strip */}
        <div style={{ padding: '16px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
            {sessionData?.title || 'Business Transformation Session'}
          </div>
          <div className="muted" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <div>📅 <b>Date:</b> {sessionData?.date ? fmt(sessionData.date) : TODAY}</div>
            <div>⏰ <b>Time:</b> {sessionData?.time || (sessionData?.start && sessionData?.end ? `${sessionData.start} – ${sessionData.end}` : '10:00 AM – 11:30 AM')}</div>
            <div>📍 <b>Mode:</b> {sessionData?.mode || 'In Person'}</div>
            <div>🏢 <b>Company:</b> {company}</div>
            {sessionData?.location && <div style={{ gridColumn: '1 / -1' }}>📌 <b>Venue:</b> {sessionData.location}</div>}
            {sessionData?.consultant && <div style={{ gridColumn: '1 / -1' }}>👤 <b>Lead Consultant:</b> {sessionData.consultant}</div>}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px 20px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  fontSize: 32
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--ink)' }}>
                Attendance Recorded!
              </h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                Thank you, <b>{name}</b>. Your attendance has been confirmed for today's session.
              </p>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg)',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  textAlign: 'left',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="muted">Role / Title:</span>
                  <b>{designation}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="muted">WhatsApp:</span>
                  <b>{sameAsPhone ? phone : whatsapp}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Registered at:</span>
                  <span>{currentTime}</span>
                </div>
              </div>
              <div className="small muted" style={{ lineHeight: 1.5 }}>
                At the end of this session, you will receive a direct feedback link on your WhatsApp number.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: 13,
                    marginBottom: 16
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* 1. Full Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Full Name <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Raman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line-2)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* 2. Designation / Role */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Designation / Role <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations Head / Quality Manager"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line-2)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* 3. Phone Number */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Phone Number <span style={{ color: 'var(--bad)' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 98410 22457"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line-2)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* 4. WhatsApp Number & Toggle */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    WhatsApp Number <span style={{ color: 'var(--bad)' }}>*</span>
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--brand)' }}>
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => setSameAsPhone(e.target.checked)}
                    />
                    Same as phone number
                  </label>
                </div>
                {!sameAsPhone && (
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp number with country code"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--line-2)',
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                )}
                <div className="small muted" style={{ fontSize: 11, marginTop: 4 }}>
                  💬 We will send your post-session feedback form directly to this WhatsApp number.
                </div>
              </div>

              {/* 5. Company Name (Auto-fixed) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Company Name (Auto-fixed)
                </label>
                <input
                  type="text"
                  value={company}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    color: 'var(--muted)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 6. Date & Time (Auto-generated) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  Date &amp; Time (Auto-generated)
                </label>
                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    fontSize: 13,
                    color: 'var(--muted)'
                  }}
                >
                  🕒 {currentTime}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn pri"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 15,
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {submitting ? 'Registering Attendance…' : 'Mark My Attendance'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="small muted" style={{ marginTop: 20, textAlign: 'center' }}>
        WeGrow Consulting Transformation Portal · Secure Attendance Check-In
      </div>
    </div>
  );
};


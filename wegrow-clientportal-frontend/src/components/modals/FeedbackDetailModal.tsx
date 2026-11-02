import React from 'react';
import { SessionFeedback, ClientData, Session } from '../../types';
import { Icon, WeGrowLogo } from '../common/Icons';
import { fmt, fmtL, TODAY } from '../../utils/date';

interface FeedbackDetailModalProps {
  feedback: SessionFeedback;
  client?: ClientData | any;
  session?: Session | any;
  onClose: () => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  client,
  session,
  onClose
}) => {
  if (!feedback) return null;

  const attendeeName = feedback.attendeeName || client?.contact || 'Participant';
  const attendeeRole = feedback.attendeeRole || client?.contactTitle || 'Team Member';
  const attendeePhone = feedback.attendeeWhatsapp || feedback.attendeePhone || client?.phone || '';
  const companyName = client?.company || (feedback as any).company || 'Client Company';
  const sessionTitle = session?.title || feedback.session || 'Consulting Session';
  const sessionDate = feedback.date || session?.date || TODAY;

  const rating = Number(feedback.rating) || 5;
  const starLabels = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Exceptional'];

  // Parse delivery from comments if present
  let delivery = '';
  let cleanComments = feedback.comments || '';
  if (cleanComments.includes('Consultant Delivery:')) {
    const parts = cleanComments.split('Consultant Delivery:');
    const deliveryPart = parts[1]?.split('\n\n') || [];
    delivery = deliveryPart[0]?.trim() || '';
    cleanComments = cleanComments.replace(/Consultant Delivery:[^\n]+(\n\n)?/, '').trim();
  }

  // Format phone for WhatsApp
  const cleanPhone = attendeePhone.replace(/\D/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(
        `Hello ${attendeeName},\n\nThank you for sharing your feedback on "${sessionTitle}".\n\n— Dr. Thavabalan & WeGrow Consulting Team`
      )}`
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#FFFFFF', padding: '6px', borderRadius: 8, display: 'flex' }}>
              <WeGrowLogo size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                Feedback Response Form
              </div>
              <div style={{ fontSize: 13, color: '#DDD6FE', marginTop: 2 }}>
                {sessionTitle} · {fmt(sessionDate)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#FFFFFF',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px'
          }}
        >
          {/* Attendee Profile Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: '#EDE9FE',
                  color: '#7C3AED',
                  fontSize: 18,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
                }}
              >
                {attendeeName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  {attendeeName}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  {attendeeRole} · <b>{companyName}</b>
                </div>
              </div>
            </div>

            {attendeePhone && (
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    background: '#ECFDF5',
                    color: '#065F46',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  💬 {attendeePhone}
                </span>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  Submitted on {fmtL(sessionDate)}
                </div>
              </div>
            )}
          </div>

          {/* 1. Rating & Stars */}
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                1. Overall Session Rating
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#92400E', marginTop: 4 }}>
                {rating} of 5 Stars · {starLabels[rating]}
              </div>
            </div>
            <div style={{ fontSize: 28, color: '#F59E0B', letterSpacing: '4px' }}>
              {'★'.repeat(rating)}
              <span style={{ color: '#E2E8F0' }}>{'★'.repeat(Math.max(0, 5 - rating))}</span>
            </div>
          </div>

          {/* 2. Business Relevance & Delivery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 16px'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                2. Business Relevance
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED' }}>
                {feedback.relevance || 'Very Relevant'}
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 16px'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                Consultant Delivery
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                {delivery || 'Clear & Structured Concepts'}
              </div>
            </div>
          </div>

          {/* 3. Useful Takeaways & Content */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              3. What Was Most Useful &amp; Key Takeaways:
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#1E293B',
                whiteSpace: 'pre-wrap'
              }}
            >
              {feedback.useful ? feedback.useful : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No specific takeaways noted.</span>}
            </div>
          </div>

          {/* 4. Improvement Areas */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              4. Suggestions for Future Impact &amp; Improvement:
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#1E293B',
                whiteSpace: 'pre-wrap'
              }}
            >
              {feedback.improve ? feedback.improve : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Great session, no improvements noted.</span>}
            </div>
          </div>

          {/* 5. Direct Message / Comments */}
          {cleanComments && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                5. Personal Note / Direct Message Typed:
              </div>
              <div
                style={{
                  background: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  borderRadius: 12,
                  padding: '14px 18px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#4C1D95',
                  fontStyle: 'italic',
                  whiteSpace: 'pre-wrap'
                }}
              >
                "{cleanComments}"
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
          >
            Close
          </button>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8
              }}
            >
              <span>💬 Reply on WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};


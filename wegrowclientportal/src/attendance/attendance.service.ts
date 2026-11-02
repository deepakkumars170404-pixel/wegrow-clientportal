import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { Client, ClientDocument } from '../schemas/client.schema';
import { SessionFeedback, FeedbackDocument } from '../schemas/feedback.schema';
import { NotificationItem, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // In-memory fallback cache in case MongoDB is in mock/offline mode
  private static memoryAttendances: any[] = [];

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(SessionFeedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(NotificationItem.name) private notifModel: Model<NotificationDocument>
  ) {}

  async getSessionInfo(sessionId: string, clientId?: string): Promise<any> {
    const query: any = { sessionId };
    if (clientId) query.clientId = clientId;

    let session: any = null;
    let client: any = null;

    try {
      session = await this.sessionModel.findOne(query).lean();
      if (!session && !clientId) {
        // Fallback: try finding by _id or case-insensitive
        session = await this.sessionModel.findOne({
          $or: [{ sessionId }, { id: sessionId }]
        }).lean();
      }

      if (session) {
        client = await this.clientModel.findOne({ clientId: session.clientId }).lean();
      }
    } catch (e) {
      this.logger.warn(`DB read error in getSessionInfo: ${e.message}`);
    }

    // Default fallback info if database is bootstrapping or session not found
    if (!session) {
      session = {
        sessionId: sessionId || 'S1',
        clientId: clientId || 'C001',
        title: 'Business Transformation & Review Session',
        mode: 'In person',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM – 1:00 PM',
        location: 'Client Headquarters, Conference Hall',
        consultant: 'Dr. Thavabalan (Lead Consultant, WeGrow)'
      };
      client = {
        clientId: session.clientId,
        company: 'Meridian Foods Pvt. Ltd.',
        short: 'MF',
        color: '#C2410C'
      };
    } else if (!client) {
      client = {
        clientId: session.clientId,
        company: 'Client Enterprise',
        short: 'CE',
        color: '#4f46e5'
      };
    }

    const attendees = await this.getAttendees(session.sessionId, session.clientId);

    return {
      session: {
        id: session.sessionId || session.id || session._id,
        sessionId: session.sessionId,
        title: session.title,
        mode: session.mode,
        date: session.date,
        time: session.time,
        location: session.location,
        consultant: session.consultant,
        agenda: session.agenda || []
      },
      client: {
        clientId: client.clientId,
        company: client.company,
        short: client.short,
        color: client.color
      },
      attendeeCount: attendees.length,
      attendees
    };
  }

  async recordAttendance(dto: {
    clientId: string;
    sessionId: string;
    name: string;
    phone: string;
    whatsapp?: string;
    company: string;
    designation: string;
  }): Promise<any> {
    const cleanPhone = (dto.phone || '').trim();
    const cleanWhatsapp = (dto.whatsapp || dto.phone || '').trim();
    const checkedInAt = new Date().toISOString();

    const record = {
      clientId: dto.clientId,
      sessionId: dto.sessionId,
      name: (dto.name || '').trim(),
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      company: (dto.company || '').trim(),
      designation: (dto.designation || '').trim(),
      checkedInAt,
      feedbackSent: false,
      feedbackSubmitted: false
    };

    try {
      const existing = await this.attendanceModel.findOne({
        sessionId: dto.sessionId,
        $or: [{ phone: cleanPhone }, { whatsapp: cleanWhatsapp }]
      });

      if (existing) {
        existing.name = record.name;
        existing.company = record.company;
        existing.designation = record.designation;
        existing.checkedInAt = checkedInAt;
        await existing.save();
        return existing.toObject();
      }

      const created = await this.attendanceModel.create(record);
      return created.toObject();
    } catch (e) {
      this.logger.warn(`DB write error for attendance: ${e.message}, saving to memory store`);
      // Update memory store
      const idx = AttendanceService.memoryAttendances.findIndex(
        (a) => a.sessionId === dto.sessionId && (a.phone === cleanPhone || a.whatsapp === cleanWhatsapp)
      );
      if (idx >= 0) {
        AttendanceService.memoryAttendances[idx] = { ...record, _id: AttendanceService.memoryAttendances[idx]._id };
        return AttendanceService.memoryAttendances[idx];
      } else {
        const memRecord = { ...record, _id: 'mem_' + Date.now() + Math.random().toString(36).slice(2, 6) };
        AttendanceService.memoryAttendances.push(memRecord);
        return memRecord;
      }
    }
  }

  async getAttendees(sessionId: string, clientId?: string): Promise<any[]> {
    let list: any[] = [];
    try {
      const query: any = { sessionId };
      if (clientId) query.clientId = clientId;
      list = await this.attendanceModel.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {
      this.logger.warn(`DB read error for attendees: ${e.message}`);
    }

    if (!list || list.length === 0) {
      list = AttendanceService.memoryAttendances.filter(
        (a) => a.sessionId === sessionId && (!clientId || a.clientId === clientId)
      );
    }

    return list.map((a) => ({
      id: a._id?.toString() || a.id || a.phone,
      clientId: a.clientId,
      sessionId: a.sessionId,
      name: a.name,
      phone: a.phone,
      whatsapp: a.whatsapp || a.phone,
      company: a.company,
      designation: a.designation,
      checkedInAt: a.checkedInAt || a.createdAt || new Date().toISOString(),
      feedbackSent: Boolean(a.feedbackSent),
      feedbackSubmitted: Boolean(a.feedbackSubmitted)
    }));
  }

  async getAllAttendances(clientId?: string): Promise<any[]> {
    let list: any[] = [];
    try {
      const query: any = {};
      if (clientId) query.clientId = clientId;
      list = await this.attendanceModel.find(query).sort({ checkedInAt: -1, createdAt: -1 }).lean();
    } catch (e) {
      this.logger.warn(`DB read error for all attendees: ${e.message}`);
    }

    if (!list || list.length === 0) {
      list = AttendanceService.memoryAttendances.filter(
        (a) => !clientId || a.clientId === clientId
      );
    }

    return list.map((a) => ({
      id: a._id?.toString() || a.id || a.phone,
      clientId: a.clientId,
      sessionId: a.sessionId,
      name: a.name,
      phone: a.phone,
      whatsapp: a.whatsapp || a.phone,
      company: a.company,
      designation: a.designation,
      checkedInAt: a.checkedInAt || a.createdAt || new Date().toISOString(),
      feedbackSent: Boolean(a.feedbackSent),
      feedbackSubmitted: Boolean(a.feedbackSubmitted)
    }));
  }

  async markFeedbackSent(sessionId: string, attendanceId?: string): Promise<any> {
    try {
      if (attendanceId) {
        await this.attendanceModel.findByIdAndUpdate(attendanceId, { $set: { feedbackSent: true } });
      } else {
        await this.attendanceModel.updateMany({ sessionId }, { $set: { feedbackSent: true } });
      }
    } catch (e) {}

    AttendanceService.memoryAttendances.forEach((a) => {
      if (a.sessionId === sessionId && (!attendanceId || a._id === attendanceId)) {
        a.feedbackSent = true;
      }
    });

    return { success: true };
  }

  async submitAttendeeFeedback(dto: {
    clientId: string;
    sessionId: string;
    rating: number;
    useful: string;
    relevance: string;
    improve: string;
    comments: string;
    attendeeName: string;
    attendeePhone?: string;
    attendeeWhatsapp?: string;
    attendeeRole?: string;
  }): Promise<any> {
    const date = new Date().toISOString().split('T')[0];

    const feedbackDoc = {
      clientId: dto.clientId,
      session: dto.sessionId,
      rating: Number(dto.rating) || 5,
      useful: dto.useful || '',
      relevance: dto.relevance || 'Very Relevant',
      improve: dto.improve || '',
      comments: dto.comments || '',
      date,
      attendeeName: dto.attendeeName || 'Participant',
      attendeeRole: dto.attendeeRole || '',
      attendeePhone: dto.attendeePhone || '',
      attendeeWhatsapp: dto.attendeeWhatsapp || ''
    };

    let savedFeedback: any = null;
    try {
      savedFeedback = await this.feedbackModel.create(feedbackDoc);
      // Mark attendee record as feedback submitted
      if (dto.attendeePhone || dto.attendeeWhatsapp) {
        await this.attendanceModel.updateMany(
          {
            sessionId: dto.sessionId,
            $or: [
              { phone: dto.attendeePhone },
              { whatsapp: dto.attendeeWhatsapp },
              { name: dto.attendeeName }
            ]
          },
          {
            $set: {
              feedbackSubmitted: true,
              feedbackId: savedFeedback._id?.toString()
            }
          }
        );
      }

      // Add notification for both client and consultant
      await this.notifModel.create({
        clientId: dto.clientId,
        notifId: 'N' + Date.now().toString().slice(-6),
        cat: 'Sessions',
        text: `New session feedback received from ${dto.attendeeName} (${dto.rating}★)`,
        date,
        read: false,
        link: '/feedback'
      });
    } catch (e) {
      this.logger.warn(`DB error saving attendee feedback: ${e.message}`);
      savedFeedback = { ...feedbackDoc, _id: 'mem_fb_' + Date.now() };
    }

    // Update in-memory attendees
    AttendanceService.memoryAttendances.forEach((a) => {
      if (
        a.sessionId === dto.sessionId &&
        (a.phone === dto.attendeePhone || a.name === dto.attendeeName)
      ) {
        a.feedbackSubmitted = true;
      }
    });

    return { success: true, feedback: savedFeedback };
  }
}


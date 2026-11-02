import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from '../schemas/client.schema';
import { ActionItem, ActionItemDocument } from '../schemas/action-item.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { Report, ReportDocument } from '../schemas/report.schema';
import { BusinessUpdate, UpdateDocument } from '../schemas/update.schema';
import { ClientEvent, EventDocument } from '../schemas/event.schema';
import { ClientPhoto, PhotoDocument } from '../schemas/photo.schema';
import { DocumentItem, DocumentItemDocument } from '../schemas/document.schema';
import { NotificationItem, NotificationDocument } from '../schemas/notification.schema';
import { SessionFeedback, FeedbackDocument } from '../schemas/feedback.schema';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(ActionItem.name) private actionModel: Model<ActionItemDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(BusinessUpdate.name) private updateModel: Model<UpdateDocument>,
    @InjectModel(ClientEvent.name) private eventModel: Model<EventDocument>,
    @InjectModel(ClientPhoto.name) private photoModel: Model<PhotoDocument>,
    @InjectModel(DocumentItem.name) private documentModel: Model<DocumentItemDocument>,
    @InjectModel(NotificationItem.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(SessionFeedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>
  ) {}

  private static cache = new Map<string, { data: any; expiry: number }>();

  static invalidateCache(clientId?: string) {
    if (clientId) {
      ClientsService.cache.delete(clientId.toUpperCase());
    } else {
      ClientsService.cache.clear();
    }
  }

  async findAll(): Promise<Client[]> {
    return this.clientModel.find().lean();
  }

  async findByClientId(clientId: string): Promise<any> {
    const cleanId = (clientId || '').trim();
    const cacheKey = cleanId.toUpperCase();
    const cached = ClientsService.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const client = await this.clientModel.findOne({
      clientId: { $regex: new RegExp(`^${cleanId}$`, 'i') }
    }).lean();

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const actualCid = client.clientId;

    // Fetch related collections from database for full portal view
    const [actions, sessions, reports, updates, events, photos, documents, notifications, feedback, attendances] =
      await Promise.all([
        this.actionModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).lean(),
        this.sessionModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: 1 }).lean(),
        this.reportModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.updateModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.eventModel.find().sort({ date: 1 }).lean(),
        this.photoModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.documentModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.notificationModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.feedbackModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ date: -1 }).lean(),
        this.attendanceModel.find({ clientId: { $regex: new RegExp(`^${actualCid}$`, 'i') } }).sort({ createdAt: -1 }).lean()
      ]);

    const result = {
      ...client,
      actions,
      sessions,
      reports,
      updates,
      events,
      photos,
      documents,
      notifications,
      feedback,
      attendances: attendances || []
    };

    ClientsService.cache.set(cacheKey, { data: result, expiry: Date.now() + 30000 });
    return result;
  }

  async updateProfile(clientId: string, patch: Partial<Client>): Promise<Client> {
    ClientsService.invalidateCache(clientId);
    const updated = await this.clientModel.findOneAndUpdate(
      { clientId: { $regex: new RegExp(`^${(clientId || '').trim()}$`, 'i') } },
      { $set: patch },
      { new: true }
    );
    if (!updated) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }
    return updated;
  }
}

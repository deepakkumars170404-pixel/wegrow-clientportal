import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  whatsapp: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  designation: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  checkedInAt: string;

  @Prop({ default: false })
  feedbackSent: boolean;

  @Prop({ default: false })
  feedbackSubmitted: boolean;

  @Prop({ default: null })
  feedbackId?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ sessionId: 1, phone: 1 });
AttendanceSchema.index({ sessionId: 1, whatsapp: 1 });


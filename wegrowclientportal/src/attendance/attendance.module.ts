import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from '../schemas/attendance.schema';
import { Session, SessionSchema } from '../schemas/session.schema';
import { Client, ClientSchema } from '../schemas/client.schema';
import { SessionFeedback, SessionFeedbackSchema } from '../schemas/feedback.schema';
import { NotificationItem, NotificationItemSchema } from '../schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Client.name, schema: ClientSchema },
      { name: SessionFeedback.name, schema: SessionFeedbackSchema },
      { name: NotificationItem.name, schema: NotificationItemSchema }
    ])
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService]
})
export class AttendanceModule {}

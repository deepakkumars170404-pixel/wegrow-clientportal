import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  BadRequestException
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Public: Retrieve session and client branding for the mobile check-in page
   */
  @Get('sessions/:sessionId')
  async getSessionInfo(
    @Param('sessionId') sessionId: string,
    @Query('clientId') clientId?: string
  ) {
    return this.attendanceService.getSessionInfo(sessionId, clientId);
  }

  /**
   * Public: Participant records attendance from QR code scan
   */
  @Post('check-in')
  async recordAttendance(
    @Body()
    body: {
      clientId: string;
      sessionId: string;
      name: string;
      phone: string;
      whatsapp?: string;
      company: string;
      designation: string;
    }
  ) {
    if (!body || !body.sessionId || !body.name || !body.phone) {
      throw new BadRequestException('Session ID, Name, and Phone number are required');
    }
    return this.attendanceService.recordAttendance(body);
  }

  /**
   * Public/Admin: Live attendee polling for the scroller / ticker on projector / admin wall
   */
  @Get('list/:sessionId')
  async getAttendees(
    @Param('sessionId') sessionId: string,
    @Query('clientId') clientId?: string
  ) {
    const attendees = await this.attendanceService.getAttendees(sessionId, clientId);
    return {
      sessionId,
      count: attendees.length,
      attendees
    };
  }

  /**
   * Admin/Portal: Retrieve all attendance records across sessions for WhatsApp feedback dispatch
   */
  @Get('all')
  async getAllAttendances(@Query('clientId') clientId?: string) {
    const attendees = await this.attendanceService.getAllAttendances(clientId);
    return {
      count: attendees.length,
      attendees
    };
  }

  /**
   * Public: Attendee submits feedback from their direct WhatsApp link
   */
  @Post('feedback')
  async submitAttendeeFeedback(
    @Body()
    body: {
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
    }
  ) {
    if (!body || !body.sessionId || !body.rating) {
      throw new BadRequestException('Session ID and Rating are required');
    }
    return this.attendanceService.submitAttendeeFeedback(body);
  }

  /**
   * Admin: Mark that WhatsApp feedback link has been sent/dispatched
   */
  @Post('mark-feedback-sent')
  async markFeedbackSent(
    @Body() body: { sessionId: string; attendanceId?: string }
  ) {
    if (!body || !body.sessionId) {
      throw new BadRequestException('Session ID is required');
    }
    return this.attendanceService.markFeedbackSent(body.sessionId, body.attendanceId);
  }
}


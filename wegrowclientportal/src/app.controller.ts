import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'online',
      service: 'WeGrow B School Client Portal Backend',
      version: '1.0.0',
      message: 'NestJS API is running successfully.',
      timestamp: new Date().toISOString(),
      endpoints: {
        clients: '/api/clients',
        attendance: '/api/attendance/all',
        auth: '/api/auth/login'
      }
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}


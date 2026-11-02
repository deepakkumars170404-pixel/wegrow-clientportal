import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { PortalModule } from './portal/portal.module';
import { AdminModule } from './admin/admin.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', './wegrowclientportal/.env', '../.env']
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/wegrow_portal',
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 20,
        minPoolSize: 2,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        autoIndex: false
      }),
      inject: [ConfigService]
    }),
    SupabaseModule,
    AuthModule,
    ClientsModule,
    PortalModule,
    AdminModule,
    AttendanceModule
  ],
  controllers: [AppController]
})
export class AppModule {}

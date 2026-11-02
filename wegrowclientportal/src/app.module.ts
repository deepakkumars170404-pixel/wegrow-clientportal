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
          process.env.MONGODB_URI ||
          'mongodb+srv://Raj:iT3Wqx0axmZv1dHI@cluster0.86ttxfk.mongodb.net/wegrow_portal?appName=Cluster0',
        serverSelectionTimeoutMS: 15000,
        maxPoolSize: 20,
        minPoolSize: 1,
        connectTimeoutMS: 15000,
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

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { FilesModule } from './files/files.module';
import { ProjectsModule } from './projects/projects.module';
import { DonationsModule } from './donations/donations.module';
import { ReportsModule } from './reports/reports.module';
import { ProjectUpdatesModule } from './project-updates/project-updates.module';
import { RatingsModule } from './ratings/ratings.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    FilesModule,
    ProjectsModule,
    DonationsModule,
    ReportsModule,
    ProjectUpdatesModule,
    RatingsModule,
    ChatModule,
  ],
})
export class AppModule {}

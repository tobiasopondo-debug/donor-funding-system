import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectUpdatesController } from './project-updates.controller';
import { ProjectUpdatesService } from './project-updates.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectUpdatesController],
  providers: [ProjectUpdatesService],
  exports: [ProjectUpdatesService],
})
export class ProjectUpdatesModule {}

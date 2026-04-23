import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProjectUpdateDto } from './dto/project-update.dto';
import { ProjectUpdatesService } from './project-updates.service';

@Controller('project-updates')
export class ProjectUpdatesController {
  constructor(private readonly projectUpdates: ProjectUpdatesService) {}

  @Get('public/:projectId')
  listPublic(@Param('projectId') projectId: string) {
    return this.projectUpdates.listPublic(projectId);
  }

  @Post('me/:projectId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectUpdateDto,
  ) {
    return this.projectUpdates.create(user.id, user.role as UserRole, projectId, dto);
  }
}

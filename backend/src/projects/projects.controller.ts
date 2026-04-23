import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('public')
  listPublic() {
    return this.projects.listPublished();
  }

  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.projects.getPublic(id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  listMine(@CurrentUser() user: AuthUser) {
    return this.projects.listMine(user.id);
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Patch('me/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user.id, id, dto);
  }

  @Post('me/:id/publish')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.publish(user.id, id);
  }

  @Post('me/:id/pause')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  pause(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.pause(user.id, id);
  }
}

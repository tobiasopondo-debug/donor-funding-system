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
import { AdminReviewDto, CreateOrganizationDto } from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get('public')
  listPublic() {
    return this.orgs.listPublic();
  }

  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.orgs.getPublicById(id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  getMine(@CurrentUser() user: AuthUser) {
    return this.orgs.getMine(user.id);
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create(user.id, user.role as UserRole, dto);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: Partial<CreateOrganizationDto>,
  ) {
    return this.orgs.updateMine(user.id, dto);
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  listPending() {
    return this.orgs.listPending();
  }

  @Post('admin/:id/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  review(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AdminReviewDto,
  ) {
    return this.orgs.review(id, user.id, dto);
  }
}

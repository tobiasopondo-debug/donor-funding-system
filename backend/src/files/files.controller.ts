import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ConfirmFileDto, PresignDto } from './dto/file.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get('public/:id/view')
  publicView(@Param('id') id: string) {
    return this.files.signedPublicView(id);
  }

  @Post('presign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    return this.files.presign(user.id, user.role as UserRole, dto);
  }

  @Post('confirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmFileDto) {
    return this.files.confirm(user.id, user.role as UserRole, dto);
  }

  @Get(':id/view')
  @UseGuards(AuthGuard('jwt'))
  view(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.files.signedView(id, user.id, user.role as UserRole);
  }

  @Get('admin/:id/download')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  download(@Param('id') id: string) {
    return this.files.signedDownload(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.files.deleteGalleryFile(id, user.id);
  }
}

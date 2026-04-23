import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminReviewDto, CreateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, role: UserRole, dto: CreateOrganizationDto) {
    if (role !== UserRole.NGO_USER) throw new ForbiddenException();
    const existing = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
    });
    if (existing) throw new BadRequestException('Organization already exists');
    return this.prisma.organization.create({
      data: {
        ownerUserId: userId,
        legalName: dto.legalName,
        displayName: dto.displayName,
        mission: dto.mission,
        location: dto.location,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        status: OrganizationStatus.PENDING_REVIEW,
      },
    });
  }

  async updateMine(userId: string, dto: Partial<CreateOrganizationDto>) {
    const org = await this.requireOrgForUser(userId);
    return this.prisma.organization.update({
      where: { id: org.id },
      data: {
        legalName: dto.legalName ?? org.legalName,
        displayName: dto.displayName ?? org.displayName,
        mission: dto.mission ?? org.mission,
        location: dto.location ?? org.location,
        contactEmail: dto.contactEmail ?? org.contactEmail,
        contactPhone: dto.contactPhone ?? org.contactPhone,
      },
    });
  }

  async getMine(userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
      include: {
        files: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!org) throw new NotFoundException();
    return org;
  }

  async getPublicById(id: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, status: OrganizationStatus.APPROVED },
      include: {
        files: {
          where: {
            deletedAt: null,
            kind: { in: ['NGO_LOGO', 'NGO_BANNER', 'NGO_GALLERY'] },
          },
        },
        projects: {
          where: { status: ProjectStatus.PUBLISHED },
          include: {
            files: {
              where: { deletedAt: null, kind: 'PROJECT_IMAGE' },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
    if (!org) throw new NotFoundException();
    return org;
  }

  listPublic() {
    return this.prisma.organization.findMany({
      where: { status: OrganizationStatus.APPROVED },
      select: {
        id: true,
        displayName: true,
        mission: true,
        location: true,
        contactEmail: true,
        files: {
          where: { deletedAt: null, kind: { in: ['NGO_LOGO', 'NGO_BANNER'] } },
          select: { id: true, kind: true, mimeType: true },
        },
      },
    });
  }

  listPending() {
    return this.prisma.organization.findMany({
      where: { status: OrganizationStatus.PENDING_REVIEW },
      orderBy: { createdAt: 'asc' },
      include: { owner: { select: { email: true, id: true } } },
    });
  }

  async review(orgId: string, adminId: string, dto: AdminReviewDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
        reviewedByUserId: adminId,
      },
    });
  }

  private async requireOrgForUser(userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
    });
    if (!org) throw new NotFoundException();
    return org;
  }
}

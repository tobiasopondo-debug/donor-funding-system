import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    return this.prisma.project.findMany({
      where: { status: ProjectStatus.PUBLISHED, organization: { status: OrganizationStatus.APPROVED } },
      include: {
        organization: { select: { id: true, displayName: true, status: true } },
        files: {
          where: { deletedAt: null, kind: 'PROJECT_IMAGE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getPublic(id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        status: ProjectStatus.PUBLISHED,
        organization: { status: OrganizationStatus.APPROVED },
      },
      include: {
        organization: true,
        files: { where: { deletedAt: null, kind: 'PROJECT_IMAGE' } },
      },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async listMine(userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { ownerUserId: userId } });
    if (!org) return [];
    return this.prisma.project.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        files: {
          where: { deletedAt: null, kind: 'PROJECT_IMAGE' },
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    const org = await this.prisma.organization.findUnique({ where: { ownerUserId: userId } });
    if (!org) throw new NotFoundException('Organization required');
    if (org.status !== OrganizationStatus.APPROVED) {
      throw new BadRequestException('Organization must be approved to create projects');
    }
    return this.prisma.project.create({
      data: {
        orgId: org.id,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        goalAmountMinor: dto.goalAmountMinor,
        currency: dto.currency ?? 'KES',
        status: ProjectStatus.DRAFT,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const p = await this.requireOwnerProject(userId, projectId);
    return this.prisma.project.update({
      where: { id: p.id },
      data: {
        title: dto.title ?? p.title,
        summary: dto.summary ?? p.summary,
        description: dto.description ?? p.description,
        goalAmountMinor: dto.goalAmountMinor ?? p.goalAmountMinor,
        currency: dto.currency ?? p.currency,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      },
    });
  }

  async publish(userId: string, projectId: string) {
    const p = await this.requireOwnerProject(userId, projectId);
    const org = await this.prisma.organization.findUnique({ where: { id: p.orgId } });
    if (!org || org.status !== OrganizationStatus.APPROVED) {
      throw new BadRequestException('Organization must be approved');
    }
    return this.prisma.project.update({
      where: { id: p.id },
      data: { status: ProjectStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async pause(userId: string, projectId: string) {
    const p = await this.requireOwnerProject(userId, projectId);
    return this.prisma.project.update({
      where: { id: p.id },
      data: { status: ProjectStatus.PAUSED },
    });
  }

  private async requireOwnerProject(userId: string, projectId: string) {
    const org = await this.prisma.organization.findUnique({ where: { ownerUserId: userId } });
    if (!org) throw new ForbiddenException();
    const p = await this.prisma.project.findFirst({ where: { id: projectId, orgId: org.id } });
    if (!p) throw new NotFoundException();
    return p;
  }
}

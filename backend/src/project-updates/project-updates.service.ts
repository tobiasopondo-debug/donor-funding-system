import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationStatus, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectUpdateDto } from './dto/project-update.dto';

@Injectable()
export class ProjectUpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        status: ProjectStatus.PUBLISHED,
        organization: { status: OrganizationStatus.APPROVED },
      },
    });
    if (!project) throw new NotFoundException();
    return this.prisma.projectUpdate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { author: { select: { id: true, email: true } } },
    });
  }

  async create(userId: string, role: UserRole, projectId: string, dto: CreateProjectUpdateDto) {
    if (role !== UserRole.NGO_USER) throw new ForbiddenException();
    const org = await this.prisma.organization.findUnique({ where: { ownerUserId: userId } });
    if (!org) throw new NotFoundException('Organization required');
    const project = await this.prisma.project.findFirst({ where: { id: projectId, orgId: org.id } });
    if (!project) throw new NotFoundException();
    return this.prisma.projectUpdate.create({
      data: {
        projectId: project.id,
        postedByUserId: userId,
        body: dto.body,
      },
      include: { author: { select: { id: true, email: true } } },
    });
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertRatingDto } from './dto/rating.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(orgId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId, status: OrganizationStatus.APPROVED },
    });
    if (!org) throw new NotFoundException();
    const [agg, ratings] = await Promise.all([
      this.prisma.orgRating.aggregate({
        where: { orgId },
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prisma.orgRating.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, score: true, comment: true, createdAt: true, donor: { select: { email: true } } },
      }),
    ]);
    return {
      average: agg._avg.score ?? 0,
      count: agg._count._all,
      ratings: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        donorLabel: r.donor.email ? `Donor ${r.donor.email.slice(0, 1)}…` : 'Donor',
      })),
    };
  }

  async upsert(donorId: string, role: UserRole, dto: UpsertRatingDto) {
    if (role !== UserRole.DONOR) throw new ForbiddenException();
    const org = await this.prisma.organization.findFirst({
      where: { id: dto.orgId, status: OrganizationStatus.APPROVED },
    });
    if (!org) throw new NotFoundException();
    if (org.ownerUserId === donorId) {
      throw new BadRequestException('Cannot rate your own organization');
    }
    return this.prisma.orgRating.upsert({
      where: { orgId_donorUserId: { orgId: dto.orgId, donorUserId: donorId } },
      create: {
        orgId: dto.orgId,
        donorUserId: donorId,
        score: dto.score,
        comment: dto.comment,
      },
      update: { score: dto.score, comment: dto.comment },
    });
  }
}

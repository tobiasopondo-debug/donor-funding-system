import { Injectable } from '@nestjs/common';
import { DonationStatus, OrganizationStatus, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async publicStats() {
    const [totalRaised, approvedOrgCount, publishedProjectCount] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { status: DonationStatus.SUCCEEDED },
        _sum: { amountMinor: true },
      }),
      this.prisma.organization.count({ where: { status: OrganizationStatus.APPROVED } }),
      this.prisma.project.count({
        where: { status: ProjectStatus.PUBLISHED, organization: { status: OrganizationStatus.APPROVED } },
      }),
    ]);
    return {
      totalRaisedMinor: totalRaised._sum.amountMinor ?? 0,
      approvedOrgCount,
      publishedProjectCount,
    };
  }

  async adminDonationsByDay() {
    const since = new Date();
    since.setDate(since.getDate() - 14);
    since.setHours(0, 0, 0, 0);
    const donations = await this.prisma.donation.findMany({
      where: { status: DonationStatus.SUCCEEDED, createdAt: { gte: since } },
      select: { createdAt: true, amountMinor: true },
    });
    const byDay = new Map<string, { day: string; amountMinor: number; count: number }>();
    for (const d of donations) {
      const key = d.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { day: key, amountMinor: 0, count: 0 };
      cur.amountMinor += d.amountMinor;
      cur.count += 1;
      byDay.set(key, cur);
    }
    const days: { day: string; amountMinor: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      dt.setHours(0, 0, 0, 0);
      const key = dt.toISOString().slice(0, 10);
      days.push(byDay.get(key) ?? { day: key, amountMinor: 0, count: 0 });
    }
    return { series: days };
  }

  async adminDashboard() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [pendingOrgs, totalRaised, donations7d, topProjects, pendingOrgList, recentDonations] =
      await Promise.all([
        this.prisma.organization.count({ where: { status: OrganizationStatus.PENDING_REVIEW } }),
        this.prisma.donation.aggregate({
          where: { status: DonationStatus.SUCCEEDED },
          _sum: { amountMinor: true },
          _count: true,
        }),
        this.prisma.donation.count({
          where: { status: DonationStatus.SUCCEEDED, createdAt: { gte: since } },
        }),
        this.prisma.project.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { raisedAmountMinor: 'desc' },
          take: 8,
          select: {
            id: true,
            title: true,
            raisedAmountMinor: true,
            goalAmountMinor: true,
            organization: { select: { displayName: true } },
          },
        }),
        this.prisma.organization.findMany({
          where: { status: OrganizationStatus.PENDING_REVIEW },
          orderBy: { createdAt: 'asc' },
          take: 20,
          select: { id: true, displayName: true },
        }),
        this.prisma.donation.findMany({
          where: { status: DonationStatus.SUCCEEDED },
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: {
            id: true,
            amountMinor: true,
            currency: true,
            createdAt: true,
            project: { select: { title: true, organization: { select: { displayName: true } } } },
            donor: { select: { email: true } },
          },
        }),
      ]);
    return {
      pendingOrgReviews: pendingOrgs,
      totalRaisedMinor: totalRaised._sum.amountMinor ?? 0,
      successfulDonationCount: totalRaised._count,
      donationsLast7Days: donations7d,
      topProjects,
      pendingOrgs: pendingOrgList,
      recentDonations,
    };
  }

  async ngoDashboard(userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { ownerUserId: userId } });
    if (!org) return { organization: null, projects: [], recentDonations: [] };
    const [projects, recentDonations] = await Promise.all([
      this.prisma.project.findMany({
        where: { orgId: org.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { donations: { where: { status: DonationStatus.SUCCEEDED } } } },
        },
      }),
      this.prisma.donation.findMany({
        where: { status: DonationStatus.SUCCEEDED, project: { orgId: org.id } },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          amountMinor: true,
          currency: true,
          createdAt: true,
          project: { select: { id: true, title: true } },
          donor: { select: { email: true } },
        },
      }),
    ]);
    return { organization: org, projects, recentDonations };
  }

  async donorStats(donorId: string) {
    const [total, count] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { donorUserId: donorId, status: DonationStatus.SUCCEEDED },
        _sum: { amountMinor: true },
      }),
      this.prisma.donation.count({ where: { donorUserId: donorId, status: DonationStatus.SUCCEEDED } }),
    ]);
    return { totalGivenMinor: total._sum.amountMinor ?? 0, giftCount: count };
  }
}

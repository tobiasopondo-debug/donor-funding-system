import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileKind, OrganizationStatus, UserRole } from '@prisma/client';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  /**
   * Presigned URLs must use a host the browser can resolve (not Docker service names).
   * Set MINIO_PUBLIC_ENDPOINT (e.g. http://localhost:9000) when MINIO_ENDPOINT is in-cluster only.
   */
  private readonly s3Presign: S3Client;
  private readonly privateBucket: string;
  private readonly publicBucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const internal = this.config.get('MINIO_ENDPOINT');
    const publicEndpoint = this.config.get('MINIO_PUBLIC_ENDPOINT') ?? internal;
    const credentials = {
      accessKeyId: this.config.getOrThrow('MINIO_ACCESS_KEY'),
      secretAccessKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
    };
    this.s3Presign = new S3Client({
      region: 'us-east-1',
      endpoint: publicEndpoint,
      forcePathStyle: true,
      credentials,
    });
    this.privateBucket = this.config.getOrThrow('MINIO_BUCKET_PRIVATE');
    this.publicBucket = this.config.getOrThrow('MINIO_BUCKET_PUBLIC');
  }

  private bucketForKind(kind: FileKind) {
    return kind === FileKind.VERIFICATION_DOC
      ? this.privateBucket
      : this.publicBucket;
  }

  async presign(
    userId: string,
    role: UserRole,
    dto: import('./dto/file.dto').PresignDto,
  ) {
    if (role !== UserRole.NGO_USER) throw new ForbiddenException();
    const org = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
    });
    if (!org) throw new BadRequestException('Create organization first');
    if (dto.kind === FileKind.PROJECT_IMAGE) {
      if (!dto.projectId) throw new BadRequestException('projectId required');
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, orgId: org.id },
      });
      if (!project) throw new ForbiddenException();
    } else if (dto.projectId) {
      throw new BadRequestException();
    }
    const bucket = this.bucketForKind(dto.kind);
    const safe = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey =
      dto.kind === FileKind.PROJECT_IMAGE
        ? `projects/${dto.projectId}/${randomUUID()}-${safe}`
        : `orgs/${org.id}/${randomUUID()}-${safe}`;
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: dto.mimeType,
      ContentLength: dto.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.s3Presign, cmd, {
      expiresIn: 3600,
    });
    return { uploadUrl, objectKey, bucket, expiresIn: 3600 };
  }

  async confirm(
    userId: string,
    role: UserRole,
    dto: import('./dto/file.dto').ConfirmFileDto,
  ) {
    if (role !== UserRole.NGO_USER) throw new ForbiddenException();
    const org = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
    });
    if (!org) throw new BadRequestException('Create organization first');
    const expectedBucket = this.bucketForKind(dto.kind);
    if (dto.bucket !== expectedBucket)
      throw new BadRequestException('Invalid bucket');
    if (dto.kind === FileKind.PROJECT_IMAGE) {
      if (!dto.projectId) throw new BadRequestException('projectId required');
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, orgId: org.id },
      });
      if (!project) throw new ForbiddenException();
      if (!dto.objectKey.startsWith(`projects/${dto.projectId}/`)) {
        throw new BadRequestException('Invalid object key');
      }
    } else if (!dto.objectKey.startsWith(`orgs/${org.id}/`)) {
      throw new ForbiddenException();
    }

    return this.prisma.fileObject.create({
      data: {
        bucket: dto.bucket,
        objectKey: dto.objectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        kind: dto.kind,
        ownerOrgId: org.id,
        ownerProjectId: dto.projectId ?? null,
        uploadedByUserId: userId,
      },
    });
  }

  async signedView(fileId: string, userId: string, role: UserRole) {
    const file = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
      include: { organization: true },
    });
    if (!file || file.deletedAt) throw new NotFoundException();
    if (file.kind === FileKind.VERIFICATION_DOC) {
      if (role !== UserRole.PLATFORM_ADMIN) throw new ForbiddenException();
    } else {
      if (role === UserRole.NGO_USER && file.ownerOrgId) {
        const org = await this.prisma.organization.findUnique({
          where: { ownerUserId: userId },
        });
        if (!org || org.id !== file.ownerOrgId) throw new ForbiddenException();
      } else if (role === UserRole.DONOR || !userId) {
        const org = file.organization;
        if (!org || org.status !== OrganizationStatus.APPROVED)
          throw new ForbiddenException();
      }
    }
    const cmd = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.objectKey,
    });
    const url = await getSignedUrl(this.s3Presign, cmd, { expiresIn: 300 });
    return { url, expiresIn: 300 };
  }

  async signedDownload(fileId: string) {
    const file = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
    });
    if (!file || file.deletedAt) throw new NotFoundException();
    const cmd = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.objectKey,
    });
    const url = await getSignedUrl(this.s3Presign, cmd, { expiresIn: 300 });
    return { url, expiresIn: 300 };
  }

  async signedPublicView(fileId: string) {
    const file = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
      include: { organization: true },
    });
    if (!file || file.deletedAt) throw new NotFoundException();
    if (file.kind === FileKind.VERIFICATION_DOC) throw new ForbiddenException();
    const org = file.organization;
    if (!org || org.status !== OrganizationStatus.APPROVED)
      throw new ForbiddenException();
    const cmd = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.objectKey,
    });
    const url = await getSignedUrl(this.s3Presign, cmd, { expiresIn: 300 });
    return { url, expiresIn: 300 };
  }

  async deleteGalleryFile(fileId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { ownerUserId: userId },
    });
    if (!org) throw new NotFoundException();
    const file = await this.prisma.fileObject.findFirst({
      where: { id: fileId, ownerOrgId: org.id, kind: FileKind.NGO_GALLERY },
    });
    if (!file) throw new NotFoundException();
    await this.prisma.fileObject.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }
}

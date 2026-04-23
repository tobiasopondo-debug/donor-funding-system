-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- Normalize emails for consistent OTP and login lookups
UPDATE "User" SET email = lower(trim(email));

-- Existing accounts: treat as already verified so they only use login OTP after upgrade
UPDATE "User" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "emailVerifiedAt" IS NULL;

-- CreateTable
CREATE TABLE "AuthOtpChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthOtpChallenge_userId_purpose_idx" ON "AuthOtpChallenge"("userId", "purpose");

-- CreateIndex
CREATE INDEX "AuthOtpChallenge_expiresAt_idx" ON "AuthOtpChallenge"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthOtpChallenge" ADD CONSTRAINT "AuthOtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

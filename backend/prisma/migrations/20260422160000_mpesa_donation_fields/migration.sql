-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "mpesaMerchantRequestId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "mpesaCheckoutRequestId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "mpesaReceiptNumber" TEXT;
ALTER TABLE "Donation" ADD COLUMN "mpesaPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Donation_mpesaMerchantRequestId_key" ON "Donation"("mpesaMerchantRequestId");

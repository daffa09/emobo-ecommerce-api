-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDays" INTEGER,
ADD COLUMN     "shippedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "installment_no" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "installment_total" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paid_amount" DECIMAL NOT NULL DEFAULT 0;

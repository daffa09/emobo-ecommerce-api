-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "condition" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "specifications" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "warranty" TEXT,
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1500,
ALTER COLUMN "stock" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "phone" TEXT;

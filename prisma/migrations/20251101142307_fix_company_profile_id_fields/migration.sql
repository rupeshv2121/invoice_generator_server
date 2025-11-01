/*
  Warnings:

  - You are about to drop the column `companyId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `items` table. All the data in the column will be lost.
  - Added the required column `companyProfileId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_companyId_fkey";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "companyId",
ADD COLUMN     "companyProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "items" DROP COLUMN "companyId",
ADD COLUMN     "companyProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "company_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

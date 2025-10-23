/*
  Warnings:

  - You are about to drop the column `companyProfileId` on the `items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_companyProfileId_fkey";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "companyProfileId",
ADD COLUMN     "companyId" TEXT;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

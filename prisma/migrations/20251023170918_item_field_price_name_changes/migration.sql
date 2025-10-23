/*
  Warnings:

  - You are about to drop the column `purchaseRate` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `sellingRate` on the `items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "items" DROP COLUMN "purchaseRate",
DROP COLUMN "sellingRate",
ADD COLUMN     "purchasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

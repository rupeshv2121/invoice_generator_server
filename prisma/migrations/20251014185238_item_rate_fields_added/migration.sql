/*
  Warnings:

  - You are about to drop the column `rate` on the `items` table. All the data in the column will be lost.
  - Added the required column `purchaseRate` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellingRate` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "items" DROP COLUMN "rate",
ADD COLUMN     "purchaseRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "sellingRate" DECIMAL(10,2) NOT NULL;

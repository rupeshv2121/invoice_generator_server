/*
  Warnings:

  - Added the required column `hsnCode` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "items" DROP COLUMN "hsnCode",
ADD COLUMN     "hsnCode" INTEGER NOT NULL;

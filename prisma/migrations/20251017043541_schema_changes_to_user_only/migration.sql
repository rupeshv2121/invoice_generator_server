/*
  Warnings:

  - You are about to drop the `companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."companies" DROP CONSTRAINT "companies_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_items" DROP CONSTRAINT "invoice_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_items" DROP CONSTRAINT "invoice_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_companyId_fkey";

-- DropTable
DROP TABLE "public"."companies";

-- DropTable
DROP TABLE "public"."customers";

-- DropTable
DROP TABLE "public"."invoice_items";

-- DropTable
DROP TABLE "public"."invoices";

-- DropTable
DROP TABLE "public"."items";

-- DropTable
DROP TABLE "public"."settings";

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");

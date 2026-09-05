-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "defaultCgstRate" DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    "defaultSgstRate" DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    "defaultIgstRate" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "termsConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_companyProfileId_key" ON "settings"("companyProfileId");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

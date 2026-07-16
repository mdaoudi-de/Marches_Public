-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "marketNature" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "requiresPrequalification" BOOLEAN NOT NULL DEFAULT false,
    "requiresRevuePrealable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureTemplatePhase" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProcedureTemplatePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureTemplateStep" (
    "id" SERIAL NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stepKind" TEXT NOT NULL DEFAULT 'DATE',
    "defaultDelayDays" INTEGER,
    "requiresNonObjection" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocCategory" TEXT,

    CONSTRAINT "ProcedureTemplateStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "budgetAmountFC" DOUBLE PRECISION NOT NULL,
    "budgetCode" TEXT,
    "aoNumber" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVU',
    "contractAmountFC" DOUBLE PRECISION,
    "templateId" INTEGER,
    "awardedSupplierId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStep" (
    "id" SERIAL NOT NULL,
    "marketId" INTEGER NOT NULL,
    "templateStepId" INTEGER,
    "phaseName" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stepKind" TEXT NOT NULL DEFAULT 'DATE',
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "plannedAmountFC" DOUBLE PRECISION,
    "actualAmountFC" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'A_VENIR',
    "documentId" INTEGER,
    "validatedById" INTEGER,
    "validatedAt" TIMESTAMP(3),
    "comment" TEXT,

    CONSTRAINT "MarketStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStepHistory" (
    "id" SERIAL NOT NULL,
    "marketStepId" INTEGER NOT NULL,
    "userId" INTEGER,
    "changeType" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketStepHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rccm" TEXT,
    "nif" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierEvaluation" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "marketId" INTEGER,
    "evaluatorId" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "deadlineScore" INTEGER NOT NULL,
    "conformityScore" INTEGER NOT NULL,
    "satisfactionScore" INTEGER NOT NULL,
    "globalScore" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "marketId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SIMPLE',
    "signatureDate" TIMESTAMP(3),
    "amountFC" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "guaranteeRetentionPct" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guarantee" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amountFC" DOUBLE PRECISION NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Guarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountFC" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "invoiceDocId" INTEGER,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reception" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "pvDocId" INTEGER,

    CONSTRAINT "Reception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "amountFC" DOUBLE PRECISION NOT NULL,
    "daysLate" INTEGER,
    "appliedDate" TIMESTAMP(3),

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendment" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "amountDeltaFC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newEndDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',

    CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "object" TEXT NOT NULL,
    "docId" INTEGER,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3),
    "amountFC" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EMISE',

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedAmountFC" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DEMANDE',
    "supplierId" INTEGER,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionById" INTEGER,
    "decisionDate" TIMESTAMP(3),

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestPayment" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "amountFC" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "PurchaseRequestPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "replacesDocumentId" INTEGER,
    "marketId" INTEGER,
    "contractId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "marketId" INTEGER,
    "contractId" INTEGER,
    "refEntity" TEXT,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedById" INTEGER,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_reference_key" ON "Market"("reference");

-- CreateIndex
CREATE INDEX "Market_nature_idx" ON "Market"("nature");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_fiscalYear_idx" ON "Market"("fiscalYear");

-- CreateIndex
CREATE INDEX "MarketStep_marketId_idx" ON "MarketStep"("marketId");

-- CreateIndex
CREATE INDEX "MarketStepHistory_marketStepId_idx" ON "MarketStepHistory"("marketStepId");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_supplierId_idx" ON "SupplierEvaluation"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_reference_key" ON "Contract"("reference");

-- CreateIndex
CREATE INDEX "Contract_marketId_idx" ON "Contract"("marketId");

-- CreateIndex
CREATE INDEX "Guarantee_contractId_idx" ON "Guarantee"("contractId");

-- CreateIndex
CREATE INDEX "Payment_contractId_idx" ON "Payment"("contractId");

-- CreateIndex
CREATE INDEX "Reception_contractId_idx" ON "Reception"("contractId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_contractId_idx" ON "PurchaseOrder"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_reference_key" ON "PurchaseRequest"("reference");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_marketId_idx" ON "Document"("marketId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_type_refEntity_key" ON "Alert"("type", "refEntity");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureTemplatePhase" ADD CONSTRAINT "ProcedureTemplatePhase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProcedureTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureTemplateStep" ADD CONSTRAINT "ProcedureTemplateStep_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "ProcedureTemplatePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProcedureTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_awardedSupplierId_fkey" FOREIGN KEY ("awardedSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStep" ADD CONSTRAINT "MarketStep_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStep" ADD CONSTRAINT "MarketStep_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStepHistory" ADD CONSTRAINT "MarketStepHistory_marketStepId_fkey" FOREIGN KEY ("marketStepId") REFERENCES "MarketStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStepHistory" ADD CONSTRAINT "MarketStepHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantee" ADD CONSTRAINT "Guarantee_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reception" ADD CONSTRAINT "Reception_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_decisionById_fkey" FOREIGN KEY ("decisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestPayment" ADD CONSTRAINT "PurchaseRequestPayment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_replacesDocumentId_fkey" FOREIGN KEY ("replacesDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


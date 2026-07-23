-- CreateTable
CREATE TABLE "Direction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ThirdPartyProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER,
    "denomination" TEXT NOT NULL,
    "rccm" TEXT,
    "idNational" TEXT,
    "nif" TEXT,
    "taxNumber" TEXT,
    "address" TEXT,
    "province" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "creationDate" DATETIME,
    "sector" TEXT,
    "activityCode" TEXT,
    "experienceYrs" INTEGER,
    "refsClients" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'ENREGISTRE',
    "decision" TEXT,
    "decisionNote" TEXT,
    "riskScore" REAL,
    "riskLevel" TEXT,
    "recommendation" TEXT,
    "mitigation" TEXT,
    "lastScreenedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThirdPartyProfile_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ThirdPartyProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyRepresentative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idDocument" TEXT,
    "appointmentDate" DATETIME,
    CONSTRAINT "ThirdPartyRepresentative_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyShareholder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sharePct" REAL NOT NULL DEFAULT 0,
    "isBeneficialOwner" BOOLEAN NOT NULL DEFAULT false,
    "nationality" TEXT,
    CONSTRAINT "ThirdPartyShareholder_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "docType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provided" BOOLEAN NOT NULL DEFAULT false,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "controlStatus" TEXT NOT NULL DEFAULT 'MANQUANT',
    "controlNote" TEXT,
    "documentId" INTEGER,
    CONSTRAINT "ThirdPartyDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DueDiligenceAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT 'NSP',
    "justification" TEXT,
    "documentId" INTEGER,
    CONSTRAINT "DueDiligenceAnswer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnhancedInvestigationItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "itemKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "result" TEXT,
    "note" TEXT,
    CONSTRAINT "EnhancedInvestigationItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyRiskRubric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "rubricKey" TEXT NOT NULL,
    "weightPct" REAL NOT NULL,
    "riskScore" REAL NOT NULL,
    "justification" TEXT,
    CONSTRAINT "ThirdPartyRiskRubric_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalControlFlag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "controlKey" TEXT NOT NULL,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "computed" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "note" TEXT,
    CONSTRAINT "InternalControlFlag_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyMonitoringEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "detail" TEXT,
    CONSTRAINT "ThirdPartyMonitoringEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "marketId" INTEGER,
    "contractId" INTEGER,
    "thirdPartyProfileId" INTEGER,
    "refEntity" TEXT,
    "message" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedById" INTEGER,
    "resolvedAt" DATETIME,
    CONSTRAINT "Alert_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_thirdPartyProfileId_fkey" FOREIGN KEY ("thirdPartyProfileId") REFERENCES "ThirdPartyProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("acknowledgedById", "contractId", "createdAt", "dueDate", "id", "marketId", "message", "refEntity", "resolvedAt", "severity", "status", "type") SELECT "acknowledgedById", "contractId", "createdAt", "dueDate", "id", "marketId", "message", "refEntity", "resolvedAt", "severity", "status", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_status_idx" ON "Alert"("status");
CREATE INDEX "Alert_thirdPartyProfileId_idx" ON "Alert"("thirdPartyProfileId");
CREATE UNIQUE INDEX "Alert_type_refEntity_key" ON "Alert"("type", "refEntity");
CREATE TABLE "new_Market" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "budgetAmountFC" REAL NOT NULL,
    "budgetCode" TEXT,
    "aoNumber" TEXT,
    "contractingAuthority" TEXT NOT NULL DEFAULT 'FONAREV',
    "directionId" INTEGER,
    "fiscalYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREVU',
    "contractAmountFC" REAL,
    "templateId" INTEGER,
    "awardedSupplierId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Market_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProcedureTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Market_awardedSupplierId_fkey" FOREIGN KEY ("awardedSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Market_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "Direction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Market_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("aoNumber", "awardedSupplierId", "budgetAmountFC", "budgetCode", "contractAmountFC", "createdAt", "createdById", "fiscalYear", "id", "intitule", "nature", "procedureType", "reference", "status", "templateId", "updatedAt") SELECT "aoNumber", "awardedSupplierId", "budgetAmountFC", "budgetCode", "contractAmountFC", "createdAt", "createdById", "fiscalYear", "id", "intitule", "nature", "procedureType", "reference", "status", "templateId", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE UNIQUE INDEX "Market_reference_key" ON "Market"("reference");
CREATE INDEX "Market_nature_idx" ON "Market"("nature");
CREATE INDEX "Market_status_idx" ON "Market"("status");
CREATE INDEX "Market_fiscalYear_idx" ON "Market"("fiscalYear");
CREATE INDEX "Market_directionId_idx" ON "Market"("directionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Direction_code_key" ON "Direction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyProfile_supplierId_key" ON "ThirdPartyProfile"("supplierId");

-- CreateIndex
CREATE INDEX "ThirdPartyProfile_riskLevel_idx" ON "ThirdPartyProfile"("riskLevel");

-- CreateIndex
CREATE INDEX "ThirdPartyProfile_decision_idx" ON "ThirdPartyProfile"("decision");

-- CreateIndex
CREATE INDEX "ThirdPartyRepresentative_profileId_idx" ON "ThirdPartyRepresentative"("profileId");

-- CreateIndex
CREATE INDEX "ThirdPartyShareholder_profileId_idx" ON "ThirdPartyShareholder"("profileId");

-- CreateIndex
CREATE INDEX "ThirdPartyDocument_profileId_idx" ON "ThirdPartyDocument"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyDocument_profileId_docType_key" ON "ThirdPartyDocument"("profileId", "docType");

-- CreateIndex
CREATE UNIQUE INDEX "DueDiligenceAnswer_profileId_questionKey_key" ON "DueDiligenceAnswer"("profileId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "EnhancedInvestigationItem_profileId_itemKey_key" ON "EnhancedInvestigationItem"("profileId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyRiskRubric_profileId_rubricKey_key" ON "ThirdPartyRiskRubric"("profileId", "rubricKey");

-- CreateIndex
CREATE UNIQUE INDEX "InternalControlFlag_profileId_controlKey_key" ON "InternalControlFlag"("profileId", "controlKey");

-- CreateIndex
CREATE INDEX "ThirdPartyMonitoringEvent_profileId_idx" ON "ThirdPartyMonitoringEvent"("profileId");

/**
 * Seed déterministe — POC « Suivi des marchés publics ».
 * Ancré sur TODAY = 2026-07-15. Aucune valeur aléatoire (jitter dérivé de l'index)
 * afin que écarts, retards et alertes soient reproductibles.
 */
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import PDFDocument from "pdfkit";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { recomputeAlerts } from "@/lib/alertes";
import { TEMPLATES, type TemplateDef } from "./templates";

const TODAY = new Date("2026-07-15T00:00:00.000Z");
const FISCAL_YEAR = 2026;
const PASSWORD = "Passw0rd!";

function d(iso: string): Date {
  return new Date(iso + "T00:00:00.000Z");
}
function isMontant(name: string): boolean {
  return /montant du contrat/i.test(name);
}
function requiresNO(name: string): boolean {
  return /non-?objection/i.test(name);
}
function delayFor(name: string): number {
  const n = name.toLowerCase();
  // Délais compressés pour qu'un cycle complet tienne dans l'exercice de démonstration.
  if (/(publication|dépôt|depot|limite|envoi)/.test(n)) return 15;
  if (/(évaluation|evaluation)/.test(n)) return 10;
  if (/non-?objection/.test(n)) return 6;
  if (/(approbation|négociation|negociation|mise au point|signature|justification)/.test(n)) return 7;
  if (/(notification|entrée|entree|début|debut|livraison|enregistrement|prestations|travaux|invitation)/.test(n)) return 4;
  return 7;
}
type Scenario = "clot" | "exec_ontime" | "exec_late" | "attrib" | "lance_overdue" | "prevu";
function jitterFor(scenario: Scenario, idx: number): number {
  switch (scenario) {
    case "clot": return (idx * 2) % 5; // 0..4
    case "exec_ontime": return (idx * 3) % 6; // 0..5
    case "exec_late": return 5 + ((idx * 7) % 20); // 5..24 (retards visibles mais réalisés)
    case "attrib": return (idx * 2) % 5;
    case "lance_overdue": return (idx * 3) % 7;
    case "prevu": return 0;
  }
}
function statusFor(scenario: Scenario): string {
  switch (scenario) {
    case "clot": return "CLOTURE";
    case "exec_ontime":
    case "exec_late": return "EXECUTE";
    case "attrib": return "ATTRIBUE";
    case "lance_overdue": return "LANCE";
    case "prevu": return "PREVU";
  }
}

interface MarketSpec {
  ref: string;
  intitule: string;
  templateKey: string;
  budget: number;
  scenario: Scenario;
  start: string; // date prévisionnelle de démarrage de la procédure
  contractFactor?: number; // montant contrat = budget × facteur
  supplier?: string; // nom du fournisseur attributaire
}

const MARKETS: MarketSpec[] = [
  // Travaux
  { ref: "T-2026-001", intitule: "Construction d'un bâtiment administratif R+3", templateKey: "TRAVAUX_PREQUAL", budget: 3_800_000_000, scenario: "exec_late", start: "2026-01-08", contractFactor: 1.06, supplier: "CONGO BÂTIR SARL" },
  { ref: "T-2026-002", intitule: "Réhabilitation de la voirie urbaine (tronçon Nord)", templateKey: "TRAVAUX_OUVERT", budget: 2_450_000_000, scenario: "clot", start: "2026-01-15", contractFactor: 0.97, supplier: "ROUTES & OUVRAGES SA" },
  { ref: "T-2026-003", intitule: "Construction d'un forage et château d'eau", templateKey: "TRAVAUX_OUVERT", budget: 890_000_000, scenario: "lance_overdue", start: "2026-05-05" },
  { ref: "T-2026-004", intitule: "Extension du réseau électrique basse tension", templateKey: "TRAVAUX_SANS_REVUE", budget: 1_250_000_000, scenario: "attrib", start: "2026-05-10", contractFactor: 1.0, supplier: "ELEC CONGO SARL" },
  { ref: "T-2026-005", intitule: "Travaux d'urgence de confortement d'un pont", templateKey: "TRAVAUX_GRE_A_GRE", budget: 620_000_000, scenario: "exec_ontime", start: "2026-02-01", contractFactor: 1.02, supplier: "GÉNIE CIVIL PLUS" },
  { ref: "T-2026-006", intitule: "Aménagement de la voirie d'un quartier périphérique", templateKey: "TRAVAUX_OUVERT", budget: 1_700_000_000, scenario: "prevu", start: "2026-09-01" },
  { ref: "T-2026-007", intitule: "Construction d'un centre de santé intégré", templateKey: "TRAVAUX_OUVERT", budget: 1_350_000_000, scenario: "lance_overdue", start: "2026-06-05" },

  // Fournitures & Services
  { ref: "F-2026-001", intitule: "Acquisition de véhicules de service", templateKey: "FOURN_OUVERT", budget: 980_000_000, scenario: "exec_ontime", start: "2026-01-20", contractFactor: 0.99, supplier: "AUTO DISTRIB CONGO" },
  { ref: "F-2026-002", intitule: "Fourniture de matériel informatique", templateKey: "FOURN_OUVERT", budget: 340_000_000, scenario: "clot", start: "2026-02-05", contractFactor: 0.95, supplier: "INFOTECH SARL" },
  { ref: "F-2026-003", intitule: "Fourniture de mobilier de bureau", templateKey: "FOURN_COTATION", budget: 45_000_000, scenario: "exec_late", start: "2026-04-01", contractFactor: 1.08, supplier: "MEUBLES DU FLEUVE" },
  { ref: "F-2026-004", intitule: "Acquisition de groupes électrogènes", templateKey: "FOURN_PREQUAL", budget: 1_150_000_000, scenario: "lance_overdue", start: "2026-03-10" },
  { ref: "F-2026-005", intitule: "Fourniture de carburant (accord-cadre annuel)", templateKey: "FOURN_OUVERT", budget: 2_000_000_000, scenario: "exec_ontime", start: "2026-01-12", contractFactor: 1.0, supplier: "PÉTRO CONGO" },
  { ref: "F-2026-006", intitule: "Fournitures de bureau (marché à bons de commande)", templateKey: "FOURN_COTATION", budget: 120_000_000, scenario: "exec_ontime", start: "2026-02-20", contractFactor: 1.0, supplier: "PAPETERIE CENTRALE" },
  { ref: "F-2026-007", intitule: "Acquisition d'équipements médicaux", templateKey: "FOURN_SANS_REVUE", budget: 760_000_000, scenario: "prevu", start: "2026-08-15" },

  // Prestations intellectuelles
  { ref: "P-2026-001", intitule: "Étude de faisabilité d'un barrage hydroélectrique", templateKey: "PI_AMI", budget: 540_000_000, scenario: "exec_late", start: "2026-01-25", contractFactor: 1.04, supplier: "HYDRO CONSULT INTL" },
  { ref: "P-2026-002", intitule: "Audit organisationnel et institutionnel", templateKey: "PI_RESTREINTE", budget: 180_000_000, scenario: "clot", start: "2026-02-12", contractFactor: 0.96, supplier: "CABINET AUDIT & CONSEIL" },
  { ref: "P-2026-003", intitule: "Maîtrise d'œuvre d'un complexe scolaire", templateKey: "PI_AMI", budget: 720_000_000, scenario: "lance_overdue", start: "2026-03-15" },
  { ref: "P-2026-004", intitule: "Élaboration du schéma directeur du système d'information", templateKey: "PI_RESTREINTE_SANS_REVUE", budget: 260_000_000, scenario: "attrib", start: "2026-05-12", contractFactor: 1.0, supplier: "DIGITAL STRATEGY SARL" },
  { ref: "P-2026-005", intitule: "Assistance technique juridique", templateKey: "PI_RESTREINTE", budget: 95_000_000, scenario: "prevu", start: "2026-09-10" },
];

/* ------------------------------------------------------------------ PDF util */
function genPdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(16).fillColor("#1d2f69").text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333");
    for (const l of lines) doc.text(l);
    doc.moveDown();
    doc.fontSize(8).fillColor("#999").text("Document de démonstration — POC de suivi des marchés publics (contenu fictif).");
    doc.end();
  });
}

async function main() {
  console.log("→ Nettoyage de la base…");
  // Ordre de suppression respectant les FK.
  await prisma.marketStepHistory.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.document.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.amendment.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.reception.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.guarantee.deleteMany();
  await prisma.purchaseRequestPayment.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.supplierEvaluation.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.marketStep.deleteMany();
  await prisma.market.deleteMany();
  await prisma.procedureTemplateStep.deleteMany();
  await prisma.procedureTemplatePhase.deleteMany();
  await prisma.procedureTemplate.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  /* --------------------------------------------------------------- Users */
  console.log("→ Utilisateurs…");
  const hash = bcrypt.hashSync(PASSWORD, 8);
  const users = {
    admin: await prisma.user.create({ data: { username: "admin", email: "admin@marches.cg", passwordHash: hash, fullName: "Administrateur Système", role: "ADMIN" } }),
    sp: await prisma.user.create({ data: { username: "sp", email: "sp@marches.cg", passwordHash: hash, fullName: "Jean-Pierre MABIALA", role: "SECRETAIRE_PERMANENT" } }),
    prep: await prisma.user.create({ data: { username: "prep", email: "prep@marches.cg", passwordHash: hash, fullName: "Alice NGOMA", role: "RESP_PREPARATION" } }),
    passation: await prisma.user.create({ data: { username: "passation", email: "passation@marches.cg", passwordHash: hash, fullName: "Thomas OKEMBA", role: "RESP_PASSATION" } }),
    suivi: await prisma.user.create({ data: { username: "suivi", email: "suivi@marches.cg", passwordHash: hash, fullName: "Claudine ITOUA", role: "RESP_SUIVI" } }),
  };

  /* ----------------------------------------------------------- Suppliers */
  console.log("→ Fournisseurs…");
  const supplierData = [
    { name: "CONGO BÂTIR SARL", type: "ENTREPRISE", city: "Brazzaville" },
    { name: "ROUTES & OUVRAGES SA", type: "ENTREPRISE", city: "Pointe-Noire" },
    { name: "ELEC CONGO SARL", type: "ENTREPRISE", city: "Brazzaville" },
    { name: "GÉNIE CIVIL PLUS", type: "ENTREPRISE", city: "Dolisie" },
    { name: "AUTO DISTRIB CONGO", type: "ENTREPRISE", city: "Brazzaville" },
    { name: "INFOTECH SARL", type: "ENTREPRISE", city: "Pointe-Noire" },
    { name: "MEUBLES DU FLEUVE", type: "ENTREPRISE", city: "Brazzaville" },
    { name: "PÉTRO CONGO", type: "ENTREPRISE", city: "Pointe-Noire" },
    { name: "PAPETERIE CENTRALE", type: "ENTREPRISE", city: "Brazzaville" },
    { name: "HYDRO CONSULT INTL", type: "CONSULTANT_CABINET", city: "Brazzaville" },
    { name: "CABINET AUDIT & CONSEIL", type: "CONSULTANT_CABINET", city: "Brazzaville" },
    { name: "DIGITAL STRATEGY SARL", type: "CONSULTANT_CABINET", city: "Pointe-Noire" },
  ];
  const suppliers: Record<string, { id: number }> = {};
  let sidx = 0;
  for (const s of supplierData) {
    sidx++;
    suppliers[s.name] = await prisma.supplier.create({
      data: {
        name: s.name,
        type: s.type,
        city: s.city,
        rccm: `CG-BZV-2020-B-${1000 + sidx}`,
        nif: `M2020${100000 + sidx}`,
        address: `${sidx} avenue de l'Indépendance`,
        phone: `+242 06 ${100 + sidx} ${2000 + sidx}`,
        email: `contact@${s.name.toLowerCase().replace(/[^a-z]+/g, "")}.cg`,
        contactPerson: "Service commercial",
      },
    });
  }

  /* ----------------------------------------------------------- Templates */
  console.log("→ Templates de procédure…");
  const templateIdByKey: Record<string, number> = {};
  for (const t of TEMPLATES) {
    const created = await prisma.procedureTemplate.create({
      data: {
        name: t.name,
        marketNature: t.nature,
        procedureType: t.procedureType,
        requiresPrequalification: t.requiresPrequalification,
        requiresRevuePrealable: t.requiresRevuePrealable,
        phases: {
          create: t.phases.map((ph, pi) => ({
            order: pi + 1,
            name: ph.name,
            steps: {
              create: ph.steps.map((st, si) => ({
                order: si + 1,
                name: st,
                stepKind: isMontant(st) ? "MONTANT" : "DATE",
                requiresNonObjection: requiresNO(st),
                defaultDelayDays: delayFor(st),
              })),
            },
          })),
        },
      },
    });
    templateIdByKey[t.key] = created.id;
  }

  /* ------------------------------------------------------- Markets + steps */
  console.log("→ Marchés + étapes (moteur Prévu/Réalisé)…");
  const templateByKey: Record<string, TemplateDef> = {};
  for (const t of TEMPLATES) templateByKey[t.key] = t;

  const marketIdByRef: Record<string, number> = {};
  const marketRealizedNotif: Record<string, Date | null> = {}; // date de notification réalisée (pour dater les contrats)

  let showcaseDone = false;
  for (const spec of MARKETS) {
    const tpl = templateByKey[spec.templateKey];
    const factor = spec.contractFactor ?? 1;
    const hasContract = ["clot", "exec_ontime", "exec_late", "attrib"].includes(spec.scenario);
    const contractAmount = hasContract ? Math.round(spec.budget * factor) : null;

    const market = await prisma.market.create({
      data: {
        reference: spec.ref,
        intitule: spec.intitule,
        nature: tpl.nature,
        procedureType: tpl.procedureType,
        budgetAmountFC: spec.budget,
        budgetCode: `${tpl.nature.slice(0, 3)}-${spec.ref.slice(-3)}`,
        aoNumber: `AO/${FISCAL_YEAR}/${spec.ref}`,
        fiscalYear: FISCAL_YEAR,
        status: statusFor(spec.scenario),
        contractAmountFC: contractAmount,
        templateId: templateIdByKey[spec.templateKey],
        awardedSupplierId: hasContract && spec.supplier ? suppliers[spec.supplier].id : null,
        createdById: users.prep.id,
        createdAt: d(spec.start),
      },
    });
    marketIdByRef[spec.ref] = market.id;

    // Étapes ordonnées à plat
    let running = d(spec.start);
    let order = 0;
    let idx = 0;
    let lastDateRealized = false;
    let notifRealized: Date | null = null;
    const isShowcase = !showcaseDone && spec.scenario === "exec_late";

    for (const ph of tpl.phases) {
      for (const st of ph.steps) {
        order++;
        idx++;
        const kind = isMontant(st) ? "MONTANT" : "DATE";
        let plannedDate: Date | null = null;
        let actualDate: Date | null = null;
        let plannedAmountFC: number | null = null;
        let actualAmountFC: number | null = null;
        let realized = false;

        const completed = ["clot", "exec_ontime", "exec_late"].includes(spec.scenario);
        if (kind === "DATE") {
          running = addDays(running, delayFor(st));
          plannedDate = new Date(running);
          let actual = addDays(plannedDate, jitterFor(spec.scenario, idx));
          if (spec.scenario === "prevu") {
            realized = false;
          } else if (completed) {
            // Marché terminé/en exécution : toutes les étapes de passation sont réalisées,
            // bornées à la veille de la date de référence (jamais dans le futur).
            realized = true;
            if (actual > TODAY) actual = addDays(TODAY, -1);
          } else if (spec.scenario === "lance_overdue") {
            // En cours : traité jusqu'à ~18 j avant la date de référence → laisse des étapes échues.
            realized = plannedDate <= addDays(TODAY, -18);
            if (actual > TODAY) actual = addDays(TODAY, -1);
          } else {
            // attrib : passation menée jusqu'aux étapes échues, exécution encore à venir.
            realized = actual <= TODAY;
          }
          if (realized) {
            actualDate = actual;
            lastDateRealized = true;
            if (/notification/i.test(st)) notifRealized = actual;
          } else {
            lastDateRealized = false;
          }
        } else {
          // MONTANT : réalisé si l'étape date précédente l'est
          plannedAmountFC = spec.budget;
          realized = lastDateRealized && contractAmount != null;
          if (realized) actualAmountFC = contractAmount;
        }

        const created = await prisma.marketStep.create({
          data: {
            marketId: market.id,
            phaseName: ph.name,
            stepName: st,
            order,
            stepKind: kind,
            plannedDate,
            actualDate,
            plannedAmountFC,
            actualAmountFC,
            status: actualDate ? "REALISE" : "A_VENIR",
            validatedById: realized && requiresNO(st) ? users.sp.id : null,
            validatedAt: realized && requiresNO(st) ? actualDate : null,
          },
        });

        // Historique de démonstration (un marché vitrine)
        if (isShowcase && realized && kind === "DATE") {
          await prisma.marketStepHistory.create({
            data: {
              marketStepId: created.id,
              userId: users.passation.id,
              changeType: "UPDATE_ACTUAL",
              field: "actualDate",
              newValue: actualDate!.toISOString().slice(0, 10),
              at: actualDate!,
            },
          });
        }
      }
    }
    if (isShowcase) showcaseDone = true;
    marketRealizedNotif[spec.ref] = notifRealized;
  }

  await seedContracts(users, suppliers, marketIdByRef, marketRealizedNotif);
  await seedPurchaseRequests(users, suppliers);
  await seedEvaluations(users, suppliers, marketIdByRef);
  const docCount = await seedDocuments(users, marketIdByRef);
  await seedAudit(users);

  console.log("→ Calcul des alertes…");
  const summary = await recomputeAlerts();

  const counts = {
    users: await prisma.user.count(),
    templates: await prisma.procedureTemplate.count(),
    markets: await prisma.market.count(),
    steps: await prisma.marketStep.count(),
    suppliers: await prisma.supplier.count(),
    contracts: await prisma.contract.count(),
    documents: docCount,
    alerts: summary.active,
  };
  console.log("✔ Seed terminé:", JSON.stringify(counts, null, 2));
}

/* =========================================================== Contrats ===== */
async function seedContracts(
  users: Record<string, { id: number }>,
  suppliers: Record<string, { id: number }>,
  marketIdByRef: Record<string, number>,
  notif: Record<string, Date | null>,
) {
  console.log("→ Contrats & exécution…");

  // Table de configuration des contrats (par référence de marché).
  const cfgs: Array<{
    ref: string; supplier: string; type?: string; amount: number;
    start: string; end: string; status?: string;
    guarantees?: Array<{ type: string; amount: number; issue: string; expiry: string; status?: string }>;
    payments?: Array<{ ref: string; type: string; amount: number; due: string; paid?: string; status: string }>;
    receptions?: Array<{ type: string; planned: string; actual?: string; status: string }>;
    penalties?: Array<{ reason: string; amount: number; daysLate: number; applied: string }>;
    amendments?: Array<{ ref: string; object: string; delta: number; newEnd?: string; approval?: string; status: string }>;
    serviceOrders?: Array<{ ref: string; type: string; date: string; object: string }>;
    purchaseOrders?: Array<{ ref: string; order: string; amount: number; description: string; delivery?: string; status: string }>;
  }> = [
    {
      ref: "T-2026-001", supplier: "CONGO BÂTIR SARL", amount: 4_028_000_000, start: "2026-06-05", end: "2027-06-05", status: "ACTIF",
      guarantees: [
        { type: "GARANTIE_BONNE_EXECUTION", amount: 201_400_000, issue: "2026-06-05", expiry: "2026-07-25", status: "ACTIVE" }, // expire < 30 j → alerte
        { type: "GARANTIE_AVANCE", amount: 805_600_000, issue: "2026-06-10", expiry: "2026-12-31", status: "ACTIVE" },
      ],
      payments: [
        { ref: "DEC-001", type: "AVANCE", amount: 805_600_000, due: "2026-06-15", paid: "2026-06-18", status: "PAYE" },
        { ref: "DEC-002", type: "DECOMPTE", amount: 402_000_000, due: "2026-06-25", status: "EN_ATTENTE" }, // échu impayé → alerte
      ],
      receptions: [{ type: "PROVISOIRE", planned: "2027-05-20", status: "EN_ATTENTE" }],
      serviceOrders: [{ ref: "OS-001", type: "DEMARRAGE", date: "2026-06-12", object: "Ordre de démarrage des travaux" }],
      penalties: [{ reason: "Retard de mobilisation du chantier", amount: 12_000_000, daysLate: 10, applied: "2026-07-01" }],
    },
    {
      ref: "T-2026-002", supplier: "ROUTES & OUVRAGES SA", amount: 2_376_500_000, start: "2026-05-02", end: "2026-06-30", status: "RECEPTIONNE_DEFINITIF",
      guarantees: [{ type: "GARANTIE_BONNE_EXECUTION", amount: 118_800_000, issue: "2026-05-02", expiry: "2026-06-30", status: "LIBEREE" }],
      payments: [
        { ref: "DEC-101", type: "AVANCE", amount: 475_300_000, due: "2026-05-10", paid: "2026-05-12", status: "PAYE" },
        { ref: "DEC-102", type: "SOLDE", amount: 1_901_200_000, due: "2026-06-28", paid: "2026-06-28", status: "PAYE" },
      ],
      receptions: [
        { type: "PROVISOIRE", planned: "2026-06-10", actual: "2026-06-12", status: "RECEPTIONNE" },
        { type: "DEFINITIVE", planned: "2026-06-28", actual: "2026-06-28", status: "RECEPTIONNE" },
      ],
    },
    {
      ref: "T-2026-004", supplier: "ELEC CONGO SARL", amount: 1_250_000_000, start: "2026-07-10", end: "2027-01-10", status: "ACTIF",
      guarantees: [{ type: "CAUTION_SOUMISSION", amount: 25_000_000, issue: "2026-05-01", expiry: "2026-09-01", status: "ACTIVE" }],
      serviceOrders: [{ ref: "OS-401", type: "DEMARRAGE", date: "2026-07-12", object: "Ordre de démarrage" }],
    },
    {
      ref: "T-2026-005", supplier: "GÉNIE CIVIL PLUS", amount: 632_400_000, start: "2026-04-15", end: "2026-08-05", status: "ACTIF",
      guarantees: [{ type: "GARANTIE_BONNE_EXECUTION", amount: 31_600_000, issue: "2026-04-15", expiry: "2026-08-05", status: "ACTIVE" }], // échéance contrat < 30j → alerte
      payments: [{ ref: "DEC-501", type: "ACOMPTE", amount: 316_000_000, due: "2026-06-01", paid: "2026-06-03", status: "PAYE" }],
      receptions: [{ type: "PROVISOIRE", planned: "2026-07-28", status: "EN_ATTENTE" }],
    },
    {
      ref: "F-2026-001", supplier: "AUTO DISTRIB CONGO", amount: 970_200_000, start: "2026-05-20", end: "2026-11-20", status: "ACTIF",
      guarantees: [{ type: "GARANTIE_BONNE_EXECUTION", amount: 48_500_000, issue: "2026-05-20", expiry: "2026-11-20", status: "ACTIVE" }],
      payments: [{ ref: "FAC-701", type: "AVANCE", amount: 291_000_000, due: "2026-05-25", paid: "2026-05-27", status: "PAYE" }],
      receptions: [{ type: "LIVRAISON", planned: "2026-06-30", status: "EN_ATTENTE" }], // livraison en retard → alerte
    },
    {
      ref: "F-2026-002", supplier: "INFOTECH SARL", amount: 323_000_000, start: "2026-05-05", end: "2026-06-25", status: "RECEPTIONNE_DEFINITIF",
      guarantees: [{ type: "GARANTIE_BONNE_EXECUTION", amount: 16_150_000, issue: "2026-05-05", expiry: "2026-06-25", status: "LIBEREE" }],
      payments: [{ ref: "FAC-201", type: "SOLDE", amount: 323_000_000, due: "2026-06-20", paid: "2026-06-22", status: "PAYE" }],
      receptions: [{ type: "DEFINITIVE", planned: "2026-06-20", actual: "2026-06-22", status: "RECEPTIONNE" }],
    },
    {
      ref: "F-2026-003", supplier: "MEUBLES DU FLEUVE", amount: 48_600_000, start: "2026-06-20", end: "2026-09-20", status: "ACTIF",
      guarantees: [{ type: "RETENUE_GARANTIE", amount: 2_430_000, issue: "2026-06-15", expiry: "2026-06-20", status: "ACTIVE" }], // déjà expirée → alerte critique
      payments: [{ ref: "FAC-301", type: "ACOMPTE", amount: 24_300_000, due: "2026-06-30", status: "EN_ATTENTE" }],
      receptions: [{ type: "LIVRAISON", planned: "2026-06-25", status: "EN_ATTENTE" }],
    },
    {
      ref: "F-2026-005", supplier: "PÉTRO CONGO", type: "CONTRAT_CADRE", amount: 2_000_000_000, start: "2026-03-01", end: "2027-02-28", status: "ACTIF",
      guarantees: [{ type: "GARANTIE_BONNE_EXECUTION", amount: 100_000_000, issue: "2026-03-01", expiry: "2027-02-28", status: "ACTIVE" }],
      purchaseOrders: [
        { ref: "BC-001", order: "2026-03-15", amount: 180_000_000, description: "Carburant 1er trimestre", delivery: "2026-03-30", status: "PAYEE" },
        { ref: "BC-002", order: "2026-04-15", amount: 210_000_000, description: "Carburant avril-mai", delivery: "2026-04-30", status: "PAYEE" },
        { ref: "BC-003", order: "2026-06-01", amount: 195_000_000, description: "Carburant juin", delivery: "2026-06-15", status: "LIVREE" },
        { ref: "BC-004", order: "2026-07-01", amount: 205_000_000, description: "Carburant juillet", status: "EMISE" },
      ],
    },
    {
      ref: "F-2026-006", supplier: "PAPETERIE CENTRALE", type: "CONTRAT_CADRE", amount: 120_000_000, start: "2026-04-01", end: "2027-03-31", status: "ACTIF",
      purchaseOrders: [
        { ref: "BC-101", order: "2026-04-10", amount: 18_000_000, description: "Fournitures avril", delivery: "2026-04-20", status: "PAYEE" },
        { ref: "BC-102", order: "2026-05-10", amount: 22_500_000, description: "Fournitures mai", delivery: "2026-05-22", status: "LIVREE" },
        { ref: "BC-103", order: "2026-06-10", amount: 15_800_000, description: "Fournitures juin", status: "EMISE" },
      ],
    },
    {
      ref: "P-2026-001", supplier: "HYDRO CONSULT INTL", amount: 561_600_000, start: "2026-06-01", end: "2026-08-03", status: "ACTIF",
      guarantees: [{ type: "GARANTIE_AVANCE", amount: 112_320_000, issue: "2026-06-01", expiry: "2026-12-01", status: "ACTIVE" }],
      payments: [{ ref: "HON-001", type: "AVANCE", amount: 112_320_000, due: "2026-06-05", paid: "2026-06-08", status: "PAYE" }],
      amendments: [{ ref: "AV-001", object: "Prolongation de délai de 30 jours", delta: 0, newEnd: "2026-09-02", approval: "2026-07-05", status: "APPROUVE" }],
    },
    {
      ref: "P-2026-002", supplier: "CABINET AUDIT & CONSEIL", amount: 172_800_000, start: "2026-05-01", end: "2026-06-30", status: "RECEPTIONNE_DEFINITIF",
      payments: [{ ref: "HON-101", type: "SOLDE", amount: 172_800_000, due: "2026-06-28", paid: "2026-06-29", status: "PAYE" }],
      receptions: [{ type: "DEFINITIVE", planned: "2026-06-28", actual: "2026-06-29", status: "RECEPTIONNE" }],
    },
    {
      ref: "P-2026-004", supplier: "DIGITAL STRATEGY SARL", amount: 260_000_000, start: "2026-07-08", end: "2027-01-08", status: "ACTIF",
      serviceOrders: [{ ref: "OS-P4", type: "DEMARRAGE", date: "2026-07-10", object: "Ordre de démarrage de la prestation" }],
    },
  ];

  for (const c of cfgs) {
    const marketId = marketIdByRef[c.ref];
    if (!marketId) continue;
    await prisma.contract.create({
      data: {
        marketId,
        supplierId: suppliers[c.supplier].id,
        reference: `CT-${c.ref}`,
        type: c.type ?? "SIMPLE",
        signatureDate: d(c.start),
        amountFC: c.amount,
        startDate: d(c.start),
        endDate: d(c.end),
        durationDays: Math.round((d(c.end).getTime() - d(c.start).getTime()) / 86400000),
        guaranteeRetentionPct: 5,
        status: c.status ?? "ACTIF",
        guarantees: c.guarantees ? { create: c.guarantees.map((g) => ({ type: g.type, amountFC: g.amount, issueDate: d(g.issue), expiryDate: d(g.expiry), status: g.status ?? "ACTIVE" })) } : undefined,
        payments: c.payments ? { create: c.payments.map((p) => ({ reference: p.ref, type: p.type, amountFC: p.amount, dueDate: d(p.due), paidDate: p.paid ? d(p.paid) : null, status: p.status })) } : undefined,
        receptions: c.receptions ? { create: c.receptions.map((r) => ({ type: r.type, plannedDate: d(r.planned), actualDate: r.actual ? d(r.actual) : null, status: r.status })) } : undefined,
        penalties: c.penalties ? { create: c.penalties.map((p) => ({ reason: p.reason, amountFC: p.amount, daysLate: p.daysLate, appliedDate: d(p.applied) })) } : undefined,
        amendments: c.amendments ? { create: c.amendments.map((a) => ({ reference: a.ref, object: a.object, amountDeltaFC: a.delta, newEndDate: a.newEnd ? d(a.newEnd) : null, approvalDate: a.approval ? d(a.approval) : null, status: a.status })) } : undefined,
        serviceOrders: c.serviceOrders ? { create: c.serviceOrders.map((s) => ({ reference: s.ref, type: s.type, date: d(s.date), object: s.object })) } : undefined,
        purchaseOrders: c.purchaseOrders ? { create: c.purchaseOrders.map((po) => ({ reference: po.ref, orderDate: d(po.order), amountFC: po.amount, description: po.description, deliveryDate: po.delivery ? d(po.delivery) : null, status: po.status })) } : undefined,
      },
    });
  }
}

/* ================================================= Achats sous seuil ====== */
async function seedPurchaseRequests(users: Record<string, { id: number }>, suppliers: Record<string, { id: number }>) {
  console.log("→ Achats sous seuil…");
  const reqs = [
    { ref: "DA-2026-001", desc: "Fournitures de papeterie (T3)", amount: 2_800_000, status: "PAYEE", supplier: "PAPETERIE CENTRALE", req: "2026-05-04", dec: "2026-05-06", pay: { amount: 2_800_000, due: "2026-05-20", paid: "2026-05-22", status: "PAYE" } },
    { ref: "DA-2026-002", desc: "Réparation de climatiseurs", amount: 1_500_000, status: "APPROUVEE", req: "2026-06-20", dec: "2026-06-24" },
    { ref: "DA-2026-003", desc: "Consommables informatiques", amount: 3_200_000, status: "COMMANDEE", supplier: "INFOTECH SARL", req: "2026-06-10", dec: "2026-06-12", pay: { amount: 3_200_000, due: "2026-07-10", status: "EN_ATTENTE" } },
    { ref: "DA-2026-004", desc: "Petit mobilier d'appoint", amount: 900_000, status: "DEMANDE", req: "2026-07-08" },
    { ref: "DA-2026-005", desc: "Entretien et vidange des véhicules", amount: 4_100_000, status: "PAYEE", supplier: "AUTO DISTRIB CONGO", req: "2026-04-15", dec: "2026-04-18", pay: { amount: 4_100_000, due: "2026-05-01", paid: "2026-05-03", status: "PAYE" } },
    { ref: "DA-2026-006", desc: "Fournitures sanitaires", amount: 650_000, status: "REJETEE", req: "2026-06-28", dec: "2026-07-01" },
  ];
  for (const r of reqs) {
    await prisma.purchaseRequest.create({
      data: {
        reference: r.ref,
        requesterId: users.prep.id,
        description: r.desc,
        estimatedAmountFC: r.amount,
        status: r.status,
        supplierId: r.supplier ? suppliers[r.supplier].id : null,
        requestDate: d(r.req),
        decisionById: r.dec ? users.sp.id : null,
        decisionDate: r.dec ? d(r.dec) : null,
        payments: r.pay ? { create: [{ amountFC: r.pay.amount, dueDate: d(r.pay.due), paidDate: r.pay.paid ? d(r.pay.paid) : null, status: r.pay.status }] } : undefined,
      },
    });
  }
}

/* ================================================= Évaluations ============ */
async function seedEvaluations(
  users: Record<string, { id: number }>,
  suppliers: Record<string, { id: number }>,
  marketIdByRef: Record<string, number>,
) {
  console.log("→ Évaluations fournisseurs…");
  const evals = [
    { supplier: "ROUTES & OUVRAGES SA", ref: "T-2026-002", q: 5, del: 4, conf: 5, sat: 5, c: "Chantier livré conforme, léger retard sans impact." },
    { supplier: "INFOTECH SARL", ref: "F-2026-002", q: 4, del: 5, conf: 4, sat: 4, c: "Matériel conforme, livraison rapide." },
    { supplier: "CABINET AUDIT & CONSEIL", ref: "P-2026-002", q: 5, del: 5, conf: 5, sat: 5, c: "Rapport d'audit de très bonne qualité." },
    { supplier: "CONGO BÂTIR SARL", ref: "T-2026-001", q: 3, del: 2, conf: 3, sat: 3, c: "Retards de mobilisation, qualité correcte." },
    { supplier: "MEUBLES DU FLEUVE", ref: "F-2026-003", q: 2, del: 2, conf: 3, sat: 2, c: "Retard de livraison et finitions moyennes." },
    { supplier: "HYDRO CONSULT INTL", ref: "P-2026-001", q: 4, del: 3, conf: 4, sat: 4, c: "Expertise reconnue, délais à surveiller." },
    { supplier: "GÉNIE CIVIL PLUS", ref: "T-2026-005", q: 4, del: 5, conf: 4, sat: 4, c: "Intervention d'urgence réussie." },
  ];
  for (const e of evals) {
    const g = Number(((e.q + e.del + e.conf + e.sat) / 4).toFixed(2));
    await prisma.supplierEvaluation.create({
      data: {
        supplierId: suppliers[e.supplier].id,
        marketId: marketIdByRef[e.ref] ?? null,
        evaluatorId: users.suivi.id,
        qualityScore: e.q,
        deadlineScore: e.del,
        conformityScore: e.conf,
        satisfactionScore: e.sat,
        globalScore: g,
        comment: e.c,
        evaluatedAt: d("2026-07-01"),
      },
    });
  }
}

/* ================================================= GED ==================== */
async function seedDocuments(users: Record<string, { id: number }>, marketIdByRef: Record<string, number>): Promise<number> {
  console.log("→ Documents (GED)…");
  let seq = 0;
  const create = async (opts: {
    category: string; title: string; marketRef?: string; version?: number; isCurrent?: boolean; replaces?: number; archived?: boolean;
  }): Promise<number> => {
    seq++;
    const fileName = `doc-${seq}.pdf`;
    const buffer = await genPdf(opts.title, [
      `Catégorie : ${opts.category}`,
      opts.marketRef ? `Marché : ${opts.marketRef}` : "",
      `Version : ${opts.version ?? 1}`,
      `Date : 2026`,
    ].filter(Boolean));
    const blob = await put(`documents/${fileName}`, buffer, { access: "private", contentType: "application/pdf" });
    const doc = await prisma.document.create({
      data: {
        category: opts.category,
        title: opts.title,
        fileName,
        filePath: blob.url,
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        version: opts.version ?? 1,
        isCurrentVersion: opts.isCurrent ?? true,
        replacesDocumentId: opts.replaces ?? null,
        marketId: opts.marketRef ? marketIdByRef[opts.marketRef] : null,
        uploadedById: users.passation.id,
        archived: opts.archived ?? false,
      },
    });
    return doc.id;
  };

  // Marché T-2026-001 : DAO versionné + pièces
  const daoV1 = await create({ category: "DAO", title: "DAO — Bâtiment administratif (v1)", marketRef: "T-2026-001", version: 1, isCurrent: false, archived: true });
  await create({ category: "DAO", title: "DAO — Bâtiment administratif (v2)", marketRef: "T-2026-001", version: 2, isCurrent: true, replaces: daoV1 });
  await create({ category: "AVIS_NON_OBJECTION", title: "Avis de non-objection sur le DAO", marketRef: "T-2026-001" });
  await create({ category: "PV", title: "PV d'ouverture des offres", marketRef: "T-2026-001" });
  await create({ category: "RAPPORT_EVALUATION", title: "Rapport d'évaluation des offres", marketRef: "T-2026-001" });
  await create({ category: "CONTRAT", title: "Contrat CT-T-2026-001", marketRef: "T-2026-001" });

  await create({ category: "DAO", title: "DAO — Réhabilitation voirie", marketRef: "T-2026-002" });
  await create({ category: "CONTRAT", title: "Contrat CT-T-2026-002", marketRef: "T-2026-002" });
  await create({ category: "FACTURE", title: "Décompte définitif — voirie", marketRef: "T-2026-002" });

  await create({ category: "DAO", title: "DAO — Véhicules de service", marketRef: "F-2026-001" });
  await create({ category: "PV", title: "PV d'ouverture — véhicules", marketRef: "F-2026-001" });

  await create({ category: "TDR", title: "TDR — Étude de faisabilité barrage", marketRef: "P-2026-001" });
  await create({ category: "CONTRAT", title: "Contrat CT-P-2026-001", marketRef: "P-2026-001" });

  await create({ category: "AVENANT", title: "Avenant n°1 — prolongation de délai", marketRef: "P-2026-001" });
  await create({ category: "GARANTIE", title: "Garantie de bonne exécution — bâtiment", marketRef: "T-2026-001" });

  return seq;
}

/* ================================================= Audit ================== */
async function seedAudit(users: Record<string, { id: number }>) {
  console.log("→ Journal d'audit (historique)…");
  const entries: Array<{ u: number; action: string; module: string; entity?: string; detail: string; at: string }> = [
    { u: users.prep.id, action: "CREATE", module: "PPM", entity: "Market", detail: "Création du marché T-2026-001", at: "2026-01-08T09:12:00" },
    { u: users.passation.id, action: "UPDATE", module: "PPM", entity: "MarketStep", detail: "Saisie de la réalisation « Publication de l'AAO » (T-2026-001)", at: "2026-02-20T14:30:00" },
    { u: users.sp.id, action: "VALIDATE", module: "PASSATION", entity: "MarketStep", detail: "Validation de la non-objection sur DAO (T-2026-001)", at: "2026-02-05T11:05:00" },
    { u: users.passation.id, action: "UPLOAD", module: "GED", entity: "Document", detail: "Import du DAO (v2) — T-2026-001", at: "2026-02-01T16:20:00" },
    { u: users.suivi.id, action: "CREATE", module: "CONTRATS", entity: "Contract", detail: "Enregistrement du contrat CT-T-2026-002", at: "2026-05-02T10:00:00" },
    { u: users.suivi.id, action: "CREATE", module: "FOURNISSEURS", entity: "SupplierEvaluation", detail: "Évaluation de ROUTES & OUVRAGES SA", at: "2026-07-01T09:00:00" },
    { u: users.prep.id, action: "CREATE", module: "ACHATS", entity: "PurchaseRequest", detail: "Demande d'achat DA-2026-004", at: "2026-07-08T08:45:00" },
    { u: users.admin.id, action: "EXPORT", module: "PPM", entity: "Market", detail: "Export Excel du Plan de passation", at: "2026-07-10T17:00:00" },
    { u: users.sp.id, action: "LOGIN", module: "ADMIN", detail: "Connexion de Jean-Pierre MABIALA", at: "2026-07-14T08:02:00" },
    { u: users.admin.id, action: "LOGIN", module: "ADMIN", detail: "Connexion de Administrateur Système", at: "2026-07-15T07:50:00" },
  ];
  for (const e of entries) {
    await prisma.auditLog.create({
      data: {
        userId: e.u,
        action: e.action,
        module: e.module,
        entityType: e.entity ?? null,
        detail: e.detail,
        createdAt: new Date(e.at),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

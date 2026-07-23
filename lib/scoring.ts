/**
 * Moteur de scoring de risque des tiers (Module 8.6) — fonctions PURES, testables.
 * Convention : score = RISQUE, 0 (sûr) → 100 (critique). Moyenne pondérée des 8
 * rubriques (pondérations RUBRIC_WEIGHTS issues du document source).
 */
import {
  RUBRIC_WEIGHTS, RUBRIC_ORDER,
  type RiskRubric, type RiskLevel, type ThirdPartyDecision, type InternalControlKey,
} from "@/lib/enums";

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const b = (v: boolean) => (v ? 1 : 0);

export interface RiskInput {
  identity: { rccm: boolean; idNational: boolean; nif: boolean; taxNumber: boolean; address: boolean; creationDate: boolean };
  docs: { total: number; ok: number; expired: number; missing: number; incoherent: number };
  fiscal: { attestationFiscaleValid: boolean; cnssValid: boolean };
  admin: { agrementsValid: boolean; licencesValid: boolean };
  governance: { hasReps: boolean; shareSumPct: number; beneficialOwnersIdentified: boolean };
  reputation: { sanctions: number; contentieux: number; mediasNegatifs: number; condamnation: boolean; procedureJudiciaire: boolean };
  history: { nbResiliations: number; nbPenalties: number; nbLateReceptions: number; avgEval5: number | null };
  integrity: { anticorruption: boolean; exclusionMP: boolean; liensAgentsPublics: boolean; lbcft: boolean };
  controls: Record<InternalControlKey, boolean>;
}

export interface RubricScore {
  key: RiskRubric;
  weight: number;
  risk: number; // 0..100
  justification: string;
}

export interface RiskResult {
  score: number; // 0..100
  level: RiskLevel;
  decision: ThirdPartyDecision;
  recommendation: string;
  mitigations: string[];
  rubrics: RubricScore[];
}

/** Sous-scores de risque par rubrique (0 = sûr, 100 = pire). */
export function rubricRisks(i: RiskInput): Record<RiskRubric, number> {
  const idMissing = [i.identity.rccm, i.identity.idNational, i.identity.nif, i.identity.taxNumber, i.identity.address, i.identity.creationDate].filter((v) => !v).length;
  const evalRisk = i.history.avgEval5 == null ? 0 : clamp(((3 - i.history.avgEval5) / 3) * 100);
  return {
    IDENTITE_JURIDIQUE: clamp((100 * idMissing) / 6),
    SITUATION_ADMINISTRATIVE: clamp(50 * b(!i.admin.agrementsValid) + 50 * b(!i.admin.licencesValid)),
    DOCUMENTS: i.docs.total ? clamp((100 * (i.docs.missing + i.docs.expired + i.docs.incoherent)) / i.docs.total) : 100,
    SITUATION_FISCALE: clamp(50 * b(!i.fiscal.attestationFiscaleValid) + 50 * b(!i.fiscal.cnssValid)),
    GOUVERNANCE: clamp(40 * b(!i.governance.hasReps) + 40 * b(Math.abs(100 - i.governance.shareSumPct) > 1) + 20 * b(!i.governance.beneficialOwnersIdentified)),
    REPUTATION: clamp(25 * i.reputation.sanctions + 20 * i.reputation.contentieux + 15 * i.reputation.mediasNegatifs + 30 * b(i.reputation.condamnation) + 25 * b(i.reputation.procedureJudiciaire)),
    HISTORIQUE_MARCHES: clamp(30 * i.history.nbResiliations + 12 * i.history.nbPenalties + 8 * i.history.nbLateReceptions + evalRisk + 15 * b(i.controls.C1) + 20 * b(i.controls.C3) + 15 * b(i.controls.C4)),
    INTEGRITE: clamp(30 * b(!i.integrity.anticorruption) + 40 * b(i.integrity.exclusionMP) + 25 * b(i.integrity.liensAgentsPublics) + 25 * b(!i.integrity.lbcft) + 20 * b(i.controls.C2) + 15 * b(i.controls.C5) + 10 * b(i.controls.C7) + 10 * b(i.controls.C8)),
  };
}

function justify(key: RiskRubric, i: RiskInput, risk: number): string {
  switch (key) {
    case "IDENTITE_JURIDIQUE": {
      const miss = [["RCCM", i.identity.rccm], ["ID National", i.identity.idNational], ["NIF", i.identity.nif], ["N° impôt", i.identity.taxNumber], ["Adresse", i.identity.address], ["Date création", i.identity.creationDate]].filter(([, v]) => !v).map(([k]) => k);
      return miss.length ? `Éléments d'identité manquants : ${miss.join(", ")}.` : "Identité juridique complète.";
    }
    case "DOCUMENTS":
      return `${i.docs.ok}/${i.docs.total} pièces conformes (${i.docs.missing} manquantes, ${i.docs.expired} expirées, ${i.docs.incoherent} incohérentes).`;
    case "SITUATION_FISCALE":
      return `Attestation fiscale ${i.fiscal.attestationFiscaleValid ? "valide" : "manquante/expirée"} · CNSS ${i.fiscal.cnssValid ? "valide" : "manquante/expirée"}.`;
    case "SITUATION_ADMINISTRATIVE":
      return `Agréments ${i.admin.agrementsValid ? "OK" : "à régulariser"} · Licences ${i.admin.licencesValid ? "OK" : "à régulariser"}.`;
    case "GOUVERNANCE":
      return `Représentants ${i.governance.hasReps ? "identifiés" : "absents"} · actionnariat = ${i.governance.shareSumPct}% · bénéficiaires effectifs ${i.governance.beneficialOwnersIdentified ? "identifiés" : "non identifiés"}.`;
    case "REPUTATION":
      return `${i.reputation.sanctions} sanction(s), ${i.reputation.contentieux} contentieux, ${i.reputation.mediasNegatifs} signal(s) presse${i.reputation.condamnation ? ", condamnation" : ""}${i.reputation.procedureJudiciaire ? ", procédure en cours" : ""}.`;
    case "HISTORIQUE_MARCHES":
      return `${i.history.nbResiliations} résiliation(s), ${i.history.nbPenalties} pénalité(s), ${i.history.nbLateReceptions} retard(s) de réception · note moyenne ${i.history.avgEval5 == null ? "n/a" : i.history.avgEval5.toFixed(1) + "/5"}.`;
    case "INTEGRITE": {
      const flags = [!i.integrity.anticorruption && "pas de programme anticorruption", i.integrity.exclusionMP && "exclusion antérieure d'un marché public", i.integrity.liensAgentsPublics && "liens avec des agents publics", !i.integrity.lbcft && "pas de politique LBC/FT"].filter(Boolean);
      return flags.length ? `Signaux : ${flags.join(", ")}.` : "Aucun signal d'intégrité majeur.";
    }
  }
  void risk;
  return "";
}

export function levelOf(score: number): RiskLevel {
  if (score < 25) return "FAIBLE";
  if (score < 50) return "MOYEN";
  if (score < 75) return "ELEVE";
  return "CRITIQUE";
}

export function defaultDecision(level: RiskLevel): ThirdPartyDecision {
  return level === "FAIBLE" ? "VALIDE" : level === "MOYEN" ? "VALIDE_CONDITIONNEL" : level === "ELEVE" ? "DD_RENFORCEE" : "REJETE";
}

function buildMitigations(i: RiskInput, risks: Record<RiskRubric, number>): string[] {
  const m: string[] = [];
  if (risks.DOCUMENTS > 40) m.push("Régulariser le dossier de pièces (documents manquants ou expirés).");
  if (risks.SITUATION_FISCALE > 0) m.push("Exiger une attestation fiscale et CNSS en cours de validité.");
  if (risks.GOUVERNANCE > 40) m.push("Identifier les bénéficiaires effectifs et compléter l'actionnariat.");
  if (i.integrity.exclusionMP || i.reputation.condamnation) m.push("Vérification approfondie de l'intégrité avant tout engagement.");
  if (risks.HISTORIQUE_MARCHES > 50) m.push("Encadrer l'exécution (jalons, pénalités renforcées) au vu de l'historique.");
  if (i.controls.C5) m.push("Traiter le signalement de conflit d'intérêts (comité d'éthique).");
  if (!m.length) m.push("Aucune mesure particulière ; suivi standard.");
  return m;
}

export function computeRiskScore(i: RiskInput): RiskResult {
  const risks = rubricRisks(i);
  const rubrics: RubricScore[] = RUBRIC_ORDER.map((key) => ({
    key,
    weight: RUBRIC_WEIGHTS[key],
    risk: Math.round(risks[key]),
    justification: justify(key, i, risks[key]),
  }));
  const score = Math.round(rubrics.reduce((s, r) => s + (r.weight / 100) * r.risk, 0));
  const level = levelOf(score);
  const decision = defaultDecision(level);
  const recommendation =
    level === "FAIBLE" ? "Tiers fiable — validation possible."
    : level === "MOYEN" ? "Validation sous conditions (mesures de mitigation)."
    : level === "ELEVE" ? "Due diligence renforcée requise avant décision."
    : "Risque critique — rejet recommandé.";
  return { score, level, decision, recommendation, mitigations: buildMitigations(i, risks), rubrics };
}

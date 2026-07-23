import { describe, it, expect } from "vitest";
import { computeRiskScore, rubricRisks, levelOf, defaultDecision, type RiskInput } from "@/lib/scoring";

const CLEAN: RiskInput = {
  identity: { rccm: true, idNational: true, nif: true, taxNumber: true, address: true, creationDate: true },
  docs: { total: 11, ok: 11, expired: 0, missing: 0, incoherent: 0 },
  fiscal: { attestationFiscaleValid: true, cnssValid: true },
  admin: { agrementsValid: true, licencesValid: true },
  governance: { hasReps: true, shareSumPct: 100, beneficialOwnersIdentified: true },
  reputation: { sanctions: 0, contentieux: 0, mediasNegatifs: 0, condamnation: false, procedureJudiciaire: false },
  history: { nbResiliations: 0, nbPenalties: 0, nbLateReceptions: 0, avgEval5: 4.5 },
  integrity: { anticorruption: true, exclusionMP: false, liensAgentsPublics: false, lbcft: true },
  controls: { C1: false, C2: false, C3: false, C4: false, C5: false, C7: false, C8: false },
};

const CRITICAL: RiskInput = {
  identity: { rccm: false, idNational: false, nif: false, taxNumber: false, address: false, creationDate: false },
  docs: { total: 11, ok: 2, expired: 3, missing: 6, incoherent: 0 },
  fiscal: { attestationFiscaleValid: false, cnssValid: false },
  admin: { agrementsValid: false, licencesValid: false },
  governance: { hasReps: false, shareSumPct: 60, beneficialOwnersIdentified: false },
  reputation: { sanctions: 2, contentieux: 1, mediasNegatifs: 1, condamnation: true, procedureJudiciaire: true },
  history: { nbResiliations: 3, nbPenalties: 2, nbLateReceptions: 1, avgEval5: 1.0 },
  integrity: { anticorruption: false, exclusionMP: true, liensAgentsPublics: true, lbcft: false },
  controls: { C1: true, C2: true, C3: true, C4: true, C5: true, C7: true, C8: true },
};

describe("computeRiskScore — profil sain", () => {
  const r = computeRiskScore(CLEAN);
  it("score nul et niveau faible", () => {
    expect(r.score).toBe(0);
    expect(r.level).toBe("FAIBLE");
    expect(r.decision).toBe("VALIDE");
  });
  it("8 rubriques pondérées (Σ poids = 100)", () => {
    expect(r.rubrics).toHaveLength(8);
    expect(r.rubrics.reduce((s, x) => s + x.weight, 0)).toBe(100);
  });
});

describe("computeRiskScore — profil critique", () => {
  const r = computeRiskScore(CRITICAL);
  it("score très élevé, niveau critique, rejet", () => {
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.level).toBe("CRITIQUE");
    expect(r.decision).toBe("REJETE");
  });
  it("propose des mesures de mitigation", () => {
    expect(r.mitigations.length).toBeGreaterThan(0);
  });
});

describe("rubricRisks — formules", () => {
  it("IDENTITE = 100 × (champs manquants / 6)", () => {
    const i = { ...CLEAN, identity: { rccm: false, idNational: false, nif: false, taxNumber: true, address: true, creationDate: true } };
    expect(rubricRisks(i).IDENTITE_JURIDIQUE).toBe(50);
  });
  it("DOCUMENTS = 100 × (manquants+expirés+incohérents / total)", () => {
    const i = { ...CLEAN, docs: { total: 10, ok: 6, missing: 2, expired: 1, incoherent: 1 } };
    expect(rubricRisks(i).DOCUMENTS).toBe(40);
  });
  it("HISTORIQUE intègre les contrôles internes C1 et C3", () => {
    const i = { ...CLEAN, history: { nbResiliations: 0, nbPenalties: 0, nbLateReceptions: 0, avgEval5: null }, controls: { ...CLEAN.controls, C1: true, C3: true } };
    // 15 (C1) + 20 (C3) = 35
    expect(rubricRisks(i).HISTORIQUE_MARCHES).toBe(35);
  });
});

describe("levelOf — seuils", () => {
  it("bornes des 4 niveaux", () => {
    expect(levelOf(24)).toBe("FAIBLE");
    expect(levelOf(25)).toBe("MOYEN");
    expect(levelOf(49)).toBe("MOYEN");
    expect(levelOf(50)).toBe("ELEVE");
    expect(levelOf(74)).toBe("ELEVE");
    expect(levelOf(75)).toBe("CRITIQUE");
  });
});

describe("defaultDecision — mapping niveau → décision", () => {
  it("chaque niveau donne la décision par défaut attendue", () => {
    expect(defaultDecision("FAIBLE")).toBe("VALIDE");
    expect(defaultDecision("MOYEN")).toBe("VALIDE_CONDITIONNEL");
    expect(defaultDecision("ELEVE")).toBe("DD_RENFORCEE");
    expect(defaultDecision("CRITIQUE")).toBe("REJETE");
  });
});

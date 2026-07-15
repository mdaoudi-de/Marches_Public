import { describe, it, expect } from "vitest";
import { ecartJours, ecartMontant, deriveStepStatus, marketProgress, type StepLike } from "@/lib/ecarts";

const U = (s: string) => new Date(s + "T00:00:00.000Z");

describe("ecartJours", () => {
  it("compte les jours de retard (réel - prévu)", () => {
    expect(ecartJours({ plannedDate: U("2026-01-01"), actualDate: U("2026-01-10") })).toBe(9);
  });
  it("gère l'avance (écart négatif)", () => {
    expect(ecartJours({ plannedDate: U("2026-01-10"), actualDate: U("2026-01-07") })).toBe(-3);
  });
  it("renvoie null si une date manque", () => {
    expect(ecartJours({ plannedDate: U("2026-01-01"), actualDate: null })).toBeNull();
    expect(ecartJours({ plannedDate: null, actualDate: U("2026-01-01") })).toBeNull();
  });
});

describe("ecartMontant", () => {
  it("calcule le dépassement de montant", () => {
    expect(ecartMontant({ plannedAmountFC: 1000, actualAmountFC: 1200 })).toBe(200);
  });
  it("renvoie null si un montant manque", () => {
    expect(ecartMontant({ plannedAmountFC: 1000, actualAmountFC: null })).toBeNull();
  });
});

describe("deriveStepStatus (aujourd'hui = 2026-07-15)", () => {
  it("REALISE quand la date réelle est saisie", () => {
    expect(deriveStepStatus({ plannedDate: U("2026-01-01"), actualDate: U("2026-01-02") })).toBe("REALISE");
  });
  it("EN_RETARD quand la prévision est passée et non réalisée", () => {
    expect(deriveStepStatus({ plannedDate: U("2026-06-01"), actualDate: null })).toBe("EN_RETARD");
  });
  it("A_VENIR quand la prévision est future", () => {
    expect(deriveStepStatus({ plannedDate: U("2026-12-01"), actualDate: null })).toBe("A_VENIR");
  });
  it("REALISE pour une étape MONTANT dont le montant réel est saisi", () => {
    expect(deriveStepStatus({ stepKind: "MONTANT", actualAmountFC: 500 })).toBe("REALISE");
    expect(deriveStepStatus({ stepKind: "MONTANT", actualAmountFC: null })).toBe("A_VENIR");
  });
});

describe("marketProgress", () => {
  const steps: StepLike[] = [
    { stepKind: "DATE", plannedDate: U("2026-01-01"), actualDate: U("2026-01-05") }, // +4
    { stepKind: "DATE", plannedDate: U("2026-02-01"), actualDate: U("2026-02-10") }, // +9
    { stepKind: "DATE", plannedDate: U("2026-06-01"), actualDate: null }, // en retard
    { stepKind: "DATE", plannedDate: U("2026-12-01"), actualDate: null }, // à venir
    { stepKind: "MONTANT", plannedAmountFC: 1000, actualAmountFC: 1000 }, // ignoré (non DATE)
  ];
  const p = marketProgress(steps);

  it("ne compte que les étapes DATE dans l'avancement", () => {
    expect(p.total).toBe(4);
  });
  it("calcule le taux d'exécution", () => {
    expect(p.realises).toBe(2);
    expect(p.tauxExecution).toBe(50);
  });
  it("compte les étapes en retard", () => {
    expect(p.enRetard).toBe(1);
  });
  it("calcule le retard moyen et max des étapes réalisées", () => {
    expect(p.retardMoyen).toBe(7); // moyenne(4, 9) = 6,5 → arrondi 7
    expect(p.retardMax).toBe(9);
  });
  it("identifie la prochaine échéance", () => {
    expect(p.prochaineEcheance?.toISOString().slice(0, 10)).toBe("2026-12-01");
  });
});

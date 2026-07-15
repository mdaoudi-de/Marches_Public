import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { ecartJours, marketProgress } from "@/lib/ecarts";
import { formatDate, formatFC, humanDelay } from "@/lib/utils";
import { NATURE_LABELS, MARKET_STATUS_LABELS, PROCEDURE_LABELS, label } from "@/lib/enums";

type StepRow = {
  phaseName: string; stepName: string; stepKind: string;
  plannedDate: Date | null; actualDate: Date | null;
  plannedAmountFC: number | null; actualAmountFC: number | null;
};
export type ExportMarket = {
  reference: string; intitule: string; nature: string; procedureType: string;
  budgetAmountFC: number; contractAmountFC: number | null; status: string;
  budgetCode: string | null; steps: StepRow[];
};

const NATURES: (keyof typeof NATURE_LABELS)[] = ["TRAVAUX", "FOURNITURES_SERVICES", "PRESTATIONS_INTELLECTUELLES"];

/* ------------------------------------------------------------------- Excel */
export async function buildPpmExcel(markets: ExportMarket[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "POC Suivi des marchés publics";

  for (const nature of NATURES) {
    const list = markets.filter((m) => m.nature === nature);
    const ws = wb.addWorksheet(NATURE_LABELS[nature].slice(0, 31));
    ws.columns = [{ width: 40 }, { width: 24 }, { width: 16 }, { width: 16 }, { width: 12 }];

    const title = ws.addRow(["PLAN DE PASSATION DES MARCHÉS — " + NATURE_LABELS[nature]]);
    title.font = { bold: true, size: 13, color: { argb: "FF1D2F69" } };
    ws.addRow(["Période : exercice budgétaire 2026"]).font = { italic: true, color: { argb: "FF888888" } };
    ws.addRow([]);

    if (list.length === 0) { ws.addRow(["(Aucun marché)"]); continue; }

    for (const m of list) {
      const head = ws.addRow([`${m.reference} — ${m.intitule}`]);
      head.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      head.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244FD1" } }));
      ws.addRow([
        `Budget : ${formatFC(m.budgetAmountFC)}`,
        `Contrat : ${m.contractAmountFC != null ? formatFC(m.contractAmountFC) : "—"}`,
        `Procédure : ${label(PROCEDURE_LABELS, m.procedureType)}`,
        `Statut : ${label(MARKET_STATUS_LABELS, m.status)}`,
      ]).font = { size: 10, color: { argb: "FF555555" } };

      const hr = ws.addRow(["Phase", "Étape", "Prévision", "Réalisation", "Écart (j)"]);
      hr.font = { bold: true };
      hr.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }));

      for (const s of m.steps) {
        if (s.stepKind === "MONTANT") {
          ws.addRow([s.phaseName, s.stepName,
            s.plannedAmountFC != null ? formatFC(s.plannedAmountFC) : "—",
            s.actualAmountFC != null ? formatFC(s.actualAmountFC) : "—",
            s.actualAmountFC != null && s.plannedAmountFC != null ? formatFC(s.actualAmountFC - s.plannedAmountFC) : "—"]);
        } else {
          const e = ecartJours(s);
          ws.addRow([s.phaseName, s.stepName, formatDate(s.plannedDate), formatDate(s.actualDate), e == null ? "—" : e]);
        }
      }
      ws.addRow([]);
    }
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/* --------------------------------------------------------------------- PDF */
function pdfToBuffer(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

export function buildPpmPdf(markets: ExportMarket[], single: boolean): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    doc.fontSize(16).fillColor("#1d2f69").text("Plan de Passation des Marchés", { align: "left" });
    doc.fontSize(9).fillColor("#888").text("Exercice budgétaire 2026 — synthèse au 15/07/2026");
    doc.moveDown();

    for (const m of markets) {
      const p = marketProgress(m.steps);
      doc.fontSize(12).fillColor("#244fd1").text(`${m.reference} — ${m.intitule}`);
      doc.fontSize(9).fillColor("#333").text(
        `${label(NATURE_LABELS, m.nature)} · ${label(PROCEDURE_LABELS, m.procedureType)} · ${label(MARKET_STATUS_LABELS, m.status)} · Budget ${formatFC(m.budgetAmountFC)} · Exécution ${p.tauxExecution}% · Écart moyen ${p.retardMoyen == null ? "—" : humanDelay(p.retardMoyen)}`,
      );

      if (single) {
        doc.moveDown(0.3);
        for (const s of m.steps) {
          if (s.stepKind === "MONTANT") {
            doc.fontSize(8).fillColor("#555").text(`   • ${s.stepName} — prévu ${s.plannedAmountFC != null ? formatFC(s.plannedAmountFC) : "—"} / réel ${s.actualAmountFC != null ? formatFC(s.actualAmountFC) : "—"}`);
          } else {
            const e = ecartJours(s);
            doc.fontSize(8).fillColor("#555").text(`   • ${s.stepName} — prévu ${formatDate(s.plannedDate)} / réalisé ${formatDate(s.actualDate)} ${e == null ? "" : `(${humanDelay(e)})`}`);
          }
        }
      }
      doc.moveDown(0.6);
      if (doc.y > 760) doc.addPage();
    }
  });
}

/* ----------------------------------------------------------- Journal Excel */
type LogRow = { createdAt: Date; userName: string; action: string; module: string; detail: string | null };
export async function buildJournalExcel(logs: LogRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Journal d'audit");
  ws.columns = [
    { header: "Date & heure", key: "d", width: 20 },
    { header: "Utilisateur", key: "u", width: 26 },
    { header: "Action", key: "a", width: 14 },
    { header: "Module", key: "m", width: 16 },
    { header: "Détail", key: "det", width: 70 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const l of logs) {
    ws.addRow({ d: l.createdAt.toLocaleString("fr-FR", { timeZone: "UTC" }), u: l.userName, a: l.action, m: l.module, det: l.detail ?? "" });
  }
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

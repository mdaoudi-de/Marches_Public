/**
 * Configuration globale du POC.
 *
 * La date « aujourd'hui » est FIGÉE pour rendre la démonstration déterministe :
 * les retards, écarts et alertes restent identiques quel que soit le jour réel.
 * En production, remplacer `today()` par `new Date()`.
 */
export const TODAY_ISO = "2026-07-15";

// Toutes les dates « jour » sont ancrées à minuit UTC pour éviter tout décalage
// de fuseau horaire (affichage via timeZone: "UTC").
export function today(): Date {
  return new Date(TODAY_ISO + "T00:00:00.000Z");
}

/** Libellé de devise — externalisé pour rester évolutif (spec § interopérabilité). */
export const CURRENCY_LABEL = "USD";

/** Autorité contractante par défaut. */
export const CONTRACTING_AUTHORITY = "FONAREV";

/** Exercice budgétaire par défaut de la démonstration. */
export const FISCAL_YEAR = 2026;

/** Seuil (jours) d'anticipation des alertes d'échéance. */
export const ALERT_HORIZON_DAYS = 30;

/** Seuil réglementaire (USD) en-dessous duquel on passe par « Achats sous seuil ». */
export const PURCHASE_THRESHOLD_USD = 25_000;

/** Taux de conversion indicatif FC → USD (données de démonstration). */
export const USD_RATE = 2800;

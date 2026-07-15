/**
 * Valeurs "énumérées" (stockées en String faute d'enum SQLite) + libellés FR
 * + tons de badge pour l'affichage. Source unique de vérité pour l'UI et le seed.
 */
import type { Tone } from "@/components/ui-types";

export type Role =
  | "ADMIN"
  | "SECRETAIRE_PERMANENT"
  | "RESP_PREPARATION"
  | "RESP_PASSATION"
  | "RESP_SUIVI";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  SECRETAIRE_PERMANENT: "Secrétaire Permanent",
  RESP_PREPARATION: "Responsable Préparation",
  RESP_PASSATION: "Responsable Passation",
  RESP_SUIVI: "Responsable Suivi des contrats",
};

export type MarketNature = "TRAVAUX" | "FOURNITURES_SERVICES" | "PRESTATIONS_INTELLECTUELLES";

export const NATURE_LABELS: Record<MarketNature, string> = {
  TRAVAUX: "Travaux",
  FOURNITURES_SERVICES: "Fournitures & Services",
  PRESTATIONS_INTELLECTUELLES: "Prestations intellectuelles",
};

export const NATURE_SHORT: Record<MarketNature, string> = {
  TRAVAUX: "Travaux",
  FOURNITURES_SERVICES: "Fournitures",
  PRESTATIONS_INTELLECTUELLES: "Prest. intel.",
};

export type ProcedureType =
  | "AO_OUVERT"
  | "AO_RESTREINT"
  | "DEMANDE_COTATION"
  | "CONSULTATION_FOURNISSEURS"
  | "GRE_A_GRE"
  | "AMI"
  | "SC_QUALITE"
  | "SC_QUALITE_COUT"
  | "SC_MOINDRE_COUT"
  | "SC_BUDGET_DETERMINE"
  | "SC_INDIVIDUEL";

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  AO_OUVERT: "Appel d'offres ouvert",
  AO_RESTREINT: "Appel d'offres restreint",
  DEMANDE_COTATION: "Demande de cotation",
  CONSULTATION_FOURNISSEURS: "Consultation de fournisseurs",
  GRE_A_GRE: "Gré à gré",
  AMI: "Appel à manifestation d'intérêt (AMI)",
  SC_QUALITE: "Sélection de consultants — Qualité",
  SC_QUALITE_COUT: "Sélection de consultants — Qualité-Coût",
  SC_MOINDRE_COUT: "Sélection de consultants — Moindre coût",
  SC_BUDGET_DETERMINE: "Sélection de consultants — Budget déterminé",
  SC_INDIVIDUEL: "Consultant individuel",
};

export type MarketStatus = "PREVU" | "LANCE" | "ATTRIBUE" | "EXECUTE" | "CLOTURE";

export const MARKET_STATUS_LABELS: Record<MarketStatus, string> = {
  PREVU: "Prévu",
  LANCE: "Lancé",
  ATTRIBUE: "Attribué",
  EXECUTE: "Exécuté",
  CLOTURE: "Clôturé",
};

export const MARKET_STATUS_TONE: Record<MarketStatus, Tone> = {
  PREVU: "gray",
  LANCE: "blue",
  ATTRIBUE: "violet",
  EXECUTE: "amber",
  CLOTURE: "green",
};

export type StepStatus = "A_VENIR" | "EN_COURS" | "REALISE" | "EN_RETARD";

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  REALISE: "Réalisé",
  EN_RETARD: "En retard",
};

export const STEP_STATUS_TONE: Record<StepStatus, Tone> = {
  A_VENIR: "gray",
  EN_COURS: "blue",
  REALISE: "green",
  EN_RETARD: "red",
};

export type StepKind = "DATE" | "MONTANT" | "VALIDATION" | "DOCUMENT";

export type SupplierType = "ENTREPRISE" | "CONSULTANT_CABINET" | "CONSULTANT_INDIVIDUEL";

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  ENTREPRISE: "Entreprise",
  CONSULTANT_CABINET: "Cabinet / Bureau d'études",
  CONSULTANT_INDIVIDUEL: "Consultant individuel",
};

export type ContractType = "SIMPLE" | "BON_COMMANDE" | "CONTRAT_CADRE";

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  SIMPLE: "Marché simple",
  BON_COMMANDE: "À bons de commande",
  CONTRAT_CADRE: "Contrat-cadre",
};

export type ContractStatus =
  | "ACTIF"
  | "SUSPENDU"
  | "RECEPTIONNE_PROVISOIRE"
  | "RECEPTIONNE_DEFINITIF"
  | "RESILIE"
  | "CLOTURE";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  RECEPTIONNE_PROVISOIRE: "Réception provisoire",
  RECEPTIONNE_DEFINITIF: "Réception définitive",
  RESILIE: "Résilié",
  CLOTURE: "Clôturé",
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, Tone> = {
  ACTIF: "blue",
  SUSPENDU: "amber",
  RECEPTIONNE_PROVISOIRE: "violet",
  RECEPTIONNE_DEFINITIF: "green",
  RESILIE: "red",
  CLOTURE: "gray",
};

export type GuaranteeType =
  | "CAUTION_SOUMISSION"
  | "GARANTIE_BONNE_EXECUTION"
  | "RETENUE_GARANTIE"
  | "GARANTIE_AVANCE";

export const GUARANTEE_TYPE_LABELS: Record<GuaranteeType, string> = {
  CAUTION_SOUMISSION: "Caution de soumission",
  GARANTIE_BONNE_EXECUTION: "Garantie de bonne exécution",
  RETENUE_GARANTIE: "Retenue de garantie",
  GARANTIE_AVANCE: "Garantie de restitution d'avance",
};

export type GuaranteeStatus = "ACTIVE" | "LIBEREE" | "EXPIREE";
export const GUARANTEE_STATUS_LABELS: Record<GuaranteeStatus, string> = {
  ACTIVE: "Active",
  LIBEREE: "Libérée",
  EXPIREE: "Expirée",
};
export const GUARANTEE_STATUS_TONE: Record<GuaranteeStatus, Tone> = {
  ACTIVE: "green",
  LIBEREE: "gray",
  EXPIREE: "red",
};

export type PaymentType = "AVANCE" | "ACOMPTE" | "DECOMPTE" | "SOLDE";
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  AVANCE: "Avance de démarrage",
  ACOMPTE: "Acompte",
  DECOMPTE: "Décompte",
  SOLDE: "Solde",
};

export type PaymentStatus = "EN_ATTENTE" | "PAYE" | "EN_RETARD";
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "En attente",
  PAYE: "Payé",
  EN_RETARD: "En retard",
};
export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  EN_ATTENTE: "amber",
  PAYE: "green",
  EN_RETARD: "red",
};

export type ReceptionType = "LIVRAISON" | "PROVISOIRE" | "DEFINITIVE";
export const RECEPTION_TYPE_LABELS: Record<ReceptionType, string> = {
  LIVRAISON: "Livraison",
  PROVISOIRE: "Réception provisoire",
  DEFINITIVE: "Réception définitive",
};

export type ReceptionStatus = "EN_ATTENTE" | "RECEPTIONNE" | "EN_RETARD";
export const RECEPTION_STATUS_LABELS: Record<ReceptionStatus, string> = {
  EN_ATTENTE: "En attente",
  RECEPTIONNE: "Réceptionné",
  EN_RETARD: "En retard",
};
export const RECEPTION_STATUS_TONE: Record<ReceptionStatus, Tone> = {
  EN_ATTENTE: "amber",
  RECEPTIONNE: "green",
  EN_RETARD: "red",
};

export type ServiceOrderType = "DEMARRAGE" | "ARRET" | "REPRISE" | "MODIFICATION";
export const SERVICE_ORDER_TYPE_LABELS: Record<ServiceOrderType, string> = {
  DEMARRAGE: "Ordre de démarrage",
  ARRET: "Ordre d'arrêt",
  REPRISE: "Ordre de reprise",
  MODIFICATION: "Ordre de modification",
};

export type AmendmentStatus = "EN_COURS" | "APPROUVE" | "REJETE";
export const AMENDMENT_STATUS_LABELS: Record<AmendmentStatus, string> = {
  EN_COURS: "En cours",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
};

export type PurchaseOrderStatus = "EMISE" | "LIVREE" | "PAYEE" | "ANNULEE";
export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  EMISE: "Émise",
  LIVREE: "Livrée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};
export const PO_STATUS_TONE: Record<PurchaseOrderStatus, Tone> = {
  EMISE: "blue",
  LIVREE: "violet",
  PAYEE: "green",
  ANNULEE: "gray",
};

export type PurchaseRequestStatus = "DEMANDE" | "APPROUVEE" | "COMMANDEE" | "PAYEE" | "REJETEE";
export const PR_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  DEMANDE: "Demande",
  APPROUVEE: "Approuvée",
  COMMANDEE: "Commandée",
  PAYEE: "Payée",
  REJETEE: "Rejetée",
};
export const PR_STATUS_TONE: Record<PurchaseRequestStatus, Tone> = {
  DEMANDE: "gray",
  APPROUVEE: "blue",
  COMMANDEE: "violet",
  PAYEE: "green",
  REJETEE: "red",
};

export type DocumentCategory =
  | "DAO"
  | "DPQ"
  | "TDR"
  | "PV"
  | "RAPPORT_EVALUATION"
  | "CONTRAT"
  | "ORDRE_SERVICE"
  | "FACTURE"
  | "AVIS_NON_OBJECTION"
  | "AVENANT"
  | "GARANTIE"
  | "AUTRE";

export const DOC_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  DAO: "Dossier d'appel d'offres (DAO)",
  DPQ: "Dossier de pré-qualification (DPQ)",
  TDR: "Termes de référence (TDR)",
  PV: "Procès-verbal",
  RAPPORT_EVALUATION: "Rapport d'évaluation",
  CONTRAT: "Contrat",
  ORDRE_SERVICE: "Ordre de service",
  FACTURE: "Facture",
  AVIS_NON_OBJECTION: "Avis de non-objection",
  AVENANT: "Avenant",
  GARANTIE: "Garantie",
  AUTRE: "Autre",
};

export type AlertType =
  | "RETARD_PUBLICATION"
  | "ETAPE_EN_RETARD"
  | "ECHEANCE_CONTRAT"
  | "GARANTIE_EXPIRATION"
  | "RETARD_LIVRAISON"
  | "PAIEMENT_ATTENTE";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  RETARD_PUBLICATION: "Retard de publication",
  ETAPE_EN_RETARD: "Étape en retard",
  ECHEANCE_CONTRAT: "Échéance de contrat",
  GARANTIE_EXPIRATION: "Garantie arrivant à expiration",
  RETARD_LIVRAISON: "Retard de livraison",
  PAIEMENT_ATTENTE: "Paiement en attente",
};

export type AlertSeverity = "INFO" | "WARNING" | "CRITIQUE";
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: "Info",
  WARNING: "À surveiller",
  CRITIQUE: "Critique",
};
export const ALERT_SEVERITY_TONE: Record<AlertSeverity, Tone> = {
  INFO: "blue",
  WARNING: "amber",
  CRITIQUE: "red",
};

export type AlertStatus = "ACTIVE" | "ACQUITTEE" | "RESOLUE";
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  ACTIVE: "Active",
  ACQUITTEE: "Acquittée",
  RESOLUE: "Résolue",
};

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VALIDATE"
  | "EXPORT"
  | "UPLOAD";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  EXPORT: "Export",
  UPLOAD: "Import fichier",
};

export type AppModule =
  | "DASHBOARD"
  | "PPM"
  | "PASSATION"
  | "CONTRATS"
  | "ACHATS"
  | "FOURNISSEURS"
  | "GED"
  | "ALERTES"
  | "ADMIN";

/** Petit utilitaire tolérant : renvoie le libellé, sinon la clé brute. */
export function label<T extends string>(map: Record<T, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return (map as Record<string, string>)[key] ?? key;
}
